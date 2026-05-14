import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qahwqsqzmbqgmiorvnek.supabase.co'
const supabaseKey = 'sb_publishable_2COLVI6axBQfJnRGLMSKPg_BWmvb6kA'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})