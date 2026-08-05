import { X } from "lucide-react";
import { AttachmentTypeIcon } from "./AttachmentTypeIcon";
import { AttachmentPreview } from "./AttachmentPreview";
import { formatBytes } from "./mediChatUtils";
import type { DraftAttachment } from "../../types/mediChat";

export function DraftAttachmentCard({
  attachment,
  onRemove,
}: {
  attachment: DraftAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-3xl border border-brand-border bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AttachmentTypeIcon attachment={attachment} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-text">{attachment.name}</p>
            <p className="text-xs text-brand-text-muted">
              {attachment.kind} - {formatBytes(attachment.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-brand-text-muted transition hover:bg-white hover:text-brand-danger"
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
}
