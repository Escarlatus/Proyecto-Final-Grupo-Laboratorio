import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Singleton: one client for the entire app lifetime
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const useSupabase = () => supabaseClient
