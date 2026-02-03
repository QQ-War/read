import { useEffect, useState } from 'react';
import { getBookshelf } from '../api/readApi';
import { authStore } from '../state/auth';
import type { BookshelfItem } from '../api/types';
import { Link } from 'react-router-dom';

const BookshelfPage = () => {
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [status, setStatus] = useState('');
  const token = authStore.getToken();

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setStatus('加载书架...');
      const resp = await getBookshelf(token, 1);
      if (resp.isSuccess && resp.data) {
        setBooks(resp.data);
        setStatus('');
      } else {
        setStatus(resp.errorMsg || '加载失败');
      }
    };
    run();
  }, [token]);

  if (!token) {
    return <div className="panel">请先登录。</div>;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>书架</h2>
        <span className="status-line">{status}</span>
      </div>
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

export default BookshelfPage;
