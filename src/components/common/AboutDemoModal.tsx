import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { getAgentCutToolDefinitions } from '../../webmcp/registerTools';

interface AboutDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDemoModal: React.FC<AboutDemoModalProps> = ({ isOpen, onClose }) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const tools = getAgentCutToolDefinitions();
  const imageTools = tools.filter((t) => t.name.includes('image'));
  const videoTools = tools.filter((t) => t.name.includes('video') || t.name.includes('timeline'));

  const isWebMCPDetected =
    typeof window !== 'undefined' &&
    !!((document as any).modelContext || (navigator as any).modelContext);

  const sampleImagePrompts = [
    'Make this image 4:5, brighten it slightly and increase saturation.',
    'Add "Explore More" centered near the bottom.',
    'Move the title to the top-left and make it smaller.',
    'Undo the last edit.',
    'What edits have been made to this image?',
  ];

  const sampleVideoPrompts = [
    'Remove the first 2 seconds of the video.',
    'Make this vertical 9:16 for Instagram Reels.',
    'Add "Built with WebMCP" at the bottom from 2 to 6 seconds.',
    'Make the video 1.5× speed.',
    'What edits have we made so far?',
    'Undo the speed change but keep everything else.',
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="max-w-3xl w-full max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">About AgentCut & WebMCP</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-300">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Creative editing, agent-ready</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Story Banner */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3.5">
            {isWebMCPDetected ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-100">
                  {isWebMCPDetected ? 'WebMCP Registered Imperatively' : 'Awaiting WebMCP Host Environment'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  document.modelContext
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                AgentCut exposes editor capabilities through WebMCP. The external AI agent (e.g. ChatGPT with Site Tools)
                calls structured operations while the human user watches the real canvas and timeline update immediately.
                Both human UI and AI agent operate the exact same canonical state.
              </p>
            </div>
          </div>

          {/* Architecture Concept */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Single Source of Truth
            </span>
            <p className="text-zinc-300 leading-relaxed">
              AgentCut does not contain an internal chatbot or LLM API. The external agent provides reasoning,
              while AgentCut provides reliable structured tools. If a human modifies a slider or adds text, WebMCP inspects the exact state.
              If WebMCP executes a tool, the human UI reflects it in real time with an agent toast notification.
            </p>
          </div>

          {/* Example Prompts for Judges / ChatGPT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Prompts */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5" />
                Image Demo Prompts
              </div>
              <div className="space-y-1.5">
                {sampleImagePrompts.map((prompt, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between group hover:border-zinc-700 transition-colors"
                  >
                    <span className="text-zinc-300 italic">"{prompt}"</span>
                    <button
                      onClick={() => handleCopy(prompt, i)}
                      className="text-zinc-500 hover:text-zinc-200 p-1 rounded transition-colors shrink-0 ml-2"
                      title="Copy prompt"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Prompts */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5" />
                Video Demo Prompts
              </div>
              <div className="space-y-1.5">
                {sampleVideoPrompts.map((prompt, i) => (
                  <div
                    key={i + 10}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between group hover:border-zinc-700 transition-colors"
                  >
                    <span className="text-zinc-300 italic">"{prompt}"</span>
                    <button
                      onClick={() => handleCopy(prompt, i + 10)}
                      className="text-zinc-500 hover:text-zinc-200 p-1 rounded transition-colors shrink-0 ml-2"
                      title="Copy prompt"
                    >
                      {copiedIndex === i + 10 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registered Tools Catalog */}
          <div className="space-y-3 border-t border-zinc-800/80 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                Registered WebMCP Tools ({tools.length})
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Imperative registration via AbortController
              </span>
            </div>

            {/* Image Tools */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-indigo-400">Image Editor Tools ({imageTools.length})</span>
              <div className="space-y-1">
                {imageTools.map((tool) => {
                  const isExpanded = expandedTool === tool.name;
                  return (
                    <div
                      key={tool.name}
                      className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-900/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span className="font-mono font-semibold text-zinc-200">{tool.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              tool.annotations.readOnlyHint
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {tool.annotations.readOnlyHint ? 'read-only' : 'mutation'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 border-t border-zinc-800/60 bg-zinc-950 space-y-2">
                          <p className="text-zinc-400 leading-relaxed">{tool.description}</p>
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-mono">Input Schema:</span>
                            <pre className="p-2 rounded bg-zinc-900 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                              {JSON.stringify(tool.inputSchema, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Video Tools */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-medium text-purple-400">Video Editor Tools ({videoTools.length})</span>
              <div className="space-y-1">
                {videoTools.map((tool) => {
                  const isExpanded = expandedTool === tool.name;
                  return (
                    <div
                      key={tool.name}
                      className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-900/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span className="font-mono font-semibold text-zinc-200">{tool.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              tool.annotations.readOnlyHint
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {tool.annotations.readOnlyHint ? 'read-only' : 'mutation'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 border-t border-zinc-800/60 bg-zinc-950 space-y-2">
                          <p className="text-zinc-400 leading-relaxed">{tool.description}</p>
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-mono">Input Schema:</span>
                            <pre className="p-2 rounded bg-zinc-900 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                              {JSON.stringify(tool.inputSchema, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-zinc-800 px-6 flex items-center justify-between bg-zinc-900/50 shrink-0">
          <span className="text-[11px] text-zinc-500">AgentCut Hackathon Prototype · MIT License</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
