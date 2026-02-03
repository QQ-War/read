import { useState } from 'react';
import { searchBook, saveBook } from '../api/readApi';
import { resolveAssetUrl } from '../utils/assets';
import { authStore } from '../state/auth';
import type { BookshelfItem } from '../api/types';
import { Link } from 'react-router-dom';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [status, setStatus] = useState('');
  const token = authStore.getToken();

  const handleSearch = async () => {
    if (!token) return;
    setStatus('搜索中...');
    const resp = await searchBook(token, query.trim(), 1);
    if (resp.isSuccess && resp.data) {
      setBooks(resp.data);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '搜索失败');
    }
  };

  if (!token) {
    return <div className="panel">请先登录。</div>;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>搜索</h2>
        <div className="search">
          <input
            placeholder="搜索书名"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleSearch}>搜索</button>
        </div>
      </div>
      <div className="status-line">{status}</div>
      <div className="grid">
        {books.map((book) => (
          <div key={book.bookUrl} className="card">
            <Link to={`/book?bookUrl=${encodeURIComponent(book.bookUrl)}`} className="card-link">
              <div className="cover">
                {book.coverUrl ? (
                  <img src={resolveAssetUrl(book.coverUrl)} alt={book.bookName || book.name} />
                ) : (
                  <div className="placeholder" />
                )}
              </div>
              <div className="meta">
                <div className="title">{book.bookName || book.name}</div>
                <div className="author">{book.author}</div>
              </div>
            </Link>
            <div className="card-actions">
              <button
                onClick={async () => {
                  if (!token) return;
                  setStatus('加入书架...');
                  const payload = {
                    ...book,
                    name: book.bookName || book.name || '',
                    bookName: book.bookName || book.name || '',
                  };
                  const resp = await saveBook(token, payload, 0);
                  setStatus(resp.isSuccess ? '' : resp.errorMsg || '加入失败');
                }}
              >
                加入书架
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SearchPage;
