import React, { useState } from 'react';
import { Youtube, Sparkles, Loader2, Clipboard, SlidersHorizontal, Check, FileText } from 'lucide-react';
import { SampleVideo } from '../types';

interface UrlInputBarProps {
  onGenerate: (url: string, cardCount: number, focus: string, manualTranscript?: string) => void;
  isLoading: boolean;
  sampleVideos: SampleVideo[];
  initialUrl?: string;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onGenerate,
  isLoading,
  sampleVideos,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [cardCount, setCardCount] = useState<number>(8);
  const [studyFocus, setStudyFocus] = useState<string>('comprehensive');
  const [showOptions, setShowOptions] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [manualTranscript, setManualTranscript] = useState('');
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);

  React.useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onGenerate(url.trim(), cardCount, studyFocus, manualTranscript.trim() || undefined);
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
      // Clipboard permission denied or unsupported
    }
  };

  const handleSelectSample = (sample: SampleVideo) => {
    setUrl(sample.url);
    onGenerate(sample.url, cardCount, studyFocus);
  };

  return (
    <div id="generator" className="w-full max-w-4xl mx-auto px-4">
      {/* Container with subtle glow */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/25 to-pink-500/15 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Headline & kicker */}
          <div className="text-center mb-6">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 mb-1 inline-block">
              AI Video Learning Engine
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-balance">
              Transform Any YouTube Video into Active Recall Flashcards
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
              Extracts the video transcript and synthesizes 6 to 10 high-impact study cards using Google Gemini AI.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-red-500">
                  <Youtube className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube link (e.g., https://www.youtube.com/watch?v=...)"
                  disabled={isLoading}
                  className="w-full pl-11 pr-24 py-3.5 bg-slate-950/80 border border-slate-750 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  disabled={isLoading}
                  title="Paste from clipboard"
                  className="absolute right-3 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
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

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting & Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>

            {/* Customization Options Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Study Settings ({cardCount} cards · {studyFocus})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTranscriptInput(!showTranscriptInput)}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>{showTranscriptInput ? 'Hide Notes/Transcript' : 'Paste Notes/Transcript (Optional)'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span>Free & Instant</span>
                <span aria-hidden="true">·</span>
                <span>Gemini 3.8 Flash</span>
              </div>
            </div>

            {/* Optional Manual Transcript Box */}
            {showTranscriptInput && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
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

            {/* Collapsible Options Drawer */}
            {showOptions && (
              <div className="mt-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
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
                    Learning Focus
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
            <div id="samples" className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-slate-400">
                  Or test immediately with a curated educational video:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {sampleVideos.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    disabled={isLoading}
                    className="text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-indigo-500/50 transition-all duration-200 group/sample flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-medium text-indigo-400 block mb-0.5">
                        {sample.tag} · {sample.author}
                      </span>
                      <p className="text-xs font-medium text-slate-200 line-clamp-1 group-hover/sample:text-indigo-200 transition-colors">
                        {sample.title}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 group-hover/sample:text-slate-300 mt-2 block">
                      Click to load →
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
