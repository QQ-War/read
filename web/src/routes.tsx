import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './ui/user/AppShell';
import LoginPage from './ui/user/LoginPage';
import BookshelfPage from './ui/user/BookshelfPage';
import SearchPage from './ui/user/SearchPage';
import BookPage from './ui/user/BookPage';
import SourcesPage from './ui/user/SourcesPage';
import RssPage from './ui/user/RssPage';
import TtsPage from './ui/user/TtsPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <Navigate to="/bookshelf" replace /> },
        { path: 'index.html', element: <Navigate to="/bookshelf" replace /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'bookshelf', element: <BookshelfPage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 'book', element: <BookPage /> },
        { path: 'sources', element: <SourcesPage /> },
        { path: 'rss', element: <RssPage /> },
        { path: 'tts', element: <TtsPage /> },
      ],
    },
  ],
  { basename: '/new' }
);