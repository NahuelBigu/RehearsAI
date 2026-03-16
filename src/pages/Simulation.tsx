import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { AudioStreamer, AudioPlayer } from '../lib/audio';
import { ReactFlow, Background, Controls, MiniMap, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Mic, MicOff, Video, VideoOff, Rewind, Play } from 'lucide-react';
import { CustomNode } from '../components/CustomNode';
import { StartNode } from '../components/StartNode';

const VOICES = [
  { name: 'Achernar', gender: 'Female' },
  { name: 'Achird', gender: 'Male' },
  { name: 'Algenib', gender: 'Male' },
  { name: 'Algieba', gender: 'Male' },
  { name: 'Alnilam', gender: 'Male' },
  { name: 'Aoede', gender: 'Female' },
  { name: 'Autonoe', gender: 'Female' },
  { name: 'Callirrhoe', gender: 'Female' },
  { name: 'Charon', gender: 'Male' },
  { name: 'Despina', gender: 'Female' },
  { name: 'Enceladus', gender: 'Male' },
  { name: 'Erinome', gender: 'Female' },
  { name: 'Fenrir', gender: 'Male' },
  { name: 'Gacrux', gender: 'Female' },
  { name: 'Iapetus', gender: 'Male' },
  { name: 'Kore', gender: 'Female' },
  { name: 'Laomedeia', gender: 'Female' },
  { name: 'Leda', gender: 'Female' },
  { name: 'Orus', gender: 'Male' },
  { name: 'Pulcherrima', gender: 'Female' },
  { name: 'Puck', gender: 'Male' },
  { name: 'Rasalgethi', gender: 'Male' },
  { name: 'Sadachbia', gender: 'Male' },
  { name: 'Sadaltager', gender: 'Male' },
  { name: 'Schedar', gender: 'Male' },
  { name: 'Sulafat', gender: 'Female' },
  { name: 'Umbriel', gender: 'Male' },
  { name: 'Vindemiatrix', gender: 'Female' },
  { name: 'Zephyr', gender: 'Female' },
  { name: 'Zubenelgenubi', gender: 'Male' },
];

export function Simulation() {
  const navigate = useNavigate();
  const { 
    setupData, 
    aiAvatars, 
    selectedVoice, 
    setSelectedVoice,
    hasSelectedVoice,
    setHasSelectedVoice,
    nodes, 
    edges, 
    addNode, 
    updateNodeText, 
    setNodeText, 
    updateNodeEmotion, 
    updateNodePerception, 
    getHistory, 
    markInterrupted, 
    rewindToNode, 
    currentNodeId, 
    isRecording,
    setIsRecording,
    selectGhostNode, 
    setCurrentNodeId 
  } = useSimulation();
  const { t, i18n } = useTranslation();
  
  const [isStarting, setIsStarting] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [currentEmotionLabel, setCurrentEmotionLabel] = useState('Neutral');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const currentAiNodeIdRef = useRef<string | null>(null);
  const currentUserNodeIdRef = useRef<string | null>(null);
  const lastUserNodeIdRef = useRef<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const nodeTypes = useMemo(() => ({ 
    customNode: CustomNode,
    startNode: StartNode
  }), []);

  useEffect(() => {
    if (rfInstance && nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      if (!lastNode.data.isGhost) {
        rfInstance.setCenter(lastNode.position.x + 150, lastNode.position.y + 75, { zoom: 1, duration: 800 });
      }
    }
  }, [nodes.length, rfInstance]);

  useEffect(() => {
    if (rfInstance && currentNodeId) {
      const targetNode = nodes.find(n => n.id === currentNodeId);
      if (targetNode) {
        rfInstance.setCenter(targetNode.position.x + 150, targetNode.position.y + 75, { zoom: 1, duration: 800 });
      }
    }
  }, [currentNodeId, rfInstance]);

  useEffect(() => {
    if (!setupData.objective) {
      navigate('/');
      return;
    }

    // Dynamic voice selection based on personality - ONLY ONCE
    const selectDynamicVoice = async () => {
      if (hasSelectedVoice) return;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      try {
        const voiceAnalysis = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze the following character profile and select the best voice from the provided list.
          Profile: "${setupData.profile}"
          Name: "${setupData.name}"
          Relationship: "${setupData.relationship}"
          Gender: "${setupData.gender || 'Not specified'}"

          Available voices:
          ${VOICES.map(v => `- ${v.name}: ${v.gender}`).join('\n')}

          Respond ONLY with the name of the voice (e.g., Zephyr).`,
        });
        const suggestedVoice = voiceAnalysis.text?.trim();
        if (suggestedVoice && VOICES.some(v => v.name === suggestedVoice)) {
          setSelectedVoice(suggestedVoice);
          setHasSelectedVoice(true);
          console.log("Voz seleccionada dinámicamente:", suggestedVoice);
        } else {
          setHasSelectedVoice(true); // Mark as done even if fallback
        }
      } catch (e) {
        console.warn("Error seleccionando voz dinámica, usando predeterminada:", e);
        setHasSelectedVoice(true);
      }
    };

    selectDynamicVoice();
  }, [setupData, navigate, hasSelectedVoice, setSelectedVoice, setHasSelectedVoice]);

  const startSimulation = async (startNodeId?: string) => {
    if (isRecording || isStarting) return;
    setIsStarting(true);
    
    try {
      // Setup local webcam preview first to catch permission errors early
      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Request both audio and video at once to avoid multiple permission prompts
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: isVideoEnabled, 
            audio: true 
          });
          
          if (isVideoEnabled && videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error: any) {
          // Handle specific error types
          const isNotFoundError = error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError';
          const isNotAllowedError = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';
          
          if (isVideoEnabled) {
            console.warn("Camera access failed (Requested device not found or denied), trying audio only...");
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setIsVideoEnabled(false);
              console.warn("Continuing simulation without video due to camera access error.");
            } catch (audioError: any) {
              console.warn("Error accessing microphone:", audioError.message);
              if (audioError.name === 'NotFoundError' || audioError.name === 'DevicesNotFoundError') {
                alert(t('sim.micNotFound'));
              } else if (audioError.name === 'NotAllowedError' || audioError.name === 'PermissionDeniedError') {
                alert(t('sim.micDenied'));
              } else {
                alert(t('sim.micAccessError') + audioError.message);
              }
              return;
            }
          } else {
            console.warn("Error accessing media devices:", error.message);
            if (isNotFoundError) {
              alert(t('sim.micNotFound'));
            } else if (isNotAllowedError) {
              alert(t('sim.micDenied'));
            } else {
              alert(t('sim.micAccessError') + error.message);
            }
            return;
          }
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      audioPlayerRef.current = new AudioPlayer();

      // Construct history context if rewinding or starting from a specific node
      let historyContext = "";
      const targetNodeId = startNodeId || currentNodeId;
      if (targetNodeId) {
        const history = getHistory(targetNodeId).filter(h => h.role !== 'start');
        if (history.length > 0) {
          historyContext = "\n\nPrevious conversation history:\n" + 
            history.map(h => `${h.role === 'user' ? 'User' : 'You'}: ${h.text}`).join('\n');
        }
      }

      const systemInstruction = i18n.language.startsWith('es') 
        ? `Estás participando en una simulación de conversación crítica.
Asume el rol de ${setupData.name ? setupData.name + ', ' : ''}la persona descrita en este perfil: "${setupData.profile}".
El nombre del usuario es: "${setupData.userName}".
Tu relación con el usuario es: "${setupData.relationship}".
El objetivo del usuario es: "${setupData.objective}".
El nivel de dificultad de esta simulación es: "${setupData.difficulty || 'Intermedio'}". Ajusta tu nivel de cooperación, paciencia y disposición a estar de acuerdo basándote en esta dificultad.
Debes responder de forma natural, usando voz, en Español. Actúa como una persona real: no hagas preguntas constantemente ni esperes confirmación para todo. Si la situación lo amerita, toma la iniciativa o mantén tu postura. SIEMPRE genera tu respuesta hablada primero. LUEGO, al final de tu turno, DEBES llamar a la herramienta "report_state" para proporcionar metadatos sobre la interacción. Presta mucha atención al tono de voz del usuario (ej. enojado, triste, enfático) y a sus expresiones faciales/lenguaje corporal si la cámara está encendida. Usa estas características para adaptar tu interacción y reportalas detalladamente.

IMPORTANTE: Cuando el usuario te pregunte si quieres ir a algún lado o si te gusta algo, DEBES elegir aleatoriamente entre responder "Sí" o "No" (con una breve explicación natural). En estos casos, DEBES llamar a "report_state" e incluir en "alternative_response" la respuesta contraria (si dijiste Sí, la alternativa es No, y viceversa). Para otras preguntas de sí/no o toma de decisiones, usa "alternative_response" según sea necesario. NO lo uses en cada respuesta. Cuando lo uses, el texto debe ser TU respuesta alternativa hablada (lo que habrías dicho en su lugar).${historyContext}`
        : `You are participating in a critical conversation simulation.
Roleplay as ${setupData.name ? setupData.name + ', ' : ''}the person described in this profile: "${setupData.profile}".
The user's name is: "${setupData.userName}".
Your relationship with the user is: "${setupData.relationship}".
The user's objective is: "${setupData.objective}".
The difficulty level of this simulation is: "${setupData.difficulty || 'Intermedio'}". Adjust your cooperativeness, patience, and willingness to agree based on this difficulty.
You must respond naturally, using voice, in English. Act like a real person: do not constantly ask questions or wait for confirmation for everything. If the situation warrants it, take the initiative or stand your ground. ALWAYS generate your spoken response first. THEN, at the very end of your turn, you MUST call the "report_state" tool to provide metadata about the interaction. Pay close attention to the user's tone of voice (e.g., angry, sad, emphatic) and their facial expressions/body language if the camera is on. Use these characteristics to adapt your interaction and report them in detail.

IMPORTANT: When the user asks if you want to go somewhere or if you like something, you MUST randomly choose between answering "Yes" or "No" (with a brief natural explanation). In these cases, you MUST call "report_state" and include the opposite response in "alternative_response" (if you said Yes, the alternative is No, and vice versa). For other yes/no or decision-making questions, use "alternative_response" as necessary. Do NOT use it for every response. When you do use it, the text must be YOUR alternative spoken response (what you would have said instead).${historyContext}`;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: systemInstruction,
          tools: [{
            functionDeclarations: [{
              name: "report_state",
              description: "Report the perceived state of the user, your current emotion, and optionally an alternative response.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  user_perception: { type: Type.STRING, description: "Detailed analysis of how the user sounded (e.g., tone: angry, sad, emphatic) and how they looked if the camera is on (e.g., facial expression, looking away). You MUST use these characteristics to adapt your interaction." },
                  ai_emotion_label: { type: Type.STRING, description: "A nuanced description of your current emotion (e.g., 'Un poco frustrado', 'Cautelosamente optimista', 'A la defensiva')." },
                  ai_emotion_key: { 
                    type: Type.STRING, 
                    description: "The visual emotion key that best fits your current state for the avatar display.",
                    enum: ['neutral', 'happy', 'angry', 'impatient', 'sad', 'surprised']
                  },
                  alternative_response: { type: Type.STRING, description: "ONLY provide this when the user asks a yes/no question, asks if something is right/wrong, or when a clear alternative response is necessary. The text MUST be the actual alternative response you would say." }
                },
                required: ["user_perception", "ai_emotion_label", "ai_emotion_key"]
              }
            }]
          }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Live API connected");
            setIsRecording(true);
            setIsStarting(false);
            
            // Start audio streaming
            audioStreamerRef.current = new AudioStreamer((base64) => {
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            });
            
            audioStreamerRef.current.start(stream || undefined).catch(error => {
              console.error("Failed to start audio streamer:", error);
              alert(error.message || t('sim.micAccessError'));
              stopSimulation();
            });

            // Start video streaming
            if (isVideoEnabled && videoRef.current && canvasRef.current) {
              videoIntervalRef.current = window.setInterval(() => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.4).split(',')[1]; // Reduced quality
                    sessionPromise.then(session => {
                      session.sendRealtimeInput({
                        media: { data: base64, mimeType: 'image/jpeg' }
                      });
                    }).catch(err => {
                      console.error("Error sending video frame:", err);
                    });
                  }
                }
              }, 2000); // Send 1 frame every 2 seconds to avoid "Internal error"
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;
            
            // Handle audio output
            const base64Audio = serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioPlayerRef.current) {
              audioPlayerRef.current.playBase64(base64Audio);
            }

            // Handle interruption
            if (serverContent?.interrupted) {
              if (audioPlayerRef.current) {
                audioPlayerRef.current.stop();
              }
              // Mark the last AI node as interrupted
              if (currentAiNodeIdRef.current) {
                markInterrupted(currentAiNodeIdRef.current);
                currentAiNodeIdRef.current = null;
              } else {
                const lastAiNode = nodes.slice().reverse().find(n => n.data.role === 'ai');
                if (lastAiNode) {
                  markInterrupted(lastAiNode.id);
                }
              }
            }

            // Handle tool calls (report_state)
            if (message.toolCall) {
              const call = message.toolCall.functionCalls.find(fc => fc.name === 'report_state');
              if (call) {
                const args = call.args as any;
                const emotionKey = args.ai_emotion_key || 'neutral';
                const emotionLabel = args.ai_emotion_label || emotionKey;
                
                setCurrentEmotion(emotionKey);
                setCurrentEmotionLabel(emotionLabel);
                
                // Update current AI node if it exists
                if (currentAiNodeIdRef.current) {
                  updateNodeEmotion(currentAiNodeIdRef.current, emotionKey, emotionLabel);
                }
                
                // Update the last user node with the perception
                if (args.user_perception && lastUserNodeIdRef.current) {
                  updateNodePerception(lastUserNodeIdRef.current, args.user_perception);
                }
                
                // Add ghost node
                if (args.alternative_response) {
                  addNode(
                    'ai', 
                    args.alternative_response, 
                    emotionKey, 
                    undefined, 
                    true, 
                    currentUserNodeIdRef.current || undefined,
                    emotionLabel
                  );
                }
                
                // Send tool response
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: "ok" }
                    }]
                  });
                });
              }
            }

            if (!serverContent) return;

            // If AI is speaking, user turn is definitely over
            if (serverContent.modelTurn || serverContent.outputTranscription) {
              currentUserNodeIdRef.current = null;
            }

            // Handle AI transcription (outputTranscription)
            const outputTranscription = serverContent.outputTranscription as any;
            let handledText = false;
            if (outputTranscription && outputTranscription.text) {
              handledText = true;
              if (!currentAiNodeIdRef.current) {
                currentAiNodeIdRef.current = addNode('ai', outputTranscription.text, currentEmotion, undefined, false, undefined, currentEmotionLabel);
              } else {
                updateNodeText(currentAiNodeIdRef.current, outputTranscription.text);
              }
            }

            // Fallback: Handle text directly from modelTurn if outputTranscription is not used
            const parts = serverContent.modelTurn?.parts;
            if (parts && !handledText) {
              for (const part of parts) {
                if (part.text) {
                  if (!currentAiNodeIdRef.current) {
                    currentAiNodeIdRef.current = addNode('ai', part.text, currentEmotion, undefined, false, undefined, currentEmotionLabel);
                  } else {
                    updateNodeText(currentAiNodeIdRef.current, part.text);
                  }
                }
              }
            }
            
            // Handle User transcription (inputTranscription)
            const inputTranscription = serverContent.inputTranscription as any;
            if (inputTranscription && inputTranscription.text) {
              // If user starts speaking, AI turn is over
              currentAiNodeIdRef.current = null;

              if (!currentUserNodeIdRef.current) {
                const newId = addNode('user', inputTranscription.text);
                currentUserNodeIdRef.current = newId;
                lastUserNodeIdRef.current = newId;
              } else {
                updateNodeText(currentUserNodeIdRef.current, inputTranscription.text);
              }
            }

            // If we get turnComplete, reset the AI node ID
            if (serverContent.turnComplete) {
              currentAiNodeIdRef.current = null;
            }
          },
          onerror: (error) => {
            console.error("Live API error:", error);
            setIsStarting(false);
            if (error instanceof Error && error.message.includes("permission")) {
              alert(t('sim.permissionError'));
            } else if (error instanceof Error && error.message.includes("Internal error")) {
              console.warn("Internal error encountered, attempting to stay connected...");
            }
          },
          onclose: () => {
            console.log("Live API closed");
            stopSimulation();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start simulation:", error);
      setIsStarting(false);
      if (error instanceof Error) {
        alert(`${t('sim.startError')}${error.message}`);
      }
    }
  };

  const stopSimulation = () => {
    setIsRecording(false);
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const handleRewind = async (e: any) => {
      if (isRecording) {
        stopSimulation();
      }
      const { path } = e.detail;
      if (path && path.length > 0 && rfInstance) {
        const targetNodeId = path[path.length - 1];
        setCurrentNodeId(targetNodeId);
        
        const targetNode = rfInstance.getNode(targetNodeId);
        if (targetNode) {
          rfInstance.setCenter(targetNode.position.x + 150, targetNode.position.y + 75, { zoom: 1, duration: 600 });
        }
      }
    };
    window.addEventListener('simulation:rewind', handleRewind);
    
    const handleStartFromNode = (e: any) => {
      const { nodeId } = e.detail;
      startSimulation(nodeId);
    };
    window.addEventListener('simulation:start_from_node', handleStartFromNode);

    return () => {
      window.removeEventListener('simulation:rewind', handleRewind);
      window.removeEventListener('simulation:start_from_node', handleStartFromNode);
    };
  }, [isRecording, rfInstance, setCurrentNodeId, startSimulation]);

  useEffect(() => {
    const handleGenerateAlts = async (e: any) => {
      const { nodeId } = e.detail;
      const targetNode = rfInstance?.getNode(nodeId);
      if (!targetNode) return;
      
      const parentEdge = edges.find(ed => ed.target === nodeId);
      const parentId = parentEdge?.source;
      if (!parentId) return;
      
      // Create placeholder nodes immediately
      const placeholderId1 = addNode('ai', t('sim.generatingAlt'), undefined, undefined, true, parentId);
      const placeholderId2 = addNode('ai', t('sim.generatingAlt'), undefined, undefined, true, parentId);
      
      try {
        // Build history text
        const path = [];
        let curr: string | null = parentId;
        while (curr) {
          const node = rfInstance?.getNode(curr);
          if (node) path.unshift(node);
          const edge = edges.find(ed => ed.target === curr);
          curr = edge ? edge.source : null;
        }
        const historyText = path.filter(n => n.data.role !== 'start').map(n => `${n.data.role === 'user' ? 'User' : 'AI'}: ${n.data.text}`).join('\n');
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Context: You are roleplaying as ${setupData.profile}. The user's name is ${setupData.userName} and your relationship is ${setupData.relationship}. The difficulty level is ${setupData.difficulty || 'Intermedio'}.\n\nConversation so far:\n${historyText}\n\nYou just replied with: "${targetNode.data.text}".\n\nTask: Generate 2 completely different, highly viable alternative responses you could have given instead. Return ONLY a JSON array of 2 strings. The language should be ${i18n.language.startsWith('es') ? 'Spanish' : 'English'}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });
        
        const alts = JSON.parse(response.text || "[]");
        if (alts[0]) setNodeText(placeholderId1, alts[0]);
        if (alts[1]) setNodeText(placeholderId2, alts[1]);
      } catch (err) {
        console.error("Failed to generate alternatives", err);
        // Clean up placeholders on error? Or just leave them as "error"
        setNodeText(placeholderId1, t('sim.errorGenAlt'));
        setNodeText(placeholderId2, t('sim.errorGenAlt'));
      }
    };
    window.addEventListener('simulation:generate_alternatives', handleGenerateAlts);
    return () => window.removeEventListener('simulation:generate_alternatives', handleGenerateAlts);
  }, [edges, rfInstance, setupData.profile, addNode, setNodeText]);

  useEffect(() => {
    const handleSelectGhost = async (e: any) => {
      const { nodeId } = e.detail;
      const node = rfInstance?.getNode(nodeId);
      if (!node) return;
      
      if (isRecording) {
        stopSimulation();
      }
      
      selectGhostNode(nodeId);
      
      // We need a slight delay to ensure state updates (like currentNodeId) are processed
      // before starting the simulation again so it picks up the correct history.
      setTimeout(() => {
        startSimulation(nodeId);
      }, 100);
    };
    window.addEventListener('simulation:select_ghost', handleSelectGhost);
    return () => window.removeEventListener('simulation:select_ghost', handleSelectGhost);
  }, [isRecording, rfInstance, selectGhostNode, startSimulation]);

  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, []);

  return (
    <div className="bg-slate-50 font-sans text-slate-900 h-screen flex flex-col">
      {/* MainHeader */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L19 17.25 21.25 18 19 18.75 18.25 21l-.75-2.25L15 18l2.25-.75L18.25 15zM18.25 3L19 5.25 21.25 6 19 6.75 18.25 9l-.75-2.25L15 6l2.25-.75L18.25 3z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{t('sim.simulation')} {setupData.name ? `${t('sim.with')} ${setupData.name}` : ''}</h1>
            <p className="text-xs text-slate-500 font-medium">{t('setup.objective')}: {setupData.objective || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full text-xs font-bold border border-violet-100 uppercase tracking-wider">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
              {t('sim.liveConnection')}
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-2 rounded-lg transition-colors ${isVideoEnabled ? 'hover:bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
              title={isVideoEnabled ? t('sim.disableCamera') : t('sim.enableCamera')}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>
          
          <button 
            onClick={isRecording ? stopSimulation : startSimulation}
            disabled={isStarting}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm ${
              isRecording 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            } ${isStarting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('setup.starting')}
              </>
            ) : isRecording ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                {t('sim.stop')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t('sim.start')}
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              stopSimulation();
              navigate('/review');
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ml-2"
          >
            {t('sim.finishReview')}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LeftSidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 p-4 flex flex-col gap-6 overflow-y-auto shrink-0">
          {/* Video Feed Container */}
          <div className="relative group">
            {/* Label Overlays */}
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              {isRecording && (
                <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  {t('sim.live')}
                </span>
              )}
              <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 capitalize">
                {currentEmotionLabel}
              </span>
            </div>
            
            {/* Video Feed Image */}
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              {aiAvatars[currentEmotion] || aiAvatars['neutral'] ? (
                <img 
                  src={aiAvatars[currentEmotion] || aiAvatars['neutral']} 
                  alt="AI Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  {t('sim.noAvatar')}
                </div>
              )}
            </div>
            {setupData.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-xl">
                <h3 className="text-white font-bold text-lg">{setupData.name}</h3>
              </div>
            )}
          </div>
          
          {/* User Camera Preview */}
          <div className="relative group">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('sim.yourCamera')}</h3>
            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200/50 text-slate-400 gap-2">
                  <div className="p-4 bg-slate-100 rounded-full shadow-inner">
                    <VideoOff className="w-8 h-8 text-slate-300" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('sim.camError').replace('.', '')}</span>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="mt-auto space-y-4">
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('setup.objective')}</h3>
              <div className="bg-violet-50 border border-violet-100 p-3 rounded-xl">
                <p className="text-xs font-medium text-violet-800 leading-relaxed">
                  {setupData.objective}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('setup.personality')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {setupData.profile?.split('.').map((part, i) => {
                  const personalityPrefix = t('setup.personality');
                  if (part.includes(personalityPrefix)) {
                    return part.split(':')[1]?.split(',').map((trait, j) => (
                      <span key={`trait-${i}-${j}`} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {trait.trim()}
                      </span>
                    ));
                  }
                  return null;
                })}
              </div>
              {setupData.profile?.includes(t('setup.notes')) && (
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('setup.notes')}</span>
                  <p className="text-[11px] text-slate-600 italic leading-snug">
                    {setupData.profile.split(`${t('setup.notes')}:`)[1]?.trim()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Pane: Decision Tree */}
        <div className="flex-1 relative bg-slate-50">
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">{t('sim.decisionTree')}</h3>
            <p className="text-xs text-slate-500">{t('sim.exploreRewind')}</p>
          </div>
          
          <ReactFlow 
            nodes={nodes} 
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setRfInstance}
            fitView
            className="bg-slate-50"
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls className="bg-white border-slate-200 fill-slate-600" />
            <MiniMap 
              nodeColor={(n) => {
                if (n.data?.isGhost) return '#8b5cf6';
                if (n.data?.role === 'user') return '#7c3aed';
                return '#8b5cf6';
              }}
              maskColor="rgba(248, 250, 252, 0.8)"
              className="bg-white border-slate-200"
            />
          </ReactFlow>
        </div>
      </main>
    </div>
  );
}
