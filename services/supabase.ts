import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfqyxcicqwzeobraxelg.supabase.co';
const supabaseKey = 'sb_publishable_-Ep-sgm-XdCrsMijZjKTJA_cRd9yClZ';

export const supabase = createClient(supabaseUrl, supabaseKey);
