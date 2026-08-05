import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Activity, ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { patientProfileAPI, symptomAPI } from "../services/api";
import PatientProfileIntake from "../components/PatientProfileIntake";
import { WizardProgress, type WizardStepDef } from "../components/symptomWizard/WizardProgress";
import { SymptomsStep } from "../components/symptomWizard/SymptomsStep";
import { DurationStep } from "../components/symptomWizard/DurationStep";
import { SeverityStep } from "../components/symptomWizard/SeverityStep";
import { FollowUpStep } from "../components/symptomWizard/FollowUpStep";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { fadeIn } from "../lib/motion";
import type { PatientProfileDetails } from "../types/patientProfile";
import type { DraftSubmission, FollowUpQuestion, UploadedImage } from "../types/symptomWizard";

const submitSymptomSchema = z.object({
  symptoms: z.string().min(5, "Please describe your symptoms in more detail"),
  duration: z.string().min(1, "Please select how long you have had these symptoms"),
  severity: z.enum(["mild", "moderate", "severe"], "Please select a severity level"),
});

type FormValues = z.infer<typeof submitSymptomSchema>;

const WIZARD_STEPS: WizardStepDef[] = [
  { id: "profile", label: "Profile" },
  { id: "symptoms", label: "Symptoms" },
  { id: "duration", label: "Duration" },
  { id: "severity", label: "Severity" },
  { id: "followup", label: "Follow-up" },
];

const FORM_STEP_ORDER = ["symptoms", "duration", "severity"] as const;
type FormStep = (typeof FORM_STEP_ORDER)[number];

interface EditProfileLocationState {
  editProfile?: boolean;
}

export default function SubmitSymptoms() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparingFollowUps, setIsPreparingFollowUps] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfileDetails | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [draftSubmission, setDraftSubmission] = useState<DraftSubmission | null>(null);
  const [formStep, setFormStep] = useState<FormStep>("symptoms");
  const navigate = useNavigate();
  const location = useLocation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const symptomsRef = useRef("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(submitSymptomSchema),
    defaultValues: { symptoms: "", duration: "", severity: "mild" },
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
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message || "Failed to load the patient profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const state = location.state as EditProfileLocationState | null;
    if (state?.editProfile) {
      setIsEditingProfile(true);
    }
  }, [location.state]);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return undefined;
    }

    const recognition = new SpeechRecognitionCtor();
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

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const nextImages: UploadedImage[] = files
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

  const removeImage = (index: number) => {
    setUploadedImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleProfileSaved = (savedProfile: PatientProfileDetails) => {
    setProfile(savedProfile);
    setIsEditingProfile(false);
    setError(null);
  };

  const resetFollowUpState = () => {
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setDraftSubmission(null);
  };

  const submitAssessment = async (
    submission: DraftSubmission,
    followUpResponses: { id: string; question: string; answer: string }[] = [],
  ) => {
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
      if (axios.isAxiosError(err) && err.response?.data?.code === "PATIENT_PROFILE_REQUIRED") {
        setIsEditingProfile(true);
        await fetchProfile();
      }
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message || "Failed to submit symptoms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!profile?.profileComplete) {
      setError("Complete the patient profile before starting a new assessment.");
      setIsEditingProfile(true);
      return;
    }

    setIsPreparingFollowUps(true);
    setError(null);
    try {
      const response = await symptomAPI.getFollowUpQuestions(data);
      const nextQuestions: FollowUpQuestion[] = Array.isArray(response.data?.data?.questions)
        ? response.data.data.questions.slice(0, 15)
        : [];

      setDraftSubmission(data);

      if (nextQuestions.length === 0) {
        await submitAssessment(data, []);
        return;
      }

      setFollowUpQuestions(nextQuestions);
      setFollowUpAnswers(
        nextQuestions.reduce<Record<string, string>>((accumulator, question) => {
          accumulator[question.id] = "";
          return accumulator;
        }, {}),
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.code === "PATIENT_PROFILE_REQUIRED") {
        setIsEditingProfile(true);
        await fetchProfile();
      }
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message || "Failed to submit symptoms. Please try again.");
    } finally {
      setIsPreparingFollowUps(false);
    }
  };

  const handleFollowUpAnswer = (questionId: string, answer: string) => {
    setFollowUpAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

  const handleEditSymptoms = () => {
    resetFollowUpState();
    setError(null);
    setFormStep("symptoms");
  };

  const handleCompleteAssessment = async () => {
    if (!draftSubmission) {
      setError("Please complete the symptom details before continuing.");
      return;
    }

    const unansweredQuestion = followUpQuestions.find((question) => !followUpAnswers[question.id]);

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

  const isFollowUpStep = followUpQuestions.length > 0 && Boolean(draftSubmission);

  const goToNextFormStep = async () => {
    setError(null);
    if (formStep === "symptoms") {
      const valid = await trigger("symptoms");
      if (valid) setFormStep("duration");
      return;
    }
    if (formStep === "duration") {
      const valid = await trigger("duration");
      if (valid) setFormStep("severity");
    }
  };

  const goToPreviousFormStep = () => {
    setError(null);
    if (formStep === "severity") setFormStep("duration");
    else if (formStep === "duration") setFormStep("symptoms");
  };

  const currentStepId = profileLoading
    ? "profile"
    : !profile?.profileComplete || isEditingProfile
      ? "profile"
      : isFollowUpStep
        ? "followup"
        : formStep;

  const profileCompleted = Boolean(profile?.profileComplete && !isEditingProfile);
  const formStepIndex = FORM_STEP_ORDER.indexOf(formStep);
  const completedStepIds = [
    ...(profileCompleted ? ["profile"] : []),
    ...FORM_STEP_ORDER.filter((_step, index) => {
      if (isFollowUpStep) return true;
      return profileCompleted && index < formStepIndex;
    }),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-xl">
        <div className="relative bg-linear-to-r from-slate-900 to-slate-800 p-8 text-white sm:p-12">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <Activity className="size-48" />
          </div>
          <div className="relative z-10">
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Symptom Assessment
            </h1>
            <p className="max-w-3xl text-lg text-slate-300">
              A guided, step-by-step assessment: your profile, symptoms, duration, and severity,
              followed by a few clarifying questions before MediGuide analyzes your responses.
            </p>
          </div>
        </div>
      </div>

      <WizardProgress steps={WIZARD_STEPS} currentStepId={currentStepId} completedStepIds={completedStepIds} />

      {error && (
        <Alert variant="danger">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {profileLoading ? (
        <div className="rounded-3xl border border-brand-border bg-white p-10 text-center text-brand-text-muted shadow-sm">
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
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-xl"
        >
          <div className="p-8 sm:p-12">
            {isFollowUpStep ? (
              <FollowUpStep
                draftSubmission={draftSubmission}
                followUpQuestions={followUpQuestions}
                followUpAnswers={followUpAnswers}
                onAnswer={handleFollowUpAnswer}
                onEditSymptoms={handleEditSymptoms}
                onComplete={handleCompleteAssessment}
                isSubmitting={isLoading}
              />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {formStep === "symptoms" && (
                  <SymptomsStep
                    register={register}
                    errors={errors}
                    isRecording={isRecording}
                    onToggleVoiceRecording={toggleVoiceRecording}
                    uploadedImages={uploadedImages}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                    imageInputRef={imageInputRef}
                  />
                )}
                {formStep === "duration" && <DurationStep register={register} errors={errors} />}
                {formStep === "severity" && <SeverityStep register={register} errors={errors} />}

                <div className="flex flex-col gap-4 border-t border-brand-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {formStep !== "symptoms" ? (
                    <Button type="button" variant="outline" onClick={goToPreviousFormStep} leftIcon={<ArrowLeft className="size-4" />}>
                      Back
                    </Button>
                  ) : (
                    <p className="text-sm text-brand-text-muted">
                      Non-critical assessments may include up to 15 follow-up questions before
                      analysis is completed.
                    </p>
                  )}

                  {formStep === "severity" ? (
                    <Button
                      type="submit"
                      size="lg"
                      loading={isPreparingFollowUps}
                      rightIcon={!isPreparingFollowUps ? <ArrowRight className="size-5" /> : undefined}
                    >
                      {isPreparingFollowUps ? "Preparing questions..." : "Continue Assessment"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      onClick={goToNextFormStep}
                      rightIcon={<ArrowRight className="size-5" />}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
