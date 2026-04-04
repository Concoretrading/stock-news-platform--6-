const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://xsnmdczfgevodrweuttq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzbm1kY3pmZ2V2b2Ryd2V1dHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgwMTM5MiwiZXhwIjoyMDY2Mzc3MzkyfQ.SAxsGxohXJ6J_O80dnN0UnCgUcxvyzaJK_EnDDTnfBo";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to list users (requires service role key)
    const res = await supabase.auth.admin.listUsers();
    if (res.error) {
      console.error('Error listing users:', res.error);
    } else {
      console.log('Users:', res.data.users);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection(); 