import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeftRight, CheckCircle2, AlertTriangle, Download, Star, Clock } from 'lucide-react';
import { accountService, beneficiaryService, transactionService, upiService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/format';
import { generateReceipt } from '../../utils/pdfReceipt';

// Enhancement 5: Confirm modal
function ConfirmModal({ open, senderAcc, receiverLabel, amount, description, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <h3 className="font-bold text-gray-900">Confirm Transfer</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 mb-5 text-sm">
          {[['From', `${senderAcc?.accountType} · ${senderAcc?.accountNumber}`], ['To', receiverLabel], ['Amount', <span className="text-brand-700 font-bold">{formatCurrency(amount)}</span>], description && ['Note', description]].filter(Boolean).map(([l, v]) => (
            <div key={l} className="flex items-center justify-between"><span className="text-gray-500">{l}</span><span className="font-medium text-gray-900">{v}</span></div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mb-4">This will debit your account immediately and cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1">{loading ? 'Processing…' : 'Confirm & Pay'}</button>
        </div>
      </div>
    </div>
  );
}

export default function TransferPage() {
  const [accounts, setAccounts] = useState([]);
  const [benes,    setBenes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [success,  setSuccess]  = useState(null);
  const [confirm,  setConfirm]  = useState(false);
  const [pending,  setPending]  = useState(null);
  const [confirming, setConf]   = useState(false);
  // Enhancement 10: UPI
  const [upiInput,  setUpiInput]  = useState('');
  const [upiResult, setUpiResult] = useState(null);
  const [upiLoading,setUpiLoad]   = useState(false);
  const [mode,      setMode]      = useState('account'); // 'account' | 'upi'

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm();
  const senderAccountId   = watch('senderAccountId');
  const receiverAccountId = watch('receiverAccountId');
  const amount = watch('amount');
  const description = watch('description');

  useEffect(() => {
    Promise.all([accountService.getAll(), beneficiaryService.getAll()])
      .then(([a, b]) => {
        setAccounts(a.data.data?.filter(x => x.status === 'ACTIVE') || []);
        setBenes(b.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const senderAcc   = accounts.find(a => a.id === senderAccountId);
  const receiverAcc = accounts.find(a => a.id === receiverAccountId);

  // Enhancement 4: favourites first, then recent linked
  const favBenes    = benes.filter(b => b.isFavourite && b.receiverAccountId);
  const recentBenes = benes.filter(b => !b.isFavourite && b.receiverAccountId).slice(0, 4);

  const selectBene = (b) => {
    if (b.receiverAccountId) { setValue('receiverAccountId', b.receiverAccountId); toast.success(`Selected ${b.beneficiaryName}`); }
    else toast('No linked FinCore account', { icon: 'ℹ️' });
  };

  // Enhancement 10: resolve UPI
  const resolveUpi = async () => {
    if (!upiInput.trim()) return;
    setUpiLoad(true); setUpiResult(null);
    try {
      const r = await upiService.resolve(upiInput.trim());
      setUpiResult(r.data.data);
      setValue('receiverAccountId', r.data.data.accountId);
      toast.success(`Found: ${r.data.data.name}`);
    } catch (err) { toast.error(err.response?.data?.message || 'UPI ID not found'); }
    finally { setUpiLoad(false); }
  };

  // Enhancement 5: intercept → show confirm
  const onSubmit = (data) => { setPending(data); setConfirm(true); };

  const executeTransfer = async () => {
    setConf(true);
    try {
      const res = await transactionService.transfer({
        senderAccountId: pending.senderAccountId,
        receiverAccountId: pending.receiverAccountId,
        amount: parseFloat(pending.amount),
        description: pending.description || 'Fund transfer',
      });
      setConfirm(false);
      setSuccess({ ...res.data.data, senderAccount: senderAcc, receiverAccount: receiverAcc });
      reset(); setUpiResult(null); setUpiInput('');
    } catch (err) { setConfirm(false); toast.error(err.response?.data?.message || 'Transfer failed'); }
    finally { setConf(false); }
  };

  const receiverLabel = upiResult ? `${upiResult.name} (${upiResult.upiId})` : receiverAcc ? `${receiverAcc.accountType} · ${receiverAcc.accountNumber}` : '—';

  // Enhancement 6: Success screen with PDF download
  if (success) return (
    <div className="p-6 max-w-md mx-auto">
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Transfer Successful!</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">Your funds have been transferred instantly.</p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2.5 mb-6">
          {[['Reference', <span className="font-mono text-xs">{success.referenceNumber}</span>],
            ['Amount', <span className="font-semibold text-green-700">{formatCurrency(success.amount)}</span>],
            ['Status', <span className="badge-success">{success.status}</span>],
            ['From', success.senderAccount?.accountNumber || '—'],
            ['To',   success.receiverAccount?.accountNumber || '—'],
          ].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => generateReceipt({ ...success, fromAccount: success.senderAccount?.accountNumber, toAccount: success.receiverAccount?.accountNumber })} className="btn-secondary flex-1">
            <Download size={15} /> Receipt
          </button>
          <button onClick={() => setSuccess(null)} className="btn-primary flex-1">New Transfer</button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Transfer Money" subtitle="Move funds between accounts instantly" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card p-6 lg:col-span-3 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {['account', 'upi'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {m === 'account' ? 'By Account' : '⚡ By UPI'}
              </button>
            ))}
          </div>

          {/* Enhancements 4+5: Quick-select beneficiaries */}
          {mode === 'account' && (favBenes.length > 0 || recentBenes.length > 0) && (
            <div className="space-y-3">
              {favBenes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Star size={11} className="fill-amber-400 text-amber-400" /> Favourites
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {favBenes.map(b => (
                      <button key={b.id} onClick={() => selectBene(b)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${b.receiverAccountId === receiverAccountId ? 'bg-brand-600 text-white border-brand-600' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'}`}>
                        <Star size={9} className="fill-amber-400 text-amber-400" />{b.beneficiaryName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recentBenes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock size={11} /> Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentBenes.map(b => (
                      <button key={b.id} onClick={() => selectBene(b)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${b.receiverAccountId === receiverAccountId ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                        {b.beneficiaryName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-gray-100" />
            </div>
          )}

          {/* Enhancement 10: UPI input */}
          {mode === 'upi' && (
            <div>
              <label className="label">UPI ID</label>
              <div className="flex gap-2">
                <input value={upiInput} onChange={e => setUpiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && resolveUpi()}
                  placeholder="e.g. priya.yadav@fincore" className="input flex-1" />
                <button onClick={resolveUpi} disabled={upiLoading} className="btn-secondary whitespace-nowrap">
                  {upiLoading ? 'Checking…' : 'Verify'}
                </button>
              </div>
              {upiResult && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">{upiResult.name}</p>
                    <p className="text-xs text-green-600 font-mono">{upiResult.accountNumber} · {upiResult.accountType}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">From Account</label>
              <select className={`input ${errors.senderAccountId ? 'input-error' : ''}`}
                {...register('senderAccountId', { required: 'Select sender account' })}>
                <option value="">Select your account…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountType} — {a.accountNumber} ({formatCurrency(a.balance)})</option>)}
              </select>
              {errors.senderAccountId && <p className="text-xs text-red-500 mt-1">{errors.senderAccountId.message}</p>}
            </div>

            {mode === 'account' && (
              <div>
                <label className="label">To Account</label>
                <select className={`input ${errors.receiverAccountId ? 'input-error' : ''}`}
                  {...register('receiverAccountId', { required: 'Select destination', validate: v => v !== senderAccountId || 'Cannot transfer to same account' })}>
                  <option value="">Select destination…</option>
                  {favBenes.length > 0 && <optgroup label="⭐ Favourite Beneficiaries">{favBenes.map(b => <option key={b.id} value={b.receiverAccountId}>{b.beneficiaryName} — {b.accountNumber}</option>)}</optgroup>}
                  {recentBenes.length > 0 && <optgroup label="🕐 Recent Beneficiaries">{recentBenes.map(b => <option key={b.id} value={b.receiverAccountId}>{b.beneficiaryName} — {b.accountNumber}</option>)}</optgroup>}
                  <optgroup label="My Accounts">{accounts.filter(a => a.id !== senderAccountId).map(a => <option key={a.id} value={a.id}>{a.accountType} — {a.accountNumber}</option>)}</optgroup>
                </select>
                {errors.receiverAccountId && <p className="text-xs text-red-500 mt-1">{errors.receiverAccountId.message}</p>}
              </div>
            )}

            {mode === 'upi' && (
              <input type="hidden" {...register('receiverAccountId', { required: 'Verify a UPI ID first' })} />
            )}

            <div>
              <label className="label">Amount (₹)</label>
              <input type="number" step="0.01" min="1" placeholder="0.00"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                {...register('amount', {
                  required: 'Amount is required', min: { value: 1, message: 'Minimum ₹1' },
                  validate: v => !senderAcc || parseFloat(v) <= parseFloat(senderAcc.balance) || 'Insufficient balance',
                })} />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
              {senderAcc && <p className="text-xs text-gray-400 mt-1">Available: {formatCurrency(senderAcc.balance)}</p>}
            </div>

            <div>
              <label className="label">Description <span className="text-gray-400">(optional)</span></label>
              <input className="input" placeholder="e.g. Rent Payment" {...register('description')} />
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              <ArrowLeftRight size={16} /> Review Transfer
            </button>
          </form>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview</h3>
            {senderAcc && (receiverAcc || upiResult) && amount ? (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <p className="text-xs text-gray-400 mb-1">FROM</p>
                  <p className="font-semibold">{senderAcc.accountType}</p>
                  <p className="font-mono text-xs text-gray-500">{senderAcc.accountNumber}</p>
                  <p className="text-green-700 font-bold mt-1">{formatCurrency(senderAcc.balance)}</p>
                </div>
                <div className="flex justify-center"><ArrowRight size={16} className="text-gray-400" /></div>
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <p className="text-xs text-gray-400 mb-1">TO</p>
                  {upiResult ? <><p className="font-semibold">{upiResult.name}</p><p className="font-mono text-xs text-gray-500">{upiResult.upiId}</p></> : receiverAcc ? <><p className="font-semibold">{receiverAcc.accountType}</p><p className="font-mono text-xs text-gray-500">{receiverAcc.accountNumber}</p></> : null}
                </div>
                <div className="bg-brand-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-brand-600 mb-1">AMOUNT</p>
                  <p className="text-xl font-bold text-brand-700">{formatCurrency(amount)}</p>
                </div>
                {description && <p className="text-xs text-center text-gray-400">"{description}"</p>}
              </div>
            ) : <p className="text-sm text-gray-400 text-center py-6">Fill in the form to preview</p>}
          </div>
        </div>
      </div>

      {/* Enhancement 5: Confirmation modal */}
      <ConfirmModal open={confirm}
        senderAcc={senderAcc} receiverLabel={receiverLabel}
        amount={pending?.amount} description={pending?.description}
        onConfirm={executeTransfer} onCancel={() => setConfirm(false)} loading={confirming} />
    </div>
  );
}
