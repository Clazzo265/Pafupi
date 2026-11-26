import type { SupabaseClient } from '@supabase/supabase-js';
import { api, setTokenProvider } from './api';
export interface PublicConfig {
  authMode: 'demo' | 'supabase';
  supabase?: { url: string; publishableKey: string };
}
let client: SupabaseClient | null = null;
let pending: Promise<PublicConfig> | null = null;
export function configureAuth(): Promise<PublicConfig> {
  if (!pending)
    pending = (async () => {
      const config = await api<PublicConfig>('/config');
      if (config.authMode === 'supabase') {
        if (!config.supabase) throw new Error('Sign-in configuration is unavailable.');
        const { createClient } = await import('@supabase/supabase-js');
        client = createClient(config.supabase.url, config.supabase.publishableKey, {
          auth: {
            persistSession: true,
            storage: window.sessionStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        setTokenProvider(
          async () => (await client!.auth.getSession()).data.session?.access_token || null,
        );
      }
      return config;
    })().catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}
export function authClient() {
  if (!client) throw new Error('Hosted sign-in is not configured.');
  return client;
}
