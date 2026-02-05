import { useState } from 'react';
import { searchBook, saveBook } from '../../api/readApi';
import { resolveAssetUrl } from '../../utils/assets';
import { authStore } from '../../state/auth';
import type { BookshelfItem } from '../../api/types';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Plus, BookMarked } from 'lucide-react';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const token = authStore.getToken();

  const handleSearch = async () => {
    if (!token || !query.trim()) return;
    setLoading(true);
    setStatus('正在全网搜索...');
    const resp = await searchBook(token, query.trim(), 1);
    if (resp.isSuccess && resp.data) {
      setBooks(resp.data);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '搜索失败');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '60px' }}>
        <BookMarked size={48} className="muted" style={{ marginBottom: '16px' }} />
        <p className="muted">请先登录以使用搜索功能。</p>
      </div>
    );
  }

  return (
    <section>
      <div className="panel-header">
        <h2>发现新书籍</h2>
      </div>

      <div className="panel" style={{ marginBottom: '32px' }}>
        <div className="admin-toolbar" style={{ margin: 0 }}>
          <div className="search-wrapper">
            <SearchIcon size={18} className="icon" />
            <input
              placeholder="输入书名、作者或关键词..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '搜索中...' : '开始搜索'}
          </button>
        </div>
        {status && <div className="status-line" style={{ marginTop: '12px' }}>{status}</div>}
      </div>

      <div className="grid">
        {books.map((book) => (
          <div key={book.bookUrl} className="card">
            <Link to={`/book?bookUrl=${encodeURIComponent(book.bookUrl)}`} className="card-link" style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
              <div className="cover">
                {book.coverUrl ? (
                  <img src={resolveAssetUrl(book.coverUrl)} alt={book.bookName} />
                ) : (
                  <div className="placeholder" />
                )}
              </div>
              <div className="meta">
                <div className="title">{book.bookName || book.name}</div>
                <div className="author">{book.author}</div>
              </div>
            </Link>
            <div className="card-actions" style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
              <button
                className="secondary"
                style={{ width: '100%' }}
                onClick={async (e) => {
                  e.preventDefault();
                  setStatus('正在加入书架...');
                  const payload = {
                    ...book,
                    name: book.bookName || book.name || '',
                    bookName: book.bookName || book.name || '',
                  };
                  const resp = await saveBook(token, payload, 0);
                  setStatus(resp.isSuccess ? '已成功加入' : resp.errorMsg || '加入失败');
                }}
              >
                <Plus size={14} /> 加入书架
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SearchPage;