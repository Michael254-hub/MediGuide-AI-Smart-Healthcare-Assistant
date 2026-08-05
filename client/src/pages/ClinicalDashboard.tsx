import { useEffect, useRef, useState, type ChangeEvent } from "react";
import axios from "axios";
import { AlertCircle, Loader2 } from "lucide-react";
import { mediChatAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { ConversationSidebar } from "../components/mediChat/ConversationSidebar";
import { ChatWindow } from "../components/mediChat/ChatWindow";
import { Button } from "../components/ui/Button";
import {
  createEmptyConversation,
  createId,
  createDraftAttachment,
  deriveConversationTitle,
  ensureConversationCollection,
  getLegacyStorageKey,
  getMediChatLoadErrorMessage,
  isSupportedAttachment,
  normalizeConversationRecord,
  serializeMessageForApi,
  sortConversations,
  toMessageAttachment,
} from "../components/mediChat/mediChatUtils";
import type { ChatMessage, Conversation, DraftAttachment } from "../types/mediChat";

const MAX_ATTACHMENTS_PER_MESSAGE = 4;

const ClinicalDashboard = () => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const draftAttachmentsRef = useRef<DraftAttachment[]>([]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [isConsulting, setIsConsulting] = useState(false);
  const [chatNotice, setChatNotice] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ||
    conversations[0] ||
    null;

  useEffect(() => {
    draftAttachmentsRef.current = draftAttachments;
  }, [draftAttachments]);

  useEffect(() => {
    const loadMediChat = async () => {
      try {
        setIsLoading(true);
        const [patientRes, historyRes, suggestionsRes] = await Promise.allSettled([
          mediChatAPI.getPatientData(),
          mediChatAPI.getConversationHistory(),
          mediChatAPI.getSuggestions(),
        ]);

        if (patientRes.status === "rejected") {
          throw patientRes.reason;
        }
        if (historyRes.status === "rejected") {
          throw historyRes.reason;
        }

        const storedConversations = historyRes.value.data.data.conversations || [];
        let initialConversations = ensureConversationCollection(storedConversations);
        let nextChatNotice = "";

        if (storedConversations.length === 0 && typeof window !== "undefined") {
          const legacyStorageKey = getLegacyStorageKey(user);
          const rawLegacyValue = window.localStorage.getItem(legacyStorageKey);

          if (rawLegacyValue) {
            try {
              const parsedLegacyConversations = JSON.parse(rawLegacyValue);
              const legacyConversations = ensureConversationCollection(
                parsedLegacyConversations,
              ).filter((conversation) => conversation.messages.length > 0);

              if (legacyConversations.length > 0) {
                const importResponse =
                  await mediChatAPI.importConversationHistory(legacyConversations);

                initialConversations = ensureConversationCollection(
                  importResponse.data.data.conversations || [],
                );
                window.localStorage.removeItem(legacyStorageKey);
                nextChatNotice =
                  "Your previous MediChat conversations were migrated into your account.";
              }
            } catch (migrationError) {
              console.error("Failed to migrate legacy MediChat history:", migrationError);
            }
          }
        }

        setConversations(initialConversations);
        setActiveConversationId(initialConversations[0]?.id || null);
        setSuggestions(
          suggestionsRes.status === "fulfilled"
            ? suggestionsRes.value.data.data.suggestions || []
            : [],
        );
        setInputValue("");
        setDraftAttachments([]);
        setChatNotice(nextChatNotice);
        setError(null);
      } catch (loadError) {
        console.error("Failed to load MediChat:", loadError);
        setError(getMediChatLoadErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    };

    loadMediChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.id]);

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
    [],
  );

  const releaseAttachments = (attachmentsToRelease: DraftAttachment[]) => {
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

  const updateConversation = (
    conversationId: string,
    updater: (conversation: Conversation) => Conversation,
  ) => {
    setConversations((previousConversations) =>
      sortConversations(
        previousConversations.map((conversation) =>
          conversation.id === conversationId ? updater(conversation) : conversation,
        ),
      ),
    );
  };

  const replaceConversation = (temporaryConversationId: string, nextConversation: unknown) => {
    const normalizedConversation = normalizeConversationRecord(
      nextConversation as Partial<Conversation>,
    );

    setConversations((previousConversations) =>
      sortConversations([
        normalizedConversation,
        ...previousConversations.filter(
          (conversation) =>
            conversation.id !== temporaryConversationId &&
            conversation.id !== normalizedConversation.id,
        ),
      ]),
    );
    setActiveConversationId(normalizedConversation.id);
  };

  const switchConversation = (conversationId: string) => {
    if (conversationId === activeConversationId) {
      setIsConversationPanelOpen(true);
      setIsSidebarOpen(false);
      return;
    }

    clearDraftAttachments();
    setInputValue("");
    setChatNotice("");
    setActiveConversationId(conversationId);
    setIsConversationPanelOpen(true);
    setIsSidebarOpen(false);
  };

  const handleNewConversation = () => {
    if (
      activeConversation &&
      activeConversation.messages.length === 0 &&
      !activeConversation.persisted
    ) {
      clearDraftAttachments();
      setInputValue("");
      setChatNotice("");
      setIsConversationPanelOpen(true);
      setIsSidebarOpen(false);
      return;
    }

    const conversation = createEmptyConversation();

    clearDraftAttachments();
    setInputValue("");
    setChatNotice("");
    setConversations((previousConversations) =>
      sortConversations([conversation, ...previousConversations]),
    );
    setActiveConversationId(conversation.id);
    setIsConversationPanelOpen(true);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const targetConversation = conversations.find(
      (conversation) => conversation.id === conversationId,
    );

    if (!targetConversation) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${targetConversation.title}" from your MediChat history? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingConversationId(conversationId);

      if (targetConversation.persisted) {
        await mediChatAPI.deleteConversation(conversationId);
      }

      const remainingConversations = conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      if (remainingConversations.length === 0) {
        const fallbackConversation = createEmptyConversation();
        setConversations([fallbackConversation]);
        setActiveConversationId(fallbackConversation.id);
        clearDraftAttachments();
        setInputValue("");
        setChatNotice("Conversation deleted.");
        return;
      }

      setConversations(sortConversations(remainingConversations));

      if (conversationId === activeConversationId) {
        setActiveConversationId(remainingConversations[0].id);
        clearDraftAttachments();
        setInputValue("");
      }

      setChatNotice("Conversation deleted.");
    } catch (deleteError) {
      console.error("Failed to delete MediChat conversation:", deleteError);
      const message = axios.isAxiosError(deleteError) ? deleteError.response?.data?.message : undefined;
      window.alert(
        message || "We could not delete that MediChat conversation right now. Please try again.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleAttachmentSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    setDraftAttachments((previousAttachments) => {
      const supportedFiles = selectedFiles.filter(isSupportedAttachment);
      const remainingSlots = Math.max(MAX_ATTACHMENTS_PER_MESSAGE - previousAttachments.length, 0);
      const acceptedFiles = supportedFiles.slice(0, remainingSlots);
      const nextAttachments = acceptedFiles.map(createDraftAttachment);

      if (selectedFiles.length !== supportedFiles.length) {
        setChatNotice(
          "Some files were skipped. MediChat currently supports images, videos, audio files, PDFs, and text-based documents.",
        );
      } else if (supportedFiles.length > remainingSlots) {
        setChatNotice(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`);
      } else {
        setChatNotice("");
      }

      return [...previousAttachments, ...nextAttachments];
    });

    event.target.value = "";
  };

  const handleRemoveDraftAttachment = (attachmentId: string) => {
    setDraftAttachments((previousAttachments) => {
      const attachmentToRemove = previousAttachments.find(
        (attachment) => attachment.id === attachmentId,
      );

      if (attachmentToRemove?.previewUrl) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl);
      }

      return previousAttachments.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const handleSendMessage = async (seedMessage: string = inputValue) => {
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
    const userMessage: ChatMessage = {
      id: createId("message"),
      role: "user",
      content:
        trimmedMessage || "Please review the attached files and summarize the key findings.",
      timestamp: now,
      isError: false,
      attachments: attachmentMetadata,
    };
    const conversationHistory = activeConversation.messages.map(serializeMessageForApi);
    const localConversationId = activeConversation.id;
    const conversationId = activeConversation.persisted ? activeConversation.id : undefined;
    const conversationTitle =
      activeConversation.messages.length === 0
        ? deriveConversationTitle(trimmedMessage, attachmentMetadata)
        : activeConversation.title;

    updateConversation(localConversationId, (conversation) => ({
      ...conversation,
      title: conversationTitle,
      updatedAt: now,
      messages: [...conversation.messages, userMessage],
    }));

    setInputValue("");
    clearDraftAttachments();
    setChatNotice("");
    setIsConsulting(true);

    try {
      const response = await mediChatAPI.sendMessage({
        question: trimmedMessage,
        conversationId,
        conversationTitle,
        conversationHistory,
        attachments: pendingAttachments.map((attachment) => attachment.file),
      });
      replaceConversation(localConversationId, response.data.data.conversation);
    } catch (requestError) {
      console.error("Failed to get MediGuide response:", requestError);

      const persistedErrorConversation = axios.isAxiosError(requestError)
        ? requestError.response?.data?.data?.conversation
        : undefined;

      if (persistedErrorConversation) {
        replaceConversation(localConversationId, persistedErrorConversation);
        const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : undefined;
        setChatNotice(
          message || "MediChat saved the exchange, but the response completed with an error.",
        );
        return;
      }

      const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : undefined;
      const errorMessage: ChatMessage = {
        id: createId("message"),
        role: "assistant",
        content: message || "MediChat could not process that request. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true,
        attachments: [],
      };

      updateConversation(localConversationId, (conversation) => ({
        ...conversation,
        updatedAt: errorMessage.timestamp,
        messages: [...conversation.messages, errorMessage],
      }));
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  const sortedConversations = sortConversations(conversations);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-primary" />
          <p className="font-medium text-brand-text-muted">Loading MediChat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-brand-danger" />
          <p className="text-center font-medium text-red-700">{error}</p>
          <Button className="mt-4 w-full" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-sky-50 to-cyan-50">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-4">
          <div className="lg:hidden">
            <div className="rounded-[28px] border border-brand-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
                    MediChat
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold text-brand-text">
                    {activeConversation?.title || "MediChat"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen((current) => !current)}
                  className="rounded-full border border-brand-border bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-slate-100"
                >
                  {isSidebarOpen ? "Hide menu" : "Open menu"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-brand-text-muted">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  {sortedConversations.length} conversation{sortedConversations.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  {suggestions.length} suggested question{suggestions.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid min-h-[calc(100vh-240px)] grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <ConversationSidebar
              className={`order-2 lg:order-1 ${isSidebarOpen ? "flex" : "hidden lg:flex"}`}
              conversations={conversations}
              activeConversationId={activeConversation?.id ?? null}
              deletingConversationId={deletingConversationId}
              suggestions={suggestions}
              onSelectConversation={switchConversation}
              onDeleteConversation={handleDeleteConversation}
              onNewConversation={handleNewConversation}
              onSuggestedQuestion={handleSuggestedQuestion}
            />

            <ChatWindow
              activeConversation={activeConversation}
              isConsulting={isConsulting}
              chatNotice={chatNotice}
              inputValue={inputValue}
              draftAttachments={draftAttachments}
              suggestions={suggestions}
              isConversationPanelOpen={isConversationPanelOpen}
              attachmentInputRef={attachmentInputRef}
              messagesEndRef={messagesEndRef}
              onInputChange={setInputValue}
              onSendMessage={handleSendMessage}
              onUploadAttachments={handleAttachmentSelection}
              onRemoveDraftAttachment={handleRemoveDraftAttachment}
              onCloseConversationPanel={() => setIsConversationPanelOpen(false)}
              onReopenConversationPanel={() => setIsConversationPanelOpen(true)}
              onNewConversation={handleNewConversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalDashboard;
