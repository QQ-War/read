import { request } from './client';
import { api } from './endpoints';
import type { ApiResponse, LoginResponse, UserInfo, BookshelfItem, ChapterItem, BookContent } from './types';

export const login = (username: string, password: string) =>
  request<LoginResponse>(api.login, {
    method: 'POST',
    body: { username, password },
  });

export const getUserInfo = (accessToken: string) =>
  request<UserInfo>(api.userInfo, {
    query: { accessToken },
  });

export const getBookshelf = (accessToken: string, page = 1) =>
  request<BookshelfItem[]>(api.bookshelf, {
    query: { accessToken, page },
  });

export const getBookshelfPage = (accessToken: string, page = 1) =>
  request<BookshelfItem[]>(api.bookshelfPage, {
    query: { accessToken, page },
  });

export const getBookInfo = (accessToken: string, bookUrl: string) =>
  request<BookshelfItem>(api.bookInfo, {
    query: { accessToken, bookUrl },
  });

export const getChapterList = (accessToken: string, bookUrl: string) =>
  request<ChapterItem[]>(api.chapterList, {
    query: { accessToken, bookUrl },
  });

export const getBookContent = (accessToken: string, bookUrl: string, index: number) =>
  request<BookContent>(api.bookContent, {
    query: { accessToken, bookUrl, index },
  });

export const searchBook = (accessToken: string, key: string, page = 1) =>
  request<BookshelfItem[]>(api.search, {
    query: { accessToken, key, page },
  });

export const saveBookProgress = (accessToken: string, bookUrl: string, index: number) =>
  request<ApiResponse>(api.saveProgress, {
    method: 'POST',
    body: { accessToken, bookUrl, index },
  });
