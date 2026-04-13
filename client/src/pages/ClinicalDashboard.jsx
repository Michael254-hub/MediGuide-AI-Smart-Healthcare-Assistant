import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Heart,
  Image as ImageIcon,
  Loader,
  MessageCircle,
  Mic,
  Paperclip,
  Pill,
  Plus,
  Send,
  Sparkles,
  Stethoscope,
  TestTube,
  Trash2,
  TrendingUp,
  Video,
  Wind,
  X,
  Zap,
  Droplets,
} from "lucide-react";
import { clinicalAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const MEDIGUIDE_STORAGE_PREFIX = "mediguide-ai-conversations:";
const MAX_ATTACHMENTS = 4;
const SUPPORTED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
]);
const ATTACHMENT_ACCEPT =
  "image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,text/csv,application/json,application/xml,text/xml";

const createId = (prefix) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createEmptyConversation = () => {
  const timestamp = new Date().toISOString();

  return {
    id: createId("conversation"),
    title: "New conversation",
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  };
};

const sortConversations = (conversations) =>
  [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const truncateText = (value, maxLength = 52) => {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
};

const getAttachmentKind = (mimeType = "") => {
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

const isSupportedAttachment = (file) =>
  file.type.startsWith("image/") ||
  file.type.startsWith("video/") ||
  file.type.startsWith("audio/") ||
  SUPPORTED_DOCUMENT_MIME_TYPES.has(file.type);

const isPreviewableAttachment = (fileOrAttachment) =>
  fileOrAttachment?.type?.startsWith("image/") ||
  fileOrAttachment?.type?.startsWith("video/") ||
  fileOrAttachment?.type?.startsWith("audio/");

const createDraftAttachment = (file) => ({
  id: createId("draft"),
  file,
  name: file.name,
  size: file.size,
  type: file.type || "application/octet-stream",
  kind: getAttachmentKind(file.type),
  previewUrl: isPreviewableAttachment(file) ? URL.createObjectURL(file) : null,
});

const normalizeAttachmentRecord = (attachment = {}) => ({
  id: attachment.id || createId("attachment"),
  name: attachment.name || "Attachment",
  size: attachment.size || 0,
  type: attachment.type || "application/octet-stream",
  kind: attachment.kind || getAttachmentKind(attachment.type),
  url: attachment.url || "",
  description: attachment.description || "",
  generated: Boolean(attachment.generated),
});

const toMessageAttachment = (attachment) =>
  normalizeAttachmentRecord({
    id: attachment.id,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    kind: attachment.kind,
  });

const sanitizeStoredConversations = (rawValue) => {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    return [createEmptyConversation()];
  }

  const normalized = rawValue
    .filter((conversation) => conversation && typeof conversation.id === "string")
    .map((conversation) => ({
      id: conversation.id,
      title:
        typeof conversation.title === "string" && conversation.title.trim()
          ? conversation.title.trim()
          : "Untitled conversation",
      createdAt: conversation.createdAt || new Date().toISOString(),
      updatedAt:
        conversation.updatedAt || conversation.createdAt || new Date().toISOString(),
      messages: Array.isArray(conversation.messages)
        ? conversation.messages
            .filter(
              (message) =>
                message &&
                typeof message.id === "string" &&
                typeof message.role === "string" &&
                typeof message.content === "string"
            )
            .map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              timestamp: message.timestamp || new Date().toISOString(),
              usage: message.usage || null,
              isError: Boolean(message.isError),
              attachments: Array.isArray(message.attachments)
                ? message.attachments.map((attachment) =>
                    normalizeAttachmentRecord(attachment)
                  )
                : [],
            }))
        : [],
    }));

  return normalized.length > 0 ? sortConversations(normalized) : [createEmptyConversation()];
};

const deriveConversationTitle = (text, attachments) => {
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

const formatMessageTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const formatConversationTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatBytes = (bytes = 0) => {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const buildConversationPreview = (conversation) => {
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

const serializeMessageForApi = (message) => {
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

const getStorageKey = (user) =>
  `${MEDIGUIDE_STORAGE_PREFIX}${user?.id || user?.email || "guest"}`;

const ClinicalDashboard = () => {
  const { user } = useAuthStore();
  const storageKey = getStorageKey(user);
  const messagesEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const draftAttachmentsRef = useRef([]);

  const [patientData, setPatientData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationsReady, setConversationsReady] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [draftAttachments, setDraftAttachments] = useState([]);
  const [isConsulting, setIsConsulting] = useState(false);
  const [chatNotice, setChatNotice] = useState("");

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ||
    conversations[0] ||
    null;

  useEffect(() => {
    draftAttachmentsRef.current = draftAttachments;
  }, [draftAttachments]);

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setIsLoading(true);
        const [patientRes, suggestionsRes] = await Promise.allSettled([
          clinicalAPI.getPatientData(),
          clinicalAPI.getSuggestions(),
        ]);

        if (patientRes.status !== "fulfilled") {
          throw patientRes.reason;
        }

        setPatientData(patientRes.value.data.data);
        setSuggestions(
          suggestionsRes.status === "fulfilled"
            ? suggestionsRes.value.data.data.suggestions || []
            : []
        );
        setError(null);
      } catch (loadError) {
        console.error("Failed to load patient data:", loadError);
        setError("Failed to load MediChat. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, []);

  useEffect(() => {
    setConversationsReady(false);
    releaseAttachments(draftAttachmentsRef.current);
    draftAttachmentsRef.current = [];

    try {
      const rawValue = localStorage.getItem(storageKey);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      const initialConversations = sanitizeStoredConversations(parsedValue);

      setConversations(initialConversations);
      setActiveConversationId(initialConversations[0]?.id || null);
      setInputValue("");
      setDraftAttachments([]);
      setChatNotice("");
    } catch (loadError) {
      console.error("Failed to load MediChat conversations:", loadError);
      const fallbackConversation = createEmptyConversation();
      setConversations([fallbackConversation]);
      setActiveConversationId(fallbackConversation.id);
    } finally {
      setConversationsReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!conversationsReady) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(conversations));
  }, [conversations, conversationsReady, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversationId, activeConversation?.messages.length, isConsulting]);

  useEffect(
    () => () => {
      draftAttachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    },
    []
  );

  const releaseAttachments = (attachmentsToRelease) => {
    attachmentsToRelease.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
  };

  const clearDraftAttachments = () => {
    releaseAttachments(draftAttachmentsRef.current);
    draftAttachmentsRef.current = [];
    setDraftAttachments([]);

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const updateConversation = (conversationId, updater) => {
    setConversations((previousConversations) =>
      sortConversations(
        previousConversations.map((conversation) =>
          conversation.id === conversationId ? updater(conversation) : conversation
        )
      )
    );
  };

  const switchConversation = (conversationId) => {
    if (conversationId === activeConversationId) {
      return;
    }

    clearDraftAttachments();
    setInputValue("");
    setChatNotice("");
    setActiveConversationId(conversationId);
  };

  const handleNewConversation = () => {
    const conversation = createEmptyConversation();

    clearDraftAttachments();
    setInputValue("");
    setChatNotice("");
    setConversations((previousConversations) =>
      sortConversations([conversation, ...previousConversations])
    );
    setActiveConversationId(conversation.id);
  };

  const handleDeleteConversation = (conversationId) => {
    const remainingConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );

    if (remainingConversations.length === 0) {
      const fallbackConversation = createEmptyConversation();
      setConversations([fallbackConversation]);
      setActiveConversationId(fallbackConversation.id);
      clearDraftAttachments();
      setInputValue("");
      return;
    }

    setConversations(sortConversations(remainingConversations));

    if (conversationId === activeConversationId) {
      setActiveConversationId(remainingConversations[0].id);
      clearDraftAttachments();
      setInputValue("");
    }
  };

  const handleAttachmentSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    setDraftAttachments((previousAttachments) => {
      const supportedFiles = selectedFiles.filter(isSupportedAttachment);
      const remainingSlots = Math.max(MAX_ATTACHMENTS - previousAttachments.length, 0);
      const acceptedFiles = supportedFiles.slice(0, remainingSlots);
      const nextAttachments = acceptedFiles.map(createDraftAttachment);

      if (selectedFiles.length !== supportedFiles.length) {
        setChatNotice(
          "Some files were skipped. MediChat currently supports images, videos, audio files, PDFs, and text-based documents."
        );
      } else if (supportedFiles.length > remainingSlots) {
        setChatNotice(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      } else {
        setChatNotice("");
      }

      return [...previousAttachments, ...nextAttachments];
    });

    event.target.value = "";
  };

  const handleRemoveDraftAttachment = (attachmentId) => {
    setDraftAttachments((previousAttachments) => {
      const attachmentToRemove = previousAttachments.find(
        (attachment) => attachment.id === attachmentId
      );

      if (attachmentToRemove?.previewUrl) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl);
      }

      return previousAttachments.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const handleSendMessage = async (seedMessage = inputValue) => {
    if (!activeConversation || isConsulting) {
      return;
    }

    const trimmedMessage = seedMessage.trim();
    const pendingAttachments = [...draftAttachments];

    if (!trimmedMessage && pendingAttachments.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const attachmentMetadata = pendingAttachments.map(toMessageAttachment);
    const userMessage = {
      id: createId("message"),
      role: "user",
      content:
        trimmedMessage || "Please review the attached files and summarize the key findings.",
      timestamp: now,
      attachments: attachmentMetadata,
    };
    const conversationHistory = activeConversation.messages.map(serializeMessageForApi);
    const conversationId = activeConversation.id;

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title:
        conversation.messages.length === 0
          ? deriveConversationTitle(trimmedMessage, attachmentMetadata)
          : conversation.title,
      updatedAt: now,
      messages: [...conversation.messages, userMessage],
    }));

    setInputValue("");
    clearDraftAttachments();
    setChatNotice("");
    setIsConsulting(true);

    try {
      const response = await clinicalAPI.sendMediGuideMessage({
        question: trimmedMessage,
        conversationHistory,
        attachments: pendingAttachments.map((attachment) => attachment.file),
      });

      const assistantMessage = {
        id: createId("message"),
        role: "assistant",
        content: response.data.data.consultation,
        timestamp: response.data.data.timestamp || new Date().toISOString(),
        usage: response.data.data.usage,
        attachments: Array.isArray(response.data.data.artifacts)
          ? response.data.data.artifacts.map((artifact) =>
              normalizeAttachmentRecord(artifact)
            )
          : [],
      };

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        updatedAt: assistantMessage.timestamp,
        messages: [...conversation.messages, assistantMessage],
      }));
    } catch (requestError) {
      console.error("Failed to get MediGuide response:", requestError);

      const errorMessage = {
        id: createId("message"),
        role: "assistant",
        content:
          requestError.response?.data?.message ||
          "MediChat could not process that request. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true,
        attachments: [],
      };

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        updatedAt: errorMessage.timestamp,
        messages: [...conversation.messages, errorMessage],
      }));
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-12 w-12 animate-spin text-med-primary" />
          <p className="font-medium text-slate-600">Loading MediChat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <p className="text-center font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-lg bg-med-primary px-4 py-2 text-white transition hover:bg-med-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <MediGuideChatTab
          activeConversation={activeConversation}
          attachmentInputRef={attachmentInputRef}
          chatNotice={chatNotice}
          conversations={conversations}
          draftAttachments={draftAttachments}
          inputValue={inputValue}
          isConsulting={isConsulting}
          messagesEndRef={messagesEndRef}
          patientData={patientData}
          suggestions={suggestions}
          onDeleteConversation={handleDeleteConversation}
          onInputChange={setInputValue}
          onNewConversation={handleNewConversation}
          onRemoveDraftAttachment={handleRemoveDraftAttachment}
          onSelectConversation={switchConversation}
          onSendMessage={handleSendMessage}
          onSuggestedQuestion={handleSuggestedQuestion}
          onUploadAttachments={handleAttachmentSelection}
        />
      </div>
    </div>
  );
};

const MediGuideChatTab = ({
  activeConversation,
  attachmentInputRef,
  chatNotice,
  conversations,
  draftAttachments,
  inputValue,
  isConsulting,
  messagesEndRef,
  patientData,
  suggestions,
  onDeleteConversation,
  onInputChange,
  onNewConversation,
  onRemoveDraftAttachment,
  onSelectConversation,
  onSendMessage,
  onSuggestedQuestion,
  onUploadAttachments,
}) => {
  const patient = patientData?.patient;
  const canSend = inputValue.trim().length > 0 || draftAttachments.length > 0;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSendMessage();
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  const handleSelectConversation = (conversationId) => {
    onSelectConversation(conversationId);
    setIsSidebarOpen(false);
  };

  const handleCreateConversation = () => {
    onNewConversation();
    setIsSidebarOpen(false);
  };

  const handleSuggestedQuestionClick = (question) => {
    onSuggestedQuestion(question);
    setIsSidebarOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                MediChat
              </p>
              <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                {activeConversation?.title || "MediChat"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {isSidebarOpen ? "Hide menu" : "Open menu"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">
              {suggestions.length} suggested question{suggestions.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-240px)] grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          className={`${
            isSidebarOpen ? "flex" : "hidden"
          } order-2 min-h-[240px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:order-1 lg:flex`}
        >
        <div className="border-b border-slate-200 bg-slate-50/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                MediChat
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Conversations</h2>
            </div>
            <button
              type="button"
              onClick={handleCreateConversation}
              className="inline-flex items-center gap-2 rounded-full bg-med-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-med-secondary"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id;

              return (
                <div
                  key={conversation.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-sky-300 bg-sky-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-2xl p-2 ${
                        isActive ? "bg-white text-sky-600" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectConversation(conversation.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {conversation.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatConversationTime(conversation.updatedAt)}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-red-500"
                          aria-label={`Delete ${conversation.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {buildConversationPreview(conversation)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Suggested questions
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() => handleSuggestedQuestionClick(suggestion)}
                  className="w-full rounded-2xl border border-blue-200 bg-white px-3 py-2 text-left text-sm text-blue-900 transition hover:bg-blue-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
        </aside>

        <section className="order-1 flex min-h-[calc(100vh-240px)] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm lg:order-2">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {activeConversation?.title || "MediChat"}
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Text, images, videos, audio, PDFs, and text documents in one clinical thread
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/60 px-4 py-6 sm:px-6">
          {activeConversation?.messages.length ? (
            <div className="space-y-5">
              {activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-[28px] border px-4 py-4 shadow-sm sm:max-w-3xl sm:px-5 ${
                      message.role === "user"
                        ? "border-med-primary bg-med-primary text-white"
                        : message.isError
                          ? "border-red-200 bg-red-50 text-red-900"
                          : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                        {message.role === "user" ? "You" : "MediChat"}
                      </p>
                      <p className="text-xs opacity-70">
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>

                    {message.attachments?.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {message.attachments.map((attachment) => (
                          <MessageAttachmentCard
                            key={attachment.id}
                            attachment={attachment}
                            isUserMessage={message.role === "user"}
                          />
                        ))}
                      </div>
                    )}

                    {message.usage && (
                      <p className="mt-3 text-xs opacity-70">
                        Tokens: {message.usage.inputTokens} {"->"}{" "}
                        {message.usage.outputTokens}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isConsulting && (
                <div className="flex justify-start">
                  <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">
                        MediChat is reviewing the latest context...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-sky-100 text-sky-700">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-slate-900">
                  Start a richer MediChat conversation
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Ask by text alone, or attach images, audio clips, short videos,
                  PDFs, and text documents for Gemini to review in the same thread.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-4 sm:p-6">
          {chatNotice && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {chatNotice}
            </div>
          )}

          {draftAttachments.length > 0 && (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              {draftAttachments.map((attachment) => (
                <DraftAttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={() => onRemoveDraftAttachment(attachment.id)}
                />
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="rounded-[30px] border-2 border-sky-200 bg-white p-4 shadow-lg shadow-sky-100/50">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                  Text
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                  Images
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <Mic className="h-3.5 w-3.5 text-slate-500" />
                  Audio
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <Video className="h-3.5 w-3.5 text-slate-500" />
                  Videos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  Documents
                </span>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                MediChat can review these inputs and respond with text, SVG visuals,
                and downloadable reports or data files.
              </p>

              <textarea
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message MediChat about symptoms, differential diagnosis, treatment options, or ask it to review attachments, create a visual summary, or generate a document..."
                disabled={isConsulting}
                rows={4}
                className="min-h-[120px] w-full resize-none bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:min-h-[140px]"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept={ATTACHMENT_ACCEPT}
                    multiple
                    className="hidden"
                    onChange={onUploadAttachments}
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={isConsulting || draftAttachments.length >= MAX_ATTACHMENTS}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Paperclip className="h-4 w-4" />
                    Add attachments
                  </button>
                  <span className="text-xs text-slate-500">
                    Supports images, audio, videos, PDFs, TXT, CSV, and JSON
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isConsulting || !canSend}
                  className="inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-full bg-med-primary px-5 text-white transition hover:bg-med-secondary disabled:cursor-not-allowed disabled:opacity-60 sm:w-12 sm:self-end sm:px-0"
                  aria-label="Send message"
                  title="Send message"
                >
                  {isConsulting ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span className="text-sm font-semibold sm:hidden">
                    {isConsulting ? "Sending" : "Send"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
        </section>
      </div>
    </div>
  );
};

const AttachmentPreview = ({ attachment, className }) => {
  const previewUrl = attachment.previewUrl || attachment.url;

  if (!previewUrl) {
    return null;
  }

  if (attachment.kind === "image") {
    return <img src={previewUrl} alt={attachment.name} className={className} />;
  }

  if (attachment.kind === "video") {
    return <video src={previewUrl} controls className={className} />;
  }

  if (attachment.kind === "audio") {
    return <audio src={previewUrl} controls className={className} />;
  }

  return null;
};

const DraftAttachmentCard = ({ attachment, onRemove }) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <AttachmentTypeIcon attachment={attachment} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{attachment.name}</p>
          <p className="text-xs text-slate-500">
            {attachment.kind} - {formatBytes(attachment.size)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-red-500"
        aria-label={`Remove ${attachment.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <AttachmentPreview
      attachment={attachment}
      className={
        attachment.kind === "audio"
          ? "mt-3 w-full"
          : "mt-3 h-36 w-full rounded-2xl bg-slate-900 object-cover"
      }
    />
  </div>
);

const MessageAttachmentCard = ({ attachment, isUserMessage }) => {
  const hasPreview = Boolean(attachment.previewUrl || attachment.url);
  const canDownload = Boolean(attachment.url);

  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${
        isUserMessage
          ? "border-white/30 bg-white/10 text-white"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <AttachmentTypeIcon attachment={attachment} compact />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{attachment.name}</p>
              <p className="text-xs opacity-70">
                {attachment.kind} - {formatBytes(attachment.size)}
              </p>
            </div>

            {canDownload && (
              <a
                href={attachment.url}
                download={attachment.name}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  isUserMessage
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            )}
          </div>

          {attachment.description && (
            <p className="mt-2 text-xs leading-5 opacity-80">{attachment.description}</p>
          )}
        </div>
      </div>

      {hasPreview && (
        <AttachmentPreview
          attachment={attachment}
          className={
            attachment.kind === "audio"
              ? "mt-3 w-full"
              : "mt-3 max-h-56 w-full rounded-2xl bg-slate-900 object-contain"
          }
        />
      )}
    </div>
  );
};

const AttachmentTypeIcon = ({ attachment, compact = false }) => {
  const className = compact ? "h-4 w-4" : "h-5 w-5";
  const containerClassName = compact
    ? "rounded-xl bg-white/80 p-2 text-slate-700"
    : "rounded-2xl bg-white p-2.5 text-slate-700 shadow-sm";

  const icon =
    attachment.kind === "image" ? (
      <ImageIcon className={className} />
    ) : attachment.kind === "video" ? (
      <Video className={className} />
    ) : attachment.kind === "audio" ? (
      <Mic className={className} />
    ) : (
      <FileText className={className} />
    );

  return <div className={containerClassName}>{icon}</div>;
};

const DashboardTab = ({ patientData }) => {
  const patient = patientData?.patient;
  const vitals = patientData?.vitals;
  const riskScore = patientData?.riskScore;
  const actionItems = patientData?.actionItems;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-med-dark">Patient Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Name</p>
            <p className="text-lg font-bold text-med-dark">{patient?.name}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Age</p>
            <p className="text-lg font-bold text-med-dark">{patient?.age} years</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Height/Weight</p>
            <p className="text-lg font-bold text-med-dark">
              {patient?.height}, {patient?.weight}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-600">BMI</p>
            <p className="text-lg font-bold text-med-dark">{patient?.bmi}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <VitalCard
          icon={<Droplets className="h-5 w-5" />}
          label="Temperature"
          value={vitals?.temperature.value}
          unit={vitals?.temperature.unit}
          status={vitals?.temperature.status}
        />
        <VitalCard
          icon={<Heart className="h-5 w-5" />}
          label="Blood Pressure"
          value={vitals?.bloodPressure.value}
          unit="mmHg"
          status={vitals?.bloodPressure.status}
        />
        <VitalCard
          icon={<Zap className="h-5 w-5" />}
          label="Heart Rate"
          value={vitals?.heartRate.value}
          unit="bpm"
          status={vitals?.heartRate.status}
        />
        <VitalCard
          icon={<Wind className="h-5 w-5" />}
          label="Respiratory Rate"
          value={vitals?.respiratoryRate.value}
          unit="breaths/min"
          status={vitals?.respiratoryRate.status}
        />
        <VitalCard
          icon={<Activity className="h-5 w-5" />}
          label="O2 Saturation"
          value={vitals?.oxygenSaturation.value}
          unit="%"
          status={vitals?.oxygenSaturation.status}
        />
      </div>

      <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="mb-2 text-xl font-bold text-med-dark">Overall Risk Assessment</h2>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-orange-600">{riskScore?.score}</div>
              <div>
                <p className="text-lg font-bold text-orange-700">
                  {riskScore?.overallRisk} Risk
                </p>
                <p className="text-sm text-orange-600">Clinical severity score</p>
              </div>
            </div>
          </div>
          <AlertTriangle className="h-10 w-10 text-orange-600" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {riskScore?.factors.map((factor, index) => (
            <div
              key={`${factor.name}-${index}`}
              className="rounded-lg border border-orange-100 bg-white p-4"
            >
              <p className="font-medium text-med-dark">{factor.name}</p>
              <p className="text-sm capitalize text-slate-600">
                Severity: {factor.severity}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-med-dark">Prioritized Action Items</h2>
        <div className="space-y-3">
          {actionItems?.map((item, index) => (
            <div
              key={`${item.action}-${index}`}
              className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div
                className={`mt-1 rounded px-2 py-1 text-xs font-bold ${
                  item.priority === "HIGH"
                    ? "bg-red-100 text-red-700"
                    : item.priority === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {item.priority}
              </div>
              <div className="flex-1">
                <p className="font-bold text-med-dark">{item.action}</p>
                <p className="text-sm text-slate-600">{item.reason}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </p>
              </div>
              <CheckCircle className="mt-1 h-5 w-5 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VitalCard = ({ icon, label, value, unit, status }) => {
  const statusColor =
    status === "normal"
      ? "border-green-200 bg-green-50"
      : status === "elevated"
        ? "border-orange-200 bg-orange-50"
        : "border-red-200 bg-red-50";

  const statusTextColor =
    status === "normal"
      ? "text-green-700"
      : status === "elevated"
        ? "text-orange-700"
        : "text-red-700";

  return (
    <div className={`${statusColor} rounded-xl border p-4 shadow-sm`}>
      <div
        className={`mb-3 w-fit rounded-lg p-2 ${
          status === "normal"
            ? "bg-green-100 text-green-600"
            : status === "elevated"
              ? "bg-orange-100 text-orange-600"
              : "bg-red-100 text-red-600"
        }`}
      >
        {icon}
      </div>
      <p className="mb-1 text-sm font-medium text-slate-600">{label}</p>
      <p className="text-2xl font-bold text-med-dark">
        {value} <span className="text-sm text-slate-600">{unit}</span>
      </p>
      <p className={`mt-2 text-xs font-medium capitalize ${statusTextColor}`}>{status}</p>
    </div>
  );
};

const DifferentialDxTab = ({ patientData }) => {
  const diagnoses = patientData?.differentialDiagnoses;

  return (
    <div className="space-y-4">
      {diagnoses?.map((dx, index) => (
        <div
          key={`${dx.diagnosis}-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-med-dark">{dx.diagnosis}</h3>
              <p className="mt-1 text-sm text-slate-600">{dx.reasoning}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{dx.probability}%</div>
              <p className="text-xs text-slate-600">Probability</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${dx.probability}%` }}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 font-medium text-med-dark">Recommendations:</p>
            <ul className="space-y-2">
              {dx.recommendations.map((recommendation, recommendationIndex) => (
                <li
                  key={`${recommendation}-${recommendationIndex}`}
                  className="flex gap-2 text-sm text-slate-700"
                >
                  <span className="font-bold text-med-primary">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

const MedicationsTab = ({ patientData }) => {
  const [expandedMedication, setExpandedMedication] = useState(null);
  const medications = patientData?.medications;

  return (
    <div className="space-y-4">
      {medications?.map((medication, index) => (
        <div
          key={`${medication.name}-${index}`}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <button
            type="button"
            onClick={() =>
              setExpandedMedication(expandedMedication === index ? null : index)
            }
            className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-slate-50"
          >
            <div className="flex flex-1 items-center gap-4">
              <div className="rounded-lg bg-blue-50 p-2">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-med-dark">{medication.name}</h3>
                <p className="text-sm text-slate-600">
                  {medication.dosage} • {medication.frequency}
                </p>
              </div>
            </div>
            {expandedMedication === index ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedMedication === index && (
            <div className="space-y-4 border-t border-slate-200 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-600">
                    Indication
                  </p>
                  <p className="font-medium text-med-dark">{medication.indication}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-600">Route</p>
                  <p className="font-medium text-med-dark">{medication.route}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-600">
                    Start Date
                  </p>
                  <p className="font-medium text-med-dark">
                    {new Date(medication.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-600">Status</p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>

              {medication.interactions.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 flex items-center gap-2 font-bold text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Drug Interactions
                  </div>
                  {medication.interactions.map((interaction, interactionIndex) => (
                    <p
                      key={`${interaction}-${interactionIndex}`}
                      className="text-sm text-red-600"
                    >
                      {interaction}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const LabResultsTab = ({ patientData }) => {
  const labResults = patientData?.labResults;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left font-bold text-med-dark">Test</th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">Result</th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">Reference</th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">Status</th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">Trend</th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {labResults?.map((lab, index) => (
            <tr key={`${lab.test}-${index}`} className="transition hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-med-dark">{lab.test}</td>
              <td className="px-6 py-4 text-lg font-bold text-med-dark">
                {lab.value} <span className="text-sm text-slate-600">{lab.unit}</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{lab.reference}</td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    lab.status === "normal"
                      ? "bg-green-100 text-green-700"
                      : lab.status === "high"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {lab.status.toUpperCase()}
                </span>
              </td>
              <td className="flex items-center gap-1 px-6 py-4">
                {lab.trend === "increasing" ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : lab.trend === "decreasing" ? (
                  <TrendingUp className="h-4 w-4 rotate-180 text-green-600" />
                ) : (
                  <span className="text-slate-600">-</span>
                )}
                <span className="text-sm capitalize text-slate-600">{lab.trend}</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {new Date(lab.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClinicalDashboard;
