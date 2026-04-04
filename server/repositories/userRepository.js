const { supabase } = require('../config/db');
const bcrypt = require('bcrypt');

class UserRepository {
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async countAll() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
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
}

module.exports = new UserRepository();
