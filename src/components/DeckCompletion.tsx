import React, { useState } from 'react';
import { Award, RotateCcw, Shuffle, CheckCircle2, AlertCircle, Copy, Check, ArrowRight } from 'lucide-react';
import { Flashcard, VideoMetadata } from '../types';

interface DeckCompletionProps {
  cards: Flashcard[];
  video?: VideoMetadata;
  onResetDeck: () => void;
  onReviewUnmastered: () => void;
  onShuffleAndRestart: () => void;
  onNewVideo: () => void;
}

export const DeckCompletion: React.FC<DeckCompletionProps> = ({
  cards,
  video,
  onResetDeck,
  onReviewUnmastered,
  onShuffleAndRestart,
  onNewVideo,
}) => {
  const [copied, setCopied] = useState(false);

  const masteredCount = cards.filter((c) => c.mastered).length;
  const unmasteredCount = cards.length - masteredCount;
  const masteryPercentage = Math.round((masteredCount / cards.length) * 100);

  const handleExportDeck = () => {
    const text = cards
      .map((c, i) => `Card ${i + 1}:\nQ: ${c.question}\nA: ${c.answer}\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-8 animate-fadeIn">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/30 to-pink-500/20 rounded-3xl blur-2xl opacity-80" />

        <div className="relative bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
          {/* Trophy Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 mb-6">
            <Award className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Deck Completed!
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            You reviewed all {cards.length} flashcards from{' '}
            <span className="text-slate-200 font-medium">{video?.title || 'this video'}</span>.
          </p>

          {/* Metric breakdown cards */}
          <div className="grid grid-cols-3 gap-3 my-8">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                {cards.length}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">Cards Studied</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-900/40">
              <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                {masteredCount}
              </span>
              <span className="text-xs text-emerald-400/80 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mastered
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-900/40">
              <span className="block text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-400">
                {unmasteredCount}
              </span>
              <span className="text-xs text-amber-400/80 mt-1 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Need Review
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onResetDeck}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Study Again</span>
            </button>

            {unmasteredCount > 0 && (
              <button
                type="button"
                onClick={onReviewUnmastered}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 font-semibold text-sm rounded-xl transition-all cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Review Needs Work ({unmasteredCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onShuffleAndRestart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-purple-400" />
              <span>Shuffle & Replay</span>
            </button>
          </div>

          {/* Secondary Utilities */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={handleExportDeck}
              className="inline-flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Deck as Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNewVideo}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <span>Study Another YouTube Video</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
