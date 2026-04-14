import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Activity,
  ArrowRight,
  Image as ImageIcon,
  Mic,
  MicOff,
  ShieldAlert,
} from "lucide-react";
import { patientProfileAPI, symptomAPI } from "../services/api";
import PatientProfileIntake from "../components/PatientProfileIntake";

const submitSymptomSchema = z.object({
  symptoms: z.string().min(5, "Please describe your symptoms in more detail"),
  duration: z.string().min(1, "Please select how long you have had these symptoms"),
  severity: z.enum(["mild", "moderate", "severe"], {
    errorMap: () => ({ message: "Please select a severity level" }),
  }),
});

const FOLLOW_UP_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "i_dont_know", label: "I don't know" },
];

export default function SubmitSymptoms() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparingFollowUps, setIsPreparingFollowUps] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [draftSubmission, setDraftSubmission] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const symptomsRef = useRef("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(submitSymptomSchema),
    defaultValues: { severity: "mild" },
  });

  const symptomsValue = watch("symptoms");

  useEffect(() => {
    symptomsRef.current = symptomsValue || "";
  }, [symptomsValue]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await patientProfileAPI.getProfile();
      setProfile(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load the patient profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (location.state?.editProfile) {
      setIsEditingProfile(true);
    }
  }, [location.state]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalText += ` ${event.results[i][0].transcript}`;
        }
      }
      if (finalText.trim()) {
        setValue("symptoms", `${symptomsRef.current}${finalText}`.trim(), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    };
    recognition.onerror = (event) => {
      setError(`Voice input error: ${event.error}`);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [setValue]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const nextImages = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
      }));

    setUploadedImages((current) => [...current, ...nextImages]);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setUploadedImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleProfileSaved = (savedProfile) => {
    setProfile(savedProfile);
    setIsEditingProfile(false);
    setError(null);
  };

  const resetFollowUpState = () => {
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setDraftSubmission(null);
  };

  const submitAssessment = async (submission, followUpResponses = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("symptoms", submission.symptoms);
      formData.append("duration", submission.duration);
      formData.append("severity", submission.severity);
      formData.append("followUpResponses", JSON.stringify(followUpResponses));
      uploadedImages.forEach((image) => formData.append("images", image.file));

      await symptomAPI.submitSymptoms(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetFollowUpState();
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.code === "PATIENT_PROFILE_REQUIRED") {
        setIsEditingProfile(true);
        await fetchProfile();
      }
      setError(
        err.response?.data?.message ||
          "Failed to submit symptoms. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!profile?.profileComplete) {
      setError("Complete the patient profile before starting a new assessment.");
      setIsEditingProfile(true);
      return;
    }

    setIsPreparingFollowUps(true);
    setError(null);
    try {
      const response = await symptomAPI.getFollowUpQuestions(data);
      const nextQuestions = Array.isArray(response.data?.data?.questions)
        ? response.data.data.questions.slice(0, 15)
        : [];

      setDraftSubmission(data);

      if (nextQuestions.length === 0) {
        await submitAssessment(data, []);
        return;
      }

      setFollowUpQuestions(nextQuestions);
      setFollowUpAnswers(
        nextQuestions.reduce((accumulator, question) => {
          accumulator[question.id] = "";
          return accumulator;
        }, {})
      );
    } catch (err) {
      if (err.response?.data?.code === "PATIENT_PROFILE_REQUIRED") {
        setIsEditingProfile(true);
        await fetchProfile();
      }
      setError(
        err.response?.data?.message ||
          "Failed to submit symptoms. Please try again."
      );
    } finally {
      setIsPreparingFollowUps(false);
    }
  };

  const handleFollowUpAnswer = (questionId, answer) => {
    setFollowUpAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

  const handleEditSymptoms = () => {
    resetFollowUpState();
    setError(null);
  };

  const handleCompleteAssessment = async () => {
    if (!draftSubmission) {
      setError("Please complete the symptom details before continuing.");
      return;
    }

    const unansweredQuestion = followUpQuestions.find(
      (question) => !followUpAnswers[question.id]
    );

    if (unansweredQuestion) {
      setError("Please answer every follow-up question before finishing the assessment.");
      return;
    }

    const followUpResponses = followUpQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: followUpAnswers[question.id],
    }));

    await submitAssessment(draftSubmission, followUpResponses);
  };

  const answeredFollowUps = followUpQuestions.filter(
    (question) => Boolean(followUpAnswers[question.id])
  ).length;
  const isFollowUpStep = followUpQuestions.length > 0 && Boolean(draftSubmission);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in space-y-8">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-linear-to-r from-med-dark to-slate-800 p-8 sm:p-12 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Symptom Assessment
            </h1>
            <p className="text-slate-300 text-lg max-w-3xl">
              New assessments now start with a structured patient profile so the
              CDSS can use demographics, medication history, allergies, provenance,
              FHIR-aligned data, and timestamps before symptoms are analyzed.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-sm font-medium flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {profileLoading ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center text-med-muted">
          Loading patient profile...
        </div>
      ) : !profile?.profileComplete || isEditingProfile ? (
        <PatientProfileIntake
          initialProfile={profile}
          onSaved={handleProfileSaved}
          onCancelEdit={profile?.profileComplete ? () => setIsEditingProfile(false) : undefined}
          isEditing={Boolean(profile?.profileComplete && isEditingProfile)}
        />
      ) : null}

      {profile?.profileComplete && !isEditingProfile && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-12">
            {isFollowUpStep ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                        Follow-up questions
                      </div>
                      <h2 className="text-2xl font-bold text-med-dark">
                        Answer a few quick follow-up questions
                      </h2>
                      <p className="max-w-3xl text-sm text-slate-600">
                        These questions are tailored to your symptom description and
                        help clarify non-critical concerns before the assessment is
                        completed. Please answer all {followUpQuestions.length} using
                        Yes, No, or I don&apos;t know.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEditSymptoms}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Edit symptom details
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Symptoms
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{draftSubmission?.symptoms}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Duration
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{draftSubmission?.duration}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Severity
                      </div>
                      <p className="mt-2 text-sm capitalize text-slate-700">{draftSubmission?.severity}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-500">
                    {answeredFollowUps} of {followUpQuestions.length} follow-up questions answered
                  </div>
                </div>

                <div className="space-y-4">
                  {followUpQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
                    >
                      <div className="mb-4 text-sm font-semibold text-blue-700">
                        Question {index + 1}
                      </div>
                      <h3 className="text-lg font-bold text-med-dark">
                        {question.question}
                      </h3>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {FOLLOW_UP_OPTIONS.map((option) => {
                          const isSelected = followUpAnswers[question.id] === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFollowUpAnswer(question.id, option.value)}
                              className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                                isSelected
                                  ? "border-med-primary bg-blue-50 text-med-dark shadow-sm"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Follow-up questions are capped at 15 and are skipped for more
                    urgent symptom patterns.
                  </p>
                  <button
                    type="button"
                    onClick={handleCompleteAssessment}
                    disabled={isLoading}
                    className="px-8 py-4 bg-med-primary text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? "Submitting..." : <>Complete Assessment <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-lg font-bold text-med-dark block">
                    1. What symptoms are you experiencing?
                  </label>
                  <p className="text-sm text-med-muted">
                    You can type, use voice input, or upload images. Be as specific
                    as possible.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 ${
                        isRecording
                          ? "bg-red-500 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isRecording ? "Stop voice input" : "Start voice input"}
                    </button>
                    {isRecording && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl text-red-600 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Recording...
                      </div>
                    )}
                  </div>

                  <textarea
                    {...register("symptoms")}
                    rows="4"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-300 resize-none focus:outline-none focus:ring-4 focus:ring-med-primary/20"
                    placeholder="Describe your symptoms here..."
                  />
                  {errors.symptoms && (
                    <p className="text-sm text-red-500 font-medium">{errors.symptoms.message}</p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-med-dark mb-2">
                      Add images (optional)
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-5 h-5" />
                      Upload symptom images
                    </button>
                    {uploadedImages.length > 0 && (
                      <div className="mt-4 grid sm:grid-cols-3 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={`${image.name}-${index}`} className="rounded-2xl border border-slate-200 p-3">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-28 object-cover rounded-xl"
                            />
                            <div className="flex items-center justify-between gap-3 mt-3">
                              <span className="text-xs text-slate-500 truncate">{image.name}</span>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="text-xs text-red-600 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-lg font-bold text-med-dark block mb-3">
                      2. How long have you had these symptoms?
                    </label>
                    <select
                      {...register("duration")}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-med-primary/20"
                    >
                      <option value="">Select duration...</option>
                      <option value="Just started (less than a day)">Just started (less than a day)</option>
                      <option value="1-3 days">1-3 days</option>
                      <option value="4-7 days">4-7 days</option>
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="More than 2 weeks">More than 2 weeks</option>
                    </select>
                    {errors.duration && (
                      <p className="text-sm text-red-500 font-medium mt-2">{errors.duration.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-lg font-bold text-med-dark block mb-3">
                      3. How severe are your symptoms?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["mild", "moderate", "severe"].map((level) => (
                        <label key={level} className="cursor-pointer">
                          <input type="radio" value={level} {...register("severity")} className="sr-only peer" />
                          <div className="rounded-2xl border-2 border-slate-200 px-4 py-4 text-center capitalize font-semibold peer-checked:border-med-primary peer-checked:bg-blue-50">
                            {level}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.severity && (
                      <p className="text-sm text-red-500 font-medium mt-2">{errors.severity.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Non-critical assessments may include up to 15 follow-up questions
                    before analysis is completed.
                  </p>
                  <button
                    type="submit"
                    disabled={isPreparingFollowUps || isLoading}
                    className="px-8 py-4 bg-med-primary text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {isPreparingFollowUps ? "Preparing questions..." : <>Continue Assessment <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
