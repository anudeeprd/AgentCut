import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getAgentCutToolDefinitions } from '../../webmcp/registerTools';

interface AboutDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDemoModal: React.FC<AboutDemoModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  if (!isOpen) return null;

  const isWebMCPDetected =
    typeof window !== 'undefined' &&
    (!!(document as any).modelContext || !!(navigator as any).modelContext);

  const tools = getAgentCutToolDefinitions();
  const imageTools = tools.filter((t) => t.name.includes('image'));
  const videoTools = tools.filter((t) => t.name.includes('video') || t.name === 'get_timeline');

  const sampleImagePrompts = [
    'Make this image 4:5, brighten it slightly and increase saturation.',
    'Add "Explore More" centered near the bottom.',
    'Move the title to the top-left and make it smaller.',
    'Undo the last edit.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="max-w-3xl w-full max-h-[88vh] bg-white border border-[#E8E5DD] rounded-2xl shadow-card flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="h-14 border-b border-[#E8E5DD] px-6 flex items-center justify-between bg-[#FAF9F5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF5D6] border border-[#F6C344]/60 flex items-center justify-center text-[#8C6200] shadow-xs">
              <Cpu className="w-4 h-4 text-[#F2B705]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">About AgentCut & WebMCP</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF5D6] border border-[#F6C344]/50 font-mono text-[#8C6200] font-semibold">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B66]">Creative editing, agent-ready</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6B66] hover:text-zinc-900 p-1.5 rounded-lg hover:bg-[#F0EEE8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-[#FFF5D6]/40 border border-[#F6C344]/50 flex items-start gap-3.5 shadow-subtle">
            {isWebMCPDetected ? (
              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900">
                  {isWebMCPDetected ? 'WebMCP Registered Imperatively' : 'Awaiting WebMCP Host Environment'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#E8E5DD] text-[#6B6B66]">
                  document.modelContext
                </span>
              </div>
              <p className="text-zinc-700 leading-relaxed text-[11px]">
                AgentCut exposes editor capabilities through WebMCP. The external AI agent (e.g. ChatGPT with Site Tools)
                calls structured operations while the human user watches the real canvas and timeline update immediately.
                Both human UI and AI agent operate the exact same canonical state.
              </p>
            </div>
          </div>

          {/* Architecture Concept */}
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[#8C6200] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F2B705]" />
              Single Source of Truth
            </span>
            <p className="text-zinc-700 leading-relaxed">
              AgentCut does not contain an internal chatbot or LLM API. The external agent provides reasoning,
              while AgentCut provides reliable structured tools. If a human modifies a slider or adds text, WebMCP inspects the exact state.
              If WebMCP executes a tool, the human UI reflects it in real time with an agent toast notification.
            </p>
            <p className="text-[#6B6B66] text-[11px] leading-relaxed border-t border-[#E8E5DD] pt-2">
              <strong className="text-zinc-800">Export note:</strong> Video export renders the current AgentCut composition (trims, crops, keyframe motion, text overlays) directly in-browser, preferring QuickTime-compatible MP4 when supported by the host browser MediaRecorder, with automatic WebM fallback.
            </p>
          </div>

          {/* Example Prompts for Judges / ChatGPT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Prompts */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2.5">
              <div className="flex items-center gap-1.5 text-[#8C6200] font-bold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                Image Demo Prompts
              </div>
              <div className="space-y-1.5">
                {sampleImagePrompts.map((prompt, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white border border-[#E8E5DD] flex items-center justify-between group hover:border-[#F2B705] transition-colors"
                  >
                    <span className="text-zinc-800 italic text-[11px]">"{prompt}"</span>
                    <button
                      onClick={() => handleCopy(prompt, i)}
                      className="text-[#6B6B66] hover:text-zinc-900 p-1 rounded transition-colors shrink-0 ml-2"
                      title="Copy prompt"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Prompts */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2.5">
              <div className="flex items-center gap-1.5 text-[#8C6200] font-bold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                Video Demo Prompts
              </div>
              <div className="space-y-1.5">
                {sampleVideoPrompts.map((prompt, i) => (
                  <div
                    key={i + 10}
                    className="p-2.5 rounded-lg bg-white border border-[#E8E5DD] flex items-center justify-between group hover:border-[#F2B705] transition-colors"
                  >
                    <span className="text-zinc-800 italic text-[11px]">"{prompt}"</span>
                    <button
                      onClick={() => handleCopy(prompt, i + 10)}
                      className="text-[#6B6B66] hover:text-zinc-900 p-1 rounded transition-colors shrink-0 ml-2"
                      title="Copy prompt"
                    >
                      {copiedIndex === i + 10 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registered Tools Reference */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-800">
                Registered Tools ({tools.length})
              </span>
              <span className="text-[10px] text-[#6B6B66] font-mono">
                Imperative registration via AbortController
              </span>
            </div>

            {/* Image Tools */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#8C6200]">Image Editor Tools ({imageTools.length})</span>
              <div className="space-y-1">
                {imageTools.map((tool) => {
                  const isExpanded = expandedTool === tool.name;
                  return (
                    <div
                      key={tool.name}
                      className="rounded-xl bg-white border border-[#E8E5DD] overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#FAF9F5] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span className="font-mono font-semibold text-zinc-900">{tool.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              tool.annotations.readOnlyHint
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {tool.annotations.readOnlyHint ? 'read-only' : 'mutation'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 border-t border-[#E8E5DD] bg-[#FAF9F5] space-y-2">
                          <p className="text-zinc-700 leading-relaxed">{tool.description}</p>
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#6B6B66] font-mono">Input Schema:</span>
                            <pre className="p-2 rounded-lg bg-white border border-[#E8E5DD] font-mono text-[10px] text-zinc-800 overflow-x-auto">
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
              <span className="text-[11px] font-semibold text-[#8C6200]">Video Editor Tools ({videoTools.length})</span>
              <div className="space-y-1">
                {videoTools.map((tool) => {
                  const isExpanded = expandedTool === tool.name;
                  return (
                    <div
                      key={tool.name}
                      className="rounded-xl bg-white border border-[#E8E5DD] overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#FAF9F5] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span className="font-mono font-semibold text-zinc-900">{tool.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              tool.annotations.readOnlyHint
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-[#FFF5D6] text-[#8C6200] border border-[#F6C344]/60'
                            }`}
                          >
                            {tool.annotations.readOnlyHint ? 'read-only' : 'mutation'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 border-t border-[#E8E5DD] bg-[#FAF9F5] space-y-2">
                          <p className="text-zinc-700 leading-relaxed">{tool.description}</p>
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#6B6B66] font-mono">Input Schema:</span>
                            <pre className="p-2 rounded-lg bg-white border border-[#E8E5DD] font-mono text-[10px] text-zinc-800 overflow-x-auto">
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
        <div className="h-14 border-t border-[#E8E5DD] px-6 flex items-center justify-between bg-[#FAF9F5] shrink-0">
          <span className="text-[11px] text-[#6B6B66]">AgentCut Hackathon Prototype · MIT License</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#F6C344] hover:bg-[#E9B332] text-zinc-900 font-semibold shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
