import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getBookInfo,
  getChapterList,
  getBookContent,
  refreshBook,
  saveBookProgress,
} from '../../api/readApi';
import { authStore } from '../../state/auth';
import { resolveAssetUrl } from '../../utils/assets';
import type { BookshelfItem, ChapterItem } from '../../api/types';
import { 
  ArrowLeft, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Plus, 
  List
} from 'lucide-react';

const BookPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookUrl = params.get('bookUrl') || '';
  const token = authStore.getToken();
  const [book, setBook] = useState<BookshelfItem | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [contentIndex, setContentIndex] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const hasAccess = useMemo(() => token && bookUrl, [token, bookUrl]);

  useEffect(() => {
    if (!hasAccess) return;
    const run = async () => {
      setLoading(true);
      const infoResp = await getBookInfo(token, bookUrl);
      if (infoResp.isSuccess && infoResp.data) {
        setBook(infoResp.data);
      }
      const sourceUrl = infoResp.isSuccess && infoResp.data?.origin ? infoResp.data.origin : undefined;
      const chapterResp = await getChapterList(token, bookUrl, sourceUrl, infoResp.data?.bookName || infoResp.data?.name);
      if (chapterResp.isSuccess && chapterResp.data) {
        setChapters(chapterResp.data);
      }
      setLoading(false);
    };
    run();
  }, [hasAccess, token, bookUrl]);

  const loadChapter = async (index: number) => {
    if (!token) return;
    setLoading(true);
    setStatus('正在加载...');
    const sourceUrl = book?.origin;
    const resp = await getBookContent(token, bookUrl, index, sourceUrl, book?.bookName || book?.name);
    if (resp.isSuccess && resp.data) {
      setContent(resp.data.content || resp.data.text || '');
      setImages(resp.data.images ?? []);
      setContentIndex(index);
      setStatus('');
      await saveBookProgress(token, bookUrl, index);
      window.scrollTo(0, 0);
      setShowDrawer(false);
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!token) return;
    setLoading(true);
    setStatus('刷新中...');
    const resp = await refreshBook(token, bookUrl);
    if (resp.isSuccess) {
      const listResp = await getChapterList(token, bookUrl, book?.origin, book?.bookName || book?.name);
      if (listResp.isSuccess && listResp.data) {
        setChapters(listResp.data);
      }
      setStatus('已更新');
    } else {
      setStatus(resp.errorMsg || '刷新失败');
    }
    setLoading(false);
  };

  if (!token) return <div className="panel">请先登录。</div>;

  if (contentIndex !== null) {
    return (
      <div className="reader-view">
        <div className={`reader-nav-overlay ${showDrawer ? 'visible' : ''}`} onClick={() => setShowDrawer(false)} />
        <div className={`reader-drawer ${showDrawer ? 'open' : ''}`}>
          <div className="drawer-header">
            <h3>目录 ({chapters.length})</h3>
            <button className="ghost" onClick={() => setShowDrawer(false)}>关闭</button>
          </div>
          <div className="drawer-content">
            {chapters.map((c, idx) => (
              <button
                key={idx}
                className={`chapter-list-item ${contentIndex === idx ? 'active' : ''}`}
                onClick={() => loadChapter(idx)}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-header reader-toolbar-top" style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10, padding: '12px 0' }}>
          <button className="secondary" onClick={() => setContentIndex(null)}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', margin: '0 12px' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }} className="muted">
              {chapters[contentIndex]?.title}
            </h2>
          </div>
          <button className="secondary" onClick={() => setShowDrawer(true)}>
            <List size={18} />
          </button>
        </div>

        <div className="reader-container panel">
          {content ? (
            <article className="reader-content" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="image-list">
              {images.map((src, idx) => <img key={idx} src={src} alt="" style={{ width: '100%', marginBottom: '12px', borderRadius: '8px' }} />)}
            </div>
          )}
        </div>

        <div className="reader-bar">
          <button className="ghost" disabled={contentIndex <= 0} onClick={() => loadChapter(contentIndex - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '60px', textAlign: 'center' }}>
            {contentIndex + 1} / {chapters.length}
          </span>
          <button className="ghost" disabled={contentIndex >= chapters.length - 1} onClick={() => loadChapter(contentIndex + 1)}>
            <ChevronRight size={18} />
          </button>
          <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 8px' }} />
          <button className="ghost" onClick={() => setShowDrawer(true)}>
            <Menu size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="secondary" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <h2>书籍详情</h2>
        </div>
        <div className="panel-actions">
          <button className="secondary" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            刷新
          </button>
          <button onClick={() => { /* 加入逻辑 */ }}><Plus size={16} />加入书架</button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        {book && (
          <div className="book-meta">
            <div className="cover" style={{ width: '140px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
              <img src={resolveAssetUrl(book.coverUrl)} alt="" />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{book.bookName || book.name}</h1>
              <div className="author" style={{ fontSize: '1rem', marginBottom: '16px' }}>{book.author}</div>
              <p className="intro" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{book.intro}</p>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>目录列表</h3>
          <span className="status-line">{status}</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {chapters.map((c, idx) => (
            <button key={idx} className="chapter-list-item" onClick={() => loadChapter(idx)} style={{ border: '1px solid var(--border)', marginBottom: 0 }}>
              {c.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookPage;
