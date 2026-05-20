import { DocumentMeta } from "../types";

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  text: string;
  pageNumber?: number;
  startIndex: number;
}

interface MemoryStore {
  documents: DocumentMeta[];
  documentChunks: DocumentChunk[];
}

const globalStore = globalThis as unknown as {
  _memoryStore?: MemoryStore;
};

if (!globalStore._memoryStore) {
  globalStore._memoryStore = {
    documents: [],
    documentChunks: [],
  };
}

export const memoryStore = globalStore._memoryStore;

// Helper functions (identical to our server-side core RAG engine)
export function cleanText(text: string): string {
  return text
    .replace(/[\r\n]+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function chunkText(text: string, docId: string, docName: string): DocumentChunk[] {
  const cleaned = cleanText(text);
  const words = cleaned.split(" ");
  const chunks: DocumentChunk[] = [];
  
  const CHUNK_SIZE = 200; // Words per chunk (~1000 characters)
  const CHUNK_OVERLAP = 40; // Overlapping words

  let i = 0;
  let chunkIndex = 0;
  while (i < words.length) {
    const sliceEnd = Math.min(i + CHUNK_SIZE, words.length);
    const chunkWords = words.slice(i, sliceEnd);
    const chunkTextContent = chunkWords.join(" ");

    chunks.push({
      id: `${docId}-chunk-${chunkIndex}`,
      docId,
      docName,
      text: chunkTextContent,
      startIndex: i,
    });

    chunkIndex++;
    if (sliceEnd >= words.length) {
      break;
    }
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

export function retrieveRelevantChunks(query: string, limit = 5): DocumentChunk[] {
  const chunks = memoryStore.documentChunks;
  if (chunks.length === 0) return [];

  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTokens.length === 0) {
    return chunks.slice(0, limit);
  }

  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;

    queryTokens.forEach((token) => {
      const regex = new RegExp(`\\b${token}\\b`, "g");
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length * 3;
      } else if (chunkLower.includes(token)) {
        score += 1;
      }
    });

    const exactQueryPhrase = query.toLowerCase().trim();
    if (chunkLower.includes(exactQueryPhrase)) {
      score += 15;
    }

    return { chunk, score };
  });

  const relevantList = scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.chunk);

  if (relevantList.length === 0) {
    return chunks.slice(0, limit);
  }

  return relevantList.slice(0, limit);
}
