import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { aiService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/format';

const RISK_CONFIG = {
  NONE:   { label: 'No Risk',  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', icon: ShieldCheck,  ring: 'ring-green-200' },
  LOW:    { label: 'Low Risk', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200',icon: Shield,       ring: 'ring-yellow-200' },
  MEDIUM: { label: 'Medium',   color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',icon: AlertTriangle,ring: 'ring-orange-200' },
  HIGH:   { label: 'High Risk',color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   icon: ShieldAlert,  ring: 'ring-red-300'   },
};

const SEV_STYLES = {
  HIGH:   'bg-red-100 text-red-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  LOW:    'bg-yellow-100 text-yellow-800',
};

const TYPE_LABELS = {
  LARGE_TRANSFER:  '💸 Large Transfer',
  RAPID_TRANSFERS: '⚡ Rapid Transfers',
  OFF_HOURS:       '🌙 Off-hours Activity',
};

export default function FraudPage() {
  const [data,      setData]     = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [refreshing,setRef]      = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRef(true); else setLoading(true);
    try {
      const res = await aiService.fraud();
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRef(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  const risk   = data?.riskLevel || 'NONE';
  const config = RISK_CONFIG[risk] || RISK_CONFIG.NONE;
  const RiskIcon = config.icon;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={<span className="flex items-center gap-2"><ShieldAlert size={20} className="text-red-500" /> Fraud Detection</span>}
        subtitle="AI analysis of your recent transactions for unusual patterns"
        action={
          <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* Risk Level Card */}
      <div className={`card p-6 mb-6 border-2 ${config.border}`}>
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-full ${config.bg} flex items-center justify-center ring-4 ${config.ring}`}>
            <RiskIcon size={30} className={config.color} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Current Risk Level</p>
            <p className={`text-3xl font-bold mt-0.5 ${config.color}`}>{config.label}</p>
            <p className="text-sm text-gray-500 mt-1">
              {data?.analysedTransactions || 0} transactions analysed · {data?.signalCount || 0} signal{data?.signalCount !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>

        {risk === 'NONE' && (
          <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <ShieldCheck size={16} />
            No unusual activity detected in your recent transactions. Your account looks secure.
          </div>
        )}
      </div>

      {/* Signal list */}
      {data?.signals?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Detected Signals</h3>
            <p className="text-xs text-gray-500 mt-0.5">Review these patterns and contact support if you do not recognise any activity</p>
          </div>
          <div className="divide-y divide-gray-100">
            {data.signals.map((signal, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-3">
                <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${SEV_STYLES[signal.severity] || SEV_STYLES.LOW}`}>
                  {signal.severity}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{TYPE_LABELS[signal.type] || signal.type}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{signal.description}</p>
                  {signal.transaction && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {signal.transaction}</p>
                  )}
                  {signal.amount && (
                    <p className="text-xs text-gray-500 mt-0.5">Amount: ₹{parseFloat(signal.amount).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-6 card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">How fraud detection works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '💸', title: 'Large Transfers', desc: 'Flags transfers 3× above your average that exceed ₹5,000' },
            { icon: '⚡', title: 'Rapid Transfers', desc: 'Detects 3+ transfers within the same minute' },
            { icon: '🌙', title: 'Off-hours Activity', desc: 'Alerts on transfers between midnight and 5 AM' },
          ].map(item => (
            <div key={item.title} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Analysis covers your last 7 days of transactions. For any suspicious activity, contact FinCore support immediately.
        </p>
      </div>
    </div>
  );
}
