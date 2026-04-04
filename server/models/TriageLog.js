/**
 * DEPRECATED: This file is no longer used.
 * 
 * The project has been migrated from MongoDB to Supabase (PostgreSQL).
 * TriageLog data is now managed directly via Supabase queries.
 * 
 * See config/schema.sql for the PostgreSQL schema definition.
 */

const triageLogSchema = {
  fields: {
    id: { type: 'UUID', primary: true, default: 'gen_random_uuid()' },
    submission_id: { type: 'UUID', required: true, references: 'symptom_submissions(id)' },
    detected_symptoms: { type: 'TEXT[]', default: 'ARRAY[]::TEXT[]' },
    risk_level: { type: 'VARCHAR(20)', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], required: true },
    recommendation: { type: 'TEXT', required: true },
    flagged_emergency: { type: 'BOOLEAN', default: false },
    created_at: { type: 'TIMESTAMP', default: 'NOW()' }
  }
};

module.exports = null; // No longer exported
