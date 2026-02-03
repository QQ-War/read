import type { ApiResponse } from './types';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

export type HttpMethod = 'GET' | 'POST';

export interface RequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

const buildQuery = (query?: RequestOptions['query']) => {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });
  const str = params.toString();
  return str ? `?${str}` : '';
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const method = options.method ?? 'GET';
  const query = buildQuery(options.query);
  const init: RequestInit = {
    method,
    headers: {
      ...JSON_HEADERS,
      ...(options.headers ?? {}),
    },
    signal: options.signal,
  };

  if (method !== 'GET' && options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${path}${query}`, init);
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<ApiResponse<T>>;
  }

  const text = await response.text();
  return {
    isSuccess: false,
    errorMsg: text || `Unexpected response (${response.status})`,
  } as ApiResponse<T>;
}
