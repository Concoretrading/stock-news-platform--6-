const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://xsnmdczfgevodrweuttq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzbm1kY3pmZ2V2b2Ryd2V1dHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgwMTM5MiwiZXhwIjoyMDY2Mzc3MzkyfQ.SAxsGxohXJ6J_O80dnN0UnCgUcxvyzaJK_EnDDTnfBo";
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const email = 'handrigannick@gmail.com';
  const password = 'tslanvda1216';
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('User created:', data.user);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createUser(); 