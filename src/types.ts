export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  citations?: Array<{ docName: string; text: string }>;
}

export interface DocumentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  contentLength: number;
  chunksCount: number;
  uploadedAt: string;
}
