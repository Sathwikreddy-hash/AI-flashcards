import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { YoutubeTranscript } from 'youtube-transcript';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface Flashcard {
  id: number;
  prompt?: string;
  question: string;
  answer: string;
}

interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
}

/**
 * Curated cache for popular sample videos to eliminate API latency
 */
const KNOWN_VIDEOS: Record<string, { title: string; author: string; tag: string }> = {
  '60ItHLz5WEA': {
    title: 'Alan Walker - Faded',
    author: 'Alan Walker',
    tag: 'Music & Visuals',
  },
  'z-EtmaPEt64': {
    title: 'But what is a GPT? Visual intro to Transformers',
    author: '3Blue1Brown',
    tag: 'AI & Math',
  },
  'tp4A3fP0Lw0': {
    title: 'The Map of Quantum Computing',
    author: 'Domain of Science',
    tag: 'Physics',
  },
  'Lp7E973zozc': {
    title: 'How The Immune System Works',
    author: 'Kurzgesagt – In a Nutshell',
    tag: 'Biology',
  },
  '7B34N49557U': {
    title: 'How does your memory work?',
    author: 'TED-Ed',
    tag: 'Neuroscience',
  },
};

/**
 * Extracts a YouTube Video ID from various URL formats.
 */
function extractVideoId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        return parsed.searchParams.get('v');
      }
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0]) && pathParts[1]) {
        return pathParts[1];
      }
    } else if (parsed.hostname === 'youtu.be') {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0]) {
        return pathParts[0];
      }
    }
  } catch {
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Fetches video metadata via YouTube oEmbed API with a strict 2.5-second timeout
 */
async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (KNOWN_VIDEOS[videoId]) {
    return {
      id: videoId,
      title: KNOWN_VIDEOS[videoId].title,
      author: KNOWN_VIDEOS[videoId].author,
      thumbnail,
      url: watchUrl,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
      if (data.title && data.title !== ' - YouTube') {
        return {
          id: videoId,
          title: data.title,
          author: data.author_name || 'YouTube Creator',
          thumbnail: data.thumbnail_url || thumbnail,
          url: watchUrl,
        };
      }
    }
  } catch {
    // Timed out or rejected; proceed with fallback immediately without stalling
  }

  return {
    id: videoId,
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Creator',
    thumbnail,
    url: watchUrl,
  };
}

/**
 * Attempts to extract transcript with a fast timeout
 */
async function getTranscriptForVideo(videoId: string): Promise<{ transcriptText: string; source: 'transcript' | 'grounded_synthesis' }> {
  try {
    const transcriptPromise = YoutubeTranscript.fetchTranscript(videoId).catch(() => null);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2500)
    );

    const transcriptItems = await Promise.race([transcriptPromise, timeoutPromise]);
    if (transcriptItems && Array.isArray(transcriptItems) && transcriptItems.length > 0) {
      const fullText = transcriptItems.map((item) => item.text).join(' ');
      if (fullText.trim().length > 50) {
        return { transcriptText: fullText.trim(), source: 'transcript' };
      }
    }
  } catch {
    // Fall back to direct synthesis
  }

  return { transcriptText: '', source: 'grounded_synthesis' };
}

// -------------------------------------------------------------
// API ROUTE: /api/generate-flashcards
// -------------------------------------------------------------
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const { url, cardCount = 8, studyFocus = 'comprehensive', manualTranscript, customPrompt } = req.body;

    const hasUrl = Boolean(url && typeof url === 'string' && url.trim().length > 0);
    const hasPrompt = Boolean(customPrompt && typeof customPrompt === 'string' && customPrompt.trim().length > 0);

    if (!hasUrl && !hasPrompt) {
      return res.status(400).json({
        error: 'Please paste a YouTube URL, or enter your prompt/topic to generate flashcards.',
      });
    }

    let videoId: string | null = null;
    let metadata: VideoMetadata = {
      id: 'prompt-topic',
      title: customPrompt?.trim() || 'Custom Study Topic',
      author: 'AI Flashcard Engine',
      thumbnail: '',
      url: '',
    };

    if (hasUrl) {
      videoId = extractVideoId(url);
      if (!videoId && !hasPrompt) {
        return res.status(400).json({
          error: 'Invalid YouTube URL format. Please paste a standard link like https://www.youtube.com/watch?v=... or enter a prompt topic.',
        });
      }
      if (videoId) {
        metadata = await fetchVideoMetadata(videoId);
      }
    }

    // Fast transcript extraction
    let transcriptText = typeof manualTranscript === 'string' && manualTranscript.trim().length > 20
      ? manualTranscript.trim()
      : '';
    let extractionSource: 'transcript' | 'grounded_synthesis' | 'prompt_synthesis' = transcriptText
      ? 'transcript'
      : (videoId ? 'grounded_synthesis' : 'prompt_synthesis');

    if (!transcriptText && videoId) {
      const transcriptResult = await getTranscriptForVideo(videoId);
      transcriptText = transcriptResult.transcriptText;
      extractionSource = transcriptResult.source;
    }

    // Prepare Gemini Prompt for SINGLE Fast Execution
    const numCards = Math.max(6, Math.min(10, Number(cardCount) || 8));
    const customPromptInstruction = hasPrompt
      ? `\nUSER CUSTOM PROMPT & GUIDELINES: "${customPrompt.trim()}". Strongly prioritize this instruction for topics, questions, and concept prompts.`
      : '';

    let promptContents: string;

    if (!videoId && hasPrompt) {
      // Direct prompt synthesis without video
      extractionSource = 'prompt_synthesis';
      promptContents = `You are a master educator, cognitive scientist, and study coach.
The learner wants to study this specific prompt / topic: "${customPrompt.trim()}".
The study focus is: ${studyFocus}.

Generate exactly ${numCards} high-quality, memorable, and intellectually rigorous study flashcards directly based on this topic prompt.
Guidelines:
1. Cover the most important core ideas, counterintuitive concepts, key definitions, causal relationships, and real-world applications.
2. For each flashcard, provide a 2-4 word concept "prompt" (category/theme hint), a thought-provoking "question", and a clear "answer" (1-3 sentences).
3. Output strictly a JSON array matching the requested schema with IDs 1 to ${numCards}.

STUDY PROMPT:
${customPrompt.trim()}`;
    } else if (transcriptText && transcriptText.length > 80) {
      const safeTranscript = transcriptText.slice(0, 35000);
      promptContents = `You are a master educator, cognitive scientist, and study coach.
Analyze the following transcript from the YouTube video titled "${metadata.title}" by "${metadata.author}".

Create exactly ${numCards} high-quality, memorable, and intellectually rigorous study flashcards.
The study focus is: ${studyFocus}.${customPromptInstruction}

Strict Guidelines:
1. Cover the most important core ideas, counterintuitive concepts, key definitions, causal relationships, and real-world applications discussed in the video.
2. For each flashcard, provide a 2-4 word concept "prompt" (category/theme hint), a thought-provoking "question", and a clear "answer" (1-3 sentences).
3. Output strictly a JSON array matching the requested schema with IDs 1 to ${numCards}.

VIDEO TITLE: ${metadata.title}
VIDEO AUTHOR: ${metadata.author}

TRANSCRIPT:
${safeTranscript}`;
    } else {
      // Direct video knowledge synthesis
      promptContents = `You are a master educator, cognitive scientist, and study coach.
A learner is studying the YouTube video with URL: https://www.youtube.com/watch?v=${videoId}
Video Title / Context: "${metadata.title}" by "${metadata.author}".
Study Focus: ${studyFocus}.${customPromptInstruction}

Analyze this video topic and generate exactly ${numCards} high-quality, comprehensive study flashcards that masterfully test the key concepts, mental models, core principles, and practical takeaways of this video.

Strict Guidelines:
1. Provide a 2-4 word concept "prompt" (category/theme hint) for each card.
2. Provide questions that test deep comprehension.
3. Provide crisp, clear answers (1-3 sentences).
4. Output strictly a JSON array matching the schema with IDs 1 to ${numCards}.

VIDEO URL: https://www.youtube.com/watch?v=${videoId}
VIDEO TITLE: ${metadata.title}
CREATOR: ${metadata.author}`;
    }

    // Call Gemini with automatic graceful fallback if primary model is experiencing high demand
    let rawJsonText = '[]';
    const schema = {
      type: Type.ARRAY,
      description: `Array of exactly ${numCards} flashcards`,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.INTEGER,
            description: 'Unique sequential card number starting from 1',
          },
          prompt: {
            type: Type.STRING,
            description: 'A 2-4 word conceptual topic prompt or recall hint (e.g., "Self-Attention Mechanism", "Vocal Performance", "Historical Milestone")',
          },
          question: {
            type: Type.STRING,
            description: 'The question or prompt for the front of the flashcard',
          },
          answer: {
            type: Type.STRING,
            description: 'The clear, educational answer for the back of the flashcard',
          },
        },
        required: ['id', 'question', 'answer'],
      },
    };

    const config = {
      systemInstruction:
        'You are an expert study assistant. Output strictly a JSON array of flashcard objects with id, prompt, question, and answer. No markdown backticks, no extra text, strictly JSON.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: promptContents,
        config,
      });
      rawJsonText = response.text?.trim() || '[]';
    } catch (primaryErr: unknown) {
      console.warn('Model gemini-3.1-flash-lite had an issue, attempting gemini-3.8-flash:', primaryErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContents,
        config,
      });
      rawJsonText = fallbackResponse.text?.trim() || '[]';
    }

    let flashcards: Flashcard[] = [];

    try {
      flashcards = JSON.parse(rawJsonText);
    } catch {
      const cleaned = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      flashcards = JSON.parse(cleaned);
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Gemini model did not return a valid list of flashcards.');
    }

    flashcards = flashcards.map((card, idx) => ({
      id: idx + 1,
      prompt: card.prompt ? String(card.prompt).trim() : undefined,
      question: String(card.question || '').trim(),
      answer: String(card.answer || '').trim(),
    }));

    return res.json({
      success: true,
      video: metadata.id === 'prompt-topic' ? undefined : metadata,
      userPrompt: customPrompt?.trim() || null,
      flashcards,
      source: extractionSource,
      totalCards: flashcards.length,
      transcriptSnippet: transcriptText ? transcriptText.slice(0, 300) + '...' : null,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating flashcards:', err.message);

    let cleanMessage = err.message || 'An unexpected error occurred while generating flashcards.';
    try {
      const parsed = JSON.parse(cleanMessage);
      if (parsed?.error?.message) {
        cleanMessage = parsed.error.message;
      }
    } catch {
      // not a json string
    }

    return res.status(500).json({
      error: cleanMessage,
    });
  }
});

// -------------------------------------------------------------
// API ROUTE: /api/sample-videos
// -------------------------------------------------------------
app.get('/api/sample-videos', (_req, res) => {
  res.json([
    {
      id: 'z-EtmaPEt64',
      title: 'How Large Language Models Work',
      author: '3Blue1Brown',
      url: 'https://www.youtube.com/watch?v=z-EtmaPEt64',
      tag: 'AI & Math',
      suggestedPrompt: 'Focus on how the self-attention mechanism works geometrically',
    },
    {
      id: 'tp4A3fP0Lw0',
      title: 'The Map of Quantum Computing',
      author: 'Domain of Science',
      url: 'https://www.youtube.com/watch?v=tp4A3fP0Lw0',
      tag: 'Physics',
      suggestedPrompt: 'Focus on qubits, superposition, and Shor algorithm',
    },
    {
      id: 'Lp7E973zozc',
      title: 'How The Immune System Works',
      author: 'Kurzgesagt – In a Nutshell',
      url: 'https://www.youtube.com/watch?v=Lp7E973zozc',
      tag: 'Biology',
      suggestedPrompt: 'Highlight innate vs adaptive immunity and T-cell activation',
    },
    {
      id: '7B34N49557U',
      title: 'How Does Memory Work in the Brain?',
      author: 'TED-Ed',
      url: 'https://www.youtube.com/watch?v=7B34N49557U',
      tag: 'Neuroscience',
      suggestedPrompt: 'Focus heavily on brain anatomy, hippocampus, and neuroplasticity',
    },
  ]);
});

// Dev vs Production serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
