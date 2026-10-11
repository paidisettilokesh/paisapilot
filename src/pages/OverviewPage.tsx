import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  FlaskConical,
  Plus,
  Calendar,
  ChevronRight,
  Target,
  Layers,
  Clock,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { BalanceCard3D } from '@/components/dashboard/BalanceCard3D';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { CATEGORY_META } from '@/lib/constants';
import type { Category, TransactionType } from '@/types';
import { getIcon } from '@/lib/icons';

export function OverviewPage() {
  const { state, metrics, dispatch } = useFinancial();
  const navigate = useNavigate();

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<Category>('food');
  const [txDesc, setTxDesc] = useState('');

  // Handle adding a quick transaction
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
        date: new Date().toISOString().slice(0, 10),
      },
    });

    setTxAmount('');
    setTxDesc('');
    setIsAddTxOpen(false);
  };

  // Group spending by category
  const categoryExpenses = state.transactions
    .filter((t) => t.type === 'expense' && !t.isSimulated)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<Category, number>);

  const sortedCategories = (Object.entries(categoryExpenses) as [Category, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const totalExpenseVal = metrics.totalExpenses || 1;

  // Unpaid commitments due soon
  const pendingCommitments = state.commitments
    .filter((c) => !c.isPaid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  // Active subscriptions due this month
  const activeSubscriptions = state.subscriptions
    .filter((s) => !s.isPaused)
    .slice(0, 3);

  // Recent transactions
  const recentTransactions = [...state.transactions]
    .filter((t) => !t.isSimulated)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${state.userName.split(' ')[0]} 👋`}
        subtitle="30-Day Financial Command Center • Real-Time Trajectory"
        action={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/lab')}
              className="btn-ghost text-xs gap-1.5 border border-navy-500 hover:border-emerald/40 transition-all"
            >
              <FlaskConical size={14} className="text-emerald" />
              <span>Simulate Move</span>
            </button>
            <button
              onClick={() => setIsAddTxOpen(true)}
              className="btn-primary text-xs gap-1.5 shadow-glow"
            >
              <Plus size={14} />
              <span>Record Spend</span>
            </button>
          </div>
        }
      />

      {/* Row 1: 3D Balance Card + Key Trajectory KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 3D Interactive Balance Card */}
        <div className="lg:col-span-7 flex">
          <BalanceCard3D
            availableToSpend={metrics.availableToSpend}
            actualBalance={metrics.actualBalance}
            startingBudget={state.startingBudget}
            outstandingCommitments={metrics.outstandingCommitments}
            savingsReserved={metrics.savingsReserved}
            userName={state.userName}
            onExploreLab={() => navigate('/lab')}
          />
        </div>

        {/* Side KPI Column: Allowance, Trajectory & Pulse */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Safe Daily Allowance */}
          <Card variant="default" className="p-5 relative overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Clock size={12} className="text-emerald" />
                  Safe Daily Allowance
                </span>
                <Badge
                  variant={
                    metrics.dailyAllowance > 150
                      ? 'emerald'
                      : metrics.dailyAllowance > 70
                      ? 'amber'
                      : 'rose'
                  }
                >
                  {metrics.dailyAllowance > 150 ? 'Comfortable' : metrics.dailyAllowance > 70 ? 'Controlled' : 'Tight Squeeze'}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {formatCurrency(metrics.dailyAllowance)}
                </span>
                <span className="text-xs text-muted">/ day</span>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-600/70 flex items-center justify-between text-2xs text-muted">
              <span>Remaining Days: <strong className="text-white">{metrics.remainingDays} days</strong></span>
              <span className="text-emerald font-medium">Safe pace to month-end</span>
            </div>
          </Card>

          {/* Projected Month-End Balance */}
          <Card variant="default" className="p-5 relative overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-sky-400" />
                  Projected Month-End
                </span>
                <Badge variant={metrics.projectedMonthEnd >= 0 ? 'emerald' : 'rose'}>
                  {metrics.projectedMonthEnd >= 0 ? 'Surplus Expected' : 'Deficit Risk'}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-100 tracking-tight tabular-nums">
                  {formatCurrency(metrics.projectedMonthEnd)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-600/70 flex items-center justify-between text-2xs text-muted">
              <span>After all scheduled commitments</span>
              <span className="text-slate-300">
                Starting: {formatCurrency(state.startingBudget)}
              </span>
            </div>
          </Card>

          {/* Health & Risk Mini Strip */}
          <div
            onClick={() => navigate('/health')}
            className="p-3.5 rounded-2xl bg-navy-800/80 hover:bg-navy-700/80 border border-navy-500 hover:border-emerald/40 transition-all cursor-pointer flex items-center justify-between shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald/15 text-emerald flex items-center justify-center font-bold text-xs">
                {metrics.healthScore}
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">
                  Financial Health Index
                </div>
                <div className="text-2xs text-muted">
                  Risk Level: <span className="capitalize text-slate-200">{metrics.riskLevel}</span> ({metrics.riskScore}%)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-2xs text-emerald font-medium">
              <span>Inspect</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 30-Day Cash Flow Trajectory Chart */}
      <Card variant="default" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald" />
              30-Day Financial Trajectory & Projection
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Cash flow path modeling actual past spending and forecasted obligations to day 31
            </p>
          </div>
          <div className="flex items-center gap-3 text-2xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald inline-block" />
              <span className="text-slate-300">Projected Cash Balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-400 inline-block" />
              <span className="text-slate-400">Zero Floor</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.cashFlow} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickFormatter={(d) => `Day ${d}`}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E293B' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(v) => `₹${v}`}
                tickLine={false}
                axisLine={{ stroke: '#1E293B' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-navy-800 border border-navy-500 rounded-xl p-2.5 shadow-2xl text-xs">
                        <div className="text-muted font-medium mb-1">
                          Day {data.day} ({formatDate(data.date)})
                        </div>
                        <div className="text-emerald font-bold text-sm">
                          {formatCurrency(data.balance)}
                        </div>
                        <div className="text-2xs text-navy-400 mt-0.5">
                          {data.projected ? 'Forecasted Trajectory' : 'Actual Recorded Balance'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Row 3: Two-Column Modular Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Obligations & Savings Goals */}
        <div className="space-y-6">
          {/* Upcoming Bills & Subscriptions Summary */}
          <Card variant="default">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-amber" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Upcoming Bills & Subscriptions
                </h3>
              </div>
              <button
                onClick={() => navigate('/goals')}
                className="text-2xs text-emerald hover:underline flex items-center gap-0.5"
              >
                <span>Manage</span>
                <ChevronRight size={11} />
              </button>
            </div>

            {/* Commitments List */}
            <div className="space-y-2.5 mb-4">
              <div className="text-3xs uppercase tracking-wider text-muted font-bold">
                Pending Fixed Bills (₹{metrics.outstandingCommitments} unpaid)
              </div>
              {pendingCommitments.length === 0 ? (
                <p className="text-2xs text-muted py-2">No pending bills due this month.</p>
              ) : (
                pendingCommitments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-navy-700/60 border border-navy-500 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{c.description}</div>
                      <div className="text-2xs text-muted mt-0.5">Due {formatDate(c.dueDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber">{formatCurrency(c.amount)}</div>
                      <span className="text-2xs text-muted">Unpaid</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Subscriptions Mini List */}
            <div className="space-y-2 pt-3 border-t border-navy-600/70">
              <div className="text-3xs uppercase tracking-wider text-muted font-bold flex items-center justify-between">
                <span>Active Subscriptions</span>
                <span>₹{activeSubscriptions.reduce((s, sub) => s + sub.amount, 0)}/mo</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2 rounded-xl bg-navy-700/40 border border-navy-500/60 text-2xs"
                  >
                    <div className="font-medium text-slate-200 truncate">{sub.name}</div>
                    <div className="text-purple-300 font-bold">{formatCurrency(sub.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Savings Goals Progress */}
          <Card variant="default">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-emerald" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Savings Goals Progress
                </h3>
              </div>
              <button
                onClick={() => navigate('/goals')}
                className="text-2xs text-emerald hover:underline flex items-center gap-0.5"
              >
                <span>View All ({state.goals.length})</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="space-y-4">
              {state.goals.slice(0, 2).map((goal) => {
                const percent = Math.min(
                  Math.round((goal.savedAmount / goal.targetAmount) * 100),
                  100,
                );
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{goal.name}</span>
                        <span className="text-2xs text-muted ml-2">Due {formatDate(goal.targetDate)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatCurrency(goal.savedAmount)}</span>
                        <span className="text-2xs text-muted ml-1">/ {formatCurrency(goal.targetAmount)} ({percent}%)</span>
                      </div>
                    </div>
                    <div className="progress-track h-2 bg-navy-900 border border-navy-600/40">
                      <div
                        className="progress-fill bg-gradient-to-r from-emerald to-lime"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Recent Transactions & Category Breakdown */}
        <div className="space-y-6">
          {/* Recent Transactions Ledger */}
          <Card variant="default">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-slate-300" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Recent Transactions
                </h3>
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="text-2xs text-emerald hover:underline flex items-center gap-0.5"
              >
                <span>Ledger ({state.transactions.length})</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="divide-y divide-navy-600/60">
              {recentTransactions.map((tx) => {
                const meta = CATEGORY_META[tx.category] || CATEGORY_META.other;
                const Icon = getIcon(meta.icon);

                return (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">{tx.description}</div>
                        <div className="text-3xs text-muted">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold tabular-nums ${
                          tx.type === 'income' ? 'text-emerald' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Spending by Category Breakdown */}
          <Card variant="default">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Top Expense Categories
              </h3>
              <span className="text-2xs text-muted">
                Total: {formatCurrency(metrics.totalExpenses)}
              </span>
            </div>

            <div className="space-y-3">
              {sortedCategories.map(([cat, amount]) => {
                const meta = CATEGORY_META[cat] || CATEGORY_META.other;
                const Icon = getIcon(meta.icon);
                const percent = Math.round((amount / totalExpenseVal) * 100);

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: meta.bg, color: meta.color }}
                        >
                          <Icon size={11} />
                        </div>
                        <span className="text-slate-200">{meta.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-white">{formatCurrency(amount)}</span>
                        <span className="text-2xs text-muted ml-1">({percent}%)</span>
                      </div>
                    </div>
                    <div className="progress-track h-1.5">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        title="Record Transaction"
        description="Add a real spend or income to update your live budget"
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
              placeholder="e.g. 450"
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
              placeholder="e.g. Lunch with friends, Cab fare"
              className="input-field"
            />
          </div>

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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddTxOpen(false)}
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
