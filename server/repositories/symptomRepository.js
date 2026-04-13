const { supabase } = require('../config/supabaseClient');
const userRepository = require('./userRepository');

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

  async countSubmittedSince(isoTimestamp) {
    const { count, error } = await supabase
      .from('symptom_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', isoTimestamp);

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

  async findSubmissionsByIds(ids = []) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('symptom_submissions')
      .select('id, user_id, symptoms, duration, severity, submitted_at')
      .in('id', uniqueIds);

    if (error) throw error;
    return data;
  }

  async findAllLogsWithDetails() {
    const { data: logs, error } = await supabase
      .from('triage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!logs || logs.length === 0) {
      return [];
    }

    const submissions = await this.findSubmissionsByIds(logs.map((log) => log.submission_id));
    const submissionMap = new Map(submissions.map((submission) => [submission.id, submission]));
    const users = await userRepository.findManyByIds(submissions.map((submission) => submission.user_id));
    const userMap = new Map(users.map((user) => [user.id, user]));

    return logs.map((log) => {
      const submission = submissionMap.get(log.submission_id);

      return {
        ...log,
        submission_id: submission
          ? {
              ...submission,
              user_id: userMap.get(submission.user_id) || null,
            }
          : null,
      };
    });
  }
}

module.exports = new SymptomRepository();
