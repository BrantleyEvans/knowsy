// Supabase clients for both browser and server-side usage.

import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface CookieEntry {
  name: string;
  value: string;
  options?: CookieOptions;
}

/** Browser-side Supabase client (uses anon key, RLS applies). */
export function getBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Server-side Supabase client tied to the request cookies. Use this in
 * Server Components and route handlers when you want RLS-respecting reads.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieEntry[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieEntry) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot set cookies — safe to ignore.
        }
      },
    },
  });
}

/**
 * Admin Supabase client using the service role key. Bypasses RLS — only
 * use server-side, never expose to the browser.
 */
export function getAdminSupabase() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
