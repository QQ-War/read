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

export const getChapterList = (accessToken: string, bookUrl: string, bookSourceUrl?: string, bookname?: string) =>
  request<ChapterItem[]>(api.chapterList, {
    query: { accessToken, bookUrl, bookSourceUrl, bookname, useReplaceRule: 1 },
  });

export const getBookContent = (accessToken: string, bookUrl: string, index: number, bookSourceUrl?: string, bookname?: string) =>
  request<BookContent>(api.bookContent, {
    query: { accessToken, bookUrl, index, bookSourceUrl, bookname, useReplaceRule: 1 },
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

export const getBookSourcesPage = (accessToken: string) =>
  request<ApiResponse>(api.bookSourcesPage, {
    query: { accessToken },
  });

export const getBookSourcesNew = (accessToken: string, md5: string, page: number) =>
  request<ApiResponse>(api.bookSources, {
    query: { accessToken, md5, page },
  });

export const getRssSources = (accessToken: string, page = 1) =>
  request<ApiResponse>(api.rssSources, {
    query: { accessToken, page },
  });

export const getRssSourcesPage = (accessToken: string) =>
  request<ApiResponse>(api.rssSourcesPage, {
    query: { accessToken },
  });

export const getRssSourcesNew = (accessToken: string, md5: string, page: number) =>
  request<ApiResponse>(api.rssSources, {
    query: { accessToken, md5, page },
  });

export const getTtsSources = (accessToken: string, page = 1) =>
  request<ApiResponse>(api.ttsSources, {
    query: { accessToken, page },
  });

export const getTtsSourcesPage = (accessToken: string) =>
  request<ApiResponse>(api.ttsSourcesPage, {
    query: { accessToken },
  });

export const getTtsSourcesNew = (accessToken: string, md5: string, page: number) =>
  request<ApiResponse>(api.ttsSources, {
    query: { accessToken, md5, page },
  });

export const stopBookSource = (accessToken: string, id: string, st: '0' | '1') =>
  request<ApiResponse>(api.stopBookSource, {
    query: { accessToken, id, st },
  });

export const delBookSource = (accessToken: string, id: string) =>
  request<ApiResponse>(api.delBookSource, {
    query: { accessToken, id },
  });

export const saveBookSources = (accessToken: string, content: string) =>
  request<ApiResponse>(api.saveBookSources, {
    method: 'POST',
    query: { accessToken },
    body: content,
    headers: { 'Content-Type': 'text/plain' },
  });

export const stopRssSource = (accessToken: string, id: string, st: '0' | '1') =>
  request<ApiResponse>(api.stopRssSource, {
    query: { accessToken, id, st },
  });

export const delRssSource = (accessToken: string, id: string) =>
  request<ApiResponse>(api.delRssSource, {
    query: { accessToken, id },
  });

export const saveRssSources = (accessToken: string, source: string, urls = '') =>
  request<ApiResponse>(api.saveRssSources, {
    query: { accessToken, source, urls },
  });

export const addTts = (accessToken: string, tts: Record<string, unknown>) =>
  request<ApiResponse>(api.addTts, {
    method: 'POST',
    query: { accessToken },
    body: tts,
  });

export const delTts = (accessToken: string, id: string) =>
  request<ApiResponse>(api.delTts, {
    query: { accessToken, id },
  });
