import config from '../config';

/**
 * Wrapper for fetch that automatically includes credentials
 * Use this for all API calls to ensure cookies are sent
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${config.BACKEND_URL}${endpoint}`;

  // Only add Content-Type for POST/PUT/PATCH requests with body
  const hasBody = options.body !== undefined;
  const defaultHeaders: HeadersInit = {};
  
  if (hasBody) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
};
