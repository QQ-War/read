import { useState } from 'react';
import { searchBook } from '../api/readApi';
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
          <Link
            key={book.bookUrl}
            to={`/book?bookUrl=${encodeURIComponent(book.bookUrl)}`}
            className="card"
          >
            <div className="cover">
              {book.coverUrl ? <img src={book.coverUrl} alt={book.bookName} /> : <div className="placeholder" />}
            </div>
            <div className="meta">
              <div className="title">{book.bookName}</div>
              <div className="author">{book.author}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SearchPage;
