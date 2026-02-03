import { useEffect, useState } from 'react';
import { authStore } from '../state/auth';
import { getBookSources } from '../api/readApi';

const SourcesPage = () => {
  const token = authStore.getToken();
  const [status, setStatus] = useState('');
  const [data, setData] = useState<unknown[]>([]);

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setStatus('加载书源...');
      const resp = await getBookSources(token, 1);
      if (resp.isSuccess && resp.data) {
        setData(Array.isArray(resp.data) ? resp.data : [resp.data]);
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
        <h2>书源</h2>
        <span className="status-line">{status}</span>
      </div>
      {data.map((item, idx) => (
        <pre key={idx} className="code-block">{JSON.stringify(item, null, 2)}</pre>
      ))}
    </section>
  );
};

export default SourcesPage;
