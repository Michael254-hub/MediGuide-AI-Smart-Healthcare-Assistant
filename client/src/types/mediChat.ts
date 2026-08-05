export type AttachmentKind = "image" | "video" | "audio" | "document";

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  kind: AttachmentKind;
  url: string;
  description: string;
  generated: boolean;
}

export interface DraftAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  kind: AttachmentKind;
  previewUrl: string | null;
}

export interface UsageStats {
  inputTokens?: number;
  outputTokens?: number;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  timestamp: string;
  usage?: UsageStats | null;
  isError: boolean;
  attachments: MessageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  persisted: boolean;
  messages: ChatMessage[];
}
