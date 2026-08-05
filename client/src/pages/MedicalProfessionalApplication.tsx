import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  BadgeCheck,
  BriefcaseMedical,
  FileText,
  GraduationCap,
  Loader2,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { professionalApplicationAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import type { ProfessionalApplication } from "../types/admin";

const roleOptions = [
  { value: "general_practitioner", label: "General Practitioner" },
  { value: "specialist_physician", label: "Specialist Physician" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "mental_health_professional", label: "Mental Health Professional" },
  { value: "nutrition_specialist", label: "Nutrition Specialist" },
  { value: "physiotherapist", label: "Physiotherapist" },
] as const;

const roleValues = roleOptions.map((option) => option.value) as [string, ...string[]];
const roleLabels: Record<string, string> = Object.fromEntries(
  roleOptions.map((option) => [option.value, option.label]),
);
const currentYear = new Date().getUTCFullYear();

const applicationSchema = z.object({
  desiredRole: z.enum(roleValues),
  licenseNumber: z.string().trim().min(3, "License number is required"),
  licensingAuthority: z.string().trim().min(2, "Licensing authority is required"),
  licenseJurisdiction: z.string().trim().min(2, "License jurisdiction is required"),
  licenseExpiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for the license expiry date"),
  educationInstitution: z.string().trim().min(2, "Education institution is required"),
  educationQualification: z.string().trim().min(2, "Qualification is required"),
  educationGraduationYear: z.coerce
    .number()
    .int()
    .min(1950, "Graduation year must be 1950 or later")
    .max(currentYear + 1, `Graduation year cannot be later than ${currentYear + 1}`),
  yearsOfExperience: z.coerce
    .number()
    .int()
    .min(0, "Years of experience cannot be negative")
    .max(60, "Years of experience must be 60 or fewer"),
  currentEmployer: z.string().trim().optional(),
  workExperienceSummary: z.string().trim().min(40, "Please provide a fuller work experience summary"),
  specialties: z.array(z.string()).min(1, "Add at least one specialty"),
  supportingDocuments: z.array(z.string()).optional(),
  professionalStatement: z.string().trim().optional(),
});

type FormInput = z.input<typeof applicationSchema>;
type FormValues = z.output<typeof applicationSchema>;

const defaultValues: FormInput = {
  desiredRole: "general_practitioner",
  licenseNumber: "",
  licensingAuthority: "",
  licenseJurisdiction: "",
  licenseExpiryDate: "",
  educationInstitution: "",
  educationQualification: "",
  educationGraduationYear: "" as unknown as number,
  yearsOfExperience: "" as unknown as number,
  currentEmployer: "",
  workExperienceSummary: "",
  specialties: [],
  supportingDocuments: [],
  professionalStatement: "",
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const validationErrors = error.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.map((item: { message: string }) => item.message).join(", ");
  }

  return error.response?.data?.message || fallbackMessage;
};

const toFormValues = (application?: ProfessionalApplication | null): FormInput => ({
  desiredRole: application?.desiredRole || defaultValues.desiredRole,
  licenseNumber: application?.licenseNumber || "",
  licensingAuthority: application?.licensingAuthority || "",
  licenseJurisdiction: application?.licenseJurisdiction || "",
  licenseExpiryDate: application?.licenseExpiryDate || "",
  educationInstitution: application?.educationInstitution || "",
  educationQualification: application?.educationQualification || "",
  educationGraduationYear:
    (application?.educationGraduationYear as number | undefined) ?? ("" as unknown as number),
  yearsOfExperience: (application?.yearsOfExperience as number | undefined) ?? ("" as unknown as number),
  currentEmployer: application?.currentEmployer || "",
  workExperienceSummary: application?.workExperienceSummary || "",
  specialties: application?.specialties || [],
  supportingDocuments: application?.supportingDocuments || [],
  professionalStatement: application?.professionalStatement || "",
});

const ListBadge = ({ value, onRemove }: { value: string; onRemove?: () => void }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-sm font-medium text-brand-text">
    {value}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
      >
        Remove
      </button>
    )}
  </span>
);

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-text">{label}</label>
      {children}
      {error && <p className="mt-2 text-sm font-medium text-brand-danger">{error}</p>}
    </div>
  );
}

export default function MedicalProfessionalApplication() {
  const user = useAuthStore((state) => state.user);
  const [application, setApplication] = useState<ProfessionalApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
  });

  const specialties = watch("specialties") || [];
  const supportingDocuments = watch("supportingDocuments") || [];
  const applicationLocked = application?.status === "approved";

  useEffect(() => {
    const loadApplication = async () => {
      try {
        setIsLoading(true);
        const response = await professionalApplicationAPI.getMine();
        const existingApplication = response.data.data;
        setApplication(existingApplication);
        reset(toFormValues(existingApplication));
      } catch (error) {
        console.error("Failed to load professional application:", error);
        setPageError("Unable to load your professional application right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadApplication();
  }, [reset]);

  const addListItem = (
    fieldName: "specialties" | "supportingDocuments",
    value: string,
    setter: (value: string) => void,
    maxItems: number,
  ) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    const currentValues = watch(fieldName) || [];
    if (currentValues.includes(trimmedValue) || currentValues.length >= maxItems) {
      setter("");
      return;
    }

    setValue(fieldName, [...currentValues, trimmedValue], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setter("");
  };

  const removeListItem = (
    fieldName: "specialties" | "supportingDocuments",
    itemToRemove: string,
  ) => {
    const currentValues = watch(fieldName) || [];
    setValue(
      fieldName,
      currentValues.filter((item) => item !== itemToRemove),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const onSubmit = async (data: FormValues) => {
    setPageError(null);
    setPageMessage(null);
    setIsSubmitting(true);

    try {
      const response = await professionalApplicationAPI.submit(data);
      const savedApplication = response.data.data;
      setApplication(savedApplication);
      reset(toFormValues(savedApplication));
      setPageMessage(
        savedApplication.status === "pending"
          ? "Your application has been submitted for admin verification."
          : "Your application has been updated.",
      );
    } catch (error) {
      console.error("Professional application submission failed:", error);
      setPageError(
        getApiErrorMessage(error, "We could not submit the professional application. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-14 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-brand-border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-brand-text">Medical Professional Applications</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Administrator accounts do not submit role applications. Review incoming applications
            from the admin dashboard instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-xl">
        <div className="bg-linear-to-r from-brand-primary via-slate-800 to-slate-700 px-8 py-10 text-white sm:px-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Stethoscope className="h-3.5 w-3.5" />
            Human Medical Guidance
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Apply for a verified professional role
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-300 sm:text-lg">
            Submit the license, education, and work experience details an admin needs to verify
            you before approving you to provide human medical guidance.
          </p>
        </div>
      </div>

      {(pageError || pageMessage) && (
        <div className="mt-6 space-y-3">
          {pageError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{pageError}</span>
            </div>
          )}
          {pageMessage && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{pageMessage}</span>
            </div>
          )}
        </div>
      )}

      {application && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${statusStyles[application.status] || statusStyles.pending}`}
              >
                {application.status}
              </span>
              {application.createdAt && (
                <span className="text-sm font-medium text-brand-text-muted">
                  Submitted {new Date(application.createdAt as string).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-xl font-bold text-brand-text">
              {application.approvedRole
                ? `${roleLabels[application.approvedRole as string] || application.approvedRole} approved`
                : `${roleLabels[application.desiredRole] || application.desiredRole} requested`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {application.status === "pending" &&
                "Your application is queued for admin verification. You can still update it while it is pending."}
              {application.status === "approved" &&
                "Your credentials have been approved. The form is now locked to preserve the verified record."}
              {application.status === "rejected" &&
                "Your application was reviewed but not approved. Update the missing details and resubmit when ready."}
            </p>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
              Reviewer notes
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {application.reviewerNotes || "No reviewer notes yet."}
            </p>
            <div className="mt-4 space-y-2 text-sm text-brand-text-muted">
              <div>
                Reviewed:{" "}
                <span className="font-medium text-slate-700">
                  {application.reviewedAt
                    ? new Date(application.reviewedAt).toLocaleString()
                    : "Not yet reviewed"}
                </span>
              </div>
              <div>
                Approved role:{" "}
                <span className="font-medium text-slate-700">
                  {application.approvedRole
                    ? roleLabels[application.approvedRole as string] || application.approvedRole
                    : "Pending decision"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <fieldset disabled={applicationLocked || isSubmitting} className="space-y-8 disabled:opacity-80">
          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                <BriefcaseMedical className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">Role and license verification</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Tell us which role you want to fill and the license details an admin should verify.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Select label="Desired role" {...register("desiredRole")}>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="License number"
                type="text"
                placeholder="Enter your professional registration number"
                error={errors.licenseNumber?.message}
                {...register("licenseNumber")}
              />

              <Input
                label="Licensing authority"
                type="text"
                placeholder="e.g. national medical, nursing, or pharmacy board"
                error={errors.licensingAuthority?.message}
                {...register("licensingAuthority")}
              />

              <Input
                label="License jurisdiction"
                type="text"
                placeholder="Country, state, or region"
                error={errors.licenseJurisdiction?.message}
                {...register("licenseJurisdiction")}
              />

              <Input
                label="License expiry date"
                type="date"
                error={errors.licenseExpiryDate?.message}
                {...register("licenseExpiryDate")}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">Education and qualifications</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Add the training details admins should review alongside your license.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Input
                label="Institution"
                type="text"
                placeholder="University or training institution"
                error={errors.educationInstitution?.message}
                {...register("educationInstitution")}
              />

              <Input
                label="Qualification"
                type="text"
                placeholder="Degree, diploma, residency, or certification"
                error={errors.educationQualification?.message}
                {...register("educationQualification")}
              />

              <Input
                label="Graduation year"
                type="number"
                placeholder="e.g. 2018"
                error={errors.educationGraduationYear?.message}
                {...register("educationGraduationYear")}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">Work experience</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Give the admin enough context to validate your clinical background.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Input
                label="Years of experience"
                type="number"
                placeholder="Total professional years"
                error={errors.yearsOfExperience?.message}
                {...register("yearsOfExperience")}
              />

              <Input
                label="Current employer"
                type="text"
                placeholder="Hospital, clinic, or practice"
                {...register("currentEmployer")}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Work experience summary"
                  rows={5}
                  placeholder="Describe your relevant clinical work, populations served, and the type of guidance you are qualified to provide."
                  error={errors.workExperienceSummary?.message}
                  {...register("workExperienceSummary")}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">
                  Specialties and supporting references
                </h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Add specialties and any document links or reference identifiers that support
                  verification.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <FormField label="Specialties" error={errors.specialties?.message}>
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      containerClassName="flex-1"
                      value={specialtyInput}
                      onChange={(event) => setSpecialtyInput(event.target.value)}
                      placeholder="e.g. telemedicine triage"
                    />
                    <Button
                      type="button"
                      onClick={() => addListItem("specialties", specialtyInput, setSpecialtyInput, 10)}
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      Add
                    </Button>
                  </div>
                </FormField>
                <div className="mt-4 flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <ListBadge
                      key={specialty}
                      value={specialty}
                      onRemove={() => removeListItem("specialties", specialty)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <FormField label="Supporting document references">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      containerClassName="flex-1"
                      value={documentInput}
                      onChange={(event) => setDocumentInput(event.target.value)}
                      placeholder="Portfolio URL, license registry entry, or document reference"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        addListItem("supportingDocuments", documentInput, setDocumentInput, 6)
                      }
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      Add
                    </Button>
                  </div>
                </FormField>
                <div className="mt-4 flex flex-wrap gap-2">
                  {supportingDocuments.map((documentReference) => (
                    <ListBadge
                      key={documentReference}
                      value={documentReference}
                      onRemove={() => removeListItem("supportingDocuments", documentReference)}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2">
                <Textarea
                  label="Professional statement"
                  rows={4}
                  placeholder="Optional: explain why you want to support patients through verified human guidance."
                  {...register("professionalStatement")}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-text">Ready for admin review</h3>
            <p className="mt-1 text-sm text-brand-text-muted">
              {applicationLocked
                ? "This record is locked because the application has already been approved."
                : "Submitting will place your application in the admin verification queue."}
            </p>
          </div>

          {!applicationLocked && (
            <Button type="submit" loading={isSubmitting} leftIcon={<BadgeCheck className="h-4 w-4" />}>
              {isSubmitting
                ? "Submitting..."
                : application?.status === "rejected"
                  ? "Resubmit application"
                  : application
                    ? "Update application"
                    : "Submit application"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
