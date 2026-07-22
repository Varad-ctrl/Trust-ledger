import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Zap, Copy, CheckCircle2, Search } from 'lucide-react';
import { upiService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function UpiPage() {
  const { user } = useAuth();
  const [myUpi,     setMyUpi]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activating,setActivating]= useState(false);
  const [lookupId,  setLookupId]  = useState('');
  const [lookupRes, setLookupRes] = useState(null);
  const [lookupLoad,setLL]        = useState(false);
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    upiService.getMyUpiId()
      .then(r => setMyUpi(r.data.data))
      .catch(() => setMyUpi({ upiId: null }))
      .finally(() => setLoading(false));
  }, []);

  const activate = async () => {
    setActivating(true);
    try {
      const r = await upiService.activate();
      setMyUpi(r.data.data);
      toast.success('UPI ID activated! Check your email for confirmation.');
    } catch (err) { toast.error(err.response?.data?.message || 'Activation failed'); }
    finally { setActivating(false); }
  };

  const copyUpi = async () => {
    if (!myUpi?.upiId) return;
    await navigator.clipboard.writeText(myUpi.upiId).catch(() => {});
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const lookup = async () => {
    if (!lookupId.trim()) return;
    setLL(true); setLookupRes(null);
    try {
      const r = await upiService.resolve(lookupId.trim());
      setLookupRes(r.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'UPI ID not found'); }
    finally { setLL(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="UPI" subtitle="Your FinCore virtual payment address" />

      {/* My UPI card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
            <Zap size={20} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Your UPI ID</h2>
            <p className="text-sm text-gray-500">Receive money from anyone using this ID</p>
          </div>
        </div>

        {myUpi?.upiId ? (
          <div>
            {/* UPI display */}
            <div className="bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 rounded-2xl p-6 text-center mb-4">
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2">Your UPI ID</p>
              <p className="text-2xl font-bold text-brand-700 font-mono">{myUpi.upiId}</p>
              <p className="text-sm text-gray-500 mt-2">{user?.firstName} {user?.lastName}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyUpi} className="btn-secondary flex-1">
                {copied ? <><CheckCircle2 size={15} className="text-green-600" /> Copied!</> : <><Copy size={15} /> Copy UPI ID</>}
              </button>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 size={15} /> Share <strong className="font-mono">{myUpi.upiId}</strong> to receive instant payments
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Activate your UPI ID</h3>
            <p className="text-sm text-gray-500 mb-5">
              Your UPI ID will be created as <span className="font-mono font-semibold text-brand-600">
                {user?.firstName?.toLowerCase()}.{user?.lastName?.toLowerCase()}@fincore
              </span>
            </p>
            <button onClick={activate} disabled={activating} className="btn-primary">
              <Zap size={16} /> {activating ? 'Activating…' : 'Activate UPI ID'}
            </button>
          </div>
        )}
      </div>

      {/* Lookup tool */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Look Up a UPI ID</h2>
        <p className="text-sm text-gray-500 mb-4">Verify any FinCore UPI ID before sending money</p>
        <div className="flex gap-2 mb-4">
          <input
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="e.g. priya.yadav@fincore"
            className="input flex-1"
          />
          <button onClick={lookup} disabled={lookupLoad || !lookupId.trim()} className="btn-primary whitespace-nowrap">
            <Search size={15} /> {lookupLoad ? 'Searching…' : 'Verify'}
          </button>
        </div>

        {lookupRes && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">{lookupRes.name}</p>
                <p className="text-sm text-green-700 font-mono">{lookupRes.upiId}</p>
                <p className="text-xs text-green-600 mt-1">
                  {lookupRes.accountType} · Account: {lookupRes.accountNumber}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">How to use UPI transfer:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>Transfer Money</strong> and switch to <strong>By UPI</strong> tab</li>
            <li>Enter the recipient's UPI ID (e.g. priya.yadav@fincore)</li>
            <li>Click Verify — it will auto-fill the account</li>
            <li>Enter amount and confirm transfer</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
