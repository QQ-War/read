import { useEffect, useState } from 'react';
import {
  adminLogin,
  adminLogout,
  adminSearchUsers,
  adminDelUser,
  adminSearchBookSources,
  adminStopBookSource,
} from '../../admin/api';
import { 
  Users, 
  Database, 
  Rss, 
  Key, 
  LogOut, 
  ShieldCheck, 
  Search, 
  Plus, 
  RefreshCw,
  Home,
  FileJson
} from 'lucide-react';
import '../../styles/admin.css';

const AdminPage = () => {
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState<'users' | 'sources' | 'rss' | 'codes'>('users');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceEditor, setSourceEditor] = useState('');
  
  const adminTabs = [
    { key: 'users', label: '用户管理', icon: Users },
    { key: 'sources', label: '书源管理', icon: Database },
    { key: 'rss', label: 'RSS 管理', icon: Rss },
    { key: 'codes', label: '注册码管理', icon: Key },
  ];

  const handleLogin = async () => {
    setStatus('登录中...');
    const resp = await adminLogin(adminUser, adminPass);
    if (resp.isSuccess) {
      setIsLoggedIn(true);
      setStatus('');
    } else {
      setStatus(resp.errorMsg || '登录失败');
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsLoggedIn(false);
    setStatus('已退出登录');
  };

  const loadUsers = async () => {
    const resp = await adminSearchUsers(userQuery, 1, 50);
    if (resp.data) setUsers(resp.data as any[]);
  };

  const loadSources = async () => {
    const resp = await adminSearchBookSources(sourceQuery, 1, 100);
    if (resp.data) setSources(resp.data as any[]);
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (tab === 'users') loadUsers();
      if (tab === 'sources') loadSources();
    }
  }, [isLoggedIn, tab]);

  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="panel admin-login-card">
          <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h2>管理系统</h2>
          <p className="muted">仅限管理员访问</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <input 
              placeholder="管理员账号" 
              value={adminUser} 
              onChange={(e) => setAdminUser(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="管理员密码" 
              value={adminPass} 
              onChange={(e) => setAdminPass(e.target.value)} 
            />
            <button style={{ padding: '12px' }} onClick={handleLogin}>验证并登录</button>
            <button className="ghost" onClick={() => window.location.href = '/new/'}>
              <Home size={16} /> 返回主站
            </button>
          </div>
          {status && <div className="status-line" style={{ marginTop: '16px', color: 'var(--danger)' }}>{status}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <ShieldCheck color="var(--primary)" />
          <span>控制中心</span>
        </div>
        
        <nav className="admin-nav">
          {adminTabs.map(t => (
            <button 
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`admin-nav-item ${tab === t.key ? 'active' : ''}`}
            >
              <t.icon size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={handleLogout}>
            <LogOut size={18} /> <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          <div className="panel-header">
            <h2>{adminTabs.find(t => t.key === tab)?.label}</h2>
            <span className="status-line">{status}</span>
          </div>

          {tab === 'users' && (
            <div className="admin-section">
              <div className="panel" style={{ marginBottom: '24px' }}>
                <div className="admin-toolbar">
                  <div className="search-wrapper">
                    <Search size={18} className="icon" />
                    <input 
                      placeholder="搜索用户名或邮箱..." 
                      value={userQuery} 
                      onChange={(e) => setUserQuery(e.target.value)} 
                    />
                  </div>
                  <button onClick={loadUsers} className="secondary">
                    <RefreshCw size={16} /> 刷新
                  </button>
                </div>
              </div>
              
              <div className="panel" style={{ padding: 0 }}>
                <div className="list">
                  {users.length > 0 ? users.map((u) => (
                    <div key={u.id} className="admin-table-row">
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.username}</div>
                        <div className="muted" style={{ fontSize: '0.8125rem' }}>
                          {u.email || '无邮箱'} · ID: {u.id}
                        </div>
                      </div>
                      <div className="row-actions">
                        <button className="secondary">编辑</button>
                        <button className="danger" onClick={() => adminDelUser(u.id)}>删除</button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '40px' }} className="muted">
                      暂无数据，请尝试刷新
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'sources' && (
            <div className="admin-section">
              <div className="panel" style={{ marginBottom: '24px' }}>
                <div className="admin-toolbar">
                  <div className="search-wrapper">
                    <Search size={18} className="icon" />
                    <input 
                      placeholder="搜索书源名称..." 
                      value={sourceQuery} 
                      onChange={(e) => setSourceQuery(e.target.value)} 
                    />
                  </div>
                  <button onClick={loadSources} className="secondary"><RefreshCw size={16} /> 刷新</button>
                  <label className="secondary" style={{ cursor: 'pointer' }}>
                    <Plus size={16} /> 导入 JSON
                    <input type="file" hidden />
                  </label>
                </div>
              </div>
              <div className="panel" style={{ marginBottom: '24px' }}>
                <textarea 
                  className="code-input" 
                  style={{ height: '160px', fontFamily: 'monospace' }} 
                  placeholder="在此粘贴书源 JSON..." 
                  value={sourceEditor} 
                  onChange={(e) => setSourceEditor(e.target.value)} 
                />
                <button><FileJson size={16} /> 保存书源</button>
              </div>
              <div className="panel" style={{ padding: 0 }}>
                <div className="list">
                  {sources.map(s => (
                    <div key={s.bookSourceUrl} className="admin-table-row">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{s.bookSourceName}</div>
                        <div className="muted" style={{ fontSize: '0.8125rem' }}>{s.bookSourceUrl}</div>
                      </div>
                      <div className="row-actions">
                        <button className="secondary" onClick={() => setSourceEditor(JSON.stringify(s, null, 2))}>编辑</button>
                        <button 
                          className={s.enabled ? 'danger' : ''} 
                          onClick={() => adminStopBookSource(s.bookSourceUrl, s.enabled ? '0' : '1')}
                          style={!s.enabled ? { background: 'var(--success)' } : {}}
                        >
                          {s.enabled ? '停用' : '启用'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {(tab === 'rss' || tab === 'codes') && (
            <div className="panel" style={{ padding: '80px 0', textAlign: 'center' }}>
              <Database size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <p className="muted">功能开发中...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
