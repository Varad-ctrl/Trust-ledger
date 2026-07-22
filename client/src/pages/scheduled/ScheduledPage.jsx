import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Clock, Plus, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { accountService, beneficiaryService, scheduledService } from '../../services';
import { useApi } from '../../hooks/useApi';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_STYLES = {
  PENDING: { cls: 'bg-yellow-100 text-yellow-800', icon: <Clock size={11} /> },
  EXECUTED: { cls: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={11} /> },
  FAILED: { cls: 'bg-red-100 text-red-800', icon: <AlertCircle size={11} /> },
  CANCELLED: { cls: 'bg-gray-100 text-gray-600', icon: <XCircle size={11} /> },
};

export default function ScheduledPage() {
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccs, setLA] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [cancelLoading, setCL] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([]);

  const { data, loading, refetch } = useApi(scheduledService.getAll);
  const scheduled = data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const openForm = async () => {
    setShowForm(true);

    if (!accounts.length) {
      setLA(true);

      try {
        const [accountRes, beneRes] = await Promise.all([
          accountService.getAll(),
          beneficiaryService.getAll(),
        ]);

        setAccounts(
          accountRes.data.data.filter(a => a.status === 'ACTIVE')
        );

        setBeneficiaries(
          beneRes.data.data.filter(
            b => b.receiverAccountId !== null
          )
        );

      } finally {
        setLA(false);
      }
    }
  };

  const onSubmit = async (d) => {
    try {
      await scheduledService.create({ senderAccountId: d.senderAccountId, receiverAccountId: d.receiverAccountId, amount: parseFloat(d.amount), description: d.description, executeAt: new Date(d.executeAt).toISOString() });
      toast.success('Transfer scheduled! You will receive an email confirmation.');
      reset(); setShowForm(false); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to schedule'); }
  };

  const onCancel = async () => {
    setCL(true);
    try { await scheduledService.cancel(cancelling.id); toast.success('Scheduled transfer cancelled'); setCancelling(null); refetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
    finally { setCL(false); }
  };

  // Min date-time = now + 5 min
  const minDateTime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Scheduled Transfers" subtitle="Schedule money transfers for a future date and time"
        action={<button onClick={openForm} className="btn-primary"><Plus size={16} /> Schedule Transfer</button>} />

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Scheduled Transfer</h3>
          {loadingAccs ? <div className="flex items-center gap-2 text-sm text-gray-500"><Spinner size="sm" /> Loading accounts…</div> : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">From Account</label>
                <select className={`input ${errors.senderAccountId ? 'input-error' : ''}`}
                  {...register('senderAccountId', { required: 'Required' })}>
                  <option value="">Select account…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.accountType} — {a.accountNumber} ({formatCurrency(a.balance)})</option>)}
                </select>
                {errors.senderAccountId && <p className="text-xs text-red-500 mt-1">{errors.senderAccountId.message}</p>}
              </div>
              <div>
                <label className="label">To Account</label>

                <select
                  className={`input ${errors.receiverAccountId ? 'input-error' : ''}`}
                  {...register('receiverAccountId', { required: 'Required' })}
                >
                  <option value="">Select destination…</option>

                  <optgroup label="My Accounts">
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountType} — {a.accountNumber}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Beneficiaries">
                    {beneficiaries.map((b) => (
                      <option
                        key={b.id}
                        value={b.receiverAccountId}
                      >
                        ⭐ {b.beneficiaryName} — {b.accountNumber}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {errors.receiverAccountId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.receiverAccountId.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input type="number" step="0.01" min="1" placeholder="0.00" className={`input ${errors.amount ? 'input-error' : ''}`}
                  {...register('amount', { required: 'Required', min: { value: 1, message: 'Min ₹1' } })} />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="label">Execute At</label>
                <input type="datetime-local" min={minDateTime} className={`input ${errors.executeAt ? 'input-error' : ''}`}
                  {...register('executeAt', { required: 'Required' })} />
                {errors.executeAt && <p className="text-xs text-red-500 mt-1">{errors.executeAt.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="label">Description <span className="text-gray-400">(optional)</span></label>
                <input className="input" placeholder="e.g. Advance Rent" {...register('description')} />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Scheduling…' : 'Schedule Transfer'}</button>
                <button type="button" onClick={() => { reset(); setShowForm(false); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : scheduled.length === 0 ? (
          <EmptyState icon={Clock} title="No scheduled transfers" description="Schedule a transfer to execute it automatically at a future date and time."
            action={<button onClick={openForm} className="btn-primary"><Plus size={16} /> Schedule Transfer</button>} />
        ) : (
          <div className="card divide-y divide-gray-100">
            {scheduled.map(s => {
              const st = STATUS_STYLES[s.status] || STATUS_STYLES.PENDING;
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(s.amount)}</p>
                      <p className="text-xs text-gray-500">{s.senderAccount?.accountNumber} → {s.receiverAccount?.accountNumber}</p>
                      <p className="text-xs text-gray-400">{s.description || 'Scheduled transfer'} · Execute: {formatDate(s.executeAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.icon}{s.status}</span>
                    {s.status === 'PENDING' && (
                      <button onClick={() => setCancelling(s)} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      <ConfirmModal isOpen={!!cancelling} danger title="Cancel Scheduled Transfer"
        message={`Cancel the scheduled transfer of ${formatCurrency(cancelling?.amount)}? This cannot be undone.`}
        confirmLabel="Cancel Transfer" loading={cancelLoading}
        onConfirm={onCancel} onCancel={() => setCancelling(null)} />
    </div>
  );
}
