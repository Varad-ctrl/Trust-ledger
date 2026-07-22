import { useState, useEffect, useCallback } from 'react';
import { Receipt, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { transactionService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate, directionColor, directionSign } from '../../utils/format';

const TYPE_BADGES = {
  TRANSFER: 'bg-blue-100 text-blue-700',
  DEPOSIT: 'bg-green-100 text-green-700',
  WITHDRAWAL: 'bg-amber-100 text-amber-700',
  REVERSAL: 'bg-red-100 text-red-700',
};

export default function TransactionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback((p = 1) => {
    setLoading(true);
    transactionService.getAll({ page: p, limit: 15 })
      .then(r => { setData(r.data.data); setPage(p); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(1); }, [load]);

  const transactions = data?.transactions || [];
  const pagination = data ? { page: data.page, pages: data.pages, total: data.total } : null;

  const DirIcon = ({ dir }) => {
    if (dir === 'RECEIVED') return <TrendingUp size={15} className="text-green-600" />;
    if (dir === 'SENT') return <TrendingDown size={15} className="text-red-500" />;
    return <Minus size={15} className="text-gray-400" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Transaction History" subtitle={pagination ? `${pagination.total} total transactions` : ''} />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions yet" description="Your transaction history will appear here." />
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1"></div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Reference</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>

            <div className="divide-y divide-gray-100">
              {transactions.map(tx => (
                <div key={tx.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  {/* Direction icon */}
                  <div className="col-span-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.direction === 'RECEIVED' ? 'bg-green-50' : tx.direction === 'SENT' ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <DirIcon dir={tx.direction} />
                    </div>
                  </div>

                  {/* Description + counterparty */}
                  <div className="col-span-5 md:col-span-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.description || tx.transactionType}</p>
                    {tx.counterparty && (
                      <p className="text-xs text-gray-400">{tx.direction === 'SENT' ? 'To' : 'From'}: {tx.counterparty.firstName} {tx.counterparty.lastName}</p>
                    )}
                    <p className="text-xs text-gray-300 md:hidden">
                       {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  {/* Type badge */}
                  <div className="hidden md:block col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[tx.transactionType] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.transactionType}
                    </span>
                  </div>

                  {/* Reference */}
                  <div className="hidden md:block col-span-2">
                    <p className="text-xs font-mono text-gray-400 truncate">{tx.referenceNumber}</p>
                  </div>

                  <div className="hidden md:block col-span-2">
                    <p className="text-xs text-gray-500">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-6 md:col-span-1 text-right">
                    <span className={`text-sm font-bold ${directionColor(tx.direction)}`}>
                      {directionSign(tx.direction)}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {pagination && <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />}
          </>
        )}
      </div>
    </div>
  );
}
