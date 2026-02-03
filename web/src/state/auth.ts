const TOKEN_KEY = 'read.accessToken';

export const authStore = {
  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || '';
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
