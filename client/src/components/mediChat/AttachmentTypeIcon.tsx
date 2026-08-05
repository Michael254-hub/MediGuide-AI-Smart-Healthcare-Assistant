import { FileText, Image as ImageIcon, Mic, Video } from "lucide-react";
import type { AttachmentKind } from "../../types/mediChat";

export function AttachmentTypeIcon({
  attachment,
  compact = false,
}: {
  attachment: { kind: AttachmentKind };
  compact?: boolean;
}) {
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
}
