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
          className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/95 border border-[#E8E5DD] text-zinc-900 shadow-card backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FFF5D6] border border-[#F6C344]/60 flex items-center justify-center shrink-0 text-[#8C6200] shadow-xs">
              <Bot className="w-4 h-4 text-[#F2B705]" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C6200] font-semibold">
                  Agent Action
                </span>
                <Sparkles className="w-2.5 h-2.5 text-[#F2B705]" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 truncate">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => editorStore.removeToast(toast.id)}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-[#FAF9F5] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
