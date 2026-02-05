import { useEffect, useState } from 'react';
import { authStore } from '../../state/auth';
import { addTts, delTts, getTtsSourcesNew, getTtsSourcesPage } from '../../api/readApi';

const TtsPage = () => {
  const token = authStore.getToken();
  const [status, setStatus] = useState('');
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [editor, setEditor] = useState('');

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setStatus('加载 TTS ...');
      const meta = await getTtsSourcesPage(token);
      if (!meta.isSuccess || !meta.data) {
        setStatus(meta.errorMsg || '加载失败');
        return;
      }
      const pageCount = Number((meta.data as any).page || 1);
      const md5 = String((meta.data as any).md5 || '');
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, idx) => getTtsSourcesNew(token, md5, idx + 1))
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
        <h2>TTS</h2>
        <span className="status-line">{status}</span>
      </div>
      <div className="panel-actions">
        <textarea
          className="code-input"
          value={editor}
          onChange={(e) => setEditor(e.target.value)}
          placeholder="粘贴 TTS JSON（单条）后点击新增/更新"
        />
        <button
          onClick={async () => {
            if (!token || !editor.trim()) return;
            setStatus('保存中...');
            try {
              const payload = JSON.parse(editor.trim());
              const resp = await addTts(token, payload);
              setStatus(resp.isSuccess ? '' : resp.errorMsg || '保存失败');
            } catch (err) {
              setStatus('JSON 格式错误');
            }
          }}
        >
          新增/更新
        </button>
      </div>
      <div className="list">
        {data.map((item) => (
          <div key={item.id} className="row">
            <div>
              <div className="title">{item.name}</div>
              <div className="muted">{item.url}</div>
            </div>
            <div className="row-actions">
              <button
                onClick={() => {
                  setEditor(JSON.stringify(item, null, 2));
                }}
              >
                编辑
              </button>
              <button
                onClick={async () => {
                  if (!token) return;
                  const resp = await delTts(token, item.id);
                  if (!resp.isSuccess) {
                    setStatus(resp.errorMsg || '删除失败');
                    return;
                  }
                  setData(data.filter((d) => d.id !== item.id));
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

export default TtsPage;
