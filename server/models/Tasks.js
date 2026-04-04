/**
 * DEPRECATED: This file is no longer used.
 * 
 * The project has been migrated from MongoDB to Supabase (PostgreSQL).
 * Task data is now managed directly via Supabase queries.
 * 
 * See config/schema.sql for the PostgreSQL schema definition.
 */

const taskSchema = {
  fields: {
    id: { type: 'UUID', primary: true, default: 'gen_random_uuid()' },
    title: { type: 'VARCHAR(255)' },
    completed: { type: 'BOOLEAN', default: false },
    user_id: { type: 'UUID', references: 'users(id)' }
  }
};

module.exports = null; // No longer exported