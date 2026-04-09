import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjlqqcfuglgejishbmwg.supabase.co';
const supabaseKey = 'sb_publishable_Xg8hRhENQilMf_pVAikh_A_gNxt0xgU';
// Actually, anon key cannot read orders unless logged in. I will login as admin.
async function checkOrders() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // We need to bypass RLS or test it via API.
  // Wait, I will just query directly and see what happens.
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, status, total, assigned_to, user_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching orders:', error.message);
  } else {
    console.log('Latest orders:', data);
  }
}

checkOrders();
