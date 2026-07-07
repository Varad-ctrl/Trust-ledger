import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const categoryEmoji = { Income:'💰', Groceries:'🛒', Entertainment:'🎬', Utilities:'💡', Transport:'🚗', Shopping:'🛍️', Transfer:'🔄', 'Food & Dining':'🍔', Default:'💳' };

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    accountsAPI.getAll().then(r => setAccounts(r.data));
    transactionsAPI.getAll({ limit: 8 }).then(r => setTxns(r.data.transactions));
  }, []);

  const totalBalance = accounts.filter(a => a.type !== 'Credit').reduce((s, a) => s + a.balance, 0);
  const income = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  // Build sparkline from transactions (group by day)
  const chartData = (() => {
    const days = {};
    [...txns].reverse().forEach(t => {
      const d = new Date(t.date).toLocaleDateString('en-US', { month:'short', day:'numeric' });
      days[d] = (days[d] || 0) + (t.type === 'credit' ? t.amount : -t.amount);
    });
    let running = 0;
    return Object.entries(days).map(([date, delta]) => { running += delta; return { date, balance: Math.round((totalBalance + running) * 100) / 100 }; });
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's a summary of your finances</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{marginBottom:24}}>
        <div className="stat-tile">
          <div className="stat-icon blue"><Wallet size={18}/></div>
          <div>
            <div className="stat-label">Total Balance</div>
            <div className="stat-value">{fmt(totalBalance)}</div>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon green"><TrendingUp size={18}/></div>
          <div>
            <div className="stat-label">Income (recent)</div>
            <div className="stat-value" style={{color:'var(--green)'}}>{fmt(income)}</div>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon red"><TrendingDown size={18}/></div>
          <div>
            <div className="stat-label">Expenses (recent)</div>
            <div className="stat-value" style={{color:'var(--red)'}}>{fmt(expenses)}</div>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon amber"><CreditCard size={18}/></div>
          <div>
            <div className="stat-label">Accounts</div>
            <div className="stat-value">{accounts.length}</div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24}}>
        {/* Chart */}
        <div className="card">
          <div className="section-header"><span className="section-title">Balance trend</span></div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{top:4, right:4, left:0, bottom:0}}>
                <defs>
                  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fill:'#64748b', fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis hide />
                <Tooltip
                  contentStyle={{background:'#1e3050', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, fontSize:12}}
                  labelStyle={{color:'#94a3b8'}}
                  itemStyle={{color:'#f0f4f8'}}
                  formatter={v => fmt(v)}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fill="url(#bg)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{padding:40}}>Not enough data</div>}
        </div>

        {/* Accounts */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Accounts</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/accounts')}>View all</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {accounts.map(a => (
              <div key={a.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:14, fontWeight:500}}>{a.name}</div>
                  <div style={{fontSize:12, color:'var(--text-muted)'}}>{a.accountNumber} · {a.type}</div>
                </div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color: a.balance < 0 ? 'var(--amber)' : 'var(--text-primary)'}}>
                  {fmt(a.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Recent transactions</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/transactions')}>View all</button>
        </div>
        {txns.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">💳</div>No transactions yet</div>
          : <div className="txn-list">
              {txns.map(t => (
                <div className="txn-row" key={t.id}>
                  <div className="txn-icon">{categoryEmoji[t.category] || categoryEmoji.Default}</div>
                  <div className="txn-info">
                    <div className="txn-desc">{t.description}</div>
                    <div className="txn-meta">{t.category} · {new Date(t.date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</div>
                  </div>
                  <div className={`txn-amount ${t.type}`}>
                    {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
