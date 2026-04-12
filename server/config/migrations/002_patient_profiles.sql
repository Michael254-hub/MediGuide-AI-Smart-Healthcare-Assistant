-- =============================================================
-- MediGuide: Patient Profile Schema  (Migration 002)
-- FHIR R4 Compliant | PHI-Secure | Temporally-Precise
-- Run this in your Supabase SQL editor before starting the app.
-- =============================================================

-- ── 1. Patient Demographics  (FHIR: Patient) ─────────────────
CREATE TABLE IF NOT EXISTS patient_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- FHIR Patient demographics
    age_years           INTEGER      CHECK (age_years >= 0 AND age_years <= 120),
    date_of_birth       DATE,
    sex_at_birth        VARCHAR(20)  CHECK (sex_at_birth IN ('male','female','intersex','unknown')),

    -- Data Provenance (confidence scoring)
    data_source         VARCHAR(50)  DEFAULT 'patient-reported',
    confidence_score    DECIMAL(3,2) DEFAULT 0.80,

    -- FHIR Metadata
    fhir_resource_type  VARCHAR(50)  DEFAULT 'Patient',
    fhir_id             VARCHAR(255),

    -- Profile State
    profile_complete    BOOLEAN      DEFAULT FALSE,
    completion_step     INTEGER      DEFAULT 0,   -- 0=none,1=demographics,2=medications,3=allergies
    no_current_medications BOOLEAN    DEFAULT FALSE,
    no_known_allergies  BOOLEAN      DEFAULT FALSE,

    -- Temporal Precision (every data point timestamped)
    recorded_at         TIMESTAMPTZ  DEFAULT NOW(),
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW(),

    CONSTRAINT patient_profiles_user_unique UNIQUE (user_id)
);

-- ── 2. Medications  (FHIR: MedicationStatement) ───────────────
CREATE TABLE IF NOT EXISTS patient_medications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Drug Identity
    name                VARCHAR(255) NOT NULL,
    generic_name        VARCHAR(255),
    rxcui               VARCHAR(50),            -- RxNorm Concept Unique Identifier

    -- Classification
    category            VARCHAR(50)  NOT NULL
                        CHECK (category IN ('prescription','otc','herbal','supplement')),

    -- Dosing
    dosage              VARCHAR(100),
    frequency           VARCHAR(100),
    route               VARCHAR(50),            -- oral | topical | inhaled | injectable | etc.

    -- Clinical Context
    indication          VARCHAR(255),           -- reason for taking

    -- Temporal Precision
    start_date          DATE,
    end_date            DATE,
    is_current          BOOLEAN      DEFAULT TRUE,
    recorded_at         TIMESTAMPTZ  DEFAULT NOW(),

    -- Data Provenance
    data_source         VARCHAR(50)  DEFAULT 'patient-reported',
    confidence_score    DECIMAL(3,2) DEFAULT 0.75,

    -- FHIR Metadata
    fhir_resource_type  VARCHAR(50)  DEFAULT 'MedicationStatement',

    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 3. Allergies & Intolerances  (FHIR: AllergyIntolerance) ──
CREATE TABLE IF NOT EXISTS patient_allergies (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Substance
    substance               VARCHAR(255) NOT NULL,
    substance_code          VARCHAR(50),          -- SNOMED CT / RxNorm code

    -- Classification  (distinguishes allergy vs. intolerance vs. side-effect)
    reaction_type           VARCHAR(50)  NOT NULL
                            CHECK (reaction_type IN ('allergy','intolerance','side-effect')),
    severity                VARCHAR(30)
                            CHECK (severity IN ('mild','moderate','severe','life-threatening')),
    category                VARCHAR(50)
                            CHECK (category IN ('food','medication','environment','biologic','other')),

    -- Manifestations (JSONB array of symptom strings)
    manifestations          JSONB        DEFAULT '[]',
    onset                   VARCHAR(20)
                            CHECK (onset IN ('immediate','delayed','unknown')),

    -- Temporal Precision
    onset_date              DATE,
    recorded_at             TIMESTAMPTZ  DEFAULT NOW(),

    -- Data Provenance
    data_source             VARCHAR(50)  DEFAULT 'patient-reported',
    confidence_score        DECIMAL(3,2) DEFAULT 0.80,
    verified_by_clinician   BOOLEAN      DEFAULT FALSE,

    -- FHIR Metadata
    fhir_resource_type      VARCHAR(50)  DEFAULT 'AllergyIntolerance',
    clinical_status         VARCHAR(50)  DEFAULT 'active'
                            CHECK (clinical_status IN ('active','inactive','resolved')),

    created_at              TIMESTAMPTZ  DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 4. Immutable PHI Audit Log ────────────────────────────────
-- Every access or modification to patient data is logged here.
-- Row Level Security prevents UPDATE/DELETE on this table.
CREATE TABLE IF NOT EXISTS profile_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    actor_id        UUID REFERENCES users(id),     -- who performed the action
    action          VARCHAR(50) NOT NULL
                    CHECK (action IN ('CREATE','READ','UPDATE','DELETE','EXPORT','ANONYMIZE')),
    resource_type   VARCHAR(100) NOT NULL,          -- patient_profile | medication | allergy
    resource_id     UUID,
    changes         JSONB,                          -- delta for UPDATE actions
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id     ON patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_user_id  ON patient_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_user_id    ON patient_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_audit_user_id        ON profile_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_audit_timestamp      ON profile_audit_logs(timestamp DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE patient_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_audit_logs    ENABLE ROW LEVEL SECURITY;

-- ── Immutable Audit Logging ────────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'profile_audit_logs is append-only and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON profile_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_update
    BEFORE UPDATE ON profile_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete ON profile_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_delete
    BEFORE DELETE ON profile_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();

-- NOTE: Apply RLS policies as needed for your Supabase auth setup.
-- The backend uses the SERVICE_ROLE key so it bypasses RLS in API calls.
-- If you also expose Supabase client-side, add policies like:
--   CREATE POLICY "users_own_profile" ON patient_profiles
--     FOR ALL USING (auth.uid()::text = user_id::text);
