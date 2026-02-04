import { useMemo, useState } from 'react';
import './App.css';
import { login, getBookshelf, searchBook } from './api/readApi';
import { resolveAssetUrl } from './utils/assets';
import type { BookshelfItem } from './api/types';

function App() {
  const [accessToken, setAccessToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const isLoggedIn = useMemo(() => accessToken.length > 0, [accessToken]);

  const handleLogin = async () => {
    setStatus('登录中...');
    const resp = await login(username.trim(), password);
    if (resp.isSuccess && resp.data?.accessToken) {
      setAccessToken(resp.data.accessToken);
      setStatus('登录成功');
    } else {
      setStatus(resp.errorMsg || '登录失败');
    }
  };

  const loadBookshelf = async () => {
    setStatus('加载书架...');
    const resp = await getBookshelf(accessToken, 1);
    if (resp.isSuccess && resp.data) {
      setBooks(resp.data);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setStatus('搜索中...');
    const resp = await searchBook(accessToken, query.trim(), 1);
    if (resp.isSuccess && resp.data) {
      setBooks(resp.data);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '搜索失败');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Read Web</h1>
        <div className="status">{status}</div>
      </header>
      {!isLoggedIn ? (
        <section className="panel">
          <h2>登录</h2>
          <div className="form-row">
            <label>账号</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-row">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button onClick={handleLogin}>登录</button>
        </section>
      ) : (
        <section className="panel">
          <div className="toolbar">
            <button onClick={loadBookshelf}>书架</button>
            <div className="search">
              <input
                placeholder="搜索书名"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={runSearch}>搜索</button>
            </div>
          </div>
          <div className="grid">
            {books.map((book) => (
              <div key={book.bookUrl} className="card">
                <div className="cover">
                  {book.coverUrl ? (
                    <img src={resolveAssetUrl(book.coverUrl)} alt={book.bookName} />
                  ) : (
                    <div className="placeholder" />
                  )}
                </div>
                <div className="meta">
                  <div className="title">{book.bookName}</div>
                  <div className="author">{book.author}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
