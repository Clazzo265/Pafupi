import { createClient } from '@supabase/supabase-js';
import { AppError } from '../domain.js';

export interface AuthIdentity {
  id: string;
  name: string;
  emailVerified: boolean;
}
export interface AuthAdapter {
  verify(token: string): Promise<AuthIdentity>;
}
export interface AppConfig {
  authMode: 'demo' | 'supabase';
  supabase?: { url: string; publishableKey: string };
}
/** Fail closed on typos, missing keys or accidentally supplied privileged credentials. */
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const mode = env.AUTH_MODE || 'demo';
  if (mode !== 'demo' && mode !== 'supabase')
    throw new Error('AUTH_MODE must be demo or supabase.');
  if (mode === 'demo' && env.DEMO_MODE === 'false')
    throw new Error('Set AUTH_MODE=supabase to disable sample accounts.');
  if (mode === 'demo') return { authMode: 'demo' };
  const url = env.SUPABASE_URL || '';
  const key = env.SUPABASE_PUBLISHABLE_KEY || '';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
    throw new Error('SUPABASE_URL must be an HTTPS project URL without a trailing slash.');
  // Only the non-privileged modern publishable key is accepted, never a service-role/secret key.
  if (!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key))
    throw new Error(
      'Use a Supabase publishable key (sb_publishable_), never a secret or service-role key.',
    );
  return { authMode: mode, supabase: { url, publishableKey: key } };
}
export function supabaseAuth(config: AppConfig): AuthAdapter {
  if (!config.supabase) throw new Error('Supabase configuration is required.');
  const client = createClient(config.supabase.url, config.supabase.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) },
  });
  return {
    async verify(token) {
      // getUser makes a server-to-server validation request; never trust decoded user metadata/roles.
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user)
        throw new AppError(
          error?.name === 'AuthRetryableFetchError' || (error?.status && error.status >= 500)
            ? 503
            : 401,
          'Sign-in could not be verified. Please try again.',
        );
      if (!data.user.email_confirmed_at)
        throw new AppError(403, 'Confirm your email before using the marketplace.');
      const display =
        typeof data.user.user_metadata?.name === 'string'
          ? data.user.user_metadata.name.trim().slice(0, 60)
          : 'Neighbour';
      return { id: data.user.id, name: display || 'Neighbour', emailVerified: true };
    },
  };
}
