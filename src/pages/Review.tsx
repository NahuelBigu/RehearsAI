import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '../components/CustomNode';
import { ArrowLeft, RefreshCw, MessageSquare, GitMerge } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Review() {
  const navigate = useNavigate();
  const { setupData, aiAvatars, nodes, edges, resetSimulation, getHistory, currentNodeId } = useSimulation();
  const [viewMode, setViewMode] = useState<'tree' | 'chat'>('chat');
  const { t } = useTranslation();
  
  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  const handleRestart = () => {
    resetSimulation();
    navigate('/');
  };

  // Get the history of the selected path (or the last node if none selected)
  const lastNodeId = currentNodeId || (nodes.length > 0 ? nodes[nodes.length - 1].id : null);
  const history = lastNodeId ? getHistory(lastNodeId) : [];

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
            <h1 className="font-bold text-lg leading-tight">{t('review.title')} {setupData.name ? `${t('sim.with')} ${setupData.name}` : ''}</h1>
            <p className="text-xs text-slate-500 font-medium">{t('setup.objective')}: {setupData.objective || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/simulation')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={t('review.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleRestart}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('review.new')}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LeftSidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 p-4 flex flex-col gap-6 overflow-y-auto shrink-0">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              {aiAvatars['neutral'] ? (
                <img 
                  src={aiAvatars['neutral']} 
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
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{setupData.name}</h3>
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('review.profile')}</h3>
            <p className="text-sm text-slate-700 mb-4">{setupData.profile || 'N/A'}</p>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('review.yourProfile')}</h3>
            <p className="text-sm text-slate-700 mb-1"><span className="font-semibold">{t('review.name')}</span> {setupData.userName || 'N/A'}</p>
            <p className="text-sm text-slate-700"><span className="font-semibold">{t('review.relationship')}</span> {setupData.relationship || 'N/A'}</p>
          </div>
        </aside>

        {/* Right Pane: Content */}
        <div className="flex-1 relative bg-slate-50 flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm flex gap-1">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'chat' 
                  ? 'bg-violet-50 text-violet-700' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {t('review.chatView')}
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'tree' 
                  ? 'bg-violet-50 text-violet-700' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <GitMerge className="w-4 h-4" />
              {t('review.treeView')}
            </button>
          </div>
          
          {viewMode === 'chat' ? (
            <div className="flex-1 overflow-y-auto p-8 pt-20">
              <div className="max-w-3xl mx-auto space-y-6">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10">
                    {t('review.noHistory')}
                  </div>
                ) : (
                  history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-violet-50 border border-violet-100 text-violet-900 rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-50">
                          {msg.role === 'user' ? t('review.user') : t('review.ai')}
                        </div>
                        <div className="text-[15px] leading-relaxed">
                          {msg.text}
                        </div>
                        {(msg.emotionLabel || msg.perception) && (
                          <div className={`mt-3 pt-3 flex flex-col gap-1.5 border-t ${msg.role === 'user' ? 'border-violet-200/50' : 'border-slate-100'}`}>
                            {msg.emotionLabel && (
                              <div className="flex items-center text-xs">
                                <span className={`font-medium mr-1 ${msg.role === 'user' ? 'text-violet-700/70' : 'text-slate-400'}`}>{t('review.emotion')}</span> 
                                <span className="capitalize font-medium">{msg.emotionLabel}</span>
                              </div>
                            )}
                            {msg.perception && (
                              <div className="flex items-start text-xs">
                                <span className={`font-medium mr-1 mt-0.5 ${msg.role === 'user' ? 'text-violet-700/70' : 'text-slate-400'}`}>{t('review.perception')}</span> 
                                <span className="italic leading-tight">{msg.perception}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 relative">
              <ReactFlow 
                nodes={nodes} 
                edges={edges}
                nodeTypes={nodeTypes}
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
          )}
        </div>
      </main>
    </div>
  );
}
