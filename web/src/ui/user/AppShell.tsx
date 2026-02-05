import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { authStore } from '../../state/auth';
import { 
  Library, 
  Search, 
  BookOpen, 
  Rss, 
  LogOut, 
  LogIn,
  Mic2
} from 'lucide-react';
import '../../styles/user.css';

const AppShell = () => {
  const navigate = useNavigate();
  const token = authStore.getToken();

  const handleLogout = () => {
    authStore.clear();
    navigate('/login');
  };

  const navItems = [
    { to: '/bookshelf', label: '书架', icon: Library },
    { to: '/search', label: '搜索', icon: Search },
    { to: '/sources', label: '书源', icon: BookOpen },
    { to: '/rss', label: 'RSS', icon: Rss },
    { to: '/tts', label: 'TTS', icon: Mic2 },
  ];

  return (
    <div className="shell">
      <aside className="shell-nav">
        <div className="brand">
          <BookOpen className="brand-icon" />
          <span>Read Web</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="shell-footer">
          {token ? (
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              <span>退出登录</span>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="login-btn">
              <LogIn size={18} />
              <span>登录</span>
            </button>
          )}
        </div>
      </aside>
      <main className="shell-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;