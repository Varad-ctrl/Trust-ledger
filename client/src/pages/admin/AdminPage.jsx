import { useState, useEffect, useCallback } from 'react';
import { Users, CreditCard, Receipt, ShieldAlert, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/format';

const TABS = ['Overview', 'Users', 'Accounts', 'Audit Logs'];

export default function AdminPage() {
  const [tab,     setTab]     = useState('Overview');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [logs,    setLogs]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [freezeTarget, setFreezeTarget] = useState(null);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [pages,   setPages]   = useState({ users: 1, accounts: 1, logs: 1 });

  const loadStats = useCallback(() =>
    adminService.getDashboard().then(r => setStats(r.data.data)), []);

  const loadUsers = useCallback((p = 1) =>
    adminService.getUsers({ page: p, limit: 10 }).then(r => setUsers(r.data.data)), []);

  const loadAccounts = useCallback((p = 1) =>
    adminService.getAccounts({ page: p, limit: 10 }).then(r => setAccounts(r.data.data)), []);

  const loadLogs = useCallback((p = 1) =>
    adminService.getAuditLogs({ page: p, limit: 15 }).then(r => setLogs(r.data.data)), []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadUsers(), loadAccounts(), loadLogs()])
      .finally(() => setLoading(false));
  }, [loadStats, loadUsers, loadAccounts, loadLogs]);

  const handleFreeze = async () => {
    setFreezeLoading(true);
    try {
      const isFrozen = freezeTarget.status === 'FROZEN';
      if (isFrozen) await adminService.unfreezeAccount(freezeTarget.id);
      else          await adminService.freezeAccount(freezeTarget.id);
      toast.success(`Account ${isFrozen ? 'unfrozen' : 'frozen'}`);
      loadAccounts(pages.accounts);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setFreezeLoading(false);
      setFreezeTarget(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Admin Panel" subtitle="Platform management and oversight" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${t === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Users"    value={stats.users.total}        icon={Users}      color="blue"   />
            <StatCard title="Total Accounts" value={stats.accounts.total}     icon={CreditCard} color="purple" />
            <StatCard title="Frozen Accounts" value={stats.accounts.frozen}   icon={ShieldAlert} color="red"   />
            <StatCard title="Transactions"   value={stats.transactions.total} icon={Receipt}    color="amber"  />
            <StatCard title="Total Volume"   value={formatCurrency(stats.transactions.totalVolume)} icon={Receipt} color="green" subtitle="Completed" />
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'Users' && users && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
          </div>
          {users.data?.map(u => (
            <div key={u.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-100 items-center hover:bg-gray-50 text-sm">
              <div className="col-span-5 md:col-span-4 font-medium text-gray-900">{u.firstName} {u.lastName}</div>
              <div className="col-span-7 md:col-span-4 text-gray-500 truncate">{u.email}</div>
              <div className="col-span-6 md:col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>{u.role}</span>
              </div>
              <div className="hidden md:block col-span-2 text-xs text-gray-400">{formatDate(u.createdAt)}</div>
            </div>
          ))}
          <Pagination page={users.pagination?.page} pages={users.pagination?.pages}
            onPage={p => { setPages(prev => ({...prev, users: p})); loadUsers(p); }} />
        </div>
      )}

      {/* ── Accounts ── */}
      {tab === 'Accounts' && accounts && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-3">Account</div>
            <div className="col-span-3">Owner</div>
            <div className="col-span-2">Balance</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {accounts.data?.map(acc => (
            <div key={acc.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-100 items-center hover:bg-gray-50 text-sm">
              <div className="col-span-5 md:col-span-3">
                <p className="font-medium text-gray-900">{acc.accountType}</p>
                <p className="font-mono text-xs text-gray-400">{acc.accountNumber}</p>
              </div>
              <div className="col-span-7 md:col-span-3 text-gray-600 truncate">{acc.user?.firstName} {acc.user?.lastName}</div>
              <div className="hidden md:block col-span-2 font-semibold text-gray-900">{formatCurrency(acc.balance, acc.currency)}</div>
              <div className="col-span-6 md:col-span-2">
                <span className={acc.status === 'ACTIVE' ? 'badge-active' : acc.status === 'FROZEN' ? 'badge-frozen' : 'badge-closed'}>{acc.status}</span>
              </div>
              <div className="col-span-6 md:col-span-2 text-right">
                {acc.status !== 'CLOSED' && (
                  <button onClick={() => setFreezeTarget(acc)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${acc.status === 'FROZEN' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                    {acc.status === 'FROZEN' ? <><Unlock size={12} />Unfreeze</> : <><Lock size={12} />Freeze</>}
                  </button>
                )}
              </div>
            </div>
          ))}
          <Pagination page={accounts.pagination?.page} pages={accounts.pagination?.pages}
            onPage={p => { setPages(prev => ({...prev, accounts: p})); loadAccounts(p); }} />
        </div>
      )}

      {/* ── Audit Logs ── */}
      {tab === 'Audit Logs' && logs && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-3">User</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-3">IP Address</div>
            <div className="col-span-3">Date</div>
          </div>
          {logs.data?.map(log => (
            <div key={log.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-100 items-center hover:bg-gray-50 text-sm">
              <div className="col-span-6 md:col-span-3 text-gray-700 truncate">
                {log.user ? `${log.user.firstName} ${log.user.lastName}` : <span className="text-gray-400">Deleted user</span>}
              </div>
              <div className="col-span-6 md:col-span-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{log.action}</span>
              </div>
              <div className="hidden md:block col-span-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</div>
              <div className="hidden md:block col-span-3 text-xs text-gray-400">{formatDate(log.createdAt)}</div>
            </div>
          ))}
          <Pagination page={logs.pagination?.page} pages={logs.pagination?.pages}
            onPage={p => { setPages(prev => ({...prev, logs: p})); loadLogs(p); }} />
        </div>
      )}

      <ConfirmModal isOpen={!!freezeTarget} danger={freezeTarget?.status !== 'FROZEN'}
        title={freezeTarget?.status === 'FROZEN' ? 'Unfreeze Account' : 'Freeze Account'}
        message={freezeTarget?.status === 'FROZEN'
          ? `Unfreeze ${freezeTarget?.accountNumber}? The account owner will be able to make transactions again.`
          : `Freeze ${freezeTarget?.accountNumber}? The owner will not be able to make any transactions.`}
        confirmLabel={freezeTarget?.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
        loading={freezeLoading} onConfirm={handleFreeze} onCancel={() => setFreezeTarget(null)} />
    </div>
  );
}
