const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const connectDB = async () => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✓ Supabase Connected Successfully');
  } catch (error) {
    console.error('✗ Supabase connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { supabase, connectDB };
