/**
 * DEPRECATED: This file is no longer used.
 * 
 * The project has been migrated from MongoDB to Supabase (PostgreSQL).
 * User data is now managed directly via Supabase queries in repositories/userRepository.js
 * 
 * See config/schema.sql for the PostgreSQL schema definition.
 */

// This file is kept for reference only
const userSchema = {
  fields: {
    id: { type: 'UUID', primary: true, default: 'gen_random_uuid()' },
    name: { type: 'VARCHAR(255)', required: true },
    email: { type: 'VARCHAR(255)', unique: true, required: true },
    password: { type: 'VARCHAR(255)', required: true },
    phone: { type: 'VARCHAR(20)', nullable: true },
    role: { type: 'VARCHAR(50)', enum: ['patient', 'admin'], default: 'patient' },
    created_at: { type: 'TIMESTAMP', default: 'NOW()' },
    updated_at: { type: 'TIMESTAMP', default: 'NOW()' }
  }
};

module.exports = null; // No longer exported