import { apiFetch } from  '../../src/utils/api_quiz';
import config from '../../src/config';
import { Response } from 'node-fetch';
global.fetch = jest.fn();

describe('apiFetch', () => {
  const mockFetch = fetch as jest.Mock;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should prepend BASE_API_URL for relative endpoints', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      `${config.BASE_API_URL}/users`,
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('should not prepend BASE_API_URL for absolute URLs', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    const endpoint = 'https://external-api.com/data';

    await apiFetch(endpoint);

    expect(mockFetch).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('should include Content-Type: application/json for requests with body', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/submit', {
      method: 'POST',
      body: JSON.stringify({ name: 'Mirth' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${config.BASE_API_URL}/submit`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      })
    );
  });

  it('should not include Content-Type if no body is present', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/ping', { method: 'GET' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers).not.toHaveProperty('Content-Type');
  });

  it('should merge custom headers correctly', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await apiFetch('/merge', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        Authorization: 'Bearer token123',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${config.BASE_API_URL}/merge`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        }),
      })
    );
  });

  it('should return the fetch response', async () => {
    const mockResponse = new Response('success');
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await apiFetch('/test');
    expect(result).toBe(mockResponse);
  });
});
