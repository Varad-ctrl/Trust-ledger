import React, { useEffect, useState } from 'react';
import { transactionsAPI, accountsAPI } from '../services/api';
import { Search } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n);
const categoryEmoji = { Income:'💰', Groceries:'🛒', Entertainment:'🎬', Utilities:'💡', Transport:'🚗', Shopping:'🛍️', Transfer:'🔄', 'Food & Dining':'🍔', Default:'💳' };

export default function TransactionsPage() {
  const [txns, setTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState({ accountId:'', type:'', search:'' });

  useEffect(() => { accountsAPI.getAll().then(r => setAccounts(r.data)); }, []);
  useEffect(() => {
    transactionsAPI.getAll({ accountId: filter.accountId, limit: 100 }).then(r => setTxns(r.data.transactions));
  }, [filter.accountId]);

  const filtered = txns.filter(t => {
    if (filter.type && t.type !== filter.type) return false;
    if (filter.search && !t.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:12, marginBottom:24, flexWrap:'wrap'}}>
        <div style={{position:'relative', flex:1, minWidth:200}}>
          <Search size={14} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)'}}/>
          <input
            className="form-input"
            style={{paddingLeft:34}}
            placeholder="Search transactions…"
            value={filter.search}
            onChange={e => setFilter(f => ({...f, search: e.target.value}))}
          />
        </div>
        <select className="form-select" style={{width:180}} value={filter.accountId} onChange={e => setFilter(f => ({...f, accountId: e.target.value}))}>
          <option value="">All accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="form-select" style={{width:140}} value={filter.type} onChange={e => setFilter(f => ({...f, type: e.target.value}))}>
          <option value="">All types</option>
          <option value="credit">Credits</option>
          <option value="debit">Debits</option>
        </select>
      </div>

      <div className="card">
        {filtered.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">🔍</div>No transactions found</div>
          : <div className="txn-list">
              {filtered.map(t => (
                <div className="txn-row" key={t.id}>
                  <div className="txn-icon">{categoryEmoji[t.category] || categoryEmoji.Default}</div>
                  <div className="txn-info">
                    <div className="txn-desc">{t.description}</div>
                    <div className="txn-meta">
                      {t.category}
                      {' · '}
                      {new Date(t.date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}
                      {' · '}
                      {accounts.find(a => a.id === t.accountId)?.name || 'Unknown account'}
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4}}>
                    <div className={`txn-amount ${t.type}`}>
                      {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                    </div>
                    <span className={`badge ${t.type === 'credit' ? 'badge-green' : 'badge-red'}`}>
                      {t.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
