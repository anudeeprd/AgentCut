import React from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { useAgentToasts } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';

export const ToastContainer: React.FC = () => {
  const toasts = useAgentToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-zinc-900/95 border border-indigo-500/40 text-zinc-100 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Agent Action</span>
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              </div>
              <p className="text-xs font-medium text-zinc-100 truncate">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => editorStore.removeToast(toast.id)}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
