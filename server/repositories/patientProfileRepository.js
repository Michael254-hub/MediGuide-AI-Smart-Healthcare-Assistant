const { supabase } = require('../config/supabaseClient');

class PatientProfileRepository {
  async findProfileByUserId(userId) {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async findMedicationsByUserId(userId) {
    const { data, error } = await supabase
      .from('patient_medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async findAllergiesByUserId(userId) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async findFullProfileByUserId(userId) {
    const [profile, medications, allergies] = await Promise.all([
      this.findProfileByUserId(userId),
      this.findMedicationsByUserId(userId),
      this.findAllergiesByUserId(userId),
    ]);

    return {
      profile,
      medications,
      allergies,
    };
  }

  async upsertProfile(profileData) {
    const { data, error } = await supabase
      .from('patient_profiles')
      .upsert([profileData], { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async replaceMedications(userId, medications) {
    const { error: deleteError } = await supabase
      .from('patient_medications')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    if (!medications.length) {
      return [];
    }

    const { data, error } = await supabase
      .from('patient_medications')
      .insert(medications)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  async replaceAllergies(userId, allergies) {
    const { error: deleteError } = await supabase
      .from('patient_allergies')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    if (!allergies.length) {
      return [];
    }

    const { data, error } = await supabase
      .from('patient_allergies')
      .insert(allergies)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  async createAuditLog(auditLog) {
    const { data, error } = await supabase
      .from('profile_audit_logs')
      .insert([auditLog])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = new PatientProfileRepository();
