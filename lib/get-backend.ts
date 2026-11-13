import type { Backend } from './backend';
import { localBackend } from './backend-local';
import { supabaseBackend } from './backend-supabase';
import { getBrowserClient } from './supabase';

let cached: Backend | null = null;

/** Supabase si está configurado; si no, el modo de prueba local. Solo en el navegador. */
export function getBackend(): Backend {
  if (!cached) {
    const sb = getBrowserClient();
    cached = sb ? supabaseBackend(sb) : localBackend();
  }
  return cached;
}
