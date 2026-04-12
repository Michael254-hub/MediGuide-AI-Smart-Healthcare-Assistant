const crypto = require('crypto');
const AppError = require('../errors/AppError');
const patientProfileRepository = require('../repositories/patientProfileRepository');
const {
  SOURCE_CONFIDENCE,
  PROFILE_COMPLETION_STEPS,
} = require('../utils/patientProfileConstants');

const roundConfidence = (value) => Number(Number(value).toFixed(2));

const stripEmpty = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(stripEmpty)
      .filter((item) => item !== undefined && item !== null);
  }

  if (value && typeof value === 'object') {
    const cleanedEntries = Object.entries(value)
      .map(([key, entryValue]) => [key, stripEmpty(entryValue)])
      .filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);

    return cleanedEntries.length ? Object.fromEntries(cleanedEntries) : undefined;
  }

  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const mapSexToFhirGender = (sexAtBirth) => {
  switch (sexAtBirth) {
    case 'male':
    case 'female':
      return sexAtBirth;
    case 'intersex':
      return 'other';
    default:
      return 'unknown';
  }
};

const mapAllergyCriticality = (severity) => {
  if (severity === 'life-threatening' || severity === 'severe') {
    return 'high';
  }

  if (severity === 'moderate') {
    return 'low';
  }

  return 'unable-to-assess';
};

const mapReactionSeverity = (severity) => {
  if (severity === 'life-threatening') {
    return 'severe';
  }

  return severity;
};

const sourceLabel = (source) =>
  String(source || 'patient-reported')
    .split('-')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const toIsoString = (value) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const toIsoDate = (value) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

class PatientProfileService {
  getConfidenceScore(source) {
    return roundConfidence(SOURCE_CONFIDENCE[source] || SOURCE_CONFIDENCE['patient-reported']);
  }

  calculateCompletionStep(profile, medications, allergies) {
    if (!profile) {
      return PROFILE_COMPLETION_STEPS.NONE;
    }

    const hasDemographics =
      Number.isInteger(profile.age_years) &&
      Boolean(profile.sex_at_birth);

    if (!hasDemographics) {
      return PROFILE_COMPLETION_STEPS.NONE;
    }

    const medicationsComplete =
      Boolean(profile.no_current_medications) ||
      (Array.isArray(medications) && medications.length > 0);

    if (!medicationsComplete) {
      return PROFILE_COMPLETION_STEPS.DEMOGRAPHICS;
    }

    const allergiesComplete =
      Boolean(profile.no_known_allergies) || (Array.isArray(allergies) && allergies.length > 0);

    if (!allergiesComplete) {
      return PROFILE_COMPLETION_STEPS.MEDICATIONS;
    }

    return PROFILE_COMPLETION_STEPS.ALLERGIES;
  }

  buildPatientResource(user, profile) {
    if (!profile) {
      return null;
    }

    return stripEmpty({
      resourceType: 'Patient',
      id: profile.fhir_id || user.id,
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
        lastUpdated: toIsoString(profile.updated_at || profile.recorded_at),
        versionId: '1',
      },
      identifier: [
        {
          system: 'https://mediguide.ai/patients',
          value: user.id,
        },
      ],
      active: true,
      gender: mapSexToFhirGender(profile.sex_at_birth),
      name: user.name ? [{ text: user.name }] : undefined,
      telecom: [
        user.email ? { system: 'email', value: user.email, use: 'home' } : undefined,
        user.phone ? { system: 'phone', value: user.phone, use: 'mobile' } : undefined,
      ],
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/patient-birthSex',
          valueCode: profile.sex_at_birth,
        },
        Number.isInteger(profile.age_years)
          ? {
              url: 'https://mediguide.ai/fhir/StructureDefinition/age-years',
              valueUnsignedInt: profile.age_years,
            }
          : undefined,
      ],
    });
  }

  buildMedicationResource(medication, patientReference) {
    return stripEmpty({
      resourceType: 'MedicationStatement',
      id: medication.id,
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/MedicationStatement'],
        lastUpdated: toIsoString(medication.updated_at || medication.recorded_at),
      },
      status: medication.is_current ? 'active' : 'completed',
      subject: {
        reference: `Patient/${patientReference}`,
      },
      dateAsserted: toIsoString(medication.recorded_at),
      informationSource: {
        display: sourceLabel(medication.data_source),
      },
      medicationCodeableConcept: {
        text: medication.name,
        coding: medication.rxcui
          ? [
              {
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: medication.rxcui,
                display: medication.generic_name || medication.name,
              },
            ]
          : undefined,
      },
      dosage: [
        stripEmpty({
          text: [medication.dosage, medication.frequency, medication.route]
            .filter(Boolean)
            .join(' ')
            .trim(),
          route: medication.route ? { text: medication.route } : undefined,
        }),
      ],
      effectivePeriod: stripEmpty({
        start: toIsoDate(medication.start_date),
        end: toIsoDate(medication.end_date),
      }),
      reasonCode: medication.indication ? [{ text: medication.indication }] : undefined,
      note: [
        {
          text: `Source: ${sourceLabel(medication.data_source)} | Confidence: ${medication.confidence_score}`,
        },
      ],
    });
  }

  buildAllergyResource(allergy, patientReference) {
    return stripEmpty({
      resourceType: 'AllergyIntolerance',
      id: allergy.id,
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/AllergyIntolerance'],
        lastUpdated: toIsoString(allergy.updated_at || allergy.recorded_at),
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: allergy.clinical_status || 'active',
          },
        ],
      },
      type: allergy.reaction_type === 'allergy' ? 'allergy' : 'intolerance',
      criticality: mapAllergyCriticality(allergy.severity),
      category:
        ['food', 'medication', 'environment', 'biologic'].includes(allergy.category)
          ? [allergy.category]
          : undefined,
      patient: {
        reference: `Patient/${patientReference}`,
      },
      code: {
        text: allergy.substance,
        coding: allergy.substance_code
          ? [
              {
                system: 'http://snomed.info/sct',
                code: allergy.substance_code,
                display: allergy.substance,
              },
            ]
          : undefined,
      },
      extension: [
        {
          url: 'https://mediguide.ai/fhir/StructureDefinition/reaction-classification',
          valueCode: allergy.reaction_type,
        },
      ],
      onsetDateTime: toIsoDate(allergy.onset_date),
      recordedDate: toIsoString(allergy.recorded_at),
      reaction: [
        stripEmpty({
          manifestation: Array.isArray(allergy.manifestations)
            ? allergy.manifestations.map((item) => ({ text: item }))
            : undefined,
          severity: mapReactionSeverity(allergy.severity),
          description: `${allergy.reaction_type}: ${allergy.severity}`,
        }),
      ],
      note: [
        {
          text: `Source: ${sourceLabel(allergy.data_source)} | Confidence: ${allergy.confidence_score}`,
        },
      ],
    });
  }

  buildFhirBundle(user, profile, medications, allergies) {
    if (!profile) {
      return null;
    }

    const patientResource = this.buildPatientResource(user, profile);
    const patientReference = patientResource.id;

    const entries = [
      patientResource,
      ...medications.map((medication) =>
        this.buildMedicationResource(medication, patientReference)
      ),
      ...allergies.map((allergy) => this.buildAllergyResource(allergy, patientReference)),
    ].filter(Boolean);

    return {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: toIsoString(profile.updated_at || profile.recorded_at || new Date().toISOString()),
      total: entries.length,
      entry: entries.map((resource) => ({ resource })),
    };
  }

  buildDeidentifiedTrainingView(userId, profile, medications, allergies) {
    if (!profile) {
      return null;
    }

    const cohortKey = crypto.createHash('sha256').update(String(userId)).digest('hex').slice(0, 16);
    const ageBand =
      Number.isInteger(profile.age_years) && profile.age_years >= 0
        ? `${Math.floor(profile.age_years / 10) * 10}-${Math.floor(profile.age_years / 10) * 10 + 9}`
        : 'unknown';

    return {
      cohortKey,
      generatedAt: new Date().toISOString(),
      demographics: {
        ageBand,
        sexAtBirth: profile.sex_at_birth,
      },
      medications: medications.map((medication) => ({
        category: medication.category,
        name: medication.name,
        genericName: medication.generic_name,
        route: medication.route,
        indication: medication.indication,
        isCurrent: medication.is_current,
        startYear: medication.start_date ? String(medication.start_date).slice(0, 4) : null,
        dataSource: medication.data_source,
        confidenceScore: medication.confidence_score,
      })),
      allergies: allergies.map((allergy) => ({
        substance: allergy.substance,
        reactionType: allergy.reaction_type,
        severity: allergy.severity,
        category: allergy.category,
        manifestations: allergy.manifestations || [],
        dataSource: allergy.data_source,
        confidenceScore: allergy.confidence_score,
      })),
    };
  }

  buildProfileResponse(user, assembledProfile) {
    const { profile, medications, allergies } = assembledProfile;
    const completionStep = this.calculateCompletionStep(profile, medications, allergies);
    const profileComplete = completionStep === PROFILE_COMPLETION_STEPS.ALLERGIES;

    if (!profile) {
      return {
        exists: false,
        profileComplete: false,
        completionStep: PROFILE_COMPLETION_STEPS.NONE,
        demographics: null,
        medications: [],
        allergies: [],
        attestations: {
          noCurrentMedications: false,
          noKnownAllergies: false,
        },
        profileSummary: {
          medicationCount: 0,
          allergyCount: 0,
          trueAllergyCount: 0,
          intoleranceCount: 0,
          sideEffectCount: 0,
        },
        fhirBundle: null,
        deidentifiedTrainingView: null,
      };
    }

    return {
      exists: true,
      profileComplete,
      completionStep,
      updatedAt: profile.updated_at,
      demographics: {
        age: profile.age_years,
        sexAtBirth: profile.sex_at_birth,
        dataSource: profile.data_source,
        confidenceScore: profile.confidence_score,
        recordedAt: profile.recorded_at,
      },
      medications: medications.map((medication) => ({
        id: medication.id,
        name: medication.name,
        genericName: medication.generic_name,
        rxcui: medication.rxcui,
        category: medication.category,
        dosage: medication.dosage,
        frequency: medication.frequency,
        route: medication.route,
        indication: medication.indication,
        startDate: medication.start_date,
        endDate: medication.end_date,
        isCurrent: medication.is_current,
        dataSource: medication.data_source,
        confidenceScore: medication.confidence_score,
        recordedAt: medication.recorded_at,
      })),
      allergies: allergies.map((allergy) => ({
        id: allergy.id,
        substance: allergy.substance,
        substanceCode: allergy.substance_code,
        reactionType: allergy.reaction_type,
        severity: allergy.severity,
        category: allergy.category,
        manifestations: allergy.manifestations || [],
        onset: allergy.onset,
        onsetDate: allergy.onset_date,
        clinicalStatus: allergy.clinical_status,
        verifiedByClinician: allergy.verified_by_clinician,
        dataSource: allergy.data_source,
        confidenceScore: allergy.confidence_score,
        recordedAt: allergy.recorded_at,
      })),
      attestations: {
        noCurrentMedications: Boolean(profile.no_current_medications),
        noKnownAllergies: Boolean(profile.no_known_allergies),
      },
      profileSummary: {
        medicationCount: medications.length,
        allergyCount: allergies.length,
        trueAllergyCount: allergies.filter((item) => item.reaction_type === 'allergy').length,
        intoleranceCount: allergies.filter((item) => item.reaction_type === 'intolerance').length,
        sideEffectCount: allergies.filter((item) => item.reaction_type === 'side-effect').length,
      },
      fhirBundle: this.buildFhirBundle(user, profile, medications, allergies),
      deidentifiedTrainingView: this.buildDeidentifiedTrainingView(
        user.id,
        profile,
        medications,
        allergies
      ),
    };
  }

  async logAudit(userId, actorId, action, resourceType, resourceId, requestContext, changes) {
    await patientProfileRepository.createAuditLog({
      user_id: userId,
      actor_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      changes,
      ip_address: requestContext?.ipAddress || null,
      user_agent: requestContext?.userAgent || null,
      timestamp: new Date().toISOString(),
    });
  }

  async getProfile(user, requestContext, options = {}) {
    const assembledProfile = await patientProfileRepository.findFullProfileByUserId(user.id);
    const response = this.buildProfileResponse(user, assembledProfile);

    await this.logAudit(
      user.id,
      user.id,
      options.auditAction || 'READ',
      options.resourceType || 'patient_profile',
      assembledProfile.profile?.id || null,
      requestContext,
      {
        profileComplete: response.profileComplete,
        completionStep: response.completionStep,
      }
    );

    return response;
  }

  async saveProfile(user, payload, requestContext) {
    const existing = await patientProfileRepository.findProfileByUserId(user.id);
    const timestamp = new Date().toISOString();

    const profileRecord = {
      user_id: user.id,
      age_years: payload.demographics.age,
      sex_at_birth: payload.demographics.sexAtBirth,
      data_source: payload.demographics.dataSource,
      confidence_score: this.getConfidenceScore(payload.demographics.dataSource),
      fhir_resource_type: 'Patient',
      fhir_id: existing?.fhir_id || user.id,
      no_current_medications: payload.attestations.noCurrentMedications,
      no_known_allergies: payload.attestations.noKnownAllergies,
      profile_complete: true,
      completion_step: PROFILE_COMPLETION_STEPS.ALLERGIES,
      recorded_at: payload.demographics.recordedAt || timestamp,
      updated_at: timestamp,
    };

    const savedProfile = await patientProfileRepository.upsertProfile(profileRecord);

    const medications = payload.attestations.noCurrentMedications
      ? []
      : payload.medications.map((item) => ({
          user_id: user.id,
          name: item.name,
          generic_name: item.genericName,
          rxcui: item.rxcui,
          category: item.category,
          dosage: item.dosage,
          frequency: item.frequency,
          route: item.route,
          indication: item.indication,
          start_date: item.startDate || null,
          end_date: item.endDate || null,
          is_current: item.isCurrent,
          recorded_at: item.recordedAt || timestamp,
          data_source: item.dataSource,
          confidence_score: this.getConfidenceScore(item.dataSource),
          fhir_resource_type: 'MedicationStatement',
          updated_at: timestamp,
        }));

    const allergies = payload.attestations.noKnownAllergies
      ? []
      : payload.allergies.map((item) => ({
          user_id: user.id,
          substance: item.substance,
          substance_code: item.substanceCode,
          reaction_type: item.reactionType,
          severity: item.severity,
          category: item.category,
          manifestations: item.manifestations,
          onset: item.onset,
          onset_date: item.onsetDate || null,
          recorded_at: item.recordedAt || timestamp,
          data_source: item.dataSource,
          confidence_score: this.getConfidenceScore(item.dataSource),
          verified_by_clinician: item.verifiedByClinician,
          fhir_resource_type: 'AllergyIntolerance',
          clinical_status: item.clinicalStatus,
          updated_at: timestamp,
        }));

    await patientProfileRepository.replaceMedications(user.id, medications);
    await patientProfileRepository.replaceAllergies(user.id, allergies);

    const assembledProfile = await patientProfileRepository.findFullProfileByUserId(user.id);
    const response = this.buildProfileResponse(user, assembledProfile);

    await this.logAudit(
      user.id,
      user.id,
      existing ? 'UPDATE' : 'CREATE',
      'patient_profile',
      savedProfile.id,
      requestContext,
      {
        profileComplete: response.profileComplete,
        medicationCount: response.profileSummary.medicationCount,
        allergyCount: response.profileSummary.allergyCount,
      }
    );

    return response;
  }

  async getDeidentifiedProfile(user, requestContext) {
    const assembledProfile = await patientProfileRepository.findFullProfileByUserId(user.id);
    const response = this.buildProfileResponse(user, assembledProfile);

    await this.logAudit(
      user.id,
      user.id,
      'ANONYMIZE',
      'patient_profile',
      assembledProfile.profile?.id || null,
      requestContext,
      {
        exportedForTraining: Boolean(response.deidentifiedTrainingView),
      }
    );

    return response.deidentifiedTrainingView;
  }

  async assertProfileComplete(userId) {
    const assembledProfile = await patientProfileRepository.findFullProfileByUserId(userId);
    const completionStep = this.calculateCompletionStep(
      assembledProfile.profile,
      assembledProfile.medications,
      assembledProfile.allergies
    );

    if (completionStep !== PROFILE_COMPLETION_STEPS.ALLERGIES) {
      throw new AppError(
        'Complete your patient profile before starting a new assessment',
        428,
        {
          code: 'PATIENT_PROFILE_REQUIRED',
          details: {
            completionStep,
            profileComplete: false,
          },
        }
      );
    }
  }
}

module.exports = new PatientProfileService();
