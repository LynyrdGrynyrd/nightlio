import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from './apiClient';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes a single fetch call per request (retries handled by TanStack Query)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    global.fetch = fetchMock as typeof fetch;

    const result = await client.request<{ ok: boolean }>('/api/health', { method: 'GET' });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws on server errors without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'server exploded' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );

    global.fetch = fetchMock as typeof fetch;

    await expect(
      client.request('/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood: 5 }),
      }),
    ).rejects.toThrow('server exploded');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('includes auth token in request headers when set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    global.fetch = fetchMock as typeof fetch;

    client.setAuthToken('test-token-123');
    await client.request('/api/moods');

    const callHeaders = fetchMock.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBe('Bearer test-token-123');
  });
});
