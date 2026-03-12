import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olbolxwitzwfxpyhhfcg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_h7I4mxr2m5ONzmaylpJS3w_GlMXheRv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
