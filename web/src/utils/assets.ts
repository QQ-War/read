import { API_PREFIX } from '../api/endpoints';
import { authStore } from '../state/auth';

export const resolveAssetUrl = (raw?: string | null): string | undefined => {
  if (!raw) return undefined;
  const token = authStore.getToken();
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  let path: string | null = null;
  if (trimmed.startsWith('/assets/')) {
    path = trimmed;
  } else if (trimmed.startsWith('assets/')) {
    path = `/${trimmed}`;
  } else if (trimmed.startsWith('http://assets/') || trimmed.startsWith('https://assets/')) {
    const idx = trimmed.indexOf('/assets/');
    if (idx >= 0) path = trimmed.substring(idx);
  }

  if (!path) return trimmed;
  const encodedPath = encodeURIComponent(path);
  const encodedToken = encodeURIComponent(token || '');
  return `${API_PREFIX}/assets?path=${encodedPath}&accessToken=${encodedToken}`;
};
