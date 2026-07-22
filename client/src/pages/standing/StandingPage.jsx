import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { RefreshCw, Plus, Pause, Play, XCircle, CheckCircle2 } from 'lucide-react';
import { accountService, beneficiaryService, standingService } from '../../services';
import { useApi } from '../../hooks/useApi';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const FREQ_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };

export default function StandingPage() {
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingA, setLA] = useState(false);
  const [actionItem, setActionItem] = useState(null); // { item, action }
  const [actionLoad, setAL] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([]);


  const { data, loading, refetch } = useApi(standingService.getAll);
  const instructions = data || [];

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const frequency = watch('frequency');

  const openForm = async () => {
    setShowForm(true);

    if (!accounts.length) {
      setLA(true);

      try {
        const [accountRes, beneRes] = await Promise.all([
          accountService.getAll(),
          beneficiaryService.getAll(),
        ]);

        console.log(accountRes);
        console.log(beneRes);

        setAccounts(
          accountRes.data.data?.filter(a => a.status === "ACTIVE") || []
        );

        setBeneficiaries(
          beneRes.data.data?.filter(b => b.receiverAccountId) || []
        );

        console.log("Beneficiaries:", beneRes.data.data);
      } catch (err) {
        console.error("openForm error:", err);
      } finally {
        setLA(false);
      }
    }
  };

  const onSubmit = async (d) => {
    try {
      await standingService.create({
        senderAccountId: d.senderAccountId,
        receiverAccountId: d.receiverAccountId,
        amount: parseFloat(d.amount),
        description: d.description,
        frequency: d.frequency,
        dayOfMonth: d.frequency === 'MONTHLY' ? parseInt(d.dayOfMonth) : undefined,
      });
      toast.success('Standing instruction created! You will receive an email confirmation.');
      reset(); setShowForm(false); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
  };

  const doAction = async () => {
    if (!actionItem) return;
    setAL(true);
    try {
      const { item, action } = actionItem;
      if (action === 'pause') await standingService.pause(item.id);
      if (action === 'resume') await standingService.resume(item.id);
      if (action === 'cancel') await standingService.cancel(item.id);
      toast.success(`Instruction ${action}d`);
      setActionItem(null); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setAL(false); }
  };

  const actionLabel = actionItem?.action === 'pause' ? 'Pause' : actionItem?.action === 'resume' ? 'Resume' : 'Cancel';
  const actionMsg = {
    pause: `Pause this ₹${formatCurrency(actionItem?.item?.amount)} ${FREQ_LABELS[actionItem?.item?.frequency]} instruction? No transfers will execute until you resume it.`,
    resume: `Resume this ₹${formatCurrency(actionItem?.item?.amount)} ${FREQ_LABELS[actionItem?.item?.frequency]} instruction?`,
    cancel: `Permanently cancel this ₹${formatCurrency(actionItem?.item?.amount)} ${FREQ_LABELS[actionItem?.item?.frequency]} instruction? This cannot be undone.`,
  }[actionItem?.action] || '';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Standing Instructions"
        subtitle="Set up automatic recurring transfers — daily, weekly, or monthly"
        action={<button onClick={openForm} className="btn-primary"><Plus size={16} /> New Instruction</button>}
      />

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Standing Instruction</h3>
          {loadingA
            ? <div className="flex items-center gap-2 text-sm text-gray-500"><Spinner size="sm" />Loading accounts…</div>
            : (
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
                    className={`input ${errors.receiverAccountId ? "input-error" : ""}`}
                    {...register("receiverAccountId", {
                      required: "Required",
                    })}
                  >
                    <option value="">Select destination...</option>

                    <optgroup label="My Accounts">
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountType} — {a.accountNumber}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Beneficiaries">
                      {beneficiaries
                        .filter(b => b.receiverAccountId)
                        .map(b => (
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
                  <input type="number" step="0.01" min="1" placeholder="0.00"
                    className={`input ${errors.amount ? 'input-error' : ''}`}
                    {...register('amount', { required: 'Required', min: { value: 1, message: 'Min ₹1' } })} />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="label">Frequency</label>
                  <select className={`input ${errors.frequency ? 'input-error' : ''}`}
                    {...register('frequency', { required: 'Required' })}>
                    <option value="">Select frequency…</option>
                    <option value="DAILY">Daily (every day at 9 AM)</option>
                    <option value="WEEKLY">Weekly (every 7 days)</option>
                    <option value="MONTHLY">Monthly (on a specific day)</option>
                  </select>
                  {errors.frequency && <p className="text-xs text-red-500 mt-1">{errors.frequency.message}</p>}
                </div>

                {frequency === 'MONTHLY' && (
                  <div>
                    <label className="label">Day of Month (1–28)</label>
                    <input type="number" min="1" max="28" placeholder="5"
                      className={`input ${errors.dayOfMonth ? 'input-error' : ''}`}
                      {...register('dayOfMonth', { required: 'Required for monthly', min: 1, max: 28 })} />
                    {errors.dayOfMonth && <p className="text-xs text-red-500 mt-1">{errors.dayOfMonth.message}</p>}
                  </div>
                )}

                <div className={frequency === 'MONTHLY' ? '' : 'md:col-span-2'}>
                  <label className="label">Description <span className="text-gray-400">(optional)</span></label>
                  <input className="input" placeholder="e.g. Monthly Rent" {...register('description')} />
                </div>

                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create Instruction'}
                  </button>
                  <button type="button" onClick={() => { reset(); setShowForm(false); }} className="btn-secondary">Cancel</button>
                </div>
              </form>
            )
          }
        </div>
      )}

      {loading
        ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : instructions.length === 0
          ? (
            <EmptyState icon={RefreshCw} title="No standing instructions"
              description="Set up automatic recurring transfers — perfect for rent, EMIs, and monthly savings."
              action={<button onClick={openForm} className="btn-primary"><Plus size={16} /> Create Instruction</button>} />
          )
          : (
            <div className="card divide-y divide-gray-100">
              {instructions.map(si => (
                <div key={si.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <RefreshCw size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(si.amount)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[si.status]}`}>{si.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {si.senderAccount?.accountNumber} → {si.receiverAccount?.accountNumber}
                        {' · '}{FREQ_LABELS[si.frequency]}{si.frequency === 'MONTHLY' && si.dayOfMonth ? ` on day ${si.dayOfMonth}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">
                        {si.description || 'Standing instruction'}
                        {' · '}Executions: {si.executionCount}
                        {si.status === 'ACTIVE' && ` · Next: ${formatDate(si.nextRunAt)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {si.status === 'ACTIVE' && (
                      <button onClick={() => setActionItem({ item: si, action: 'pause' })}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                        <Pause size={12} /> Pause
                      </button>
                    )}
                    {si.status === 'PAUSED' && (
                      <button onClick={() => setActionItem({ item: si, action: 'resume' })}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                        <Play size={12} /> Resume
                      </button>
                    )}
                    {si.status !== 'CANCELLED' && (
                      <button onClick={() => setActionItem({ item: si, action: 'cancel' })}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <XCircle size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      }

      <ConfirmModal
        isOpen={!!actionItem}
        danger={actionItem?.action === 'cancel'}
        title={`${actionLabel} Standing Instruction`}
        message={actionMsg}
        confirmLabel={actionLabel}
        loading={actionLoad}
        onConfirm={doAction}
        onCancel={() => setActionItem(null)}
      />
    </div>
  );
}
