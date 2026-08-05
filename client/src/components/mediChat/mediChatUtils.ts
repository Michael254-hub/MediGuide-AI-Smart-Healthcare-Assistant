import axios from "axios";
import type {
  AttachmentKind,
  ChatMessage,
  Conversation,
  DraftAttachment,
  MessageAttachment,
} from "../../types/mediChat";
import type { AuthUser } from "../../types/auth";

export const LEGACY_MEDIGUIDE_STORAGE_PREFIX = "mediguide-ai-conversations:";
export const MAX_ATTACHMENTS = 4;
export const SUPPORTED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
]);
export const ATTACHMENT_ACCEPT =
  "image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,text/csv,application/json,application/xml,text/xml";

export const createId = (prefix: string): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createEmptyConversation = (): Conversation => {
  const timestamp = new Date().toISOString();

  return {
    id: createId("conversation"),
    title: "New conversation",
    createdAt: timestamp,
    updatedAt: timestamp,
    persisted: false,
    messages: [],
  };
};

export const sortConversations = (conversations: Conversation[]): Conversation[] =>
  [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

export const truncateText = (value?: string | null, maxLength = 52): string => {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
};

export const getAttachmentKind = (mimeType = ""): AttachmentKind => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
};

export const isSupportedAttachment = (file: File): boolean =>
  file.type.startsWith("image/") ||
  file.type.startsWith("video/") ||
  file.type.startsWith("audio/") ||
  SUPPORTED_DOCUMENT_MIME_TYPES.has(file.type);

export const isPreviewableAttachment = (fileOrAttachment: { type?: string }): boolean =>
  Boolean(
    fileOrAttachment?.type?.startsWith("image/") ||
      fileOrAttachment?.type?.startsWith("video/") ||
      fileOrAttachment?.type?.startsWith("audio/"),
  );

export const createDraftAttachment = (file: File): DraftAttachment => ({
  id: createId("draft"),
  file,
  name: file.name,
  size: file.size,
  type: file.type || "application/octet-stream",
  kind: getAttachmentKind(file.type),
  previewUrl: isPreviewableAttachment(file) ? URL.createObjectURL(file) : null,
});

export const normalizeAttachmentRecord = (
  attachment: Partial<MessageAttachment> = {},
): MessageAttachment => ({
  id: attachment.id || createId("attachment"),
  name: attachment.name || "Attachment",
  size: attachment.size || 0,
  type: attachment.type || "application/octet-stream",
  kind: attachment.kind || getAttachmentKind(attachment.type),
  url: attachment.url || "",
  description: attachment.description || "",
  generated: Boolean(attachment.generated),
});

export const normalizeMessageRecord = (message: Partial<ChatMessage> & { createdAt?: string } = {}): ChatMessage => ({
  id: message.id || createId("message"),
  role: message.role || "assistant",
  content: message.content || "",
  timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
  usage: message.usage || null,
  isError: Boolean(message.isError),
  attachments: Array.isArray(message.attachments)
    ? message.attachments.map((attachment) => normalizeAttachmentRecord(attachment))
    : [],
});

export const normalizeConversationRecord = (
  conversation: Partial<Conversation> = {},
): Conversation => ({
  id: conversation.id || createId("conversation"),
  title:
    typeof conversation.title === "string" && conversation.title.trim()
      ? conversation.title.trim()
      : "Untitled conversation",
  createdAt: conversation.createdAt || new Date().toISOString(),
  updatedAt: conversation.updatedAt || conversation.createdAt || new Date().toISOString(),
  persisted: Boolean(conversation.persisted),
  messages: Array.isArray(conversation.messages)
    ? conversation.messages.map((message) => normalizeMessageRecord(message))
    : [],
});

export const toMessageAttachment = (attachment: DraftAttachment): MessageAttachment =>
  normalizeAttachmentRecord({
    id: attachment.id,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    kind: attachment.kind,
  });

export const ensureConversationCollection = (rawValue: unknown): Conversation[] => {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    return [createEmptyConversation()];
  }

  const normalized = rawValue
    .filter((conversation) => conversation && typeof conversation === "object")
    .map((conversation) => normalizeConversationRecord(conversation));

  return normalized.length > 0 ? sortConversations(normalized) : [createEmptyConversation()];
};

export const deriveConversationTitle = (
  text: string,
  attachments: MessageAttachment[],
): string => {
  if (text.trim()) {
    return truncateText(text.trim(), 44);
  }

  if (attachments.length === 1) {
    return truncateText(`Review ${attachments[0].name}`, 44);
  }

  if (attachments.length > 1) {
    return `Review ${attachments.length} attachments`;
  }

  return "New conversation";
};

export const formatMessageTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

export const formatConversationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const formatBytes = (bytes = 0): string => {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const buildConversationPreview = (conversation: Conversation): string => {
  const lastMessage = conversation.messages.at(-1);

  if (!lastMessage) {
    return "No messages yet";
  }

  const attachmentCount = lastMessage.attachments?.length || 0;
  const attachmentNote =
    attachmentCount > 0
      ? ` - ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`
      : "";

  return `${truncateText(lastMessage.content, 46)}${attachmentNote}`;
};

export const serializeMessageForApi = (message: ChatMessage) => {
  const attachmentSummary =
    message.attachments && message.attachments.length > 0
      ? `\n\nAttachments referenced in this message: ${message.attachments
          .map((attachment) => `${attachment.kind}: ${attachment.name}`)
          .join(", ")}`
      : "";

  return {
    role: message.role,
    content: `${message.content}${attachmentSummary}`.trim(),
  };
};

export const getLegacyStorageKey = (user?: AuthUser | null): string =>
  `${LEGACY_MEDIGUIDE_STORAGE_PREFIX}${user?.id || user?.email || "guest"}`;

export const getMediChatLoadErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK") {
      return "MediChat could not reach the API server at http://localhost:5000. Start the backend server and try again.";
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }
  }

  return "Failed to load MediChat. Please try again.";
};

/** Lightweight, presentational-only heuristic for surfacing an emergency warning card
 * under an assistant reply — MediChat has no structured risk classification of its own
 * (that lives in the symptom-checker's triage pipeline), so this pattern-matches on
 * language the assistant itself would use when urging immediate care. */
const EMERGENCY_PATTERN =
  /\b(call\s+(911|emergency services|an ambulance)|go to (the )?(er|emergency room)|seek immediate medical (attention|care)|life[- ]threatening)\b/i;

export const isEmergencyIndicated = (message: ChatMessage): boolean =>
  message.role === "assistant" && !message.isError && EMERGENCY_PATTERN.test(message.content);
