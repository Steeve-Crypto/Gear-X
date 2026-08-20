import { BackendSessionManager, SessionStorage } from '../src/infrastructure/auth/backendSession';

function storage(initial: string | null = null): SessionStorage & { value: string | null } {
  return {
    value: initial,
    async get() { return this.value; },
    async set(value) { this.value = value; },
    async remove() { this.value = null; },
  };
}

const config = {
  backendUrl: 'https://project.supabase.co/functions/v1/gear-x',
  supabaseUrl: 'https://project.supabase.co',
  supabasePublishableKey: 'sb_publishable_test',
};

const authPayload = (token = 'access-token') => ({
  access_token: token,
  refresh_token: 'refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3_600,
});

describe('backend mobile authentication', () => {
  test('creates, validates, and securely persists an anonymous session', async () => {
    const saved = storage();
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => authPayload() } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'access-token', userId: 'user-1' }) } as Response);
    const manager = new BackendSessionManager(config, saved, request);

    await expect(manager.getAccessToken()).resolves.toBe('access-token');
    expect(request.mock.calls[0][0]).toBe('https://project.supabase.co/auth/v1/signup');
    expect(request.mock.calls[0][1]).toMatchObject({
      headers: { apikey: 'sb_publishable_test', 'Content-Type': 'application/json' },
    });
    expect(request.mock.calls[1][0]).toContain('/v1/mobile/session');
    expect(request.mock.calls[1][1]).toMatchObject({
      headers: { Authorization: 'Bearer access-token', apikey: 'sb_publishable_test' },
    });
    expect(saved.value).toContain('refresh-token');
    await expect(manager.getIdentity()).resolves.toEqual({ accessToken: 'access-token', userId: 'user-1' });
  });

  test('refreshes an expired session and validates the replacement', async () => {
    const saved = storage(JSON.stringify({
      accessToken: 'expired', refreshToken: 'old-refresh', expiresAt: 1,
    }));
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => authPayload('fresh') } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'fresh', userId: 'user-1' }) } as Response);
    const manager = new BackendSessionManager(config, saved, request);

    await expect(manager.getAccessToken()).resolves.toBe('fresh');
    expect(request.mock.calls[0][0]).toContain('token?grant_type=refresh_token');
    expect(request.mock.calls[0][1]?.body).toContain('old-refresh');
  });

  test('rejects a backend session-token mismatch', async () => {
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => authPayload() } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'different' }) } as Response);
    const manager = new BackendSessionManager(config, storage(), request);
    await expect(manager.getAccessToken()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('coalesces concurrent authentication attempts', async () => {
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => authPayload() } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'access-token', userId: 'user-1' }) } as Response);
    const manager = new BackendSessionManager(config, storage(), request);
    await expect(Promise.all([manager.getAccessToken(), manager.getAccessToken()]))
      .resolves.toEqual(['access-token', 'access-token']);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
