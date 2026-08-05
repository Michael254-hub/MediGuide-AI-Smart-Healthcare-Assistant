import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import { patientProfileAPI } from "../services/api";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Alert } from "./ui/Alert";
import type { PatientProfileDetails } from "../types/patientProfile";

const sources = [
  "patient-reported",
  "caregiver-reported",
  "clinician-documented",
  "pharmacy-record",
  "ehr-import",
  "lab-result",
  "device-reported",
] as const;

const schema = z
  .object({
    demographics: z.object({
      age: z.coerce.number().int().min(0).max(120),
      sexAtBirth: z.enum(["male", "female", "intersex", "unknown"]),
      dataSource: z.enum(sources),
      recordedAt: z.string().optional(),
    }),
    medications: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Medication name is required"),
          category: z.enum(["prescription", "otc", "herbal", "supplement"]),
          dosage: z.string().optional(),
          frequency: z.string().optional(),
          route: z.string().optional(),
          indication: z.string().optional(),
          startDate: z.string().optional(),
          dataSource: z.enum(sources),
          isCurrent: z.boolean(),
          recordedAt: z.string().optional(),
        }),
      )
      .default([]),
    allergies: z
      .array(
        z.object({
          substance: z.string().trim().min(1, "Substance is required"),
          reactionType: z.enum(["allergy", "intolerance", "side-effect"]),
          severity: z.enum(["mild", "moderate", "severe", "life-threatening"]),
          category: z.enum(["food", "medication", "environment", "biologic", "other"]),
          manifestations: z.string().optional(),
          onset: z.enum(["immediate", "delayed", "unknown"]),
          onsetDate: z.string().optional(),
          dataSource: z.enum(sources),
          verifiedByClinician: z.boolean(),
          recordedAt: z.string().optional(),
        }),
      )
      .default([]),
    attestations: z.object({
      noCurrentMedications: z.boolean(),
      noKnownAllergies: z.boolean(),
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.attestations.noCurrentMedications && value.medications.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["medications"],
        message: "Add a medication or confirm there are no current medications.",
      });
    }
    if (!value.attestations.noKnownAllergies && value.allergies.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["allergies"],
        message: "Add an allergy/intolerance entry or confirm there are none known.",
      });
    }
  });

/** Shape the form fields hold before submit (zod's `.default([])` makes these optional). */
type FormInput = z.input<typeof schema>;
/** Shape delivered to the submit handler once zodResolver validates/coerces/defaults it. */
type FormValues = z.output<typeof schema>;

/** Array-level zod issues (e.g. superRefine on `medications`/`allergies`) surface with a
 * `.message` at runtime, but react-hook-form's generated array error type doesn't expose
 * it cleanly — this narrows just enough to read it back out. */
const arrayLevelMessage = (error: unknown): string | undefined =>
  (error as { message?: string } | undefined)?.message;

const medicationRow: NonNullable<FormInput["medications"]>[number] = {
  name: "",
  category: "prescription",
  dosage: "",
  frequency: "",
  route: "",
  indication: "",
  startDate: "",
  dataSource: "patient-reported",
  isCurrent: true,
  recordedAt: "",
};

const allergyRow: NonNullable<FormInput["allergies"]>[number] = {
  substance: "",
  reactionType: "allergy",
  severity: "mild",
  category: "medication",
  manifestations: "",
  onset: "unknown",
  onsetDate: "",
  dataSource: "patient-reported",
  verifiedByClinician: false,
  recordedAt: "",
};

const toValues = (profile?: PatientProfileDetails | null): FormInput => ({
  demographics: {
    age: (profile?.demographics?.age as number | undefined) ?? ("" as unknown as number),
    sexAtBirth:
      (profile?.demographics?.sexAtBirth as FormValues["demographics"]["sexAtBirth"]) ?? "unknown",
    dataSource:
      (profile?.demographics?.dataSource as FormValues["demographics"]["dataSource"]) ??
      "patient-reported",
    recordedAt: (profile?.demographics?.recordedAt as string | undefined) ?? "",
  },
  medications:
    (profile?.medications as Record<string, unknown>[] | undefined)?.map((item) => ({
      name: (item.name as string) ?? "",
      category: (item.category as FormValues["medications"][number]["category"]) ?? "prescription",
      dosage: (item.dosage as string) ?? "",
      frequency: (item.frequency as string) ?? "",
      route: (item.route as string) ?? "",
      indication: (item.indication as string) ?? "",
      startDate: (item.startDate as string) ?? "",
      dataSource: (item.dataSource as FormValues["medications"][number]["dataSource"]) ?? "patient-reported",
      isCurrent: (item.isCurrent as boolean) ?? true,
      recordedAt: (item.recordedAt as string) ?? "",
    })) ?? [],
  allergies:
    (profile?.allergies as Record<string, unknown>[] | undefined)?.map((item) => ({
      substance: (item.substance as string) ?? "",
      reactionType: (item.reactionType as FormValues["allergies"][number]["reactionType"]) ?? "allergy",
      severity: (item.severity as FormValues["allergies"][number]["severity"]) ?? "mild",
      category: (item.category as FormValues["allergies"][number]["category"]) ?? "medication",
      manifestations: Array.isArray(item.manifestations) ? item.manifestations.join(", ") : "",
      onset: (item.onset as FormValues["allergies"][number]["onset"]) ?? "unknown",
      onsetDate: (item.onsetDate as string) ?? "",
      dataSource: (item.dataSource as FormValues["allergies"][number]["dataSource"]) ?? "patient-reported",
      verifiedByClinician: (item.verifiedByClinician as boolean) ?? false,
      recordedAt: (item.recordedAt as string) ?? "",
    })) ?? [],
  attestations: {
    noCurrentMedications: (profile?.attestations as Record<string, unknown> | undefined)
      ?.noCurrentMedications as boolean ?? false,
    noKnownAllergies: (profile?.attestations as Record<string, unknown> | undefined)
      ?.noKnownAllergies as boolean ?? false,
  },
});

const FieldError = ({ error }: { error?: string }) =>
  error ? <p className="mt-1 text-sm text-brand-danger">{error}</p> : null;

interface PatientProfileIntakeProps {
  initialProfile?: PatientProfileDetails | null;
  onSaved?: (profile: PatientProfileDetails) => void;
  onCancelEdit?: () => void;
  isEditing?: boolean;
}

export default function PatientProfileIntake({
  initialProfile,
  onSaved,
  onCancelEdit,
  isEditing,
}: PatientProfileIntakeProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initialProfile),
  });
  useEffect(() => {
    reset(toValues(initialProfile));
  }, [initialProfile, reset]);

  const meds = useFieldArray({ control, name: "medications" });
  const allergies = useFieldArray({ control, name: "allergies" });
  const noMeds = watch("attestations.noCurrentMedications");
  const noAllergies = watch("attestations.noKnownAllergies");

  const saveProfile = async (values: FormValues) => {
    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        demographics: values.demographics,
        medications: values.attestations.noCurrentMedications
          ? []
          : values.medications.map((item) => ({
              ...item,
              dosage: item.dosage || undefined,
              frequency: item.frequency || undefined,
              route: item.route || undefined,
              indication: item.indication || undefined,
              startDate: item.startDate || undefined,
              recordedAt: item.recordedAt || undefined,
            })),
        allergies: values.attestations.noKnownAllergies
          ? []
          : values.allergies.map((item) => ({
              ...item,
              manifestations: item.manifestations
                ? item.manifestations
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                : [],
              onsetDate: item.onsetDate || undefined,
              recordedAt: item.recordedAt || undefined,
            })),
        attestations: values.attestations,
      };
      const response = await patientProfileAPI.saveProfile(payload);
      window.dispatchEvent(
        new CustomEvent("patient-profile-updated", { detail: response.data.data }),
      );
      onSaved?.(response.data.data);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setSubmitError(message || "Failed to save patient profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" shadow="md" className="space-y-8 sm:p-10">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-text">Patient Intake Profile</h2>
        <p className="mt-2 text-brand-text-muted">
          Complete this record before a new assessment so MediGuide has demographics,
          medications, allergies, provenance, and timestamps.
        </p>
      </div>

      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <form onSubmit={handleSubmit(saveProfile)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-brand-text">Demographics</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Age"
              type="number"
              min={0}
              max={120}
              error={errors.demographics?.age?.message}
              {...register("demographics.age")}
            />
            <Select label="Sex at birth" {...register("demographics.sexAtBirth")}>
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="intersex">Intersex</option>
            </Select>
            <Select label="Data source" {...register("demographics.dataSource")}>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-brand-text">Medical History</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="size-4" />}
              onClick={() => meds.append({ ...medicationRow })}
              disabled={noMeds}
            >
              Add medication
            </Button>
          </div>
          <label className="flex items-center gap-3 text-sm text-brand-text">
            <input type="checkbox" className="size-4" {...register("attestations.noCurrentMedications")} />
            No current prescriptions, OTC drugs, herbal products, or supplements
          </label>
          <FieldError error={arrayLevelMessage(errors.medications)} />
          {!noMeds &&
            meds.fields.map((field, index) => (
              <div key={field.id} className="grid gap-4 rounded-2xl border border-brand-border p-4 md:grid-cols-2">
                <Input
                  label="Name"
                  error={errors.medications?.[index]?.name?.message}
                  {...register(`medications.${index}.name`)}
                />
                <Select label="Category" {...register(`medications.${index}.category`)}>
                  <option value="prescription">Prescription</option>
                  <option value="otc">OTC</option>
                  <option value="herbal">Herbal</option>
                  <option value="supplement">Supplement</option>
                </Select>
                <Input label="Dosage" {...register(`medications.${index}.dosage`)} />
                <Input label="Frequency" {...register(`medications.${index}.frequency`)} />
                <Input label="Route" {...register(`medications.${index}.route`)} />
                <Input label="Indication" {...register(`medications.${index}.indication`)} />
                <Input label="Start date" type="date" {...register(`medications.${index}.startDate`)} />
                <Select label="Provenance" {...register(`medications.${index}.dataSource`)}>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-3 text-sm text-brand-text">
                  <input type="checkbox" className="size-4" {...register(`medications.${index}.isCurrent`)} />
                  Current medication
                </label>
                <button
                  type="button"
                  onClick={() => meds.remove(index)}
                  className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-brand-danger hover:underline"
                >
                  <Trash2 className="size-4" /> Remove medication
                </button>
              </div>
            ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-brand-text">Allergies and Intolerances</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="size-4" />}
              onClick={() => allergies.append({ ...allergyRow })}
              disabled={noAllergies}
            >
              Add entry
            </Button>
          </div>
          <label className="flex items-center gap-3 text-sm text-brand-text">
            <input type="checkbox" className="size-4" {...register("attestations.noKnownAllergies")} />
            No known allergies, intolerances, or side effects
          </label>
          <FieldError error={arrayLevelMessage(errors.allergies)} />
          {!noAllergies &&
            allergies.fields.map((field, index) => (
              <div key={field.id} className="grid gap-4 rounded-2xl border border-brand-border p-4 md:grid-cols-2">
                <Input
                  label="Substance"
                  error={errors.allergies?.[index]?.substance?.message}
                  {...register(`allergies.${index}.substance`)}
                />
                <Select label="Classification" {...register(`allergies.${index}.reactionType`)}>
                  <option value="allergy">True allergy</option>
                  <option value="intolerance">Intolerance</option>
                  <option value="side-effect">Side effect</option>
                </Select>
                <Select label="Severity" {...register(`allergies.${index}.severity`)}>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life-threatening">Life-threatening</option>
                </Select>
                <Select label="Category" {...register(`allergies.${index}.category`)}>
                  <option value="medication">Medication</option>
                  <option value="food">Food</option>
                  <option value="environment">Environment</option>
                  <option value="biologic">Biologic</option>
                  <option value="other">Other</option>
                </Select>
                <Select label="Onset timing" {...register(`allergies.${index}.onset`)}>
                  <option value="unknown">Unknown</option>
                  <option value="immediate">Immediate</option>
                  <option value="delayed">Delayed</option>
                </Select>
                <Input label="Onset date" type="date" {...register(`allergies.${index}.onsetDate`)} />
                <div className="md:col-span-2">
                  <Textarea
                    label="Manifestations"
                    rows={3}
                    placeholder="e.g. rash, nausea, anaphylaxis"
                    {...register(`allergies.${index}.manifestations`)}
                  />
                </div>
                <Select label="Provenance" {...register(`allergies.${index}.dataSource`)}>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-3 text-sm text-brand-text">
                  <input
                    type="checkbox"
                    className="size-4"
                    {...register(`allergies.${index}.verifiedByClinician`)}
                  />
                  Verified by clinician
                </label>
                <button
                  type="button"
                  onClick={() => allergies.remove(index)}
                  className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-brand-danger hover:underline"
                >
                  <Trash2 className="size-4" /> Remove entry
                </button>
              </div>
            ))}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {isEditing && onCancelEdit ? (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={saving}>
            {saving ? "Saving profile..." : "Save profile and continue"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
