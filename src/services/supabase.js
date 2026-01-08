import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cuwmsgufxylrwmnhxsja.supabase.co';
const supabaseKey = 'sb_publishable_nqwB12X1jNyzl5k0wBVcig_vKFgv6hr';

export const supabase = createClient(supabaseUrl, supabaseKey);
