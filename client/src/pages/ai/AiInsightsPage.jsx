import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, PieChart, Users, RefreshCw, Sparkles } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { aiService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/format';

const ICON_MAP = {
  balance:   { icon: TrendingUp,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
  spending:  { icon: TrendingDown, color: 'text-red-500',    bg: 'bg-red-50'    },
  income:    { icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50'  },
  transfer:  { icon: Users,        color: 'text-purple-600', bg: 'bg-purple-50' },
  savings:   { icon: PieChart,     color: 'text-amber-600',  bg: 'bg-amber-50'  },
  change:    { icon: RefreshCw,    color: 'text-teal-600',   bg: 'bg-teal-50'   },
};

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

function InsightCard({ insight, index }) {
  const style = ICON_MAP[insight.type] || ICON_MAP.balance;
  const Icon  = style.icon;
  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={style.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{insight.title}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{insight.value}</p>
        <p className="text-xs text-gray-500 mt-1">{insight.detail}</p>
      </div>
    </div>
  );
}

export default function AiInsightsPage() {
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [refreshing, setRef]   = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRef(true); else setLoading(true);
    try {
      const res = await aiService.insights();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false); setRef(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  // Build chart data from rawData if available
  const monthly = data?.rawData?.monthly;
  const comparisonData = monthly ? [
    { name: 'Last Month', spent: parseFloat(monthly.lastMonth.spent), received: parseFloat(monthly.lastMonth.received) },
    { name: 'This Month', spent: parseFloat(monthly.thisMonth.spent), received: parseFloat(monthly.thisMonth.received) },
  ] : [];

  const topRecipients = data?.rawData?.topRecipients || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title={<span className="flex items-center gap-2"><Sparkles size={20} className="text-purple-500" /> Spending Insights</span>}
        subtitle="AI-generated analysis of your financial patterns"
        action={
          <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* AI Summary banner */}
      {data?.summary && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl flex items-start gap-3">
          <Sparkles size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-purple-900">{data.summary}</p>
        </div>
      )}

      {/* Insight cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(data?.insights || []).map((insight, i) => (
          <InsightCard key={i} insight={insight} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month comparison chart */}
        {comparisonData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Month Comparison</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparisonData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(v), '']}
                />
                <Bar dataKey="received" name="Income"  fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="spent"    name="Spending" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Income</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Spending</span>
            </div>
          </div>
        )}

        {/* Top recipients */}
        {topRecipients.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top Transfer Recipients</h3>
            <div className="space-y-3">
              {topRecipients.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: COLORS[i] }}>
                    {r.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{r.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{r.count} transfer{r.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min((r.count / (topRecipients[0]?.count || 1)) * 100, 100)}%`, background: COLORS[i] }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Total: {formatCurrency(r.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
