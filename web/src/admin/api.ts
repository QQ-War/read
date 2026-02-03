import { adminFormPost, adminRequest } from './client';

export const adminLogin = (username: string, password: string) =>
  adminFormPost('/admin/login', { username, password });

export const adminLogout = () => adminRequest('/admin/logout');

export const adminSearchUsers = (where: string, page = 1, limit = 20) =>
  adminRequest('/admin/seachusers', undefined, { where, page, limit });

export const adminAddUser = (payload: Record<string, string>) =>
  adminFormPost('/admin/adduser', payload);

export const adminDelUser = (id: string) => adminRequest('/admin/deluser', undefined, { id });

export const adminSearchBookSources = (where: string, page = 1, limit = 20) =>
  adminRequest('/admin/seachbookSource', undefined, { where, page, limit });

export const adminStopBookSource = (id: string, st: '0' | '1') =>
  adminRequest('/admin/stopbookSource', undefined, { id, st });

export const adminDelBookSource = (id: string) => adminRequest('/admin/delbookSource', undefined, { id });

export const adminUploadBookSource = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return adminRequest('/admin/uploadSource', { method: 'POST', body: form });
};

export const adminSearchRssSources = (where: string, page = 1, limit = 20) =>
  adminRequest('/admin/seachrssSource', undefined, { where, page, limit });

export const adminStopRssSource = (id: string, st: '0' | '1') =>
  adminRequest('/admin/stopRssSource', undefined, { id, st });

export const adminDelRssSource = (id: string) => adminRequest('/admin/delRssSource', undefined, { id });

export const adminUploadRssSource = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return adminRequest('/admin/uploadRssSource', { method: 'POST', body: form });
};

export const adminSearchCodes = (where: string, page = 1, limit = 20) =>
  adminRequest('/admin/seachcode', undefined, { where, page, limit });

export const adminAddCodes = (num: number) =>
  adminRequest('/admin/addcode', { method: 'POST' }, { num });

export const adminDelCode = (code: string) => adminRequest('/admin/delcode', undefined, { code });
