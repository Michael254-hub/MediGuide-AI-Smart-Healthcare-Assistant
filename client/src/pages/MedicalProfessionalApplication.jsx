import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BadgeCheck,
  BriefcaseMedical,
  FileText,
  GraduationCap,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { professionalApplicationAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const roleOptions = [
  { value: "general_practitioner", label: "General Practitioner" },
  { value: "specialist_physician", label: "Specialist Physician" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "mental_health_professional", label: "Mental Health Professional" },
  { value: "nutrition_specialist", label: "Nutrition Specialist" },
  { value: "physiotherapist", label: "Physiotherapist" },
];

const roleValues = roleOptions.map((option) => option.value);
const roleLabels = Object.fromEntries(roleOptions.map((option) => [option.value, option.label]));
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
  workExperienceSummary: z
    .string()
    .trim()
    .min(40, "Please provide a fuller work experience summary"),
  specialties: z.array(z.string()).min(1, "Add at least one specialty"),
  supportingDocuments: z.array(z.string()).optional(),
  professionalStatement: z.string().trim().optional(),
});

const defaultValues = {
  desiredRole: "general_practitioner",
  licenseNumber: "",
  licensingAuthority: "",
  licenseJurisdiction: "",
  licenseExpiryDate: "",
  educationInstitution: "",
  educationQualification: "",
  educationGraduationYear: "",
  yearsOfExperience: "",
  currentEmployer: "",
  workExperienceSummary: "",
  specialties: [],
  supportingDocuments: [],
  professionalStatement: "",
};

const statusStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const validationErrors = error.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.map((item) => item.message).join(", ");
  }

  return error.response?.data?.message || fallbackMessage;
};

const toFormValues = (application) => ({
  desiredRole: application?.desiredRole || defaultValues.desiredRole,
  licenseNumber: application?.licenseNumber || "",
  licensingAuthority: application?.licensingAuthority || "",
  licenseJurisdiction: application?.licenseJurisdiction || "",
  licenseExpiryDate: application?.licenseExpiryDate || "",
  educationInstitution: application?.educationInstitution || "",
  educationQualification: application?.educationQualification || "",
  educationGraduationYear: application?.educationGraduationYear || "",
  yearsOfExperience: application?.yearsOfExperience || "",
  currentEmployer: application?.currentEmployer || "",
  workExperienceSummary: application?.workExperienceSummary || "",
  specialties: application?.specialties || [],
  supportingDocuments: application?.supportingDocuments || [],
  professionalStatement: application?.professionalStatement || "",
});

const ListBadge = ({ value, onRemove }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
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

export default function MedicalProfessionalApplication() {
  const user = useAuthStore((state) => state.user);
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [pageMessage, setPageMessage] = useState(null);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues,
  });

  const specialties = watch("specialties");
  const supportingDocuments = watch("supportingDocuments");
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

  const addListItem = (fieldName, value, setter, maxItems) => {
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

  const removeListItem = (fieldName, itemToRemove) => {
    const currentValues = watch(fieldName) || [];
    setValue(
      fieldName,
      currentValues.filter((item) => item !== itemToRemove),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const onSubmit = async (data) => {
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
          : "Your application has been updated."
      );
    } catch (error) {
      console.error("Professional application submission failed:", error);
      setPageError(
        getApiErrorMessage(
          error,
          "We could not submit the professional application. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-med-primary" />
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-med-dark">Medical Professional Applications</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Administrator accounts do not submit role applications. Review incoming
            applications from the admin dashboard instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="bg-linear-to-r from-med-dark via-slate-800 to-slate-700 px-8 py-10 text-white sm:px-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Stethoscope className="h-3.5 w-3.5" />
            Human Medical Guidance
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Apply for a verified professional role
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-300 sm:text-lg">
            Submit the license, education, and work experience details an admin needs
            to verify you before approving you to provide human medical guidance.
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
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${statusStyles[application.status] || statusStyles.pending}`}
              >
                {application.status}
              </span>
              <span className="text-sm font-medium text-slate-500">
                Submitted {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {application.approvedRole
                ? `${roleLabels[application.approvedRole] || application.approvedRole} approved`
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

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Reviewer notes
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {application.reviewerNotes || "No reviewer notes yet."}
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
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
                    ? roleLabels[application.approvedRole] || application.approvedRole
                    : "Pending decision"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <fieldset
          disabled={applicationLocked || isSubmitting}
          className="space-y-8 disabled:opacity-80"
        >
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <BriefcaseMedical className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Role and license verification</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell us which role you want to fill and the license details an admin should verify.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <FormField label="Desired role" error={errors.desiredRole?.message}>
                <select
                  {...register("desiredRole")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="License number" error={errors.licenseNumber?.message}>
                <input
                  type="text"
                  {...register("licenseNumber")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="Enter your professional registration number"
                />
              </FormField>

              <FormField label="Licensing authority" error={errors.licensingAuthority?.message}>
                <input
                  type="text"
                  {...register("licensingAuthority")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="e.g. national medical, nursing, or pharmacy board"
                />
              </FormField>

              <FormField label="License jurisdiction" error={errors.licenseJurisdiction?.message}>
                <input
                  type="text"
                  {...register("licenseJurisdiction")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="Country, state, or region"
                />
              </FormField>

              <FormField label="License expiry date" error={errors.licenseExpiryDate?.message}>
                <input
                  type="date"
                  {...register("licenseExpiryDate")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                />
              </FormField>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Education and qualifications</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add the training details admins should review alongside your license.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <FormField label="Institution" error={errors.educationInstitution?.message}>
                <input
                  type="text"
                  {...register("educationInstitution")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="University or training institution"
                />
              </FormField>

              <FormField label="Qualification" error={errors.educationQualification?.message}>
                <input
                  type="text"
                  {...register("educationQualification")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="Degree, diploma, residency, or certification"
                />
              </FormField>

              <FormField
                label="Graduation year"
                error={errors.educationGraduationYear?.message}
              >
                <input
                  type="number"
                  {...register("educationGraduationYear")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="e.g. 2018"
                />
              </FormField>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Work experience</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Give the admin enough context to validate your clinical background.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <FormField label="Years of experience" error={errors.yearsOfExperience?.message}>
                <input
                  type="number"
                  {...register("yearsOfExperience")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="Total professional years"
                />
              </FormField>

              <FormField label="Current employer">
                <input
                  type="text"
                  {...register("currentEmployer")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                  placeholder="Hospital, clinic, or practice"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField
                  label="Work experience summary"
                  error={errors.workExperienceSummary?.message}
                >
                  <textarea
                    rows={5}
                    {...register("workExperienceSummary")}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                    placeholder="Describe your relevant clinical work, populations served, and the type of guidance you are qualified to provide."
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Specialties and supporting references</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add specialties and any document links or reference identifiers that support verification.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <FormField label="Specialties" error={errors.specialties?.message}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={specialtyInput}
                      onChange={(event) => setSpecialtyInput(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                      placeholder="e.g. telemedicine triage"
                    />
                    <button
                      type="button"
                      onClick={() => addListItem("specialties", specialtyInput, setSpecialtyInput, 10)}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add
                    </button>
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
                    <input
                      type="text"
                      value={documentInput}
                      onChange={(event) => setDocumentInput(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                      placeholder="Portfolio URL, license registry entry, or document reference"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addListItem("supportingDocuments", documentInput, setDocumentInput, 6)
                      }
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add
                    </button>
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
                <FormField label="Professional statement">
                  <textarea
                    rows={4}
                    {...register("professionalStatement")}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-med-primary focus:outline-none focus:ring-4 focus:ring-med-primary/15"
                    placeholder="Optional: explain why you want to support patients through verified human guidance."
                  />
                </FormField>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ready for admin review</h3>
            <p className="mt-1 text-sm text-slate-500">
              {applicationLocked
                ? "This record is locked because the application has already been approved."
                : "Submitting will place your application in the admin verification queue."}
            </p>
          </div>

          {!applicationLocked && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-med-primary px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-med-secondary disabled:opacity-70"
            >
              <BadgeCheck className="h-4 w-4" />
              {isSubmitting
                ? "Submitting..."
                : application?.status === "rejected"
                  ? "Resubmit application"
                  : application
                    ? "Update application"
                    : "Submit application"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}
