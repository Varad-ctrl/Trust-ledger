import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, Users, Receipt, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDateShort, directionColor, directionSign } from '../../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.get()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );
  if (!data) return null;

  const { summary, accounts, recentTransactions } = data;

  // Build a mini sparkline from recent transactions
  const chartData = recentTransactions.map((tx, i) => ({
    name: formatDateShort(tx.date),
    amount: parseFloat(tx.amount),
    type: tx.direction,
  })).reverse();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.firstName} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's your financial overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Balance" value={formatCurrency(summary.totalBalance)} subtitle="Active accounts" icon={Wallet} color="blue" />
        <StatCard title="Accounts"      value={summary.accounts}      subtitle="All accounts"     icon={CreditCard} color="purple" />
        <StatCard title="Beneficiaries" value={summary.beneficiaries} subtitle="Saved payees"     icon={Users}      color="green"  />
        <StatCard title="Transactions"  value={summary.transactions}  subtitle="Total activity"   icon={Receipt}    color="amber"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Accounts</h2>
            <Link to="/accounts" className="text-xs text-brand-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {accounts.length === 0 && <p className="text-sm text-gray-400">No accounts found.</p>}
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{acc.accountType}</p>
                  <p className="text-xs text-gray-400 font-mono">{acc.accountNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(acc.balance)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${acc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {acc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/transactions" className="text-xs text-brand-600 font-medium hover:underline">View all</Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.direction === 'RECEIVED' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {tx.direction === 'RECEIVED'
                        ? <TrendingUp size={15} className="text-green-600" />
                        : <TrendingDown size={15} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{tx.description || tx.transactionType}</p>
                      <p className="text-xs text-gray-400">
                        {tx.counterparty ? `${tx.counterparty.firstName} ${tx.counterparty.lastName}` : tx.transactionType}
                        {' · '}{formatDateShort(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${directionColor(tx.direction)}`}>
                    {directionSign(tx.direction)}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/transfer"      className="btn-primary"><ArrowLeftRight size={15} /> Transfer Money</Link>
          <Link to="/beneficiaries" className="btn-secondary"><Users size={15} /> Manage Beneficiaries</Link>
          <Link to="/transactions"  className="btn-secondary"><Receipt size={15} /> Transaction History</Link>
        </div>
      </div>
    </div>
  );
}
