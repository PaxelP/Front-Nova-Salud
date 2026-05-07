import React, { useState } from 'react';
import api from '../api/axios';
import { LogIn, Pill } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
      onLoginSuccess(response.data.usuario);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-box">
        <div className="logo-section">
          <Pill size={48} color="#38bdf8" />
          <h1>FarmaPlus <span style={{ color: 'var(--primary)' }}>Sync</span></h1>
          <p>Gestión inteligente de inventario</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ejemplo@farmacia.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="login-btn">
            <LogIn size={20} /> Entrar al Sistema
          </button>
        </form>
      </div>

      <style jsx="true">{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at top right, #1e293b, #0f172a);
        }
        .login-box {
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        .logo-section {
          margin-bottom: 2rem;
        }
        .logo-section h1 {
          margin: 10px 0 0 0;
          font-size: 2rem;
        }
        .logo-section p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .input-group {
          text-align: left;
          margin-bottom: 1rem;
        }
        .input-group label {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-left: 4px;
        }
        .login-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 1rem;
        }
        .error-msg {
          color: var(--error);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
