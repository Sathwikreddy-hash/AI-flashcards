import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCw, CheckCircle, AlertCircle, HelpCircle, Check, Eye } from 'lucide-react';
import { Flashcard, VideoMetadata } from '../types';

interface FlashcardContainerProps {
  card: Flashcard;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onToggleMastery: (cardId: number) => void;
  video?: VideoMetadata;
}

export const FlashcardContainer: React.FC<FlashcardContainerProps> = ({
  card,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onToggleMastery,
  video,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Text to speech using standard Web Speech API
  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalCards) * 100);

  return (
    <div id="study" className="w-full max-w-3xl mx-auto px-4 mt-8">
      {/* Progress tracking header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-mono tracking-wider tabular-nums">
              CARD {currentIndex + 1} OF {totalCards}
            </span>
            {card.mastered && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Mastered
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-slate-400">{progressPercent}% Completed</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out shadow-sm shadow-indigo-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Video Context Tag if available */}
      {video && (
        <div className="mb-4 flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
          <div className="flex items-center gap-2.5 truncate">
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt=""
                referrerPolicy="no-referrer"
                className="w-8 h-6 object-cover rounded-md border border-slate-700/60 shrink-0"
              />
            )}
            <span className="truncate text-slate-300 font-medium">{video.title}</span>
          </div>
          <span className="text-[11px] text-slate-500 shrink-0 hidden sm:inline">
            By {video.author}
          </span>
        </div>
      )}

      {/* 3D Interactive Flashcard Container */}
      <div className="card-perspective w-full h-[360px] sm:h-[400px] select-none cursor-pointer" onClick={onFlip}>
        <div className={`card-inner-3d ${isFlipped ? 'card-flipped' : ''}`}>
          
          {/* ================= FRONT OF CARD (Question) ================= */}
          <div className="card-face rounded-3xl p-6 sm:p-10 bg-slate-900/95 border border-slate-800 shadow-2xl flex flex-col justify-between backdrop-blur-xl relative overflow-hidden group">
            {/* Subtle glow orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10 group-hover:bg-indigo-600/20 transition-all duration-500" />
            
            {/* Front Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Question
                </span>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, card.question)}
                  title="Read question aloud"
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isPlayingAudio ? (
                    <VolumeX className="w-4 h-4 text-indigo-400 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs font-medium text-indigo-300">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click to Flip</span>
                </div>
              </div>
            </div>

            {/* Front Content / Question */}
            <div className="my-auto py-4 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug sm:leading-relaxed text-balance">
                {card.question}
              </h2>
            </div>

            {/* Front Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Test your recall before flipping</span>
              </span>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-600">
                Press [Space] to flip
              </span>
            </div>
          </div>

          {/* ================= BACK OF CARD (Answer) ================= */}
          <div className="card-face card-back rounded-3xl p-6 sm:p-10 bg-slate-900/95 border border-purple-900/40 shadow-2xl flex flex-col justify-between backdrop-blur-xl relative overflow-hidden group">
            {/* Subtle purple glow orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10 group-hover:bg-purple-600/25 transition-all duration-500" />

            {/* Back Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Answer & Insight
                </span>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, card.answer)}
                  title="Read answer aloud"
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isPlayingAudio ? (
                    <VolumeX className="w-4 h-4 text-purple-400 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMastery(card.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    card.mastered
                      ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 shadow-sm shadow-emerald-900/40'
                      : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {card.mastered ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mastered</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mark Mastered</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Back Content / Answer */}
            <div className="my-auto py-4">
              <div className="text-base sm:text-lg md:text-xl font-medium text-slate-100 leading-relaxed max-w-2xl">
                {card.answer}
              </div>
            </div>

            {/* Back Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-500">
              <span className="text-purple-300/80 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click card or press [Space] to flip back</span>
              </span>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-600">
                Card #{card.id}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
