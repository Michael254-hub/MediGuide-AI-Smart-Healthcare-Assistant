import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Activity,
  ShieldAlert,
  ArrowRight,
  Mic,
  MicOff,
  Upload,
  X,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import api from "../services/api";

const submitSymptomSchema = z.object({
  symptoms: z.string().min(5, "Please describe your symptoms in more detail"),
  duration: z
    .string()
    .min(1, "Please select how long you have had these symptoms"),
  severity: z.enum(["mild", "moderate", "severe"], {
    errorMap: () => ({ message: "Please select a severity level" }),
  }),
  images: z.array(z.instanceof(File)).optional(),
  voiceNotes: z.array(z.instanceof(Blob)).optional(),
});

const SubmitSymptoms = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState([]);
  const imageInputRef = useRef(null);

  // Initialize speech recognition
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(new SpeechRecognition());

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setValue("symptoms", (prev) => prev + " " + transcript);
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Voice recording error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Voice recording toggle
  const toggleVoiceRecording = () => {
    if (!isRecording && recognitionRef.current) {
      setError(null);
      recognitionRef.current.start();
      setIsRecording(true);
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedImages((prev) => [
            ...prev,
            {
              file: file,
              preview: event.target.result,
              name: file.name,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(submitSymptomSchema),
    defaultValues: {
      severity: "mild",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      // Create FormData to handle both text and image data
      const formData = new FormData();
      formData.append("symptoms", data.symptoms);
      formData.append("duration", data.duration);
      formData.append("severity", data.severity);

      // Add uploaded images
      uploadedImages.forEach((img, index) => {
        formData.append(`images`, img.file);
      });

      await api.post("/symptoms", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit symptoms. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-med-dark to-slate-800 p-8 sm:p-12 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Symptom Assessment
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Please describe how you're feeling accurately so our AI system can
              provide the best possible guidance.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-3">
              <label className="text-lg font-bold text-med-dark block">
                1. What symptoms are you experiencing?
              </label>
              <p className="text-sm text-med-muted mb-4">
                You can type, use voice input, or upload images. Be as specific
                as possible (e.g., "sharp chest pain when breathing", "mild
                fever and headache").
              </p>

              {/* Voice Input Section */}
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Start Voice Input
                    </>
                  )}
                </button>
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">
                      Recording...
                    </span>
                  </div>
                )}
              </div>

              <textarea
                {...register("symptoms")}
                rows="4"
                className={`w-full px-5 py-4 rounded-2xl border ${errors.symptoms ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-med-primary focus:ring-med-primary/20"} resize-none focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white text-med-dark`}
                placeholder="Describe your symptoms here... or use voice input above"
              ></textarea>
              {errors.symptoms && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.symptoms.message}
                </p>
              )}

              {/* Image Upload Section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-med-dark mb-2">
                  Add Images (optional)
                </label>
                <div className="relative">
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-med-primary bg-slate-50 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-med-dark font-medium"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Upload Images of Symptoms
                  </button>
                </div>

                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img.preview}
                          alt={`Symptom ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-lg font-bold text-med-dark block">
                2. How long have you had these symptoms?
              </label>
              <select
                {...register("duration")}
                className={`w-full px-5 py-4 rounded-2xl border ${errors.duration ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-med-primary focus:ring-med-primary/20"} appearance-none focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white text-med-dark`}
              >
                <option value="">Select duration...</option>
                <option value="Just started (less than a day)">
                  Just started (less than a day)
                </option>
                <option value="1-3 days">1-3 days</option>
                <option value="4-7 days">4-7 days</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="More than 2 weeks">More than 2 weeks</option>
              </select>
              {errors.duration && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-lg font-bold text-med-dark block">
                3. How severe are your symptoms?
              </label>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    id: "mild",
                    label: "Mild",
                    desc: "Noticeable, but not interfering with daily activities",
                  },
                  {
                    id: "moderate",
                    label: "Moderate",
                    desc: "Interfering significantly with daily activities",
                  },
                  {
                    id: "severe",
                    label: "Severe",
                    desc: "Incapacitating or unbearable",
                  },
                ].map((level) => (
                  <label key={level.id} className="cursor-pointer group">
                    <input
                      type="radio"
                      value={level.id}
                      {...register("severity")}
                      className="sr-only peer"
                    />
                    <div className="h-full p-5 rounded-2xl border-2 border-slate-200 peer-checked:border-med-primary peer-checked:bg-blue-50 transition-all hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-med-dark capitalize">
                          {level.label}
                        </span>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-med-primary flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-med-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">{level.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.severity && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.severity.message}
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-4 bg-med-primary hover:bg-med-secondary text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:shadow-none hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Analyze Symptoms <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitSymptoms;
