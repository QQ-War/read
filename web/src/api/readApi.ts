import { request } from './client';
import { api } from './endpoints';
import type { ApiResponse, LoginResponse, UserInfo, BookshelfItem, ChapterItem, BookContent, SearchBook } from './types';

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

export const saveBook = (accessToken: string, book: SearchBook, useReplaceRule = 0) =>
  request<ApiResponse>(api.saveBook, {
    method: 'POST',
    query: { accessToken, useReplaceRule },
    body: { book },
  });

export const refreshBook = (accessToken: string, bookUrl: string) =>
  request<ApiResponse>(api.refreshBook, {
    query: { accessToken, bookurl: bookUrl },
  });

export const getBookSources = (accessToken: string, page = 1) =>
  request<ApiResponse>(api.bookSources, {
    query: { accessToken, page },
  });

export const getRssSources = (accessToken: string, page = 1) =>
  request<ApiResponse>(api.rssSources, {
    query: { accessToken, page },
  });

export const getTtsSources = (accessToken: string, page = 1) =>
  request<ApiResponse>(api.ttsSources, {
    query: { accessToken, page },
  });
