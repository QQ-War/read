import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getBookInfo,
  getChapterList,
  getBookContent,
  saveBook,
  refreshBook,
  saveBookProgress,
} from '../api/readApi';
import { authStore } from '../state/auth';
import { resolveAssetUrl } from '../utils/assets';
import type { BookshelfItem, ChapterItem } from '../api/types';

const BookPage = () => {
  const [params] = useSearchParams();
  const bookUrl = params.get('bookUrl') || '';
  const token = authStore.getToken();
  const [book, setBook] = useState<BookshelfItem | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [status, setStatus] = useState('');
  const [content, setContent] = useState<string>('');
  const [contentIndex, setContentIndex] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [readerMode, setReaderMode] = useState<'scroll' | 'paged'>('scroll');
  const [jumpIndex, setJumpIndex] = useState('');
  const pagedRef = useRef<HTMLDivElement | null>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });

  const hasAccess = useMemo(() => token && bookUrl, [token, bookUrl]);

  useEffect(() => {
    if (!hasAccess) return;
    const run = async () => {
      setStatus('加载书籍...');
      const [infoResp, chapterResp] = await Promise.all([
        getBookInfo(token, bookUrl),
        getChapterList(token, bookUrl),
      ]);
      if (infoResp.isSuccess && infoResp.data) {
        setBook(infoResp.data);
      }
      if (chapterResp.isSuccess && chapterResp.data) {
        setChapters(chapterResp.data);
      }
      setStatus('');
    };
    run();
  }, [hasAccess, token, bookUrl]);

  const loadChapter = async (index: number) => {
    if (!token) return;
    setStatus('加载章节内容...');
    const resp = await getBookContent(token, bookUrl, index);
    if (resp.isSuccess && resp.data?.content) {
      setContent(resp.data.content);
      setImages(resp.data.images ?? []);
      setContentIndex(index);
      setStatus('');
      await saveBookProgress(token, bookUrl, index);
      setTimeout(() => {
        if (pagedRef.current) {
          pagedRef.current.scrollLeft = 0;
          updatePageInfo();
        }
      }, 0);
      return;
    }
    if (resp.isSuccess && resp.data?.images && resp.data.images.length > 0) {
      setContent('');
      setImages(resp.data.images);
      setContentIndex(index);
      setStatus('');
      await saveBookProgress(token, bookUrl, index);
      return;
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  const updatePageInfo = () => {
    const container = pagedRef.current;
    if (!container) return;
    const width = container.clientWidth || 1;
    const total = Math.max(1, Math.ceil(container.scrollWidth / width));
    const current = Math.min(total, Math.max(1, Math.round(container.scrollLeft / width) + 1));
    setPageInfo({ current, total });
  };

  const scrollPage = (dir: 'prev' | 'next') => {
    const container = pagedRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const next = dir === 'next' ? container.scrollLeft + width : container.scrollLeft - width;
    container.scrollTo({ left: next, behavior: 'smooth' });
    setTimeout(updatePageInfo, 300);
  };

  const handleJump = async () => {
    if (!jumpIndex.trim()) return;
    const target = Number(jumpIndex) - 1;
    if (Number.isNaN(target) || target < 0 || target >= chapters.length) {
      setStatus('章节序号不合法');
      return;
    }
    await loadChapter(target);
  };

  const handleRefresh = async () => {
    if (!token) return;
    setStatus('刷新目录中...');
    const resp = await refreshBook(token, bookUrl);
    if (!resp.isSuccess) {
      setStatus(resp.errorMsg || '刷新失败');
      return;
    }
    const listResp = await getChapterList(token, bookUrl);
    if (listResp.isSuccess && listResp.data) {
      setChapters(listResp.data);
    }
    setStatus('');
  };

  const handleAddShelf = async () => {
    if (!token || !book) return;
    const payload = {
      bookUrl: book.bookUrl,
      name: book.bookName || book.name || '',
      bookName: book.bookName || book.name || '',
      author: book.author || '',
      coverUrl: resolveAssetUrl(book.coverUrl),
      intro: book.intro,
      origin: book.origin || '',
      originName: book.originName || '',
      type: book.type || 0,
      latestChapterTitle: book.latestChapterTitle || book.lastChapterTitle,
      tocUrl: book.tocUrl || '',
    };
    setStatus('加入书架...');
    const resp = await saveBook(token, payload, 0);
    if (!resp.isSuccess) {
      setStatus(resp.errorMsg || '加入失败');
      return;
    }
    setStatus('');
  };

  if (!token) {
    return <div className="panel">请先登录。</div>;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{book?.bookName || book?.name || '书籍详情'}</h2>
        <div className="panel-actions">
          <button onClick={handleRefresh}>刷新目录</button>
          <button onClick={handleAddShelf}>加入书架</button>
          <span className="status-line">{status}</span>
        </div>
      </div>
      <div className="reader-toolbar">
        <div>
          章节进度：{contentIndex !== null ? contentIndex + 1 : '-'} / {chapters.length || '-'}
        </div>
        <div className="jump">
          <input
            value={jumpIndex}
            onChange={(e) => setJumpIndex(e.target.value)}
            placeholder="跳到章节序号"
          />
          <button onClick={handleJump}>跳转</button>
        </div>
        <div className="mode-switch">
          <button onClick={() => setReaderMode('scroll')} disabled={readerMode === 'scroll'}>
            滚动
          </button>
          <button onClick={() => setReaderMode('paged')} disabled={readerMode === 'paged'}>
            分页
          </button>
        </div>
      </div>
      {book && (
        <div className="book-meta">
          <div className="cover small">
            {book.coverUrl ? (
              <img src={resolveAssetUrl(book.coverUrl)} alt={book.bookName || book.name} />
            ) : (
              <div className="placeholder" />
            )}
          </div>
          <div>
            <div className="title">{book.bookName || book.name}</div>
            <div className="author">{book.author}</div>
            <div className="intro">{book.intro}</div>
          </div>
        </div>
      )}
      <div className="chapter-grid">
        {chapters.map((c, idx) => (
          <button
            key={`${c.url}-${idx}`}
            className={contentIndex === idx ? 'active' : ''}
            onClick={() => loadChapter(idx)}
          >
            {c.title}
          </button>
        ))}
      </div>
      <div className="reader-actions">
        <button
          onClick={() => contentIndex !== null && contentIndex > 0 && loadChapter(contentIndex - 1)}
          disabled={contentIndex === null || contentIndex <= 0}
        >
          上一章
        </button>
        <button
          onClick={() =>
            contentIndex !== null && contentIndex < chapters.length - 1 && loadChapter(contentIndex + 1)
          }
          disabled={contentIndex === null || contentIndex >= chapters.length - 1}
        >
          下一章
        </button>
        {readerMode === 'paged' && content && (
          <>
            <button onClick={() => scrollPage('prev')}>上一页</button>
            <button onClick={() => scrollPage('next')}>下一页</button>
            <span className="status-line">
              页 {pageInfo.current} / {pageInfo.total}
            </span>
          </>
        )}
      </div>
      {content && readerMode === 'scroll' && (
        <article className="reader" dangerouslySetInnerHTML={{ __html: content }} />
      )}
      {content && readerMode === 'paged' && (
        <div className="reader-paged" ref={pagedRef} onScroll={updatePageInfo}>
          <article dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
      {!content && images.length > 0 && (
        <div className="image-list">
          {images.map((src, idx) => (
            <img key={`${src}-${idx}`} src={src} alt={`page-${idx + 1}`} />
          ))}
        </div>
      )}
    </section>
  );
};

export default BookPage;
