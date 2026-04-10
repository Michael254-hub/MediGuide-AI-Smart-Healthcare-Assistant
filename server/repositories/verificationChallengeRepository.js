const { supabase } = require('../config/supabaseClient');

class VerificationChallengeRepository {
  async create(challenge) {
    const { data, error } = await supabase
      .from('verification_challenges')
      .insert([challenge])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
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

    return data;
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

    return data;
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

    return data;
  }
}

module.exports = new VerificationChallengeRepository();
