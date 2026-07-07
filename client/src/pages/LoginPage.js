import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name) { setError('Name is required'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:4 }}>
            <div className="logo-icon" style={{width:36,height:36,borderRadius:9,fontSize:16}}>N</div>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22 }}>NovBank</span>
          </div>
          <p style={{color:'var(--text-muted)', fontSize:13, marginTop:4}}>Personal banking, simplified</p>
        </div>

        <div className="tabs" style={{margin:'0 auto 24px', display:'flex'}}>
          <button className={`tab${mode==='login'?' active':''}`} onClick={()=>setMode('login')}>Sign in</button>
          <button className={`tab${mode==='register'?' active':''}`} onClick={()=>setMode('register')}>Create account</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" name="name" placeholder="Alex Johnson" value={form.name} onChange={handle} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',marginTop:8,padding:'12px'}}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="auth-footer" style={{marginTop:16}}>
            <div style={{background:'var(--navy)',borderRadius:'var(--radius-sm)',padding:'10px 14px', fontSize:12, color:'var(--text-muted)'}}>
              Demo: <strong style={{color:'var(--text-secondary)'}}>demo@bank.com</strong> / <strong style={{color:'var(--text-secondary)'}}>demo1234</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
