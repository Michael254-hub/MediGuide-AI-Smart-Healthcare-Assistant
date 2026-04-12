import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { patientProfileAPI } from "../services/api";

const sources = [
  "patient-reported",
  "caregiver-reported",
  "clinician-documented",
  "pharmacy-record",
  "ehr-import",
  "lab-result",
  "device-reported",
];

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
        })
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
        })
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

const medicationRow = {
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

const allergyRow = {
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

const toValues = (profile) => ({
  demographics: {
    age: profile?.demographics?.age ?? "",
    sexAtBirth: profile?.demographics?.sexAtBirth ?? "unknown",
    dataSource: profile?.demographics?.dataSource ?? "patient-reported",
    recordedAt: profile?.demographics?.recordedAt ?? "",
  },
  medications:
    profile?.medications?.map((item) => ({
      name: item.name ?? "",
      category: item.category ?? "prescription",
      dosage: item.dosage ?? "",
      frequency: item.frequency ?? "",
      route: item.route ?? "",
      indication: item.indication ?? "",
      startDate: item.startDate ?? "",
      dataSource: item.dataSource ?? "patient-reported",
      isCurrent: item.isCurrent ?? true,
      recordedAt: item.recordedAt ?? "",
    })) ?? [],
  allergies:
    profile?.allergies?.map((item) => ({
      substance: item.substance ?? "",
      reactionType: item.reactionType ?? "allergy",
      severity: item.severity ?? "mild",
      category: item.category ?? "medication",
      manifestations: Array.isArray(item.manifestations) ? item.manifestations.join(", ") : "",
      onset: item.onset ?? "unknown",
      onsetDate: item.onsetDate ?? "",
      dataSource: item.dataSource ?? "patient-reported",
      verifiedByClinician: item.verifiedByClinician ?? false,
      recordedAt: item.recordedAt ?? "",
    })) ?? [],
  attestations: {
    noCurrentMedications: profile?.attestations?.noCurrentMedications ?? false,
    noKnownAllergies: profile?.attestations?.noKnownAllergies ?? false,
  },
});

const FieldError = ({ error }) =>
  error ? <p className="text-sm text-red-500 mt-1">{error}</p> : null;

export default function PatientProfileIntake({ initialProfile, onSaved, onCancelEdit, isEditing }) {
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({
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

  const saveProfile = async (values) => {
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
                ? item.manifestations.split(",").map((value) => value.trim()).filter(Boolean)
                : [],
              onsetDate: item.onsetDate || undefined,
              recordedAt: item.recordedAt || undefined,
            })),
        attestations: values.attestations,
      };
      const response = await patientProfileAPI.saveProfile(payload);
      window.dispatchEvent(new CustomEvent("patient-profile-updated", { detail: response.data.data }));
      onSaved?.(response.data.data);
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Failed to save patient profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-med-dark">Patient Intake Profile</h2>
        <p className="text-med-muted mt-2">
          Complete this record before a new assessment so the CDSS has demographics,
          medications, allergies, provenance, and timestamps.
        </p>
      </div>

      {submitError && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">{submitError}</div>}

      <form onSubmit={handleSubmit(saveProfile)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-med-dark">Demographics</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2">Age</label><input type="number" min="0" max="120" {...register("demographics.age")} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /><FieldError error={errors.demographics?.age?.message} /></div>
            <div><label className="block text-sm font-medium mb-2">Sex at birth</label><select {...register("demographics.sexAtBirth")} className="w-full rounded-2xl border border-slate-300 px-4 py-3"><option value="unknown">Unknown</option><option value="male">Male</option><option value="female">Female</option><option value="intersex">Intersex</option></select></div>
            <div><label className="block text-sm font-medium mb-2">Data source</label><select {...register("demographics.dataSource")} className="w-full rounded-2xl border border-slate-300 px-4 py-3">{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-med-dark">Medical History</h3>
            <button type="button" onClick={() => meds.append({ ...medicationRow })} disabled={noMeds} className="px-4 py-2 rounded-full bg-med-primary text-white disabled:opacity-50">Add medication</button>
          </div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" {...register("attestations.noCurrentMedications")} /> No current prescriptions, OTC drugs, herbal products, or supplements</label>
          <FieldError error={errors.medications?.message} />
          {!noMeds && meds.fields.map((field, index) => (
            <div key={field.id} className="grid md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 p-4">
              <div><label className="block text-sm font-medium mb-2">Name</label><input {...register(`medications.${index}.name`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /><FieldError error={errors.medications?.[index]?.name?.message} /></div>
              <div><label className="block text-sm font-medium mb-2">Category</label><select {...register(`medications.${index}.category`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3"><option value="prescription">Prescription</option><option value="otc">OTC</option><option value="herbal">Herbal</option><option value="supplement">Supplement</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Dosage</label><input {...register(`medications.${index}.dosage`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></div>
              <div><label className="block text-sm font-medium mb-2">Frequency</label><input {...register(`medications.${index}.frequency`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></div>
              <div><label className="block text-sm font-medium mb-2">Route</label><input {...register(`medications.${index}.route`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></div>
              <div><label className="block text-sm font-medium mb-2">Indication</label><input {...register(`medications.${index}.indication`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></div>
              <div><label className="block text-sm font-medium mb-2">Start date</label><input type="date" {...register(`medications.${index}.startDate`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></div>
              <div><label className="block text-sm font-medium mb-2">Provenance</label><select {...register(`medications.${index}.dataSource`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3">{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></div>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" {...register(`medications.${index}.isCurrent`)} /> Current medication</label>
              <button type="button" onClick={() => meds.remove(index)} className="text-sm text-red-600 justify-self-start">Remove medication</button>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-med-dark">Allergies and Intolerances</h3>
            <button type="button" onClick={() => allergies.append({ ...allergyRow })} disabled={noAllergies} className="px-4 py-2 rounded-full bg-amber-500 text-white disabled:opacity-50">Add entry</button>
          </div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" {...register("attestations.noKnownAllergies")} /> No known allergies, intolerances, or side effects</label>
          <FieldError error={errors.allergies?.message} />
          {!noAllergies && allergies.fields.map((field, index) => (
            <div key={field.id} className="grid md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 p-4">
              <div><label className="block text-sm font-medium mb-2">Substance</label><input {...register(`allergies.${index}.substance`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /><FieldError error={errors.allergies?.[index]?.substance?.message} /></div>
              <div><label className="block text-sm font-medium mb-2">Classification</label><select {...register(`allergies.${index}.reactionType`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3"><option value="allergy">True allergy</option><option value="intolerance">Intolerance</option><option value="side-effect">Side effect</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Severity</label><select {...register(`allergies.${index}.severity`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option><option value="life-threatening">Life-threatening</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Category</label><select {...register(`allergies.${index}.category`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3"><option value="medication">Medication</option><option value="food">Food</option><option value="environment">Environment</option><option value="biologic">Biologic</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Onset timing</label><select {...register(`allergies.${index}.onset`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3"><option value="unknown">Unknown</option><option value="immediate">Immediate</option><option value="delayed">Delayed</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Onset date</label><input type="date" {...register(`allergies.${index}.onsetDate`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Manifestations</label><textarea rows="3" {...register(`allergies.${index}.manifestations`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 resize-none" placeholder="e.g. rash, nausea, anaphylaxis" /></div>
              <div><label className="block text-sm font-medium mb-2">Provenance</label><select {...register(`allergies.${index}.dataSource`)} className="w-full rounded-2xl border border-slate-300 px-4 py-3">{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></div>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" {...register(`allergies.${index}.verifiedByClinician`)} /> Verified by clinician</label>
              <button type="button" onClick={() => allergies.remove(index)} className="text-sm text-red-600 justify-self-start">Remove entry</button>
            </div>
          ))}
        </section>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          {isEditing && onCancelEdit ? <button type="button" onClick={onCancelEdit} className="px-5 py-3 rounded-full border border-slate-300">Cancel</button> : null}
          <button type="submit" disabled={saving} className="px-5 py-3 rounded-full bg-sky-700 text-white font-semibold disabled:opacity-70">{saving ? "Saving profile..." : "Save profile and continue"}</button>
        </div>
      </form>
    </div>
  );
}
