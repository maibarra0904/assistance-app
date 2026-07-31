import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kobygvadxvhsgquaznca.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ZFeSHcfjBef6YQRhkNsiVg_WHnqgLvJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
