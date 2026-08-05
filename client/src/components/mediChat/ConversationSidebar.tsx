import { useEffect, useRef } from "react";
import { MessageCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { buildConversationPreview, formatConversationTime, sortConversations } from "./mediChatUtils";
import type { Conversation } from "../../types/mediChat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  deletingConversationId: string | null;
  suggestions: string[];
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onSuggestedQuestion: (question: string) => void;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  deletingConversationId,
  suggestions,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onSuggestedQuestion,
  className = "",
}: ConversationSidebarProps) {
  const sortedConversations = sortConversations(conversations);
  const conversationItemRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    const activeNode = conversationItemRefs.current[activeConversationId];
    activeNode?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeConversationId, sortedConversations.length]);

  return (
    <aside
      className={`flex min-h-[240px] flex-col overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-brand-border bg-slate-50/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
              MediChat
            </p>
            <h2 className="mt-1 text-xl font-bold text-brand-text">Conversations</h2>
            <p className="mt-2 text-sm text-brand-text-muted">
              Latest conversations stay at the top. Tap any title to reopen and highlight it.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewConversation}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {sortedConversations.map((conversation, index) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <div
                key={conversation.id}
                ref={(node) => {
                  if (node) {
                    conversationItemRefs.current[conversation.id] = node;
                  } else {
                    delete conversationItemRefs.current[conversation.id];
                  }
                }}
                className={`rounded-2xl border p-4 transition ${
                  isActive
                    ? "border-brand-secondary/40 bg-brand-secondary/5 shadow-sm ring-2 ring-brand-secondary/20"
                    : "border-brand-border bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-2xl p-2 ${
                      isActive ? "bg-white text-brand-primary" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectConversation(conversation.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                            {index === 0 ? "Latest" : `#${sortedConversations.length - index}`}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-brand-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-3 break-words text-sm font-semibold leading-5 text-brand-text">
                          {conversation.title}
                        </p>
                        <p className="mt-1 text-xs text-brand-text-muted">
                          {formatConversationTime(conversation.updatedAt)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        disabled={deletingConversationId === conversation.id}
                        className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-brand-danger disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Delete ${conversation.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 break-words text-xs leading-5 text-brand-text-muted">
                      {buildConversationPreview(conversation)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-brand-border bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-text">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Suggested questions
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                onClick={() => onSuggestedQuestion(suggestion)}
                className="w-full rounded-2xl border border-sky-200 bg-white px-3 py-2 text-left text-sm text-sky-900 transition hover:bg-sky-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
