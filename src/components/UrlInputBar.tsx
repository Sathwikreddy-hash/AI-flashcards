import React, { useState } from 'react';
import { Youtube, Sparkles, Loader2, Clipboard, SlidersHorizontal, Check, FileText, MessageSquareQuote, Wand2 } from 'lucide-react';
import { SampleVideo } from '../types';

interface UrlInputBarProps {
  onGenerate: (url: string, cardCount: number, focus: string, manualTranscript?: string, customPrompt?: string) => void;
  isLoading: boolean;
  sampleVideos: SampleVideo[];
  initialUrl?: string;
  initialPrompt?: string;
}

const PROMPT_PRESETS = [
  { label: '🎓 Exam-Level Questions', prompt: 'Focus on high-yield, exam-level conceptual questions and rigorous definitions' },
  { label: '💡 Core Mental Models', prompt: 'Highlight core mental models, cause-and-effect relationships, and main theories' },
  { label: '📖 Definitions & Terms', prompt: 'Focus on key terminology, technical jargon, and precise definitions' },
  { label: '🔬 Formulas & Mechanisms', prompt: 'Extract technical mechanics, equations, formulas, and operational steps' },
  { label: '👶 Explain Like I’m 5', prompt: 'Make questions and answers intuitive, beginner-friendly, and rich with analogies' },
  { label: '🎯 Real-World Applications', prompt: 'Focus on practical examples, case studies, and real-world implementation' },
];

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onGenerate,
  isLoading,
  sampleVideos,
  initialUrl = '',
  initialPrompt = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [customPrompt, setCustomPrompt] = useState(initialPrompt);
  const [cardCount, setCardCount] = useState<number>(8);
  const [studyFocus, setStudyFocus] = useState<string>('comprehensive');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [manualTranscript, setManualTranscript] = useState('');
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);

  React.useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  React.useEffect(() => {
    if (initialPrompt) {
      setCustomPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanPrompt = customPrompt.trim();

    if ((!cleanUrl && !cleanPrompt) || isLoading) return;

    onGenerate(
      cleanUrl,
      cardCount,
      studyFocus,
      manualTranscript.trim() || undefined,
      cleanPrompt || undefined
    );
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 2000);
        }
      }
    } catch {
      // Clipboard permission denied
    }
  };

  const handleSelectSample = (sample: SampleVideo) => {
    setUrl(sample.url);
    if (sample.suggestedPrompt) {
      setCustomPrompt(sample.suggestedPrompt);
    }
    onGenerate(
      sample.url,
      cardCount,
      studyFocus,
      undefined,
      sample.suggestedPrompt || customPrompt.trim() || undefined
    );
  };

  const handleApplyPreset = (presetText: string) => {
    setCustomPrompt(presetText);
  };

  const canSubmit = Boolean(url.trim() || customPrompt.trim());

  return (
    <div id="generator" className="w-full max-w-4xl mx-auto px-4">
      {/* Outer Glow container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/25 via-purple-500/30 to-pink-500/20 rounded-2xl blur-xl opacity-80 group-hover:opacity-100 transition duration-1000 -z-10" />

        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 mb-1 inline-block">
              AI Video & Prompt Learning Engine
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-balance">
              Transform Any YouTube Video or Prompt into Flashcards
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
              Paste a YouTube link, enter your custom prompt instructions, or combine both to generate tailored 3D active recall flashcards.
            </p>
          </div>

          {/* Dual-Field Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field 1: YouTube Video URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>1. YouTube Video URL</span>
                  <span className="text-slate-500 font-normal">(Optional if entering a prompt)</span>
                </label>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)"
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-24 py-3 bg-slate-950/90 border border-slate-750 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  disabled={isLoading}
                  title="Paste from clipboard"
                  className="absolute right-2.5 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Pasted!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Field 2: ENTER YOUR PROMPT (PROMINENT & UNMISSABLE) */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
                  <span>2. Enter Your Prompt / Study Instructions</span>
                  <span className="text-indigo-400/80 text-[11px] font-medium">(Steers card focus, topic & questions)</span>
                </label>
                {customPrompt && (
                  <button
                    type="button"
                    onClick={() => setCustomPrompt('')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your prompt here (e.g., 'Focus heavily on key definitions & formulas', 'Exam-level difficulty', or topic like 'Quantum Computing')..."
                  disabled={isLoading}
                  className="w-full px-3.5 py-3 bg-slate-950/90 border border-indigo-500/40 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-400 transition-all disabled:opacity-50"
                />
              </div>

              {/* Quick Prompt Presets */}
              <div className="mt-2.5">
                <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                  Quick Prompt Suggestions (Click to apply):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyPreset(preset.prompt)}
                      disabled={isLoading}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        customPrompt === preset.prompt
                          ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar & Generate Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Card Count & Settings ({cardCount} cards)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTranscriptInput(!showTranscriptInput)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>{showTranscriptInput ? 'Hide Notes' : 'Paste Transcript / Notes'}</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Flashcards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>

            {/* Optional Manual Transcript Box */}
            {showTranscriptInput && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl mt-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Video Transcript or Lecture Notes (Optional)
                </label>
                <textarea
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  placeholder="If you have an offline transcript, captions text, or course notes, paste them here to generate flashcards directly..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Collapsible Advanced Settings Drawer */}
            {showAdvanced && (
              <div className="mt-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Deck Size (Number of Flashcards)
                  </label>
                  <div className="flex gap-2">
                    {[6, 8, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setCardCount(count)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          cardCount === count
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {count} Cards
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Learning Style Focus
                  </label>
                  <select
                    value={studyFocus}
                    onChange={(e) => setStudyFocus(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="comprehensive">Comprehensive (Core Ideas & Mental Models)</option>
                    <option value="definitions">Key Terms, Formulas & Definitions</option>
                    <option value="practical">Practical Takeaways & Applications</option>
                    <option value="exam">Deep Exam & Concept Mastery</option>
                  </select>
                </div>
              </div>
            )}
          </form>

          {/* Sample Video Suggestions */}
          {sampleVideos.length > 0 && (
            <div id="samples" className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Or test with a sample video + prompt combination:</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {sampleVideos.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    disabled={isLoading}
                    className="text-left p-3 rounded-xl bg-slate-950/70 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/60 transition-all duration-200 group/sample flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide block mb-1">
                        {sample.tag} · {sample.author}
                      </span>
                      <p className="text-xs font-medium text-slate-200 line-clamp-1 group-hover/sample:text-indigo-200 transition-colors">
                        {sample.title}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 group-hover/sample:text-indigo-300 mt-2 block font-medium">
                      Load & Generate →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
