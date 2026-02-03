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

  const [editUser, setEditUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState<Record<string, string>>({
    id: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    source: '0',
    AllowUpTxt: 'false',
    AllowCache: 'false',
    AllowImg: 'false',
    Allowcheck: 'false',
    comment: '',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');

  const [sources, setSources] = useState<any[]>([]);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceEditor, setSourceEditor] = useState('');

  const [rssSources, setRssSources] = useState<any[]>([]);
  const [rssQuery, setRssQuery] = useState('');
  const [rssFile, setRssFile] = useState<File | null>(null);
  const [rssEditor, setRssEditor] = useState('');

  const [codes, setCodes] = useState<any[]>([]);
  const [codeQuery, setCodeQuery] = useState('');
  const [codeNum, setCodeNum] = useState('1');
  const parseJsonEditor = (text: string): { ok: true; json: string } | { ok: false; error: string } => {
    if (!text.trim()) {
      return { ok: false, error: '内容为空' };
    }
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, error: 'JSON 必须为对象或数组' };
      }
      return { ok: true, json: JSON.stringify(parsed, null, 2) };
    } catch (error: any) {
      return { ok: false, error: `JSON 解析失败：${error?.message || '格式错误'}` };
    }
  };

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
        <span className="helper">仅管理员账号可操作管理功能。</span>
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
                  <button
                    onClick={() => {
                      setEditUser(u);
                      setUserForm({
                        id: u.id || '',
                        username: u.username || '',
                        password: '',
                        email: u.email || '',
                        phone: u.phone || '',
                        source: String(u.source ?? 0),
                        AllowUpTxt: String(u.allowUpTxt ?? u.AllowUpTxt ?? false),
                        AllowCache: String(u.allowCache ?? u.AllowCache ?? false),
                        AllowImg: String(u.allowImg ?? u.AllowImg ?? false),
                        Allowcheck: String(u.allowcheck ?? u.Allowcheck ?? false),
                        comment: u.comment || '',
                      });
                    }}
                  >
                    编辑
                  </button>
                  <button onClick={() => adminDelUser(u.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-editor">
            <h4>{editUser ? '编辑用户' : '新增用户'}</h4>
            <div className="form-grid">
              <input
                placeholder="用户名"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
              <input
                placeholder="密码(编辑时可留空)"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
              <input
                placeholder="邮箱"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
              <input
                placeholder="手机"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
              <input
                placeholder="来源(source)"
                value={userForm.source}
                onChange={(e) => setUserForm({ ...userForm, source: e.target.value })}
              />
              <input
                placeholder="备注"
                value={userForm.comment}
                onChange={(e) => setUserForm({ ...userForm, comment: e.target.value })}
              />
            </div>
            <div className="form-grid">
              <label>
                <input
                  type="checkbox"
                  checked={userForm.AllowUpTxt === 'true'}
                  onChange={(e) => setUserForm({ ...userForm, AllowUpTxt: String(e.target.checked) })}
                />
                允许上传
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={userForm.AllowCache === 'true'}
                  onChange={(e) => setUserForm({ ...userForm, AllowCache: String(e.target.checked) })}
                />
                允许缓存
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={userForm.AllowImg === 'true'}
                  onChange={(e) => setUserForm({ ...userForm, AllowImg: String(e.target.checked) })}
                />
                允许图片
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={userForm.Allowcheck === 'true'}
                  onChange={(e) => setUserForm({ ...userForm, Allowcheck: String(e.target.checked) })}
                />
                允许校验
              </label>
            </div>
            <div className="admin-toolbar">
              <button
                onClick={async () => {
                  if (!userForm.username.trim()) {
                    setStatus('用户名不能为空');
                    return;
                  }
                  setStatus(editUser ? '保存中...' : '新增中...');
                  const resp = await adminAddUser(userForm);
                  setStatus(resp.isSuccess ? '' : resp.errorMsg || '保存失败');
                  if (resp.isSuccess) {
                    setEditUser(null);
                    await loadUsers();
                  }
                }}
              >
                {editUser ? '保存' : '新增'}
              </button>
              {editUser && (
                <button onClick={() => setEditUser(null)}>取消编辑</button>
              )}
            </div>
            <div className="helper">密码留空将保持原有密码不变。</div>
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
          <textarea
            className="code-input"
            placeholder="编辑书源 JSON（单条），点击保存"
            value={sourceEditor}
            onChange={(e) => setSourceEditor(e.target.value)}
          />
          <button
            onClick={async () => {
              const parsed = parseJsonEditor(sourceEditor);
              if (!parsed.ok) {
                setStatus(parsed.error || 'JSON 解析失败');
                return;
              }
              const file = new File([parsed.json], 'source.json', { type: 'application/json' });
              const resp = await adminUploadBookSource(file);
              setStatus(resp.isSuccess ? '' : resp.errorMsg || '保存失败');
              await loadSources();
            }}
          >
            保存编辑
          </button>
          <div className="helper">支持单条书源 JSON，保存前会自动格式化。</div>
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
                    onClick={() => {
                      setSourceEditor(JSON.stringify(s, null, 2));
                    }}
                  >
                    编辑
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
          <textarea
            className="code-input"
            placeholder="编辑 RSS JSON（单条），点击保存"
            value={rssEditor}
            onChange={(e) => setRssEditor(e.target.value)}
          />
          <button
            onClick={async () => {
              const parsed = parseJsonEditor(rssEditor);
              if (!parsed.ok) {
                setStatus(parsed.error || 'JSON 解析失败');
                return;
              }
              const file = new File([parsed.json], 'rss.json', { type: 'application/json' });
              const resp = await adminUploadRssSource(file);
              setStatus(resp.isSuccess ? '' : resp.errorMsg || '保存失败');
              await loadRss();
            }}
          >
            保存编辑
          </button>
          <div className="helper">支持单条 RSS JSON，保存前会自动格式化。</div>
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
                    onClick={() => {
                      setRssEditor(JSON.stringify(s, null, 2));
                    }}
                  >
                    编辑
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
                if (num <= 0) {
                  setStatus('数量必须大于 0');
                  return;
                }
                const resp = await adminAddCodes(num);
                setStatus(resp.isSuccess ? '' : resp.errorMsg || '生成失败');
                await loadCodes();
              }}
            >
              生成注册码
            </button>
            <span className="helper">建议一次生成 1-100 个。</span>
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
