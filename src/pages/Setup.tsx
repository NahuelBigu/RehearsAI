import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { useTranslation } from 'react-i18next';
import { Camera, Target, User, ArrowRight, Plus, X, FileText, Sliders, Settings, Brain, Briefcase, Users, ShoppingBag, Truck, Heart, Flame, Home, MoreHorizontal, MessageSquare, Edit3, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { AudioStreamer, AudioPlayer } from '../lib/audio';

export function Setup() {
  const navigate = useNavigate();
  const { setSetupData } = useSimulation();
  const { t, i18n } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [userName, setUserName] = useState(() => sessionStorage.getItem('rehearsai_userName') || '');
  const [relationshipPreset, setRelationshipPreset] = useState('');
  const [relationship, setRelationship] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [setupMode, setSetupMode] = useState<'select' | 'manual' | 'ai'>('select');
  const [manualNotes, setManualNotes] = useState('');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Intermedio' | 'Difícil'>('Intermedio');
  const [skipImageGeneration, setSkipImageGeneration] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live API State
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [liveMessages, setLiveMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  
  const liveSessionRef = useRef<any>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    sessionStorage.setItem('rehearsai_userName', userName);
  }, [userName]);

  const relationshipOptions = [
    { label: t('setup.rel.boss'), icon: Briefcase },
    { label: t('setup.rel.employee'), icon: User },
    { label: t('setup.rel.colleague'), icon: Users },
    { label: t('setup.rel.client'), icon: ShoppingBag },
    { label: t('setup.rel.supplier'), icon: Truck },
    { label: t('setup.rel.friend'), icon: Users },
    { label: t('setup.rel.partner'), icon: Heart },
    { label: t('setup.rel.family'), icon: Home },
    { label: t('setup.rel.stranger'), icon: Users },
    { label: t('setup.rel.other'), icon: MoreHorizontal, value: 'custom' }
  ];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const corePersonalities = [
    { id: 'empathetic', label: t('setup.trait.empathetic') },
    { id: 'direct', label: t('setup.trait.direct') },
    { id: 'analytical', label: t('setup.trait.analytical') },
    { id: 'detailed', label: t('setup.trait.detailed') },
    { id: 'evasive', label: t('setup.trait.evasive') },
    { id: 'defensive', label: t('setup.trait.defensive') },
    { id: 'aggressive', label: t('setup.trait.aggressive') },
    { id: 'confrontational', label: t('setup.trait.confrontational') },
    { id: 'indecisive', label: t('setup.trait.indecisive') },
    { id: 'narcissistic', label: t('setup.trait.narcissistic') },
    { id: 'egocentric', label: t('setup.trait.egocentric') },
    { id: 'passiveAggressive', label: t('setup.trait.passiveAggressive') },
    { id: 'optimistic', label: t('setup.trait.optimistic') },
    { id: 'enthusiastic', label: t('setup.trait.enthusiastic') },
    { id: 'pessimistic', label: t('setup.trait.pessimistic') },
    { id: 'negative', label: t('setup.trait.negative') },
    { id: 'distrustful', label: t('setup.trait.distrustful') },
    { id: 'skeptical', label: t('setup.trait.skeptical') },
    { id: 'impatient', label: t('setup.trait.impatient') },
    { id: 'rushed', label: t('setup.trait.rushed') },
    { id: 'meticulous', label: t('setup.trait.meticulous') },
    { id: 'perfectionist', label: t('setup.trait.perfectionist') },
    { id: 'conciliatory', label: t('setup.trait.conciliatory') },
    { id: 'diplomatic', label: t('setup.trait.diplomatic') },
    { id: 'sarcastic', label: t('setup.trait.sarcastic') },
    { id: 'ironic', label: t('setup.trait.ironic') },
    { id: 'authoritarian', label: t('setup.trait.authoritarian') },
    { id: 'dominant', label: t('setup.trait.dominant') },
    { id: 'distracted', label: t('setup.trait.distracted') },
    { id: 'scattered', label: t('setup.trait.scattered') },
    { id: 'charismatic', label: t('setup.trait.charismatic') },
    { id: 'persuasive', label: t('setup.trait.persuasive') }
  ];

  const difficulties = [
    { level: 'Fácil', label: t('setup.diff.easy'), desc: t('setup.diff.easyDesc') },
    { level: 'Intermedio', label: t('setup.diff.medium'), desc: t('setup.diff.mediumDesc') },
    { level: 'Difícil', label: t('setup.diff.hard'), desc: t('setup.diff.hardDesc') }
  ] as const;

  const togglePersonality = (p: string) => {
    setSelectedPersonalities(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const removePersonality = (p: string) => {
    setSelectedPersonalities(prev => prev.filter(item => item !== p));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startLiveSession = async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing");
      return;
    }
    
    setIsLiveConnecting(true);
    setLiveMessages([{ role: 'ai', text: t('setup.expert.greeting') }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      audioPlayerRef.current = new AudioPlayer();
      audioStreamerRef.current = new AudioStreamer((base64) => {
        if (!isMicMuted && liveSessionRef.current) {
          liveSessionRef.current.then((session: any) => {
            session.sendRealtimeInput({
              media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
            });
          });
        }
      });

      const updateProfileTool: FunctionDeclaration = {
        name: "updateProfile",
        description: "Update the user's simulation profile based on the conversation.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            objective: { type: Type.STRING, description: "The objective of the conversation." },
            personalities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core personality traits of the interlocutor." },
            notes: { type: Type.STRING, description: "Additional notes about the interlocutor." },
            name: { type: Type.STRING, description: "The name of the interlocutor." },
            relationship: { type: Type.STRING, description: "The relationship between the user and the interlocutor." },
          }
        }
      };

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setIsLiveConnected(true);
            setIsLiveConnecting(false);
            audioStreamerRef.current?.start();
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log("Live message:", message);
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData?.mimeType?.startsWith('audio/'));
              if (audioPart) {
                setAiSpeaking(true);
                await audioPlayerRef.current?.playBase64(audioPart.inlineData.data);
                setAiSpeaking(false);
              }
            }
            if (message.serverContent?.interrupted) {
              audioPlayerRef.current?.stop();
              setAiSpeaking(false);
            }
            
            // Handle transcription
            if (message.serverContent?.modelTurn?.parts) {
              const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
              if (textPart && textPart.text) {
                setLiveMessages(prev => [...prev, { role: 'ai', text: textPart.text! }]);
              }
            }
            
            // Handle tool calls
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls;
              if (calls) {
                for (const call of calls) {
                  if (call.name === 'updateProfile') {
                    const args = call.args as any;
                    if (args.objective) setObjective(args.objective);
                    if (args.personalities) setSelectedPersonalities(args.personalities);
                    if (args.notes) setManualNotes(args.notes);
                    if (args.name) setName(args.name);
                    if (args.relationship) {
                      setRelationshipPreset('custom');
                      setRelationship(args.relationship);
                    }
                    
                    // Send response back
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { success: true }
                        }]
                      });
                    });
                  }
                }
              }
            }
          },
          onclose: () => {
            setIsLiveConnected(false);
            setIsLiveConnecting(false);
            stopLiveSession();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            setIsLiveConnected(false);
            setIsLiveConnecting(false);
            stopLiveSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: `You are a friendly RehearsAI expert. Your goal is to help the user set up a roleplay simulation. 
You need to gather:
1. The name of the person they want to simulate (interlocutor).
2. The user's relationship to this person.
3. The objective of the conversation.
4. The core personality traits of the interlocutor.
5. Any additional notes.

Ask one question at a time. Be conversational and empathetic. When you have enough information, call the updateProfile tool to save the data.`,
          tools: [{ functionDeclarations: [updateProfileTool] }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      liveSessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Error starting live session:", error);
      setIsLiveConnecting(false);
    }
  };

  const stopLiveSession = () => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }
    if (liveSessionRef.current) {
      liveSessionRef.current.then((session: any) => session.close());
      liveSessionRef.current = null;
    }
    setIsLiveConnected(false);
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imagePreview || !name || !userName || !relationship || !objective || (selectedPersonalities.length === 0 && !manualNotes)) return;

    const profileParts = [];
    if (selectedPersonalities.length > 0) {
      profileParts.push(`${t('setup.personality')}: ${selectedPersonalities.join(', ')}`);
    }
    if (manualNotes) {
      profileParts.push(`${t('setup.notes')}: ${manualNotes}`);
    }

    setSetupData({
      name,
      userName,
      relationship,
      userImageBase64: imagePreview,
      objective,
      profile: profileParts.join('. '),
      difficulty,
      skipImageGeneration,
    });
    navigate('/generating');
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-700 overflow-hidden relative">
      <button 
        onClick={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
        className="absolute top-4 right-4 z-50 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
      >
        {i18n.language.startsWith('es') ? 'EN' : 'ES'}
      </button>
      
      {/* Sidebar - Only show in manual or ai mode */}
      {setupMode !== 'select' && (
        <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 shrink-0">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-violet-600/10 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">RehearsAI</h1>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-medium">{t('setup.subtitle')}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {/* Image Upload */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-32 h-32 rounded-full border-4 shadow-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all ${
                    imagePreview ? 'border-violet-600/50' : 'border-violet-600/20 bg-slate-100 hover:border-violet-600/50'
                  }`}
                >
                  {imagePreview ? (
                    <img alt="Interlocutor preview" className="w-full h-full object-cover" src={imagePreview} />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="mt-4 text-center w-full">
                <h3 className="font-bold text-sm text-slate-800 mb-3">{t('setup.name')}</h3>
                
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 placeholder:text-slate-400 p-2.5 outline-none transition-all text-center mb-2" 
                  placeholder={t('setup.namePlaceholder')}
                  required
                />

                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-violet-600 text-[11px] font-bold uppercase tracking-wider hover:text-violet-700"
                >
                  {imagePreview ? t('setup.avatar.upload').replace(' (Optional)', '') : t('setup.avatar.upload')}
                </button>
              </div>
            </div>

            {/* User Info & Relationship */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('setup.relationshipAndName')}</h4>
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input 
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" 
                    placeholder={t('setup.userNamePlaceholder')}
                    required
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between text-sm font-semibold transition-all outline-none text-slate-700"
                    >
                      <span className={relationshipPreset ? 'text-slate-700' : 'text-slate-400'}>
                        {relationshipPreset === 'custom' ? t('setup.customRelationship') : relationshipPreset || t('setup.selectRelationship')}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 5, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden py-2"
                        >
                          <div className="max-h-60 overflow-y-auto custom-scrollbar px-1">
                            {relationshipOptions.map((opt, index) => {
                              const Icon = opt.icon;
                              const val = (opt as any).value || opt.label;
                              const isSelected = relationshipPreset === val;
                              
                              return (
                                <motion.button
                                  key={opt.label}
                                  type="button"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  onClick={() => {
                                    setRelationshipPreset(val);
                                    if (val !== 'custom') {
                                      setRelationship(val);
                                    } else {
                                      setRelationship('');
                                    }
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group mb-0.5 ${
                                    isSelected 
                                      ? 'text-violet-700 bg-violet-50' 
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-violet-600'
                                  }`}
                                >
                                  <div className={`p-2 rounded-lg transition-colors ${
                                    isSelected 
                                      ? 'bg-violet-100 text-violet-600' 
                                      : 'bg-slate-100 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500'
                                  }`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="flex-1 text-left font-medium">{opt.label}</span>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    >
                                      <Check className="w-4 h-4 text-violet-600" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {relationshipPreset === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 pt-3 border-t border-slate-200"
                    >
                      <input 
                        type="text"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" 
                        placeholder={t('setup.customRelationshipPlaceholder')}
                        required
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50/50 space-y-3">
            <button 
              type="button"
              onClick={() => setIsAdvancedModalOpen(true)}
              className="w-full bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-600 hover:text-violet-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">{t('setup.advancedSettings')}</span>
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!imagePreview || !name || !userName || !relationship || !objective || (selectedPersonalities.length === 0 && !manualNotes)}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-violet-600/20"
            >
              <span className="text-sm">{t('setup.start')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-100 p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {setupMode === 'select' ? (
          <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 mb-2">
                <Brain className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('setup.mode.title')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <button 
                onClick={() => setSetupMode('ai')}
                className="group flex flex-col items-center text-center p-8 bg-white rounded-3xl border-2 border-transparent hover:border-violet-500 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-10 h-10 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t('setup.mode.ai')}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t('setup.mode.aiDesc')}</p>
              </button>

              <button 
                onClick={() => setSetupMode('manual')}
                className="group flex flex-col items-center text-center p-8 bg-white rounded-3xl border-2 border-transparent hover:border-violet-500 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Edit3 className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t('setup.mode.manual')}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t('setup.mode.manualDesc')}</p>
              </button>
            </div>
          </div>
        ) : setupMode === 'manual' ? (
          <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="grid grid-cols-12 gap-6">
              
              {/* Objective */}
              <div className="col-span-12 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-violet-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('setup.objective')}</h2>
                </div>
                <textarea 
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-700 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 min-h-[100px] placeholder:text-slate-400 p-4 resize-none outline-none transition-all" 
                  placeholder={t('setup.objectivePlaceholder')}
                  required
                />
              </div>

              {/* Core Personality */}
              <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-violet-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('setup.corePersonality')}</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPersonalities.map(p => (
                    <span key={p} className="px-3 py-1.5 bg-violet-600/10 text-violet-700 border border-violet-600/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center">
                      {p}
                      <button type="button" onClick={() => removePersonality(p)} className="ml-1.5 hover:text-violet-900 focus:outline-none">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-3 py-1.5 border border-dashed border-slate-300 text-slate-500 rounded-lg text-xs font-medium hover:border-violet-600 hover:text-violet-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {t('setup.addTrait')}
                  </button>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{t('setup.customizeTone')}</span>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-violet-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('setup.additionalNotes')}</h2>
                </div>
                <textarea 
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 h-28 placeholder:text-slate-400 p-4 resize-none outline-none transition-all" 
                  placeholder={t('setup.additionalNotesPlaceholder')}
                />
              </div>

            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 pb-12">
             {/* AI Expert Mode UI */}
             <div className="flex flex-col gap-6">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-violet-600" />
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${isLiveConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-800">{t('setup.expert.title')}</h2>
                          <p className="text-xs text-slate-500">
                            {isLiveConnecting ? t('setup.expert.connecting') : 
                             !isLiveConnected ? 'Desconectado' : 
                             aiSpeaking ? t('setup.expert.speaking') : 
                             t('setup.expert.listening')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isLiveConnected ? (
                          <button 
                            onClick={startLiveSession}
                            disabled={isLiveConnecting}
                            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                          >
                            {isLiveConnecting ? t('setup.expert.connecting') : "Conectar"}
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => setIsMicMuted(!isMicMuted)}
                              className={`p-2.5 rounded-full transition-colors ${isMicMuted ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={stopLiveSession}
                              className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-4 border border-slate-100">
                      {liveMessages.length === 0 && !isLiveConnected && (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                          Haz clic en Conectar para empezar a hablar con el experto.
                        </div>
                      )}
                      {liveMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-200' : 'bg-violet-100'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-slate-500" /> : <Brain className="w-4 h-4 text-violet-600" />}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-600" />
                      {t('setup.expert.understanding')}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('setup.objective')}</span>
                        <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {objective || t('setup.expert.waitingInfo')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('setup.corePersonality')}</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedPersonalities.length > 0 ? selectedPersonalities.map(p => (
                            <span key={p} className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium border border-violet-100">
                              {p}
                            </span>
                          )) : (
                            <span className="text-sm text-slate-400 italic">{t('setup.expert.waitingInfo')}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('setup.additionalNotes')}</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                          {manualNotes || t('setup.expert.waitingInfo')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSetupMode('manual')}
                    className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    {t('setup.mode.manual')}
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Personality Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{t('setup.selectTraits')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {corePersonalities.map(p => {
                  const isSelected = selectedPersonalities.includes(p.label);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePersonality(p.label)}
                      className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center justify-center text-center h-full ${
                        isSelected 
                          ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-600/20 scale-[1.02]' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-600/50 hover:text-violet-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-violet-600/20"
              >
                {t('setup.confirmSelection')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Advanced Settings Modal */}
      {isAdvancedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{t('setup.advancedSettings')}</h3>
              <button onClick={() => setIsAdvancedModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              
              {/* Difficulty */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-violet-600" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('setup.sceneDifficulty')}</h2>
                  </div>
                  <span className="text-[11px] font-bold text-violet-700 bg-violet-600/10 px-2 py-1 rounded">
                    {t('setup.selectedLevel')}: {t(`setup.diff.${difficulty.toLowerCase() === 'fácil' ? 'easy' : difficulty.toLowerCase() === 'intermedio' ? 'medium' : 'hard'}`).toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {difficulties.map(d => {
                    const isSelected = difficulty === d.level;
                    return (
                      <div 
                        key={d.level}
                        onClick={() => setDifficulty(d.level)}
                        className={`cursor-pointer group p-4 rounded-2xl transition-all relative ${
                          isSelected 
                            ? 'bg-white border-2 border-violet-600 shadow-md' 
                            : 'bg-slate-50 border border-slate-200 hover:border-violet-600/30'
                        }`}
                      >
                        {d.level === 'Intermedio' && (
                          <div className="absolute -top-3 right-4 bg-violet-600 text-[9px] font-black px-2 py-0.5 rounded text-white uppercase shadow-sm">
                            {t('setup.recommended')}
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-bold text-[10px] uppercase tracking-widest ${isSelected ? 'text-violet-600' : 'text-slate-500'}`}>
                            {t(`setup.diff.${d.level.toLowerCase() === 'fácil' ? 'easy' : d.level.toLowerCase() === 'intermedio' ? 'medium' : 'hard'}`)}
                          </span>
                          <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300 group-hover:border-violet-600'}`}></div>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                          {d.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Interface Options */}
              <div className="flex flex-wrap items-center justify-between bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t('setup.interfaceOptions')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={skipImageGeneration}
                    onChange={(e) => setSkipImageGeneration(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  <span className="ms-3 text-xs font-semibold text-slate-600">{t('setup.skipAvatarGen')}</span>
                </label>
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setIsAdvancedModalOpen(false)}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-violet-600/20"
              >
                {t('setup.close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
