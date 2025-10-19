import { apiFetch } from  '../../src/utils/api';
import config from '../../src/config';
import { Response } from 'node-fetch';

global.fetch = jest.fn();

describe('apiFetch', () => {
  const mockFetch = fetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should prepend BACKEND_URL for relative endpoints', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      `${config.BACKEND_URL}/users`,
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('should not prepend BACKEND_URL for absolute endpoints', async () => {
    const endpoint = 'https://external-api.com/data';
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch(endpoint);

    expect(mockFetch).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('should include Content-Type: application/json when body is present', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/submit', {
      method: 'POST',
      body: JSON.stringify({ name: 'Mirth' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${config.BACKEND_URL}/submit`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      })
    );
  });

  it('should not include Content-Type when no body is present', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/ping', { method: 'GET' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Content-Type');
  });

  it('should merge custom headers correctly', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/merge', {
      method: 'POST',
      body: JSON.stringify({ data: 1 }),
      headers: {
        Authorization: 'Bearer abc123',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${config.BACKEND_URL}/merge`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer abc123',
        }),
      })
    );
  });

  it('should return the Response object from fetch', async () => {
    const mockResponse = new Response('done');
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await apiFetch('/something');
    expect(result).toBe(mockResponse);
  });
});
