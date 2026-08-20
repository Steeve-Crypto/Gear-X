import * as SecureStore from 'expo-secure-store';
import { GearXError } from '../../domain/errors';

const STORAGE_KEY = 'gear-x.backend-session.v1';
const EXPIRY_MARGIN_SECONDS = 60;

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface SupabaseAuthPayload {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
}

export interface BackendAuthConfig {
  backendUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export interface SessionStorage {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  remove(): Promise<void>;
}

const secureStorage: SessionStorage = {
  async get() {
    if (!(await SecureStore.isAvailableAsync())) return null;
    return SecureStore.getItemAsync(STORAGE_KEY);
  },
  async set(value) {
    if (!(await SecureStore.isAvailableAsync())) {
      throw new GearXError('UNAUTHORIZED', 'Secure session storage is unavailable.');
    }
    await SecureStore.setItemAsync(STORAGE_KEY, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async remove() {
    if (await SecureStore.isAvailableAsync()) await SecureStore.deleteItemAsync(STORAGE_KEY);
  },
};

function parseSession(payload: SupabaseAuthPayload): AuthSession {
  if (!payload.access_token || !payload.refresh_token) {
    throw new GearXError('UNAUTHORIZED', 'Authentication returned no usable session.');
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_at ?? Math.floor(Date.now() / 1000) + (payload.expires_in ?? 300),
  };
}

export class BackendSessionManager {
  private session: AuthSession | null = null;
  private pending: Promise<string> | null = null;

  constructor(
    private readonly config: BackendAuthConfig,
    private readonly storage: SessionStorage = secureStorage,
    private readonly request: typeof fetch = fetch,
  ) {}

  getAccessToken(): Promise<string> {
    if (!this.pending) {
      this.pending = this.resolveAccessToken().finally(() => { this.pending = null; });
    }
    return this.pending;
  }

  async clear(): Promise<void> {
    this.session = null;
    await this.storage.remove();
  }

  private async resolveAccessToken(): Promise<string> {
    const session = this.session ?? await this.load();
    const now = Math.floor(Date.now() / 1000);
    if (session && session.expiresAt > now + EXPIRY_MARGIN_SECONDS) return session.accessToken;
    if (session?.refreshToken) {
      try {
        return await this.refresh(session.refreshToken);
      } catch {
        await this.clear();
      }
    }
    return this.signInAnonymously();
  }

  private async load(): Promise<AuthSession | null> {
    const stored = await this.storage.get();
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as AuthSession;
      if (!parsed.accessToken || !parsed.refreshToken || !Number.isFinite(parsed.expiresAt)) return null;
      this.session = parsed;
      return parsed;
    } catch {
      await this.storage.remove();
      return null;
    }
  }

  private async authRequest(path: string, body: Record<string, unknown>): Promise<AuthSession> {
    const response = await this.request(`${this.config.supabaseUrl}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: this.config.supabasePublishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new GearXError('UNAUTHORIZED', 'Authentication is unavailable.');
    return parseSession(await response.json() as SupabaseAuthPayload);
  }

  private async saveAndValidate(session: AuthSession): Promise<string> {
    const response = await this.request(`${this.config.backendUrl}/v1/mobile/session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        apikey: this.config.supabasePublishableKey,
      },
    });
    if (!response.ok) throw new GearXError('UNAUTHORIZED', 'Backend rejected the authenticated session.');
    const result = await response.json() as { token?: string };
    if (result.token !== session.accessToken) {
      throw new GearXError('UNAUTHORIZED', 'Backend returned an invalid session.');
    }
    this.session = session;
    await this.storage.set(JSON.stringify(session));
    return session.accessToken;
  }

  private async signInAnonymously(): Promise<string> {
    const session = await this.authRequest('signup', { data: { gear_x_client: 'mobile' } });
    return this.saveAndValidate(session);
  }

  private async refresh(refreshToken: string): Promise<string> {
    const session = await this.authRequest('token?grant_type=refresh_token', {
      refresh_token: refreshToken,
    });
    return this.saveAndValidate(session);
  }
}

