"use client"

import { createBrowserClient } from "@supabase/ssr"
import { createDemoSupabaseClient, isDemoMode } from "../demo-data"

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client
  
  // Check if we're in demo mode
  if (isDemoMode()) {
    console.log('Running in demo mode with sample data')
    return createDemoSupabaseClient() as any
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Using demo mode.')
    return createDemoSupabaseClient() as any
  }
  
  try {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return createDemoSupabaseClient() as any
  }
  
  return client
}
