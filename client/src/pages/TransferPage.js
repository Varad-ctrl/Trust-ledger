import React, { useEffect, useState } from 'react';
import { accountsAPI, transfersAPI } from '../services/api';
import { ArrowRight, CheckCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n);

export default function TransferPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ fromAccountId:'', toAccountId:'', amount:'', description:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { accountsAPI.getAll().then(r => { setAccounts(r.data); }); }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.fromAccountId === form.toAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }
    setLoading(true);
    try {
      const res = await transfersAPI.create({ ...form, amount: parseFloat(form.amount) });
      setSuccess(`Transfer of ${fmt(form.amount)} completed successfully!`);
      setForm(f => ({ ...f, amount:'', description:'' }));
      // Refresh accounts
      accountsAPI.getAll().then(r => setAccounts(r.data));
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const fromAcc = accounts.find(a => a.id === form.fromAccountId);
  const toAcc = accounts.find(a => a.id === form.toAccountId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transfer Funds</h1>
        <p className="page-subtitle">Move money between your accounts instantly</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:24, alignItems:'start'}}>
        <div className="card">
          {error && <div className="error-msg">{error}</div>}
          {success && (
            <div className="success-msg" style={{display:'flex', alignItems:'center', gap:8}}>
              <CheckCircle size={16}/> {success}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">From account</label>
              <select className="form-select" name="fromAccountId" value={form.fromAccountId} onChange={handle} required>
                <option value="">Select account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">To account</label>
              <select className="form-select" name="toAccountId" value={form.toAccountId} onChange={handle} required>
                <option value="">Select account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id} disabled={a.id === form.fromAccountId}>{a.name} — {fmt(a.balance)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (USD)</label>
              <input className="form-input" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={handle} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" name="description" placeholder="e.g. Monthly savings" value={form.description} onChange={handle} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%', padding:'12px', marginTop:4}}>
              {loading ? 'Processing…' : (
                <span style={{display:'flex', alignItems:'center', gap:8}}>Transfer funds <ArrowRight size={16}/></span>
              )}
            </button>
          </form>
        </div>

        {/* Preview panel */}
        <div>
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{fontSize:14, fontWeight:600, marginBottom:16, color:'var(--text-secondary)'}}>Transfer preview</h3>
            {fromAcc && toAcc && form.amount ? (
              <div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
                  <div style={{textAlign:'center', flex:1}}>
                    <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:4}}>FROM</div>
                    <div style={{fontSize:13, fontWeight:600}}>{fromAcc.name}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)'}}>{fmt(fromAcc.balance)}</div>
                  </div>
                  <ArrowRight size={16} style={{color:'var(--accent)', flexShrink:0}} />
                  <div style={{textAlign:'center', flex:1}}>
                    <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:4}}>TO</div>
                    <div style={{fontSize:13, fontWeight:600}}>{toAcc.name}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)'}}>{fmt(toAcc.balance)}</div>
                  </div>
                </div>
                <div style={{background:'var(--navy)', borderRadius:'var(--radius-sm)', padding:16, textAlign:'center'}}>
                  <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:4}}>Amount</div>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'var(--accent)'}}>{fmt(form.amount)}</div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{padding:24}}>
                <div style={{fontSize:24, marginBottom:8}}>↔️</div>
                <div style={{fontSize:13}}>Fill in the form to preview your transfer</div>
              </div>
            )}
          </div>

          <div className="card card-sm">
            <h3 style={{fontSize:13, fontWeight:600, marginBottom:12, color:'var(--text-secondary)'}}>Your accounts</h3>
            {accounts.map(a => (
              <div key={a.id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13}}>
                <span style={{color:'var(--text-secondary)'}}>{a.name}</span>
                <span style={{fontWeight:600, color: a.balance < 0 ? 'var(--amber)' : 'var(--text-primary)'}}>{fmt(a.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
