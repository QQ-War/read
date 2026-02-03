import { useEffect, useState } from 'react';
import { authStore } from '../state/auth';
import { delBookSource, getBookSourcesNew, getBookSourcesPage, saveBookSources, stopBookSource } from '../api/readApi';

const SourcesPage = () => {
  const token = authStore.getToken();
  const [status, setStatus] = useState('');
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [editor, setEditor] = useState('');

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setStatus('加载书源...');
      const meta = await getBookSourcesPage(token);
      if (!meta.isSuccess || !meta.data) {
        setStatus(meta.errorMsg || '加载失败');
        return;
      }
      const pageCount = Number((meta.data as any).page || 1);
      const md5 = String((meta.data as any).md5 || '');
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, idx) => getBookSourcesNew(token, md5, idx + 1))
      );
      const list: Record<string, any>[] = [];
      pages.forEach((p) => {
        if (p.isSuccess && Array.isArray(p.data)) {
          list.push(...p.data);
        }
      });
      setData(list);
      setStatus('');
    };
    run();
  }, [token]);

  if (!token) {
    return <div className="panel">请先登录。</div>;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>书源</h2>
        <span className="status-line">{status}</span>
      </div>
      <div className="panel-actions">
        <textarea
          className="code-input"
          value={editor}
          onChange={(e) => setEditor(e.target.value)}
          placeholder="粘贴书源 JSON（数组或单条）后点击导入"
        />
        <button
          onClick={async () => {
            if (!token || !editor.trim()) return;
            setStatus('导入中...');
            const resp = await saveBookSources(token, editor.trim());
            setStatus(resp.isSuccess ? '' : resp.errorMsg || '导入失败');
          }}
        >
          导入/更新
        </button>
      </div>
      <div className="list">
        {data.map((item) => (
          <div key={item.bookSourceUrl} className="row">
            <div>
              <div className="title">{item.bookSourceName}</div>
              <div className="muted">{item.bookSourceUrl}</div>
            </div>
            <div className="row-actions">
              <button
                onClick={async () => {
                  if (!token) return;
                  const st = item.enabled ? '0' : '1';
                  const resp = await stopBookSource(token, item.bookSourceUrl, st as '0' | '1');
                  if (!resp.isSuccess) {
                    setStatus(resp.errorMsg || '操作失败');
                    return;
                  }
                  item.enabled = !item.enabled;
                  setData([...data]);
                }}
              >
                {item.enabled ? '停用' : '启用'}
              </button>
              <button
                onClick={async () => {
                  if (!token) return;
                  const resp = await delBookSource(token, item.bookSourceUrl);
                  if (!resp.isSuccess) {
                    setStatus(resp.errorMsg || '删除失败');
                    return;
                  }
                  setData(data.filter((d) => d.bookSourceUrl !== item.bookSourceUrl));
                }}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SourcesPage;
