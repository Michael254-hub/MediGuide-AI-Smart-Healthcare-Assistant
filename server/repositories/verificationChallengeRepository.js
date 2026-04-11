const { supabase } = require('../config/supabaseClient');

class VerificationChallengeRepository {
  // Helper method to ensure timestamps are UTC (add 'Z' if missing)
  // Supabase returns TIMESTAMP fields without timezone indicator
  normalizeTimestamps(data) {
    if (!data) return data;
    
    if (data.expires_at && typeof data.expires_at === 'string' && !data.expires_at.endsWith('Z')) {
      data.expires_at = `${data.expires_at}Z`;
    }
    
    if (data.last_sent_at && typeof data.last_sent_at === 'string' && !data.last_sent_at.endsWith('Z')) {
      data.last_sent_at = `${data.last_sent_at}Z`;
    }
    
    if (data.created_at && typeof data.created_at === 'string' && !data.created_at.endsWith('Z')) {
      data.created_at = `${data.created_at}Z`;
    }
    
    if (data.updated_at && typeof data.updated_at === 'string' && !data.updated_at.endsWith('Z')) {
      data.updated_at = `${data.updated_at}Z`;
    }
    
    return data;
  }

  async create(challenge) {
    const { data, error } = await supabase
      .from('verification_challenges')
      .insert([challenge])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.normalizeTimestamps(data);
  }

  async invalidateActiveChallenges(userId, purpose, contactType) {
    const { error } = await supabase
      .from('verification_challenges')
      .update({
        invalidated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .eq('contact_type', contactType)
      .is('consumed_at', null)
      .is('invalidated_at', null);

    if (error) {
      throw error;
    }
  }

  async findLatestActiveChallenge(userId, purpose, contactType) {
    const { data, error } = await supabase
      .from('verification_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .eq('contact_type', contactType)
      .is('consumed_at', null)
      .is('invalidated_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return this.normalizeTimestamps(data);
  }

  async incrementAttempts(id, nextAttemptCount) {
    const { data, error } = await supabase
      .from('verification_challenges')
      .update({
        attempt_count: nextAttemptCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.normalizeTimestamps(data);
  }

  async markConsumed(id) {
    const { data, error } = await supabase
      .from('verification_challenges')
      .update({
        consumed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.normalizeTimestamps(data);
  }
}

module.exports = new VerificationChallengeRepository();
