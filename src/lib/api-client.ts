type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(url: string, method: HttpMethod, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(res.status, error.error || error.message || 'Request failed');
  }
  
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, 'GET'),
  post: <T>(url: string, body?: unknown) => request<T>(url, 'POST', body),
  put: <T>(url: string, body?: unknown) => request<T>(url, 'PUT', body),
  delete: <T>(url: string) => request<T>(url, 'DELETE'),
};
