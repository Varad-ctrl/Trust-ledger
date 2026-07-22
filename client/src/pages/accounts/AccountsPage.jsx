import { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountService } from '../../services';
import { useApi } from '../../hooks/useApi';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate, accountTypeLabel } from '../../utils/format';

function AccountCard({ account }) {
  const statusColors = { ACTIVE: 'badge-active', FROZEN: 'badge-frozen', CLOSED: 'badge-closed' };
  const typeColors   = { SAVINGS: 'bg-blue-500', CHECKING: 'bg-purple-500', CURRENT: 'bg-amber-500' };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${typeColors[account.accountType] || 'bg-gray-400'} flex items-center justify-center`}>
          <CreditCard size={18} className="text-white" />
        </div>
        <span className={statusColors[account.status] || 'badge-closed'}>{account.status}</span>
      </div>
      <p className="text-sm font-medium text-gray-500">{accountTypeLabel[account.accountType]} Account</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(account.balance, account.currency)}</p>
      <p className="text-xs text-gray-400 font-mono mt-2">{account.accountNumber}</p>
      <p className="text-xs text-gray-400 mt-1">Opened {formatDate(account.createdAt)}</p>
    </div>
  );
}

export default function AccountsPage() {
  const { data: accounts, loading, refetch } = useApi(accountService.getAll);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('SAVINGS');

  const handleCreate = async () => {
    setCreating(true);
    try {
      await accountService.create({ accountType: type, currency: 'INR' });
      toast.success('Account created successfully');
      refetch();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Accounts" subtitle="Manage your bank accounts"
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> New Account
          </button>
        }
      />

      {showForm && (
        <div className="card p-5 mb-6 flex items-end gap-4 flex-wrap">
          <div>
            <label className="label">Account Type</label>
            <select className="input w-48" value={type} onChange={e => setType(e.target.value)}>
              <option value="SAVINGS">Savings</option>
              <option value="CHECKING">Checking</option>
              <option value="CURRENT">Current</option>
            </select>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">{creating ? 'Creating…' : 'Create Account'}</button>
          <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !accounts?.length ? (
        <EmptyState icon={CreditCard} title="No accounts yet"
          description="Create your first bank account to get started."
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Open Account</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => <AccountCard key={acc.id} account={acc} />)}
        </div>
      )}
    </div>
  );
}
