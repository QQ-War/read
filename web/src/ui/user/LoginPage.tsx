import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/readApi';
import { authStore } from '../../state/auth';
import { User, Lock, LogIn, BookOpen, RefreshCw } from 'lucide-react';
import '../../styles/user.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setStatus('正在安全登录...');
    const resp = await login(username.trim(), password);
    if (resp.isSuccess && resp.data?.accessToken) {
      authStore.setToken(resp.data.accessToken);
      setStatus('登录成功，正在跳转...');
      setTimeout(() => navigate('/bookshelf'), 500);
    } else {
      setStatus(resp.errorMsg || '登录失败，请检查账号密码');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <section className="panel login-card">
        <div className="login-header">
          <div className="login-logo">
            <BookOpen size={40} />
          </div>
          <h2>欢迎回来</h2>
          <p className="muted">登录您的账号以继续阅读</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-row">
            <label className="form-label">账号</label>
            <div className="input-icon-wrapper">
              <User size={18} className="icon" />
              <input 
                placeholder="请输入用户名"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">密码</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="icon" />
              <input 
                type="password" 
                placeholder="请输入密码"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px' }} 
            disabled={loading}
          >
            {loading ? <RefreshCw size={18} className="spin" /> : <LogIn size={18} />}
            {loading ? '正在登录...' : '立即登录'}
          </button>
        </form>

        {status && (
          <div className={`login-status ${status.includes('失败') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}
      </section>
    </div>
  );
};

export default LoginPage;
