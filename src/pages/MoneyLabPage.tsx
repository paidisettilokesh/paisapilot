import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RotateCcw,
  Sliders,
  Split,
  Target,
  ThumbsUp,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { useSimulator } from '@/hooks/useSimulator';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { CATEGORY_META } from '@/lib/constants';
import type { Category, ScenarioType, SimulationResult } from '@/types';

// Exact presets required by spec + Gen-Z contextual descriptions
const PRESETS = [
  {
    title: 'Food Delivery Cravings',
    amount: 500,
    type: 'expense' as ScenarioType,
    category: 'food' as Category,
    tag: 'Discretionary',
    description: 'Swiggy/Zomato comfort order with friends.',
  },
  {
    title: 'Trending Sneakers Drop',
    amount: 1500,
    type: 'expense' as ScenarioType,
    category: 'shopping' as Category,
    tag: 'Lifestyle Want',
    description: 'Limited sneaker flash sale on Myntra.',
  },
  {
    title: 'Gadget / Tech Accessory',
    amount: 2500,
    type: 'expense' as ScenarioType,
    category: 'shopping' as Category,
    tag: 'Tech Hardware',
    description: 'Mechanical keyboard or noise-canceling headphones.',
  },
  {
    title: 'Emergency Medical Expense',
    amount: 2000,
    type: 'expense' as ScenarioType,
    category: 'health' as Category,
    tag: 'Unforeseen Shock',
    description: 'Unexpected doctor visit, dental checkup, or medicines.',
  },
  {
    title: 'Freelance Design Payout',
    amount: 3000,
    type: 'income' as ScenarioType,
    category: 'income' as Category,
    tag: 'Side Hustle',
    description: 'Client payment for freelance graphic design work.',
  },
];

export function MoneyLabPage() {
  const { state } = useFinancial();
  const { result, preview, confirm, reset, hasConfirmed } = useSimulator();

  const [description, setDescription] = useState('Trending Sneakers Drop');
  const [amount, setAmount] = useState<number>(1500);
  const [type, setType] = useState<ScenarioType>('expense');
  const [category, setCategory] = useState<Category>('shopping');

  // Secondary slot for Side-by-Side Comparison (Scenario B)
  const [compareResult, setCompareResult] = useState<SimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'comparison'>('primary');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Run simulation on demand or form submit
  const handleSimulate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    preview({
      type,
      amount: Math.round(amount),
      category,
      description: description.trim(),
    });
    setShowSuccessBanner(false);
  };

  // Preset quick selection
  const handleApplyPreset = (preset: (typeof PRESETS)[number]) => {
    setDescription(preset.title);
    setAmount(preset.amount);
    setType(preset.type);
    setCategory(preset.category);

    preview({
      type: preset.type,
      amount: preset.amount,
      category: preset.category,
      description: preset.title,
    });
    setShowSuccessBanner(false);
  };

  // Pin current simulation as Scenario B for side-by-side comparison
  const handlePinForComparison = () => {
    if (result) {
      setCompareResult(result);
      setActiveTab('comparison');
    }
  };

  // Alternative options: reduce amount or delay
  const handleApplyAlternative = (multiplier: number, suffix: string) => {
    const newAmount = Math.max(Math.round(amount * multiplier), 100);
    const newDesc = `${description} (${suffix})`;
    setAmount(newAmount);
    setDescription(newDesc);

    preview({
      type,
      amount: newAmount,
      category,
      description: newDesc,
    });
  };

  // Single-dispatch confirm with duplicate protection
  const handleConfirm = (targetResult?: SimulationResult) => {
    const toConfirm = targetResult || result;
    if (!toConfirm || hasConfirmed) return;
    confirm(toConfirm);
    setShowSuccessBanner(true);
  };

  // Cancel / Reset
  const handleCancel = () => {
    reset();
    setCompareResult(null);
    setShowSuccessBanner(false);
  };

  // Nuanced decision verdict engine
  const getDecisionVerdict = (res: SimulationResult) => {
    const { before, after, delta, scenario } = res;

    if (scenario.type === 'income') {
      return {
        level: 'safe',
        badge: 'Positive Liquidity Boost 🚀',
        badgeVariant: 'emerald' as const,
        headline: 'Financial Position Strengthened',
        reason: `Increases actual balance by +${formatCurrency(scenario.amount)} and lifts safe daily allowance by +${formatCurrency(delta.dailyAllowance)}/day.`,
        advice: 'Smart move! Consider parking 40% of this surplus into your savings goals.',
      };
    }

    // Expense checks
    if (after.availableToSpend <= 0) {
      return {
        level: 'danger',
        badge: 'Critical Overdraft Risk 🚨',
        badgeVariant: 'rose' as const,
        headline: 'Deficit Warning: Dips Into Essential Commitments',
        reason: `This purchase completely wipes out your disposable cash and leaves ₹${Math.abs(after.projectedMonthEnd)} of unpaid commitments at risk of default.`,
        advice: 'Delay this purchase until next month or explore lower-cost alternatives below.',
      };
    }

    if (after.dailyAllowance < 60) {
      return {
        level: 'caution',
        badge: 'Tight Budget Squeeze ⚠️',
        badgeVariant: 'amber' as const,
        headline: 'Severe Daily Allowance Squeeze',
        reason: `Your safe spending allowance drops by -${formatCurrency(Math.abs(delta.dailyAllowance))}/day down to just ${formatCurrency(after.dailyAllowance)}/day for the remaining ${after.remainingDays} days.`,
        advice: 'Feasible if you cut non-essential snacks and rides, or reduce the purchase amount by 30%.',
      };
    }

    if (before.riskLevel !== after.riskLevel && (after.riskLevel === 'high' || after.riskLevel === 'critical')) {
      return {
        level: 'caution',
        badge: 'Risk Level Elevated ⚠️',
        badgeVariant: 'amber' as const,
        headline: 'Shifts Financial Risk to ' + after.riskLevel.toUpperCase(),
        reason: `Available buffer narrows from ${formatCurrency(before.availableToSpend)} to ${formatCurrency(after.availableToSpend)}.`,
        advice: 'Fits within your budget, but leaves little margin for unexpected emergencies.',
      };
    }

    return {
      level: 'safe',
      badge: 'Safe & Affordable Move ✅',
      badgeVariant: 'emerald' as const,
      headline: 'Comfortably Fits Within Safe Allowance',
      reason: `You still retain ${formatCurrency(after.availableToSpend)} available to spend and a healthy daily allowance of ${formatCurrency(after.dailyAllowance)}/day.`,
      advice: 'All upcoming commitments and savings goals remain 100% funded. Enjoy guilt-free!',
    };
  };

  const verdict = result ? getDecisionVerdict(result) : null;

  // Comparison cash-flow data points
  const comparisonFlowData = result
    ? result.before.cashFlow.map((beforePoint, idx) => {
        const afterPoint = result.after.cashFlow[idx];
        const comparePoint = compareResult ? compareResult.after.cashFlow[idx] : null;
        return {
          day: beforePoint.day,
          date: beforePoint.date,
          current: beforePoint.balance,
          scenarioA: afterPoint ? afterPoint.balance : beforePoint.balance,
          scenarioB: comparePoint ? comparePoint.balance : undefined,
        };
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="What-If Money Lab 🧪"
        subtitle="Simulate financial choices before spending. See real-time impacts on balance, bills, allowance & goals."
      />

      {/* Confirmation Success Alert */}
      {showSuccessBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald/15 border border-emerald/30 text-emerald flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} />
            Decision confirmed! Exactly 1 transaction recorded in your ledger and all dependent metrics updated.
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-2xs underline hover:text-white"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Preset Decision Chips */}
      <div>
        <div className="text-2xs font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
          <Sparkles size={13} className="text-emerald" />
          Test Common Decisions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="p-3 rounded-2xl bg-navy-800 border border-navy-500 hover:border-emerald/40 hover:bg-navy-700/70 transition-all text-left group shadow-card"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-3xs text-muted group-hover:text-emerald font-mono uppercase tracking-wider">
                  {p.tag}
                </span>
                <span
                  className={`text-2xs font-extrabold ${
                    p.type === 'income' ? 'text-emerald' : 'text-slate-200 group-hover:text-white'
                  }`}
                >
                  {p.type === 'income' ? '+' : '-'}₹{p.amount}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-white">
                {p.title}
              </div>
              <p className="text-3xs text-muted line-clamp-1 mt-0.5">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Lab Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Decision Parameters & Controls */}
        <Card variant="default" className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-600/70">
            <div className="flex items-center gap-2">
              <FlaskConical size={18} className="text-emerald" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Scenario Builder
              </h3>
            </div>
            <span className="text-2xs text-muted font-mono">Real Engine • Zero Side-Effects</span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            {/* Transaction Type */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                    : 'bg-navy-700/80 text-muted border-navy-500'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'income'
                    ? 'bg-emerald/20 text-emerald border-emerald/40 shadow-sm'
                    : 'bg-navy-700/80 text-muted border-navy-500'
                }`}
              >
                Income (+)
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Purchase / Decision Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Weekend Goa Trip, Noise Cancelling Headphones"
                className="input-field text-xs"
              />
            </div>

            {/* Amount Input & Accessible Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-2xs text-muted uppercase tracking-wider">
                  Amount (₹)
                </label>
                <span className="text-xs font-bold text-emerald tabular-nums">
                  {formatCurrency(amount)}
                </span>
              </div>

              <input
                type="number"
                min="50"
                max="25000"
                step="50"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input-field text-xl font-black text-white"
              />

              {/* Range Slider for Accessible Tactile Control */}
              <div className="pt-1">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-emerald cursor-pointer h-1.5 bg-navy-950 rounded-lg"
                  aria-label="Purchase amount slider"
                />
                <div className="flex justify-between text-3xs text-muted font-mono mt-1">
                  <span>₹100</span>
                  <span>₹2,500</span>
                  <span>₹5,000</span>
                  <span>₹10,000</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="input-field text-xs"
              >
                {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="btn-primary flex-1 text-xs justify-center gap-2 py-2.5 shadow-glow"
              >
                <FlaskConical size={14} />
                <span>Simulate Decision</span>
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-ghost text-xs p-2.5 border border-navy-500"
                  title="Reset simulation"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Trade-off Alternatives Shelf */}
          {result && (
            <div className="pt-4 border-t border-navy-600/70 space-y-2">
              <div className="text-3xs uppercase tracking-wider text-muted font-bold flex items-center gap-1">
                <Sliders size={11} className="text-emerald" />
                <span>Explore Trade-off Adjustments</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyAlternative(0.7, '30% trimmed')}
                  className="p-2 rounded-xl bg-navy-700/60 hover:bg-navy-600 border border-navy-500 text-3xs text-slate-200 transition-all text-center"
                >
                  <div className="font-bold text-emerald">-30%</div>
                  <div className="text-muted">Trim Cost</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAlternative(0.5, '50% split')}
                  className="p-2 rounded-xl bg-navy-700/60 hover:bg-navy-600 border border-navy-500 text-3xs text-slate-200 transition-all text-center"
                >
                  <div className="font-bold text-amber">Split 50%</div>
                  <div className="text-muted">With Friend</div>
                </button>
                <button
                  type="button"
                  onClick={handlePinForComparison}
                  className="p-2 rounded-xl bg-navy-700/60 hover:bg-navy-600 border border-navy-500 text-3xs text-slate-200 transition-all text-center"
                >
                  <div className="font-bold text-purple-300">Compare</div>
                  <div className="text-muted">Pin as Plan B</div>
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Right Column: Comprehensive Before-and-After Analysis */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Decision Verdict Banner with Contextual Explanation */}
              {verdict && (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    verdict.level === 'safe'
                      ? 'bg-emerald/10 border-emerald/30 shadow-sm'
                      : verdict.level === 'caution'
                      ? 'bg-amber/10 border-amber/30 shadow-sm'
                      : 'bg-rose-500/10 border-rose-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      {verdict.level === 'safe' ? (
                        <CheckCircle2 size={18} className="text-emerald shrink-0" />
                      ) : verdict.level === 'caution' ? (
                        <AlertTriangle size={18} className="text-amber shrink-0" />
                      ) : (
                        <XCircle size={18} className="text-rose-400 shrink-0" />
                      )}
                      <span>{verdict.headline}</span>
                    </div>
                    <Badge variant={verdict.badgeVariant}>{verdict.badge}</Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {verdict.reason}
                  </p>
                  <div className="pt-2 border-t border-navy-600/40 text-2xs text-slate-400 flex items-center gap-1.5">
                    <ThumbsUp size={12} className="text-emerald" />
                    <span><strong>Trade-off Insight:</strong> {verdict.advice}</span>
                  </div>
                </div>
              )}

              {/* Scenario View Switcher (when Plan B is pinned) */}
              {compareResult && (
                <div className="flex flex-wrap items-center justify-between p-2.5 rounded-2xl bg-navy-800 border border-navy-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('primary')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'primary'
                          ? 'bg-emerald text-navy-950 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-navy-700/60'
                      }`}
                    >
                      Plan A Detail ({formatCurrency(result.scenario.amount)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('comparison')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'comparison'
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-navy-700/60'
                      }`}
                    >
                      Side-by-Side (Plan A vs Plan B)
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareResult(null);
                      setActiveTab('primary');
                    }}
                    className="text-3xs text-slate-400 hover:text-rose-400 px-2 py-1 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={11} /> Clear Plan B
                  </button>
                </div>
              )}

              {activeTab === 'comparison' && compareResult ? (
                /* Side-by-Side Multi-Scenario Comparison Matrix */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-navy-800 border border-navy-500 overflow-x-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Split size={14} className="text-purple-400" />
                        Side-by-Side Scenario Trade-off Matrix
                      </h4>
                      <span className="text-3xs text-muted">Preview trade-offs side by side</span>
                    </div>

                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-navy-600/60 text-3xs uppercase tracking-wider text-muted font-bold">
                          <th className="py-2 pr-3">Financial Metric</th>
                          <th className="py-2 px-3">Current Plan</th>
                          <th className="py-2 px-3 text-emerald font-bold">
                            Plan A: {result.scenario.description} ({formatCurrency(result.scenario.amount)})
                          </th>
                          <th className="py-2 pl-3 text-purple-400 font-bold">
                            Plan B: {compareResult.scenario.description} ({formatCurrency(compareResult.scenario.amount)})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700/50">
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">1. In-Account Cash</td>
                          <td className="py-2.5 px-3 text-slate-400">{formatCurrency(result.before.actualBalance)}</td>
                          <td className="py-2.5 px-3 font-bold text-white">{formatCurrency(result.after.actualBalance)}</td>
                          <td className="py-2.5 pl-3 font-bold text-white">{formatCurrency(compareResult.after.actualBalance)}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">2. Available Spend</td>
                          <td className="py-2.5 px-3 text-slate-400">{formatCurrency(result.before.availableToSpend)}</td>
                          <td className={`py-2.5 px-3 font-bold ${result.after.availableToSpend > 0 ? 'text-emerald' : 'text-rose-400'}`}>
                            {formatCurrency(result.after.availableToSpend)}
                          </td>
                          <td className={`py-2.5 pl-3 font-bold ${compareResult.after.availableToSpend > 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                            {formatCurrency(compareResult.after.availableToSpend)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">3. Safe Daily Allowance</td>
                          <td className="py-2.5 px-3 text-slate-400">{formatCurrency(result.before.dailyAllowance)}/d</td>
                          <td className="py-2.5 px-3 font-bold text-white">{formatCurrency(result.after.dailyAllowance)}/d</td>
                          <td className="py-2.5 pl-3 font-bold text-white">{formatCurrency(compareResult.after.dailyAllowance)}/d</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">4. Projected Month-End</td>
                          <td className="py-2.5 px-3 text-slate-400">{formatCurrency(result.before.projectedMonthEnd)}</td>
                          <td className={`py-2.5 px-3 font-bold ${result.after.projectedMonthEnd >= 0 ? 'text-white' : 'text-rose-400'}`}>
                            {formatCurrency(result.after.projectedMonthEnd)}
                          </td>
                          <td className={`py-2.5 pl-3 font-bold ${compareResult.after.projectedMonthEnd >= 0 ? 'text-white' : 'text-rose-400'}`}>
                            {formatCurrency(compareResult.after.projectedMonthEnd)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">5. Commitments Status</td>
                          <td className="py-2.5 px-3 text-slate-400">₹{result.before.outstandingCommitments} owed</td>
                          <td className={`py-2.5 px-3 font-semibold ${result.after.availableToSpend >= 0 ? 'text-emerald' : 'text-rose-400'}`}>
                            {result.after.availableToSpend >= 0 ? 'Protected' : 'Compromised'}
                          </td>
                          <td className={`py-2.5 pl-3 font-semibold ${compareResult.after.availableToSpend >= 0 ? 'text-emerald' : 'text-rose-400'}`}>
                            {compareResult.after.availableToSpend >= 0 ? 'Protected' : 'Compromised'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">6. Risk Exposure</td>
                          <td className="py-2.5 px-3 text-slate-400 capitalize">{result.before.riskLevel} ({result.before.riskScore}%)</td>
                          <td className="py-2.5 px-3 font-semibold capitalize text-white">{result.after.riskLevel} ({result.after.riskScore}%)</td>
                          <td className="py-2.5 pl-3 font-semibold capitalize text-white">{compareResult.after.riskLevel} ({compareResult.after.riskScore}%)</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 text-slate-300 font-medium">7. Health Index</td>
                          <td className="py-2.5 px-3 text-slate-400">{result.before.healthScore}/100</td>
                          <td className="py-2.5 px-3 font-bold text-emerald">{result.after.healthScore}/100</td>
                          <td className="py-2.5 pl-3 font-bold text-purple-400">{compareResult.after.healthScore}/100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleConfirm(result)}
                      disabled={hasConfirmed}
                      className="btn-primary flex-1 text-xs justify-center gap-2 py-3 shadow-glow disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>{hasConfirmed ? 'Recorded' : `Confirm Plan A (${formatCurrency(result.scenario.amount)})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirm(compareResult)}
                      disabled={hasConfirmed}
                      className="flex-1 text-xs justify-center gap-2 py-3 font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>{hasConfirmed ? 'Recorded' : `Confirm Plan B (${formatCurrency(compareResult.scenario.amount)})`}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Primary Detailed 8-Point Matrix */
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* 1. Actual In-Hand Balance */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        1. In-Account Cash
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {formatCurrency(result.before.actualBalance)}
                      </div>
                      <div className="text-sm font-bold text-white tabular-nums">
                        {formatCurrency(result.after.actualBalance)}
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.scenario.type === 'income' ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.scenario.type === 'income' ? '+' : '-'}
                        {formatCurrency(result.scenario.amount)}
                      </div>
                    </div>

                    {/* 2. Available to Spend */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        2. Available Spend
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {formatCurrency(result.before.availableToSpend)}
                      </div>
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          result.after.availableToSpend > 0 ? 'text-white' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(result.after.availableToSpend)}
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.delta.availableToSpend >= 0 ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.delta.availableToSpend >= 0 ? '+' : ''}
                        {formatCurrency(result.delta.availableToSpend)}
                      </div>
                    </div>

                    {/* 3. Safe Daily Allowance */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        3. Daily Allowance
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {formatCurrency(result.before.dailyAllowance)}/d
                      </div>
                      <div className="text-sm font-bold text-white tabular-nums">
                        {formatCurrency(result.after.dailyAllowance)}/d
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.delta.dailyAllowance >= 0 ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.delta.dailyAllowance >= 0 ? '+' : ''}
                        {formatCurrency(result.delta.dailyAllowance)}/d
                      </div>
                    </div>

                    {/* 4. Projected Month-End */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        4. Month-End Cushion
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {formatCurrency(result.before.projectedMonthEnd)}
                      </div>
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          result.after.projectedMonthEnd >= 0 ? 'text-white' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(result.after.projectedMonthEnd)}
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.delta.projectedMonthEnd >= 0 ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.delta.projectedMonthEnd >= 0 ? '+' : ''}
                        {formatCurrency(result.delta.projectedMonthEnd)}
                      </div>
                    </div>

                    {/* 5. Remaining Budget Pace */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        5. Budget Utilization
                      </div>
                      <div className="text-xs text-slate-400">
                        Spent: {formatCurrency(result.before.totalExpenses)}
                      </div>
                      <div className="text-sm font-bold text-white">
                        Spent: {formatCurrency(result.after.totalExpenses)}
                      </div>
                      <div className="text-3xs text-muted mt-1">
                        of {formatCurrency(state.startingBudget)} cap
                      </div>
                    </div>

                    {/* 6. Commitment Affordability */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        6. Unpaid Bills Safety
                      </div>
                      <div className="text-xs text-amber font-semibold">
                        ₹{result.after.outstandingCommitments} owed
                      </div>
                      <div className="text-sm font-bold text-white">
                        {result.after.availableToSpend >= 0 ? '100% Funded' : 'Compromised!'}
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.after.availableToSpend >= 0 ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.after.availableToSpend >= 0 ? 'Bills Protected' : 'Default Danger'}
                      </div>
                    </div>

                    {/* 7. Risk Level Shift */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        7. Risk Exposure
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {result.before.riskLevel} ({result.before.riskScore}%)
                      </div>
                      <div className="text-sm font-bold text-white capitalize">
                        {result.after.riskLevel} ({result.after.riskScore}%)
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.delta.riskScore <= 0 ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.delta.riskScore > 0 ? '+' : ''}
                        {result.delta.riskScore} pts risk
                      </div>
                    </div>

                    {/* 8. Financial Health Score */}
                    <div className="p-3.5 rounded-2xl bg-navy-800 border border-navy-500">
                      <div className="text-3xs uppercase tracking-wider text-muted font-bold mb-1">
                        8. Health Index
                      </div>
                      <div className="text-xs text-slate-400">
                        {result.before.healthScore} / 100
                      </div>
                      <div className="text-sm font-bold text-white">
                        {result.after.healthScore} / 100
                      </div>
                      <div
                        className={`text-3xs font-bold mt-1 ${
                          result.delta.healthScore >= 0 ? 'text-emerald' : 'text-rose-400'
                        }`}
                      >
                        {result.delta.healthScore >= 0 ? '+' : ''}
                        {result.delta.healthScore} pts health
                      </div>
                    </div>
                  </div>

                  {/* Goal Feasibility & Progress Impact Analysis */}
                  <div className="p-4 rounded-2xl bg-navy-800 border border-navy-500 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Target size={15} className="text-emerald" />
                        Savings Goals Feasibility Impact
                      </span>
                      <span className="text-2xs text-muted">
                        {result.after.goalFeasibility.filter((g) => g.feasible).length} of {result.after.goalFeasibility.length} Goals Feasible
                      </span>
                    </div>

                    <div className="space-y-2">
                      {result.after.goalFeasibility.map((g) => {
                        const beforeGoal = result.before.goalFeasibility.find((bg) => bg.goalId === g.goalId);
                        const statusChanged = beforeGoal && beforeGoal.status !== g.status;

                        return (
                          <div
                            key={g.goalId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-navy-700/50 border border-navy-600/50 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-200">{g.name}</div>
                              <div className="text-3xs text-muted">
                                Requires {formatCurrency(g.monthlyTargetNeeded)}/mo allocation
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {statusChanged && (
                                <span className="text-3xs text-amber font-bold">
                                  Shifted from {beforeGoal.status}
                                </span>
                              )}
                              <Badge variant={g.status === 'achieved' || g.status === 'on_track' ? 'emerald' : 'rose'}>
                                {g.status === 'achieved' ? 'Achieved 🏆' : g.status === 'on_track' ? 'On Track' : 'At Risk ⚠️'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons: Confirm Decision vs Cancel */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirm(result)}
                      disabled={hasConfirmed}
                      className="btn-primary flex-1 text-xs justify-center gap-2 py-3 shadow-glow disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>
                        {hasConfirmed ? 'Transaction Recorded' : 'Confirm & Commit To Live Budget'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-ghost text-xs px-5 py-3 border border-navy-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Comparative Cash-Flow Trajectory Chart */}
              <Card variant="default" className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      <Split size={14} className="text-emerald" />
                      Comparative Trajectory Overlay (Current vs Simulated)
                    </h4>
                    <p className="text-3xs text-muted">
                      Shows the cash balance timeline divergence caused by this single decision
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-3xs font-mono">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-slate-400 inline-block" />
                      <span className="text-slate-300">Current Plan</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-emerald inline-block" />
                      <span className="text-emerald">Plan A</span>
                    </div>
                    {compareResult && (
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 bg-purple-400 inline-block" />
                        <span className="text-purple-400">Plan B</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={comparisonFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="simAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="compAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        tickFormatter={(d) => `D${d}`}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={10}
                        tickFormatter={(v) => `₹${v}`}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-navy-800 border border-navy-500 rounded-xl p-2.5 shadow-2xl text-xs space-y-1">
                                <div className="text-muted text-2xs font-mono">
                                  Day {data.day} ({formatDate(data.date)})
                                </div>
                                <div className="text-slate-300">
                                  Current: <strong className="text-white">{formatCurrency(data.current)}</strong>
                                </div>
                                <div className="text-emerald">
                                  Plan A: <strong className="text-emerald">{formatCurrency(data.scenarioA)}</strong>
                                </div>
                                {data.scenarioB !== undefined && (
                                  <div className="text-purple-400">
                                    Plan B: <strong className="text-purple-400">{formatCurrency(data.scenarioB)}</strong>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="current"
                        stroke="#64748B"
                        strokeDasharray="4 4"
                        fill="transparent"
                        strokeWidth={1.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="scenarioA"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fill="url(#simAreaGradient)"
                      />
                      {compareResult && (
                        <Area
                          type="monotone"
                          dataKey="scenarioB"
                          stroke="#A855F7"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          fill="url(#compAreaGradient)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          ) : (
            /* Empty State */
            <div className="h-full min-h-[420px] rounded-3xl border border-dashed border-navy-500/80 flex flex-col items-center justify-center p-8 text-center bg-navy-800/20">
              <div className="w-16 h-16 rounded-2xl bg-navy-700/60 border border-navy-500 flex items-center justify-center mb-3 text-emerald shadow-inner">
                <FlaskConical size={32} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                Ready to Simulate a Move
              </h4>
              <p className="text-xs text-muted max-w-sm leading-relaxed">
                Choose any preset above or dial an amount on the slider to test its full
                30-day ripple effect before committing real cash.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
