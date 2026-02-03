export interface ApiResponse<T = unknown> {
  isSuccess: boolean;
  errorMsg?: string;
  data?: T;
}

export interface LoginResponse {
  accessToken: string;
  username: string;
}

export interface UserInfo {
  username: string;
  lastLoginAt?: number;
  enableBookSource?: boolean;
  enableLocalStore?: boolean;
}

export interface BookshelfItem {
  bookUrl: string;
  bookName: string;
  author?: string;
  coverUrl?: string;
  lastChapterTitle?: string;
  durChapterTitle?: string;
  intro?: string;
  type?: number;
}

export interface ChapterItem {
  title: string;
  url: string;
  index?: number;
  isVip?: boolean;
  updateTime?: string;
}

export interface BookContent {
  content?: string;
  type?: number;
  images?: string[];
}
