
import { useEffect, useState } from 'react';
import { getBookshelf, refreshBook } from '../../api/readApi';
import { resolveAssetUrl } from '../../utils/assets';
import { authStore } from '../../state/auth';
import type { BookshelfItem } from '../../api/types';
import { Link } from 'react-router-dom';
import { RefreshCw, BookMarked, User } from 'lucide-react';

const BookshelfPage = () => {
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const token = authStore.getToken();

  const loadShelf = async () => {
    if (!token) return;
    setLoading(true);
    setStatus('正在加载书架...');
    const resp = await getBookshelf(token, 1);
    if (resp.isSuccess && resp.data) {
      setBooks(resp.data);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    loadShelf();
  }, [token]);

  if (!token) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <BookMarked size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
        <p style={{ color: '#64748b' }}>请先登录以查看您的书架。</p>
      </div>
    );
  }

  return (
    <section>
      <div className="panel-header">
        <h2>我的书架</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="status-line">{status}</span>
          <button 
            className="secondary" 
            onClick={loadShelf} 
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            刷新书架
          </button>
        </div>
      </div>
      <div className="grid">
        {books.map((book) => (
          <Link
            key={book.bookUrl}
            to={`/book?bookUrl=${encodeURIComponent(book.bookUrl)}`}
            className="card"
          >
            <div className="cover">
              {book.coverUrl ? (
                <img src={resolveAssetUrl(book.coverUrl)} alt={book.bookName} loading="lazy" />
              ) : (
                <div className="placeholder" />
              )}
            </div>
            <div className="meta">
              <div className="title">{book.bookName || book.name}</div>
              <div className="author">
                <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {book.author}
              </div>
            </div>
            <div className="card-actions">
              <button
                className="ghost"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!token) return;
                  setStatus('正在刷新书籍...');
                  const resp = await refreshBook(token, book.bookUrl);
                  if (!resp.isSuccess) {
                    setStatus(resp.errorMsg || '刷新失败');
                    return;
                  }
                  await loadShelf();
                }}
              >
                <RefreshCw size={12} />
                更新
              </button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BookshelfPage;
