const { supabase } = require('../config/supabaseClient');

class MedicalProfessionalApplicationRepository {
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
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

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('medical_professional_applications')
      .insert([{ user_id: userId, ...applicationData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listAll() {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async review(id, reviewData) {
    const { data, error } = await supabase
      .from('medical_professional_applications')
      .update(reviewData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async countPending() {
    const { count, error } = await supabase
      .from('medical_professional_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count;
  }
}

module.exports = new MedicalProfessionalApplicationRepository();
