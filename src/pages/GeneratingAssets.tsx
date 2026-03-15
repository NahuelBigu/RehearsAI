import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { generateEmotionImages, detectGenderAndVoice } from '../lib/gemini';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function GeneratingAssets() {
  const navigate = useNavigate();
  const { setupData, setAiAvatars, setSelectedVoice } = useSimulation();
  const { t } = useTranslation();
  const [status, setStatus] = useState(t('gen.analyzing'));

  useEffect(() => {
    if (!setupData.userImageBase64) {
      navigate('/');
      return;
    }

    const generate = async () => {
      try {
        setStatus(t('gen.detecting'));
        const { voice } = await detectGenderAndVoice(setupData.userImageBase64!);
        setSelectedVoice(voice);

        if (setupData.skipImageGeneration) {
          setStatus(t('gen.skipping'));
        } else {
          setStatus(t('gen.generating'));
        }
        const avatars = await generateEmotionImages(setupData.userImageBase64!, setupData.skipImageGeneration);
        setAiAvatars(avatars);
        
        setStatus(t('gen.preparing'));
        setTimeout(() => {
          navigate('/simulation');
        }, 1000);
      } catch (error: any) {
        console.error('Generation failed:', error);
        console.log('Falling back to original image due to generation error.');
        
        // Detailed logging of why it might have failed
        if (error.message?.includes('API key')) {
          console.error('Reason: Invalid or missing API Key.');
        } else if (error.message?.includes('quota')) {
          console.error('Reason: API Quota exceeded.');
        } else {
          console.error('Reason:', error.message || 'Unknown error during asset generation.');
        }

        // Fallback: Use the original image for all emotions
        const fallbackAvatars = {
          neutral: setupData.userImageBase64!,
          happy: setupData.userImageBase64!,
          angry: setupData.userImageBase64!,
          impatient: setupData.userImageBase64!,
          sad: setupData.userImageBase64!,
          surprised: setupData.userImageBase64!
        };
        setAiAvatars(fallbackAvatars);
        
        setStatus(t('gen.error'));
        setTimeout(() => {
          navigate('/simulation');
        }, 2000);
      }
    };

    generate();
  }, [setupData, navigate, setAiAvatars, setSelectedVoice]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center"
      >
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 border-4 border-violet-500/40 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('gen.creating')}</h2>
        <p className="text-slate-500 text-center max-w-sm animate-pulse font-medium">
          {status}
        </p>
      </motion.div>
    </div>
  );
}
