import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cvimoskoxqwzfavqxfzi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ou-lgRWpL_gZjLJraQ003g__ISZu4IW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);