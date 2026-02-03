import { useMemo, useState } from 'react';
import {
  adminLogin,
  adminLogout,
  adminSearchUsers,
  adminAddUser,
  adminDelUser,
  adminSearchBookSources,
  adminStopBookSource,
  adminDelBookSource,
  adminUploadBookSource,
  adminSearchRssSources,
  adminStopRssSource,
  adminDelRssSource,
  adminUploadRssSource,
  adminSearchCodes,
  adminAddCodes,
  adminDelCode,
} from '../admin/api';

const AdminPage = () => {
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState<'users' | 'sources' | 'rss' | 'codes'>('users');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');

  const [sources, setSources] = useState<any[]>([]);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const [rssSources, setRssSources] = useState<any[]>([]);
  const [rssQuery, setRssQuery] = useState('');
  const [rssFile, setRssFile] = useState<File | null>(null);

  const [codes, setCodes] = useState<any[]>([]);
  const [codeQuery, setCodeQuery] = useState('');
  const [codeNum, setCodeNum] = useState('1');

  const adminTabs = useMemo(
    () => [
      { key: 'users', label: '用户' },
      { key: 'sources', label: '书源' },
      { key: 'rss', label: 'RSS' },
      { key: 'codes', label: '注册码' },
    ],
    []
  );

  const handleLogin = async () => {
    setStatus('登录中...');
    const resp = await adminLogin(adminUser, adminPass);
    if (resp.isSuccess) {
      setStatus('登录成功');
    } else {
      setStatus(resp.errorMsg || '登录失败');
    }
  };

  const loadUsers = async () => {
    setStatus('加载用户...');
    const resp = await adminSearchUsers(userQuery, 1, 50);
    if (resp.data) {
      setUsers(resp.data as any[]);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  const addUser = async () => {
    setStatus('新增用户...');
    const resp = await adminAddUser({ username: adminUser, password: adminPass, email: '' });
    setStatus(resp.isSuccess ? '' : resp.errorMsg || '新增失败');
    if (resp.isSuccess) {
      await loadUsers();
    }
  };

  const loadSources = async () => {
    setStatus('加载书源...');
    const resp = await adminSearchBookSources(sourceQuery, 1, 50);
    if (resp.data) {
      setSources(resp.data as any[]);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  const loadRss = async () => {
    setStatus('加载 RSS ...');
    const resp = await adminSearchRssSources(rssQuery, 1, 50);
    if (resp.data) {
      setRssSources(resp.data as any[]);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  const loadCodes = async () => {
    setStatus('加载注册码...');
    const resp = await adminSearchCodes(codeQuery, 1, 50);
    if (resp.data) {
      setCodes(resp.data as any[]);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '加载失败');
    }
  };

  return (
    <section className="panel admin-panel">
      <div className="panel-header">
        <h2>管理后台</h2>
        <span className="status-line">{status}</span>
      </div>

      <div className="admin-login">
        <input placeholder="管理员账号" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} />
        <input
          type="password"
          placeholder="管理员密码"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
        />
        <button onClick={handleLogin}>登录</button>
        <button onClick={() => adminLogout()}>退出</button>
      </div>

      <div className="admin-tabs">
        {adminTabs.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="admin-section">
          <div className="admin-toolbar">
            <input
              placeholder="搜索用户"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <button onClick={loadUsers}>刷新</button>
          </div>
          <div className="list">
            {users.map((u) => (
              <div key={u.id} className="row">
                <div>
                  <div className="title">{u.username}</div>
                  <div className="muted">{u.email}</div>
                </div>
                <div className="row-actions">
                  <button onClick={() => adminDelUser(u.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-toolbar">
            <button onClick={addUser}>用当前账号/密码新增用户</button>
          </div>
        </div>
      )}

      {tab === 'sources' && (
        <div className="admin-section">
          <div className="admin-toolbar">
            <input
              placeholder="搜索书源"
              value={sourceQuery}
              onChange={(e) => setSourceQuery(e.target.value)}
            />
            <button onClick={loadSources}>刷新</button>
          </div>
          <div className="admin-toolbar">
            <input type="file" onChange={(e) => setSourceFile(e.target.files?.[0] || null)} />
            <button
              onClick={async () => {
                if (!sourceFile) return;
                const resp = await adminUploadBookSource(sourceFile);
                setStatus(resp.isSuccess ? '' : resp.errorMsg || '上传失败');
                await loadSources();
              }}
            >
              上传书源
            </button>
          </div>
          <div className="list">
            {sources.map((s) => (
              <div key={s.bookSourceUrl} className="row">
                <div>
                  <div className="title">{s.bookSourceName}</div>
                  <div className="muted">{s.bookSourceUrl}</div>
                </div>
                <div className="row-actions">
                  <button
                    onClick={async () => {
                      const st = s.enabled ? '0' : '1';
                      await adminStopBookSource(s.bookSourceUrl, st);
                      s.enabled = !s.enabled;
                      setSources([...sources]);
                    }}
                  >
                    {s.enabled ? '停用' : '启用'}
                  </button>
                  <button
                    onClick={async () => {
                      await adminDelBookSource(s.bookSourceUrl);
                      setSources(sources.filter((x) => x.bookSourceUrl !== s.bookSourceUrl));
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'rss' && (
        <div className="admin-section">
          <div className="admin-toolbar">
            <input placeholder="搜索 RSS" value={rssQuery} onChange={(e) => setRssQuery(e.target.value)} />
            <button onClick={loadRss}>刷新</button>
          </div>
          <div className="admin-toolbar">
            <input type="file" onChange={(e) => setRssFile(e.target.files?.[0] || null)} />
            <button
              onClick={async () => {
                if (!rssFile) return;
                const resp = await adminUploadRssSource(rssFile);
                setStatus(resp.isSuccess ? '' : resp.errorMsg || '上传失败');
                await loadRss();
              }}
            >
              上传 RSS
            </button>
          </div>
          <div className="list">
            {rssSources.map((s) => (
              <div key={s.sourceUrl} className="row">
                <div>
                  <div className="title">{s.sourceName}</div>
                  <div className="muted">{s.sourceUrl}</div>
                </div>
                <div className="row-actions">
                  <button
                    onClick={async () => {
                      const st = s.enabled ? '0' : '1';
                      await adminStopRssSource(s.sourceUrl, st);
                      s.enabled = !s.enabled;
                      setRssSources([...rssSources]);
                    }}
                  >
                    {s.enabled ? '停用' : '启用'}
                  </button>
                  <button
                    onClick={async () => {
                      await adminDelRssSource(s.sourceUrl);
                      setRssSources(rssSources.filter((x) => x.sourceUrl !== s.sourceUrl));
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'codes' && (
        <div className="admin-section">
          <div className="admin-toolbar">
            <input placeholder="搜索注册码" value={codeQuery} onChange={(e) => setCodeQuery(e.target.value)} />
            <button onClick={loadCodes}>刷新</button>
          </div>
          <div className="admin-toolbar">
            <input value={codeNum} onChange={(e) => setCodeNum(e.target.value)} />
            <button
              onClick={async () => {
                const num = Number(codeNum) || 1;
                const resp = await adminAddCodes(num);
                setStatus(resp.isSuccess ? '' : resp.errorMsg || '生成失败');
                await loadCodes();
              }}
            >
              生成注册码
            </button>
          </div>
          <div className="list">
            {codes.map((c) => (
              <div key={c.code} className="row">
                <div>
                  <div className="title">{c.code}</div>
                  <div className="muted">{c.used ? '已使用' : '未使用'}</div>
                </div>
                <div className="row-actions">
                  <button
                    onClick={async () => {
                      await adminDelCode(c.code);
                      setCodes(codes.filter((x) => x.code !== c.code));
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminPage;
