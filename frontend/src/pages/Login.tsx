import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Mail, Lock, Wallet } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-split-left">
        <Wallet size={48} style={{ marginBottom: '2rem' }} />
        <h1>Welcome Back</h1>
        <p>Take control of your finances today. Log in to track your expenses, monitor your budgets, and achieve your financial goals.</p>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
      </div>
      
      <div className="auth-split-right">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <h2>Sign In</h2>
            <p>Enter your email and password</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Log In</button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
