import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bhpjvfddlgvyephtdaop.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocGp2ZmRkbGd2eWVwaHRkYW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDg0NDUsImV4cCI6MjA4MTEyNDQ0NX0.R8vOfi8HzGeruOL7rzHIw8JCRn6cR4_ERP2mhKqcjfQ';
// ---------------------

// Helper to check if keys are configured (just checks for existence now)
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

if (!isConfigured) {
  console.warn("Supabase is not configured. The app will run in Offline Demo Mode.");
}

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;
