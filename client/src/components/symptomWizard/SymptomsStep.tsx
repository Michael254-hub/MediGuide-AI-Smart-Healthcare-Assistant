import type { RefObject } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Image as ImageIcon, Mic, MicOff, X } from "lucide-react";
import { motion } from "framer-motion";
import { Textarea } from "../ui/Textarea";
import { fadeInUp } from "../../lib/motion";
import type { UploadedImage } from "../../types/symptomWizard";

interface SymptomFormValues {
  symptoms: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
}

interface SymptomsStepProps {
  register: UseFormRegister<SymptomFormValues>;
  errors: FieldErrors<SymptomFormValues>;
  isRecording: boolean;
  onToggleVoiceRecording: () => void;
  uploadedImages: UploadedImage[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  imageInputRef: RefObject<HTMLInputElement | null>;
}

export function SymptomsStep({
  register,
  errors,
  isRecording,
  onToggleVoiceRecording,
  uploadedImages,
  onImageUpload,
  onRemoveImage,
  imageInputRef,
}: SymptomsStepProps) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-text">
          What symptoms are you experiencing?
        </h2>
        <p className="mt-1.5 text-sm text-brand-text-muted">
          You can type, use voice input, or upload images. Be as specific as possible.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onToggleVoiceRecording}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors ${
            isRecording ? "bg-brand-danger text-white" : "bg-brand-secondary/10 text-brand-primary"
          }`}
        >
          {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          {isRecording ? "Stop voice input" : "Start voice input"}
        </button>
        {isRecording && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-brand-danger">
            <span className="size-2 animate-pulse rounded-full bg-brand-danger"></span>
            Recording...
          </div>
        )}
      </div>

      <Textarea
        rows={4}
        placeholder="Describe your symptoms here..."
        error={errors.symptoms?.message}
        {...register("symptoms")}
      />

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-text">
          Add images (optional)
        </label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-border bg-slate-50 px-4 py-3 text-sm font-medium text-brand-text-muted transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5"
        >
          <ImageIcon className="size-5" />
          Upload symptom images
        </button>
        {uploadedImages.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {uploadedImages.map((image, index) => (
              <div key={`${image.name}-${index}`} className="rounded-2xl border border-brand-border p-3">
                <img src={image.preview} alt={image.name} className="h-28 w-full rounded-xl object-cover" />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="truncate text-xs text-brand-text-muted">{image.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-danger"
                  >
                    <X className="size-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
