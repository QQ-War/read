import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBookInfo, getChapterList, getBookContent } from '../api/readApi';
import { authStore } from '../state/auth';
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
      setContentIndex(index);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  if (!token) {
    return <div className="panel">请先登录。</div>;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{book?.bookName || '书籍详情'}</h2>
        <span className="status-line">{status}</span>
      </div>
      {book && (
        <div className="book-meta">
          <div className="cover small">
            {book.coverUrl ? <img src={book.coverUrl} alt={book.bookName} /> : <div className="placeholder" />}
          </div>
          <div>
            <div className="title">{book.bookName}</div>
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
      {content && (
        <article className="reader" dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </section>
  );
};

export default BookPage;
