import { Download } from "lucide-react";
import { AttachmentTypeIcon } from "./AttachmentTypeIcon";
import { AttachmentPreview } from "./AttachmentPreview";
import { formatBytes } from "./mediChatUtils";
import type { MessageAttachment } from "../../types/mediChat";

export function MessageAttachmentCard({
  attachment,
  isUserMessage,
}: {
  attachment: MessageAttachment;
  isUserMessage: boolean;
}) {
  const hasPreview = Boolean(attachment.url);
  const canDownload = Boolean(attachment.url);

  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${
        isUserMessage
          ? "border-white/30 bg-white/10 text-white"
          : "border-brand-border bg-slate-50 text-brand-text"
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
                    : "bg-white text-brand-text hover:bg-slate-100"
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
}
