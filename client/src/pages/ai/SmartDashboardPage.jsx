import { useEffect, useState } from 'react';
import { Sparkles, Wallet, TrendingDown, TrendingUp, Clock, RefreshCw, Zap, Users, Lightbulb } from 'lucide-react';
import { aiService } from '../../services';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function SmartDashboardPage() {
  const { user } = useAuth();
  const [data,      setData]    = useState(null);
  const [loading,   setLoading] = useState(true);
  const [refreshing,setRef]     = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRef(true); else setLoading(true);
    try {
      const res = await aiService.smartDashboard();
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRef(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
        <Sparkles size={22} className="text-white" />
      </div>
      <p className="text-sm text-gray-500">AI is analysing your finances…</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data?.greeting || `Hello, ${user?.firstName} 👋`}</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <Sparkles size={13} className="text-purple-500" /> AI-powered overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* AI Recommendation banner */}
      {data?.recommendation && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-white shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-100 mb-1">AI RECOMMENDATION</p>
              <p className="text-sm font-medium">{data.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Wallet size={16} className="text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Balance</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.balance || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Active accounts</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Spent</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.thisMonth?.spent || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">This month</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Received</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.thisMonth?.received || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">This month</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scheduled</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{data?.upcomingScheduled || 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pending transfers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next scheduled transfer */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Next Scheduled Transfer
          </h3>
          {data?.nextScheduled ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(data.nextScheduled.amount)}</p>
              <p className="text-sm text-amber-600 mt-1">to {data.nextScheduled.to || 'recipient'}</p>
              <p className="text-xs text-amber-500 mt-2">
                {new Date(data.nextScheduled.executeAt).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              {data.nextScheduled.description && (
                <p className="text-xs text-amber-400 mt-1">{data.nextScheduled.description}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Clock size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming scheduled transfers</p>
            </div>
          )}
        </div>

        {/* Standing instructions & top recipient */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <RefreshCw size={16} className="text-purple-500" /> Standing Instructions
            </h3>
            {data?.activeStanding > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-purple-600">{data.activeStanding}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{data.activeStanding} active instruction{data.activeStanding !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-500">Automatic recurring payments running</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No active standing instructions</p>
            )}
          </div>

          {data?.topRecipient && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={16} className="text-blue-500" /> Most Frequent Transfer
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {data.topRecipient.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{data.topRecipient.name}</p>
                  <p className="text-xs text-gray-500">{data.topRecipient.count} transfer{data.topRecipient.count !== 1 ? 's' : ''} · {formatCurrency(data.topRecipient.totalAmount)} total</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick AI actions */}
      <div className="mt-6 card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={16} className="text-purple-500" /> Quick AI Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Chat with AI', path: '/ai/chat',     icon: '💬', color: 'from-purple-500 to-blue-500' },
            { label: 'Spending Insights', path: '/ai/insights', icon: '📊', color: 'from-blue-500 to-cyan-500'   },
            { label: 'Fraud Check',   path: '/ai/fraud',   icon: '🛡️', color: 'from-red-500 to-orange-500'   },
            { label: 'View Dashboard', path: '/dashboard', icon: '🏠', color: 'from-green-500 to-teal-500'    },
          ].map(item => (
            <a key={item.path} href={item.path}
              className={`p-4 rounded-xl bg-gradient-to-br ${item.color} text-white text-center hover:opacity-90 transition-opacity cursor-pointer`}>
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs font-semibold">{item.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
