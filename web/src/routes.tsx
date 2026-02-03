import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './ui/AppShell';
import LoginPage from './ui/LoginPage';
import BookshelfPage from './ui/BookshelfPage';
import SearchPage from './ui/SearchPage';
import BookPage from './ui/BookPage';
import SourcesPage from './ui/SourcesPage';
import RssPage from './ui/RssPage';
import TtsPage from './ui/TtsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/bookshelf" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'bookshelf', element: <BookshelfPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'book', element: <BookPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'rss', element: <RssPage /> },
      { path: 'tts', element: <TtsPage /> },
    ],
  },
]);
