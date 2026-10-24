export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  mastered?: boolean;
}

export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
}

export interface FlashcardResponse {
  success: boolean;
  video: VideoMetadata;
  flashcards: Flashcard[];
  source: 'transcript' | 'grounded_synthesis' | 'metadata_synthesis';
  totalCards: number;
  transcriptSnippet?: string;
}

export interface SampleVideo {
  id: string;
  title: string;
  author: string;
  url: string;
  tag: string;
}
