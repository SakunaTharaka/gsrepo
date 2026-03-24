import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const q = query(
        collection(db, 'credentials'),
        where('username', '==', credentials.username),
        where('password', '==', credentials.password)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) throw new Error('Invalid username or password');
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin-config');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-page {
          min-height: 100vh;
          background: linear-gradient(150deg, #1e1b4b 0%, #312e81 35%, #4338ca 65%, #0891b2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.1) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .login-card {
          background: #fff;
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.25);
          position: relative;
          z-index: 1;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .6rem;
          margin-bottom: 2rem;
        }

        .login-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5px;
          overflow: hidden;
        }

        .login-logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .login-logo-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: #4f46e5;
          letter-spacing: -.02em;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
          margin-bottom: .4rem;
          letter-spacing: -.02em;
        }

        .login-subtitle {
          font-size: .875rem;
          color: #94a3b8;
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-group {
          margin-bottom: 1.25rem;
        }

        .login-label {
          display: block;
          font-size: .75rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: .45rem;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: .875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 1rem;
        }

        .login-input {
          width: 100%;
          padding: .8rem .875rem .8rem 2.5rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: .95rem;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          transition: all .2s;
        }

        .login-input:focus {
          outline: none;
          border-color: #4f46e5;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(79,70,229,.12);
        }

        .login-input::placeholder { color: #cbd5e1; }

        .login-error {
          background: #fff1f2;
          border: 1px solid #fca5a5;
          color: #dc2626;
          border-radius: 10px;
          padding: .7rem 1rem;
          font-size: .85rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: .4rem;
        }

        .login-btn {
          width: 100%;
          padding: .9rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          margin-top: .5rem;
          box-shadow: 0 4px 16px rgba(79,70,229,.3);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(79,70,229,.4);
        }

        .login-btn:disabled {
          opacity: .7;
          cursor: not-allowed;
          transform: none;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin 1s linear infinite;
        }

        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }

        .back-to-home {
          display: block;
          text-align: center;
          margin-top: 1.5rem;
          color: #64748b;
          font-size: .85rem;
          text-decoration: none;
          transition: color .2s;
        }

        .back-to-home:hover { color: #4f46e5; }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <span className="login-logo-icon">
              <img src="/logo512.png" alt="Multilinks" />
            </span>
            <span className="login-logo-text">Multilinks</span>
          </div>

          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Sign in to access the admin dashboard</p>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-group">
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">👤</span>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <a href="/" className="back-to-home">← Back to Multilinks</a>
        </div>
      </div>
    </>
  );
}

export default Login;