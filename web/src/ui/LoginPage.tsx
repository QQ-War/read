import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/readApi';
import { authStore } from '../state/auth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setStatus('登录中...');
    const resp = await login(username.trim(), password);
    if (resp.isSuccess && resp.data?.accessToken) {
      authStore.setToken(resp.data.accessToken);
      setStatus('登录成功');
      navigate('/bookshelf');
    } else {
      setStatus(resp.errorMsg || '登录失败');
    }
  };

  return (
    <section className="panel">
      <h2>登录</h2>
      <div className="form-row">
        <label>账号</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-row">
        <label>密码</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button onClick={handleLogin}>登录</button>
      <div className="status-line">{status}</div>
    </section>
  );
};

export default LoginPage;
