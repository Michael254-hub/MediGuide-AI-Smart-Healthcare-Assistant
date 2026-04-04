const { supabase } = require('../config/supabaseClient');

class SymptomRepository {
  async createSubmission(submissionData) {
    const { data, error } = await supabase
      .from('symptom_submissions')
      .insert([submissionData])
      .select();
    if (error) throw error;
    return data[0];
  }

  async findSubmissionsByUser(userId) {
    const { data, error } = await supabase
      .from('symptom_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createTriageLog(logData) {
    const { data, error } = await supabase
      .from('triage_logs')
      .insert([logData])
      .select();
    if (error) throw error;
    return data[0];
  }

  async getTriageLogBySubmissionId(submissionId) {
    const { data, error } = await supabase
      .from('triage_logs')
      .select('*')
      .eq('submission_id', submissionId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async countSubmissions() {
    const { count, error } = await supabase
      .from('symptom_submissions')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count;
  }

  async countEmergencies() {
    const { count, error } = await supabase
      .from('triage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('flagged_emergency', true);
    if (error) throw error;
    return count;
  }

  async getRiskDistribution() {
    const { data, error } = await supabase
      .from('triage_logs')
      .select('risk_level')
      .order('risk_level');
    
    if (error) throw error;
    
    const distribution = {};
    data.forEach(log => {
      distribution[log.risk_level] = (distribution[log.risk_level] || 0) + 1;
    });
    return distribution;
  }

  async findAllLogsWithDetails() {
    const { data, error } = await supabase
      .from('triage_logs')
      .select(`
        *,
        submission_id(user_id(name, email))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}

module.exports = new SymptomRepository();
