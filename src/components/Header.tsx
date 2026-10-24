import React from 'react';
import { Sparkles, Layers, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasCards: boolean;
  onOpenDeckView?: () => void;
  totalCards?: number;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasCards, onOpenDeckView, totalCards = 0 }) => {
  return (
    <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            StudyTube <span className="text-indigo-400 font-semibold">AI</span>
          </span>
        </div>

        {/* Zone 2: Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#generator" className="hover:text-indigo-300 transition-colors whitespace-nowrap">
            Generator
          </a>
          <a href="#study" className="hover:text-indigo-300 transition-colors whitespace-nowrap">
            Flashcards
          </a>
          <a href="#samples" className="hover:text-indigo-300 transition-colors whitespace-nowrap">
            Sample Topics
          </a>
          <a href="#features" className="hover:text-indigo-300 transition-colors whitespace-nowrap">
            Methodology
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {hasCards && (
            <button
              onClick={onOpenDeckView}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
              title="View all cards in grid"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>All Cards ({totalCards})</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-600/25 transition-all whitespace-nowrap hover:shadow-indigo-600/40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Video</span>
          </button>
        </div>
      </div>
    </header>
  );
};
