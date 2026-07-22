import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, Star, Search, X, Building, CreditCard } from 'lucide-react';
import { beneficiaryService, accountService } from '../../services';
import { useApi } from '../../hooks/useApi';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/format';

export default function BeneficiariesPage() {
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDL]  = useState(false);
  const [myAccounts, setMyAccts]= useState([]);
  const [loadingAccts, setLA]   = useState(false);

  // Enhancement 2: pass search param
  const fetchBenes = useCallback(
    () => beneficiaryService.getAll(search ? { search } : {}),
    [search]
  );
  const { data, loading, refetch } = useApi(fetchBenes);
  const beneficiaries = data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const openForm = async () => {
    setShowForm(true);
    if (!myAccounts.length) {
      setLA(true);
      try { const r = await accountService.getAll(); setMyAccts(r.data.data?.filter(a => a.status === 'ACTIVE') || []); }
      finally { setLA(false); }
    }
  };

  const onAdd = async (d) => {
    try {
      await beneficiaryService.create({ beneficiaryName: d.beneficiaryName, accountNumber: d.accountNumber, bankName: d.bankName || 'FinCore Bank', ifscCode: d.ifscCode || undefined, receiverAccountId: d.linkAccountId || undefined });
      toast.success('Beneficiary added'); reset(); setShowForm(false); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add'); }
  };

  // Enhancement 3: star/unstar
  const toggleFav = async (b) => {
    try { await beneficiaryService.toggleFavourite(b.id, !b.isFavourite); toast.success(b.isFavourite ? 'Removed from favourites' : '⭐ Added to favourites'); refetch(); }
    catch { toast.error('Could not update'); }
  };

  const onDelete = async () => {
    setDL(true);
    try { await beneficiaryService.delete(deleting.id); toast.success('Removed'); setDeleting(null); refetch(); }
    catch { toast.error('Failed to remove'); } finally { setDL(false); }
  };

  const favourites = beneficiaries.filter(b => b.isFavourite);
  const others     = beneficiaries.filter(b => !b.isFavourite);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Beneficiaries" subtitle="People you can send money to"
        action={<button onClick={openForm} className="btn-primary"><Plus size={16} /> Add Beneficiary</button>} />

      {/* Enhancement 2: Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && refetch()}
          placeholder="Search by name or account number…" className="input pl-9 pr-9" />
        {search && <button onClick={() => { setSearch(''); refetch(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Beneficiary</h3>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className={`input ${errors.beneficiaryName ? 'input-error' : ''}`} placeholder="Priya Yadav"
                {...register('beneficiaryName', { required: 'Name is required' })} />
              {errors.beneficiaryName && <p className="text-xs text-red-500 mt-1">{errors.beneficiaryName.message}</p>}
            </div>
            {/* Enhancement 1: link to internal account */}
            <div>
              <label className="label">Link FinCore Account <span className="text-gray-400 font-normal">(optional)</span></label>
              {loadingAccts ? <div className="flex items-center gap-2 text-xs text-gray-400 h-10"><Spinner size="sm" /> Loading…</div> : (
                <select className="input" {...register('linkAccountId')}
                  onChange={e => { const a = myAccounts.find(x => x.id === e.target.value); if (a) reset(v => ({ ...v, accountNumber: a.accountNumber, bankName: 'FinCore Bank' })); }}>
                  <option value="">— Enter manually —</option>
                  {myAccounts.map(a => <option key={a.id} value={a.id}>{a.accountType} · {a.accountNumber}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="label">Account Number</label>
              <input className={`input ${errors.accountNumber ? 'input-error' : ''}`} placeholder="FC87654321"
                {...register('accountNumber', { required: 'Account number is required' })} />
              {errors.accountNumber && <p className="text-xs text-red-500 mt-1">{errors.accountNumber.message}</p>}
            </div>
            <div>
              <label className="label">Bank Name</label>
              <input className="input" placeholder="FinCore Bank" {...register('bankName')} />
            </div>
            <div>
              <label className="label">IFSC Code <span className="text-gray-400">(optional)</span></label>
              <input className="input" placeholder="FINC0000001" {...register('ifscCode')} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add Beneficiary'}</button>
              <button type="button" onClick={() => { reset(); setShowForm(false); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : beneficiaries.length === 0 ? (
          <EmptyState icon={Users} title={search ? `No results for "${search}"` : 'No beneficiaries yet'}
            description={search ? 'Try a different name or account number.' : 'Add people you regularly send money to.'}
            action={!search && <button onClick={openForm} className="btn-primary"><Plus size={16} /> Add</button>} />
        ) : (
          <div className="space-y-4">
            {favourites.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Star size={11} className="fill-amber-400 text-amber-400" /> Favourites
                </p>
                <BeneList list={favourites} onFav={toggleFav} onDelete={setDeleting} />
              </div>
            )}
            {others.length > 0 && (
              <div>
                {favourites.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Others</p>}
                <BeneList list={others} onFav={toggleFav} onDelete={setDeleting} />
              </div>
            )}
          </div>
        )
      }

      <ConfirmModal isOpen={!!deleting} danger title="Remove Beneficiary"
        message={`Remove ${deleting?.beneficiaryName}? You can add them back later.`}
        confirmLabel="Remove" loading={deleteLoading}
        onConfirm={onDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}

function BeneList({ list, onFav, onDelete }) {
  return (
    <div className="card divide-y divide-gray-100">
      {list.map(b => (
        <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Building size={16} className="text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{b.beneficiaryName}</p>
                {b.receiverAccountId && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                    <CreditCard size={9} /> Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{b.bankName} · <span className="font-mono">{b.accountNumber}</span>{b.ifscCode && ` · ${b.ifscCode}`}</p>
              <p className="text-xs text-gray-300 mt-0.5">Added {formatDate(b.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onFav(b)}
              className={`p-2 rounded-lg transition-colors ${b.isFavourite ? 'text-amber-400 hover:bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'}`}>
              <Star size={16} className={b.isFavourite ? 'fill-amber-400' : ''} />
            </button>
            <button onClick={() => onDelete(b)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
