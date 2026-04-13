const { supabase } = require('../config/supabaseClient');
const AppError = require('../errors/AppError');

const handleRepositoryError = (error) => {
  if (!error) {
    return;
  }

  if (error.code === 'PGRST205') {
    throw new AppError(
      'Medical professional applications are not available yet because the required database migration has not been applied.',
      503,
      {
        code: 'PROFESSIONAL_APPLICATIONS_MIGRATION_REQUIRED',
        details: {
          table: 'medical_professional_applications',
          migration: 'server/config/migrations/003_medical_professional_applications.sql',
        },
      }
    );
  }

  throw error;
};

class MedicalProfessionalApplicationRepository {
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') handleRepositoryError(error);
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') handleRepositoryError(error);
    return data;
  }

  async saveForUser(userId, applicationData) {
    const existingApplication = await this.findByUserId(userId);

    if (existingApplication) {
      const { data, error } = await supabase
        .from('medical_professional_applications')
        .update(applicationData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) handleRepositoryError(error);
      return data;
    }

    const { data, error } = await supabase
      .from('medical_professional_applications')
      .insert([{ user_id: userId, ...applicationData }])
      .select()
      .single();

    if (error) handleRepositoryError(error);
    return data;
  }

  async listAll() {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) handleRepositoryError(error);
    return data;
  }

  async review(id, reviewData) {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .update(reviewData)
      .eq('id', id)
      .select()
      .single();

    if (error) handleRepositoryError(error);
    return data;
  }

  async countPending() {
    const { count, error } = await supabase
      .from('medical_professional_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) handleRepositoryError(error);
    return count;
  }

  async countByStatus(status) {
    const { count, error } = await supabase
      .from('medical_professional_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) handleRepositoryError(error);
    return count;
  }
}

module.exports = new MedicalProfessionalApplicationRepository();
