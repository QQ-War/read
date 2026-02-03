export const API_PREFIX = '/api/v1';

export const api = {
  login: `${API_PREFIX}/login`,
  userInfo: `${API_PREFIX}/getUserInfo`,
  bookshelf: `${API_PREFIX}/getBookshelfNew`,
  bookshelfPage: `${API_PREFIX}/getBookshelfPage`,
  bookInfo: `${API_PREFIX}/getBookinfo`,
  chapterList: `${API_PREFIX}/getChapterListNew`,
  bookContent: `${API_PREFIX}/getBookContentNew`,
  search: `${API_PREFIX}/searchBook`,
  saveProgress: `${API_PREFIX}/saveBookProgress`,
  saveBook: `${API_PREFIX}/saveBook`,
  refreshBook: `${API_PREFIX}/refreshBook`,
  bookSources: `${API_PREFIX}/getBookSourcesNew`,
  rssSources: `${API_PREFIX}/getRssSourcessNew`,
  ttsSources: `${API_PREFIX}/getallttsNew`,
};
