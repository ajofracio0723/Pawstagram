import { createClient } from '@supabase/supabase-js'

// Get credentials from environment variables (Vite uses import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fallback for development - replace with your actual credentials
const fallbackUrl = 'https://qkhvbsyecrpdpmuefiqt.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraHZic3llY3JwZHBtdWVmaXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjk5NDMsImV4cCI6MjA2ODYwNTk0M30.RYrn-F1rWb4WQAWSPZcUiUC7vdWyFmnBOhyfPvdNyoA'

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey
)