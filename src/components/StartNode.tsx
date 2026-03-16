import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimulation } from '../context/SimulationContext';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const StartNode = memo(({ id, data }: { id: string, data: any }) => {
  const { rewindToNode, currentNodeId, nodes, edges } = useSimulation();
  const { t } = useTranslation();
  const isCurrent = id === currentNodeId;
  const isHighlighted = data?.isHighlighted;

  const handleRewind = () => {
    if (isCurrent) {
      window.dispatchEvent(new CustomEvent('simulation:start_from_node', { detail: { nodeId: id } }));
    } else {
      rewindToNode(id);
    }
  };

  const isLastNode = !nodes.some(n => edges.some(e => e.source === id && e.target === n.id));

  return (
    <div className={`group relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg cursor-pointer
      ${isCurrent 
        ? 'bg-violet-600 border-violet-400 ring-4 ring-violet-500/20 scale-110' 
        : isHighlighted
          ? 'bg-violet-100 border-violet-300 ring-2 ring-violet-200 scale-105'
          : 'bg-white border-slate-200 hover:border-violet-400 hover:scale-105'
      }`}
      onClick={handleRewind}
    >
      <Play className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-violet-500'}`} fill={isCurrent ? 'currentColor' : 'none'} />
      
      {isCurrent && !isLastNode && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
          {t('sim.startPoint')}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-violet-400 border-2 border-white" />
    </div>
  );
});
