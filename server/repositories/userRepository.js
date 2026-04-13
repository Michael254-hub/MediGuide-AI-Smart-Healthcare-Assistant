const { supabase } = require('../config/supabaseClient');
const bcrypt = require('bcrypt');

class UserRepository {
  // Helper method to ensure timestamps are UTC (add 'Z' if missing)
  // Supabase returns TIMESTAMP fields without timezone indicator
  normalizeTimestamps(data) {
    if (!data) return data;
    
    if (data.password_reset_expires_at && typeof data.password_reset_expires_at === 'string' && !data.password_reset_expires_at.endsWith('Z')) {
      data.password_reset_expires_at = `${data.password_reset_expires_at}Z`;
    }
    
    return data;
  }

  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...userData, password: hashedPassword }])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async findByEmail(email) {
    if (!email) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }

  async findVerifiedByEmail(email) {
    if (!email) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('email_verified', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }

  async findByPhone(phone) {
    if (!phone) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }

  async findVerifiedByPhone(phone) {
    if (!phone) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .eq('phone_verified', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }

  async findByEmailOrPhone(emailOrPhone) {
    const userByEmail = await this.findByEmail(emailOrPhone);
    if (userByEmail) {
      return userByEmail;
    }

    return this.findByPhone(emailOrPhone);
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, phone_verified, email_verified, role, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }

  async findManyByIds(ids = []) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];

    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at, updated_at')
      .in('id', uniqueIds);

    if (error) throw error;
    return data.map((item) => this.normalizeTimestamps(item));
  }

  async findAuthById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }

  async countAll() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count;
  }

  async countByRole(role) {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role);

    if (error) throw error;
    return count;
  }

  async update(id, userData) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async markContactVerified(userId, contactType) {
    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (contactType === 'email') {
      updates.email_verified = true;
    }

    if (contactType === 'phone') {
      updates.phone_verified = true;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Password recovery methods
  async savePasswordResetToken(userId, token, expiresAt) {
    const { data, error } = await supabase
      .from('users')
      .update({
        password_reset_token: token,
        password_reset_expires_at: expiresAt
      })
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { data, error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null
      })
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async findByResetToken(token) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return this.normalizeTimestamps(data);
  }
}

module.exports = new UserRepository();
