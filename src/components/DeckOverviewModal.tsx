import React, { useState } from 'react';
import { X, Search, Check, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Flashcard } from '../types';

interface DeckOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
  onSelectCard: (index: number) => void;
  currentIndex: number;
}

export const DeckOverviewModal: React.FC<DeckOverviewModalProps> = ({
  isOpen,
  onClose,
  cards,
  onSelectCard,
  currentIndex,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCards = cards.filter(
    (c) =>
      c.question.toLowerCase().includes(search.toLowerCase()) ||
      c.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-bold text-white">
              All Flashcards ({cards.length})
            </h3>
            <span className="text-xs text-slate-400">
              {cards.filter((c) => c.mastered).length} mastered
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts, questions, or answers..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Card Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card, idx) => {
            const originalIndex = cards.findIndex((c) => c.id === card.id);
            const isCurrent = originalIndex === currentIndex;

            return (
              <div
                key={card.id}
                onClick={() => {
                  onSelectCard(originalIndex);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-semibold text-indigo-400">
                      Card #{originalIndex + 1}
                    </span>
                    {card.mastered ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                        <Check className="w-2.5 h-2.5" /> Mastered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-500" /> Review
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors mb-2">
                    {card.question}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-3">
                    {card.answer}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-300">
                  <span>{isCurrent ? '● Current Card' : 'Click to study this card'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
