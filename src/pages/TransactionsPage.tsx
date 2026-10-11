import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { CATEGORY_META } from '@/lib/constants';
import type { Category, TransactionType } from '@/types';
import { getIcon } from '@/lib/icons';

export function TransactionsPage() {
  const { state, metrics, dispatch } = useFinancial();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<Category>('food');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0 || !txDesc.trim()) return;

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        type: txType,
        amount,
        category: txCategory,
        description: txDesc.trim(),
        date: txDate,
      },
    });

    setTxAmount('');
    setTxDesc('');
    setIsAddOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: { id } });
  };

  // Filter transactions
  const filtered = state.transactions
    .filter((t) => !t.isSimulated)
    .filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions 💸"
        subtitle="Complete log of your income and day-to-day expenditures."
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary text-xs gap-1.5"
          >
            <Plus size={14} />
            <span>Add Transaction</span>
          </button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="default" className="p-4">
          <div className="text-2xs text-muted uppercase tracking-wider mb-1">
            Total Inflow (Income)
          </div>
          <div className="text-2xl font-bold text-emerald tabular-nums">
            +{formatCurrency(metrics.totalIncome)}
          </div>
          <div className="text-2xs text-muted mt-1">Starting Budget + Earnings</div>
        </Card>

        <Card variant="default" className="p-4">
          <div className="text-2xs text-muted uppercase tracking-wider mb-1">
            Total Outflow (Expenses)
          </div>
          <div className="text-2xl font-bold text-rose-400 tabular-nums">
            -{formatCurrency(metrics.totalExpenses)}
          </div>
          <div className="text-2xs text-muted mt-1">
            {state.transactions.filter((t) => t.type === 'expense').length} transactions
          </div>
        </Card>

        <Card variant="default" className="p-4">
          <div className="text-2xs text-muted uppercase tracking-wider mb-1">
            Net Monthly Burn
          </div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              metrics.totalIncome >= metrics.totalExpenses ? 'text-emerald' : 'text-amber'
            }`}
          >
            {metrics.totalIncome >= metrics.totalExpenses ? '+' : '-'}
            {formatCurrency(Math.abs(metrics.totalIncome - metrics.totalExpenses))}
          </div>
          <div className="text-2xs text-muted mt-1">Cash flow velocity</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card variant="default" className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or category..."
              className="input-field pl-9 text-xs"
            />
          </div>

          <div className="flex gap-2">
            {/* Type selector */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-field text-xs w-32"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>

            {/* Category selector */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field text-xs w-36"
            >
              <option value="all">All Categories</option>
              {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <Card variant="default" className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <Layers size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No transactions match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-600/70">
            {filtered.map((t) => {
              const meta = CATEGORY_META[t.category] || CATEGORY_META.other;
              const Icon = getIcon(meta.icon);

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 hover:bg-navy-700/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white tracking-tight">
                        {t.description}
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-muted mt-0.5">
                        <span>{formatDate(t.date)}</span>
                        <span>•</span>
                        <span className="capitalize">{meta.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          t.type === 'income' ? 'text-emerald' : 'text-slate-200'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </div>
                      <span className="text-2xs text-muted capitalize">
                        {t.type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-navy-600 transition-all"
                      title="Delete transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Transaction"
        description="Record a new transaction to update your budget"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                txType === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-navy-700 text-muted border-navy-500'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                txType === 'income'
                  ? 'bg-emerald/20 text-emerald border-emerald/40'
                  : 'bg-navy-700 text-muted border-navy-500'
              }`}
            >
              Income (+)
            </button>
          </div>

          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="e.g. 500"
              className="input-field text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              placeholder="e.g. Grocery store, Swiggy dinner"
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value as Category)}
                className="input-field text-xs"
              >
                {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
