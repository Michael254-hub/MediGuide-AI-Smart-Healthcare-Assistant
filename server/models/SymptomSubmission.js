/**
 * DEPRECATED: This file is no longer used.
 * 
 * The project has been migrated from MongoDB to Supabase (PostgreSQL).
 * SymptomSubmission data is now managed directly via Supabase queries.
 * 
 * See config/schema.sql for the PostgreSQL schema definition.
 */

const symptomSubmissionSchema = {
  fields: {
    id: { type: 'UUID', primary: true, default: 'gen_random_uuid()' },
    user_id: { type: 'UUID', required: true, references: 'users(id)' },
    symptoms: { type: 'TEXT', required: true },
    duration: { type: 'VARCHAR(255)', required: true },
    severity: { type: 'VARCHAR(20)', enum: ['mild', 'moderate', 'severe'], required: true },
    submitted_at: { type: 'TIMESTAMP', default: 'NOW()' }
  }
};

module.exports = null; // No longer exported
