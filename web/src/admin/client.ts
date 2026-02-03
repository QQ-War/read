export interface AdminResponse<T = unknown> {
  code?: number;
  errorMsg?: string;
  isSuccess?: boolean;
  data?: T;
  count?: number;
  page?: number;
}

const buildQuery = (query?: Record<string, string | number | boolean | undefined | null>) => {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });
  const str = params.toString();
  return str ? `?${str}` : '';
};

export async function adminRequest<T>(path: string, options: RequestInit = {}, query?: Record<string, any>): Promise<AdminResponse<T>> {
  const queryStr = buildQuery(query);
  const response = await fetch(`${path}${queryStr}`, {
    credentials: 'include',
    ...options,
  });
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<AdminResponse<T>>;
  }
  const text = await response.text();
  return {
    code: response.status,
    errorMsg: text || 'Non-JSON response',
  };
}

export async function adminFormPost<T>(path: string, form: Record<string, string | number>): Promise<AdminResponse<T>> {
  const body = new URLSearchParams();
  Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
  return adminRequest<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
}
