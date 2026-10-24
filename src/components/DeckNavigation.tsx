import React from 'react';
import { ArrowLeft, ArrowRight, Shuffle, RotateCw } from 'lucide-react';

interface DeckNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onFlip: () => void;
  canPrevious: boolean;
  canNext: boolean;
  isLastCard: boolean;
}

export const DeckNavigation: React.FC<DeckNavigationProps> = ({
  onPrevious,
  onNext,
  onShuffle,
  onFlip,
  canPrevious,
  isLastCard,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-xl">
        {/* Left: Previous Button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canPrevious}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800/80 hover:bg-slate-750 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Center: Flip & Shuffle Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFlip}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 hover:border-indigo-500/70 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip Card</span>
          </button>

          <button
            type="button"
            onClick={onShuffle}
            title="Randomize card order"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60 transition-all hover:text-white cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>

        {/* Right: Next / Finish Button */}
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all cursor-pointer"
        >
          <span>{isLastCard ? 'Complete Deck' : 'Next'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">Space</kbd> Flip
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">←</kbd> Prev
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">→</kbd> Next
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[10px]">S</kbd> Shuffle
        </span>
      </div>
    </div>
  );
};
