import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UrlInputBar } from './components/UrlInputBar';
import { FlashcardContainer } from './components/FlashcardContainer';
import { DeckNavigation } from './components/DeckNavigation';
import { DeckCompletion } from './components/DeckCompletion';
import { DeckOverviewModal } from './components/DeckOverviewModal';
import { Flashcard, VideoMetadata, FlashcardResponse, SampleVideo } from './types';
import { Sparkles, Brain, BookOpen, Clock, AlertTriangle, Layers, Zap, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'study_tube_active_deck';

const DEFAULT_INITIAL_DATA = {
  video: {
    id: '60ItHLz5WEA',
    title: 'Alan Walker - Faded',
    author: 'Alan Walker',
    thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg',
    url: 'https://youtu.be/60ItHLz5WEA?si=87Mlds8wzqT1BnWx',
  },
  cards: [
    {
      id: 1,
      prompt: "Track Origins & Release",
      question: "Who produced and released the global electronic hit 'Faded', and in what year was it launched?",
      answer: "The track was produced by Norwegian DJ and producer Alan Walker and released in December 2015 as a vocal revamp of his 2014 instrumental track 'Fade'.",
    },
    {
      id: 2,
      prompt: "Vocal Performance",
      question: "Who provided the uncredited lead vocals for Alan Walker's 'Faded'?",
      answer: "The iconic vocals were performed by Norwegian singer-songwriter Iselin Solheim.",
    },
    {
      id: 3,
      prompt: "Genre & Musical Production",
      question: "What musical genre, tempo, and signature elements define 'Faded'?",
      answer: "It is an electro house / downtempo EDM track set at ~90 BPM, driven by an emotive solo piano progression overlaid with atmospheric synths and pitch-shifted vocal chops.",
    },
    {
      id: 4,
      prompt: "Lyrical Meaning & Metaphor",
      question: "What is the central metaphorical theme of the lyrics in 'Faded' ('Where are you now? Was it all in my fantasy?')?",
      answer: "The lyrics evoke feelings of isolation, longing, and searching for lost connections, drawing a poetic parallel to Atlantis disappearing beneath the sea.",
    },
    {
      id: 5,
      prompt: "Filming Locations",
      question: "Where was the iconic post-apocalyptic music video for 'Faded' filmed?",
      answer: "The music video was filmed on location in Estonia, featuring abandoned Soviet-era industrial ruins including the Linnahall amphitheater, the Rummu submerged prison quarry, and Paldiski.",
    },
    {
      id: 6,
      prompt: "Narrative & Protagonist",
      question: "What narrative storyline does the protagonist follow in the music video?",
      answer: "A lone masked survivor roams across derelict, abandoned landscapes clutching a faded photo of his former home, ultimately discovering that his past sanctuary lies in total ruin.",
    },
    {
      id: 7,
      prompt: "Streaming & Global Reach",
      question: "What streaming and chart milestones did 'Faded' achieve?",
      answer: "'Faded' surpassed over 3.5 billion views on YouTube—ranking among the most-watched music videos in history—and achieved multi-platinum certifications across the globe.",
    },
    {
      id: 8,
      prompt: "Visual Identity & Branding",
      question: "How did Alan Walker establish his signature visual branding around 'Faded'?",
      answer: "He adopted the iconic black hoodie and face mask persona to prioritize anonymity, unity, and the concept that anyone can join the community of 'Walkers'.",
    },
  ],
  sourceType: 'grounded_synthesis' as const,
};

export default function App() {
  const [cards, setCards] = useState<Flashcard[]>(DEFAULT_INITIAL_DATA.cards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [video, setVideo] = useState<VideoMetadata | undefined>(DEFAULT_INITIAL_DATA.video);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<string | undefined>('Track Origins, Production & Impact');
  const [sourceType, setSourceType] = useState<'transcript' | 'grounded_synthesis' | 'metadata_synthesis' | 'prompt_synthesis' | null>(DEFAULT_INITIAL_DATA.sourceType);
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(false);
  const [sampleVideos, setSampleVideos] = useState<SampleVideo[]>([]);

  // Load sample videos on mount
  useEffect(() => {
    fetch('/api/sample-videos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSampleVideos(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load sample videos:', err);
      });
  }, []);

  // Restore saved deck from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cards && parsed.cards.length > 0) {
          setCards(parsed.cards);
          setVideo(parsed.video);
          setCurrentIndex(parsed.currentIndex || 0);
          setSourceType(parsed.sourceType || 'transcript');
          if (parsed.activePrompt) {
            setActivePrompt(parsed.activePrompt);
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Persist deck changes
  useEffect(() => {
    if (cards.length > 0) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ cards, video, currentIndex, sourceType, activePrompt })
        );
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }, [cards, video, currentIndex, sourceType, activePrompt]);

  const lastRequestRef = React.useRef<{
    url: string;
    cardCount: number;
    focus: string;
    manualTranscript?: string;
    customPrompt?: string;
  } | null>(null);

  // Generate flashcards from API
  const handleGenerate = async (
    url: string,
    cardCount: number,
    focus: string,
    manualTranscript?: string,
    customPrompt?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setIsCompleted(false);
    lastRequestRef.current = { url, cardCount, focus, manualTranscript, customPrompt };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cardCount, studyFocus: focus, manualTranscript, customPrompt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data: FlashcardResponse | { error?: string } = await response.json();

      if (!response.ok || 'error' in data) {
        const errorMsg = 'error' in data && data.error ? data.error : 'Failed to generate flashcards from this video.';
        throw new Error(errorMsg);
      }

      const res = data as FlashcardResponse;
      setCards(res.flashcards);
      setVideo(res.video);
      setSourceType(res.source);
      setActivePrompt(res.userPrompt || customPrompt?.trim() || undefined);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);

      // Scroll smoothly to study section
      setTimeout(() => {
        const el = document.getElementById('study');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const e = err as Error;
      if (e.name === 'AbortError') {
        setError('Generation timed out after 45 seconds. Please click Retry.');
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        setError('Connection interrupted while contacting the server. Please click Retry.');
      } else {
        setError(e.message || 'An error occurred while analyzing the YouTube video.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastRequestRef.current) {
      handleGenerate(
        lastRequestRef.current.url,
        lastRequestRef.current.cardCount,
        lastRequestRef.current.focus,
        lastRequestRef.current.manualTranscript,
        lastRequestRef.current.customPrompt
      );
    }
  };

  // Flip the active card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Advance to next card or trigger completion
  const handleNext = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [cards.length, currentIndex]);

  // Go to previous card
  const handlePrevious = useCallback(() => {
    if (cards.length === 0 || currentIndex <= 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => prev - 1);
  }, [cards.length, currentIndex]);

  // Shuffle card deck
  const handleShuffle = useCallback(() => {
    if (cards.length <= 1) return;
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [cards]);

  // Toggle card mastery status
  const handleToggleMastery = useCallback((cardId: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, mastered: !c.mastered } : c))
    );
  }, []);

  // Reset deck to card 1
  const handleResetDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  // Filter and review unmastered cards only
  const handleReviewUnmastered = () => {
    const unmastered = cards.filter((c) => !c.mastered);
    if (unmastered.length > 0) {
      setCards(unmastered);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
    }
  };

  // Shuffle and restart
  const handleShuffleAndRestart = () => {
    handleShuffle();
    setIsCompleted(false);
  };

  // Clear current deck and start fresh
  const handleNewVideo = () => {
    setCards([]);
    setVideo(undefined);
    setActivePrompt(undefined);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleShuffle();
      } else if (e.key === 'm' || e.key === 'M') {
        if (cards[currentIndex]) {
          e.preventDefault();
          handleToggleMastery(cards[currentIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrevious, handleShuffle, handleToggleMastery, cards, currentIndex]);

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Bar Header */}
      <Header
        onReset={handleNewVideo}
        hasCards={cards.length > 0}
        onOpenDeckView={() => setIsOverviewOpen(true)}
        totalCards={cards.length}
      />

      <main className="flex-1 pb-16">
        {/* URL Input Bar */}
        <section className="pt-8 sm:pt-12">
          <UrlInputBar
            onGenerate={handleGenerate}
            isLoading={isLoading}
            sampleVideos={sampleVideos}
            initialUrl={video?.url}
            initialPrompt={activePrompt}
          />
        </section>

        {/* Error notification banner */}
        {error && (
          <div className="max-w-3xl mx-auto px-4 mt-6">
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-start gap-3 backdrop-blur-md">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-300">Generation Error</h4>
                <p className="text-xs text-red-400/90 mt-0.5">{error}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lastRequestRef.current && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs text-red-400 hover:text-red-200 font-medium px-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Source info notice */}
        {sourceType !== 'transcript' && sourceType !== null && cards.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 mt-4">
            <div className="px-3.5 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
              <span>
                {sourceType === 'prompt_synthesis'
                  ? '✨ Flashcards generated directly from your custom prompt.'
                  : 'Note: Direct YouTube closed captions were restricted or disabled on this video. Flashcards were synthesized from video concept and topic grounding.'}
              </span>
            </div>
          </div>
        )}

        {/* Flashcard Study Area */}
        {cards.length > 0 && !isCompleted && currentCard && (
          <>
            <FlashcardContainer
              card={currentCard}
              currentIndex={currentIndex}
              totalCards={cards.length}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onToggleMastery={handleToggleMastery}
              video={video}
              userPrompt={activePrompt}
            />

            <DeckNavigation
              onPrevious={handlePrevious}
              onNext={handleNext}
              onShuffle={handleShuffle}
              onFlip={handleFlip}
              canPrevious={currentIndex > 0}
              canNext={true}
              isLastCard={currentIndex === cards.length - 1}
            />
          </>
        )}

        {/* Completion Screen */}
        {cards.length > 0 && isCompleted && (
          <DeckCompletion
            cards={cards}
            video={video}
            onResetDeck={handleResetDeck}
            onReviewUnmastered={handleReviewUnmastered}
            onShuffleAndRestart={handleShuffleAndRestart}
            onNewVideo={handleNewVideo}
          />
        )}

        {/* Empty State / How it works when no cards are loaded */}
        {cards.length === 0 && !isLoading && (
          <section id="features" className="max-w-5xl mx-auto px-4 mt-16 sm:mt-20">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold tracking-wider uppercase text-purple-400 mb-1 inline-block">
                How It Works
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Supercharge Your Learning with Active Recall
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">1. Transcript Extraction</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracts full timed captions directly from public YouTube videos without requiring manual note taking.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">2. Gemini AI Synthesis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Google Gemini 3.8 Flash distills complex video lectures into 6 to 10 conceptual question-and-answer flashcards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">3. 3D Active Recall</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive 3D flip study interface with progress tracking, audio pronunciation, and mastery assessment.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Grid Overview Modal */}
      <DeckOverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        cards={cards}
        onSelectCard={(index) => {
          setCurrentIndex(index);
          setIsFlipped(false);
          setIsCompleted(false);
        }}
        currentIndex={currentIndex}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AI-Powered YouTube Flashcard Study App</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Google Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>Active Recall Methodology</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
