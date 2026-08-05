import type { RefObject } from "react";
import {
  Brain,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  Plus,
  Send,
  Video,
  X,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { DraftAttachmentCard } from "./DraftAttachmentCard";
import { QuickPrompts } from "./QuickPrompts";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS } from "./mediChatUtils";
import type { Conversation, DraftAttachment } from "../../types/mediChat";

interface ChatWindowProps {
  activeConversation: Conversation | null;
  isConsulting: boolean;
  chatNotice: string;
  inputValue: string;
  draftAttachments: DraftAttachment[];
  suggestions: string[];
  isConversationPanelOpen: boolean;
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSendMessage: (seedMessage?: string) => void;
  onUploadAttachments: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDraftAttachment: (attachmentId: string) => void;
  onCloseConversationPanel: () => void;
  onReopenConversationPanel: () => void;
  onNewConversation: () => void;
}

export function ChatWindow({
  activeConversation,
  isConsulting,
  chatNotice,
  inputValue,
  draftAttachments,
  suggestions,
  isConversationPanelOpen,
  attachmentInputRef,
  messagesEndRef,
  onInputChange,
  onSendMessage,
  onUploadAttachments,
  onRemoveDraftAttachment,
  onCloseConversationPanel,
  onReopenConversationPanel,
  onNewConversation,
}: ChatWindowProps) {
  const canSend = inputValue.trim().length > 0 || draftAttachments.length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSendMessage();
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  if (!isConversationPanelOpen) {
    return (
      <section className="order-1 flex min-h-[calc(100vh-240px)] flex-col overflow-hidden rounded-[32px] border border-brand-border bg-white shadow-sm lg:order-2">
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-2xl rounded-[28px] border border-dashed border-brand-border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-brand-text">Chat closed to sidebar</h3>
            <p className="mt-3 text-sm leading-6 text-brand-text-muted">
              Pick another conversation from the sidebar or start a new chat when you are ready.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onNewConversation}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
              {activeConversation && (
                <button
                  type="button"
                  onClick={onReopenConversationPanel}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-border px-5 py-3 text-sm font-semibold text-brand-text transition hover:bg-slate-50"
                >
                  Reopen Current
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="order-1 flex min-h-[calc(100vh-240px)] flex-col overflow-hidden rounded-[32px] border border-brand-border bg-white shadow-sm lg:order-2">
      <div className="border-b border-brand-border bg-linear-to-r from-slate-50 via-white to-sky-50 px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-text sm:text-xl">
                {activeConversation?.title || "MediChat"}
              </h2>
              <p className="text-xs text-brand-text-muted sm:text-sm">
                Text, images, videos, audio, PDFs, and text documents in one health education thread
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseConversationPanel}
            className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-slate-50"
            aria-label="Close current chat"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/60 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          {activeConversation?.messages.length ? (
            <div className="space-y-5">
              {activeConversation.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isConsulting && <TypingIndicator />}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-10">
              <div className="max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-sky-100 text-sky-700">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-brand-text">
                  Start a MediChat health education conversation
                </h3>
                <p className="mt-3 text-sm leading-6 text-brand-text-muted">
                  Ask about symptoms, conditions, medicines, medical terms, or health claims, or
                  attach images, audio clips, short videos, PDFs, and text documents for review in
                  the same thread.
                </p>
                <QuickPrompts prompts={suggestions} onSelect={onSendMessage} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-brand-border bg-white p-4 sm:p-6">
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-4 text-center text-xs text-brand-text-muted">
            MediGuide provides AI-assisted educational health information and guidance. It is not
            a substitute for professional medical advice, diagnosis, or treatment. If you are
            experiencing a medical emergency, contact your local emergency services immediately.
          </p>

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

              <textarea
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask MediChat about symptoms, conditions, medications, medical terms, or health information you want explained or verified..."
                disabled={isConsulting}
                rows={4}
                className="min-h-[120px] w-full resize-none bg-transparent text-sm leading-6 text-brand-text outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:min-h-[140px]"
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
                    className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Paperclip className="h-4 w-4" />
                    Add attachments
                  </button>
                  <span className="text-xs text-brand-text-muted">
                    Supports images, audio, videos, PDFs, TXT, CSV, and JSON
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isConsulting || !canSend}
                  className="inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-full bg-brand-primary px-5 text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-12 sm:self-end sm:px-0"
                  aria-label="Send message"
                  title="Send message"
                >
                  {isConsulting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
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
      </div>
    </section>
  );
}
