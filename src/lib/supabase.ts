import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kobygvadxvhsgquaznca.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZFeSHcfjBef6YQRhkNsiVg_WHnqgLvJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
