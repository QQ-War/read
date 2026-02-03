import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { authStore } from '../state/auth';
import './AppShell.css';

const AppShell = () => {
  const navigate = useNavigate();
  const token = authStore.getToken();

  const handleLogout = () => {
    authStore.clear();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="shell-nav">
        <div className="brand">Read Web</div>
        <nav>
          <NavLink to="/bookshelf">书架</NavLink>
          <NavLink to="/search">搜索</NavLink>
        </nav>
        <div className="shell-footer">
          {token ? (
            <button onClick={handleLogout} className="ghost">退出</button>
          ) : (
            <button onClick={() => navigate('/login')} className="ghost">登录</button>
          )}
        </div>
      </aside>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
