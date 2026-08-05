import type { DraftAttachment, MessageAttachment } from "../../types/mediChat";

interface AttachmentPreviewProps {
  attachment: DraftAttachment | MessageAttachment;
  className?: string;
}

export function AttachmentPreview({ attachment, className }: AttachmentPreviewProps) {
  const previewUrl =
    ("previewUrl" in attachment ? attachment.previewUrl : null) ||
    ("url" in attachment ? attachment.url : null);

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
}
