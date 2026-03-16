import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CustomNodeData } from '../context/SimulationContext';
import { User, Bot, Ghost, AlertTriangle, Rewind, GitBranch, Check } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { useTranslation } from 'react-i18next';

const playRewindSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const CustomNode = memo(({ id, data }: { id: string, data: CustomNodeData }) => {
  const { rewindToNode, currentNodeId, isRecording, nodes, edges } = useSimulation();
  const { t } = useTranslation();
  
  const isUser = data.role === 'user';
  const isGhost = data.isGhost;
  const isInterrupted = data.isInterrupted;
  const isCurrent = id === currentNodeId;
  const isHighlighted = data.isHighlighted as boolean;

  // Check if this is the "Live" node (last node in the main path AND we are actively recording)
  const isLastNode = !isGhost && !nodes.some(n => edges.some(e => e.source === id && e.target === n.id));
  const isLive = isRecording && isCurrent && isLastNode && !isGhost && data.role !== 'start';

  let bgClass = 'bg-white border-slate-200';
  let textClass = 'text-slate-700';
  let icon = <Bot className="w-4 h-4 text-violet-600" />;

  if (isUser) {
    bgClass = 'bg-violet-50 border-violet-200';
    textClass = 'text-violet-800';
    icon = <User className="w-4 h-4 text-violet-600" />;
  } else if (isGhost) {
    bgClass = 'bg-purple-50 border-purple-200 shadow-[0_0_15px_rgba(139,92,246,0.2)]';
    textClass = 'text-purple-800';
    icon = <Ghost className="w-4 h-4 text-purple-600" />;
  }

  if (isInterrupted) {
    bgClass = 'bg-red-50 border-red-200';
    textClass = 'text-red-800 line-through opacity-70';
  }

  let ringClass = isCurrent 
    ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-50 shadow-[0_0_20px_rgba(124,58,237,0.2)]' 
    : isHighlighted 
      ? 'ring-2 ring-violet-300 ring-offset-1 shadow-md' 
      : '';

  const handleRewind = () => {
    playRewindSound();
    rewindToNode(id);
  };

  const handleGenerateAlternatives = () => {
    window.dispatchEvent(new CustomEvent('simulation:generate_alternatives', { detail: { nodeId: id } }));
  };

  const handleSelectGhost = () => {
    window.dispatchEvent(new CustomEvent('simulation:select_ghost', { detail: { nodeId: id } }));
  };

  return (
    <div className={`relative min-w-[250px] max-w-[300px] rounded-2xl border p-4 shadow-xl transition-all hover:shadow-2xl ${bgClass} ${ringClass}`}>
      {isCurrent && !isLastNode && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] uppercase font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
          {t('sim.startPoint')}
        </div>
      )}
      {isLive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] uppercase font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          Live
        </div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400 border-2 border-white" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isGhost ? t('sim.aiAlt') : isUser ? t('sim.user') : t('sim.ai')}
          </span>
        </div>
        
        {/* Action Buttons */}
        {isUser && (
          <button 
            onClick={handleRewind}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors group relative"
            title={t('sim.rewindHere')}
          >
            <Rewind className="w-3.5 h-3.5" />
            <span className="absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-sm">
              {t('sim.rewindHere')}
            </span>
          </button>
        )}
        {!isUser && !isGhost && (
          <button 
            onClick={handleGenerateAlternatives}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors group relative"
            title={t('sim.genAlts')}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-sm">
              {t('sim.genAlts')}
            </span>
          </button>
        )}
        {isGhost && (
          <button 
            onClick={handleSelectGhost}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors group relative"
            title={t('sim.select')}
          >
            <Check className="w-3.5 h-3.5" />
            <span className="absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-sm">
              {t('sim.select')}
            </span>
          </button>
        )}
      </div>

      <div className={`text-sm leading-relaxed mb-3 ${textClass}`}>
        {data.text ? (
          data.text
        ) : (
          isUser ? (
            t('sim.speaking')
          ) : (
            <div className="flex items-center space-x-1 py-1">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
            </div>
          )
        )}
      </div>

      {(data.emotion || data.perception) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
          {data.emotion && (
            <div className="flex items-center text-xs text-slate-500">
              <span className="font-medium mr-1 text-slate-400">{t('sim.emotion')}</span> 
              <span className="capitalize text-violet-600">{data.emotionLabel || data.emotion}</span>
            </div>
          )}
          {data.perception && (
            <div className="flex items-start text-xs text-slate-500">
              <span className="font-medium mr-1 text-slate-400 mt-0.5">{t('sim.perception')}</span> 
              <span className="italic text-violet-600 leading-tight">{data.perception}</span>
            </div>
          )}
        </div>
      )}

      {isInterrupted && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-100 border border-red-200 text-red-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t('sim.interrupted')}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400 border-2 border-white" />
    </div>
  );
});
