import { motion } from "framer-motion";
import { MessageAttachmentCard } from "./MessageAttachmentCard";
import { EmergencyWarningCard } from "./EmergencyWarningCard";
import { formatMessageTime, isEmergencyIndicated } from "./mediChatUtils";
import { fadeInUp } from "../../lib/motion";
import type { ChatMessage } from "../../types/mediChat";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[92%] sm:max-w-3xl">
        {isEmergencyIndicated(message) && <EmergencyWarningCard />}
        <div
          className={`rounded-[28px] border px-4 py-4 shadow-sm sm:px-5 ${
            isUser
              ? "border-brand-primary bg-brand-primary text-white"
              : message.isError
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-brand-border bg-white text-brand-text"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              {isUser ? "You" : "MediChat"}
            </p>
            <p className="text-xs opacity-70">{formatMessageTime(message.timestamp)}</p>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>

          {message.attachments?.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {message.attachments.map((attachment) => (
                <MessageAttachmentCard key={attachment.id} attachment={attachment} isUserMessage={isUser} />
              ))}
            </div>
          )}

          {message.usage && (
            <p className="mt-3 text-xs opacity-70">
              Tokens: {message.usage.inputTokens} {"->"} {message.usage.outputTokens}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
