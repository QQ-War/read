import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './ui/AppShell';
import LoginPage from './ui/LoginPage';
import BookshelfPage from './ui/BookshelfPage';
import SearchPage from './ui/SearchPage';
import BookPage from './ui/BookPage';

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
    ],
  },
]);
