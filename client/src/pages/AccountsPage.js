import React, { useEffect, useState } from 'react';
import { accountsAPI } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => { accountsAPI.getAll().then(r => setAccounts(r.data)); }, []);

  const typeClass = { Checking: 'checking', Savings: 'savings', Credit: 'credit' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Accounts</h1>
        <p className="page-subtitle">All your accounts at a glance</p>
      </div>

      <div className="grid-3" style={{marginBottom:32}}>
        {accounts.map(a => (
          <div key={a.id} className={`account-card ${typeClass[a.type] || ''}`}>
            <div className="account-type-badge">{a.type}</div>
            <div className="account-name">{a.name}</div>
            <div className={`account-balance${a.balance < 0 ? ' negative' : ''}`}>{fmt(a.balance)}</div>
            <div className="account-number">{a.accountNumber}</div>
            {a.type === 'Credit' && a.limit && (
              <div style={{marginTop:12}}>
                <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:6}}>
                  Used: {fmt(Math.abs(a.balance))} of {fmt(a.limit)}
                </div>
                <div style={{background:'var(--navy)', borderRadius:4, height:4, overflow:'hidden'}}>
                  <div style={{
                    width: `${Math.min((Math.abs(a.balance)/a.limit)*100, 100)}%`,
                    height:'100%',
                    background: Math.abs(a.balance)/a.limit > 0.7 ? 'var(--red)' : 'var(--amber)',
                    borderRadius:4,
                    transition:'width 0.3s'
                  }}/>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card">
        <h2 className="section-title" style={{marginBottom:16}}>Summary</h2>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border)'}}>
              {['Account', 'Type', 'Number', 'Balance', 'Currency'].map(h => (
                <th key={h} style={{textAlign:'left', padding:'8px 12px', fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={{padding:'12px', fontSize:14, fontWeight:500}}>{a.name}</td>
                <td style={{padding:'12px'}}>
                  <span className={`badge ${a.type === 'Checking' ? 'badge-blue' : a.type === 'Savings' ? 'badge-green' : 'badge-amber'}`}>{a.type}</span>
                </td>
                <td style={{padding:'12px', fontSize:13, color:'var(--text-muted)', fontFamily:'monospace'}}>{a.accountNumber}</td>
                <td style={{padding:'12px', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color: a.balance < 0 ? 'var(--amber)' : 'var(--green)'}}>{fmt(a.balance)}</td>
                <td style={{padding:'12px', fontSize:13, color:'var(--text-muted)'}}>{a.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
