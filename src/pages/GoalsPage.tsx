import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/utils/helpers';
import type { Category } from '@/types';

export function GoalsPage() {
  const { state, metrics, dispatch } = useFinancial();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'goals' | 'commitments' | 'subscriptions'>('goals');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  // New Goal Form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalCategory] = useState<Category>('savings');

  // New Commitment Form
  const [commDesc, setCommDesc] = useState('');
  const [commAmount, setCommAmount] = useState('');
  const [commDate, setCommDate] = useState('');
  const [commCategory] = useState<Category>('utilities');

  // New Subscription Form
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('15');
  const [subCategory] = useState<Category>('subscriptions');

  // Handle adding a goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(goalTarget);
    const savedAmount = parseFloat(goalSaved) || 0;
    if (!goalName.trim() || !targetAmount || !goalDate) return;

    dispatch({
      type: 'ADD_GOAL',
      payload: {
        name: goalName.trim(),
        targetAmount,
        savedAmount,
        targetDate: goalDate,
        category: goalCategory,
      },
    });

    setGoalName('');
    setGoalTarget('');
    setGoalSaved('');
    setGoalDate('');
    setIsGoalModalOpen(false);
  };

  // Handle contributing to a goal
  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(contributeAmount);
    if (!contributeGoalId || !amount || amount <= 0) return;

    dispatch({
      type: 'CONTRIBUTE_TO_GOAL',
      payload: {
        id: contributeGoalId,
        amount,
      },
    });

    setContributeAmount('');
    setContributeGoalId(null);
  };

  // Handle adding commitment
  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(commAmount);
    if (!commDesc.trim() || !amount || !commDate) return;

    dispatch({
      type: 'ADD_COMMITMENT',
      payload: {
        description: commDesc.trim(),
        amount,
        dueDate: commDate,
        category: commCategory,
        isPaid: false,
        frequency: 'monthly',
        isRecurring: true,
      },
    });

    setCommDesc('');
    setCommAmount('');
    setCommDate('');
    setIsCommitmentModalOpen(false);
  };

  // Handle adding subscription
  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(subAmount);
    const billingDate = parseInt(subDay, 10);
    if (!subName.trim() || !amount || !billingDate) return;

    dispatch({
      type: 'ADD_SUBSCRIPTION',
      payload: {
        name: subName.trim(),
        amount,
        billingDate,
        category: subCategory,
        isPaused: false,
      },
    });

    setSubName('');
    setSubAmount('');
    setIsSubModalOpen(false);
  };

  const handleMarkPaid = (id: string) => {
    dispatch({
      type: 'MARK_COMMITMENT_PAID',
      payload: { id, date: new Date().toISOString().slice(0, 10) },
    });
  };

  const handleToggleSub = (id: string) => {
    dispatch({ type: 'TOGGLE_SUBSCRIPTION_PAUSE', payload: { id } });
  };

  const handleDeleteSub = (id: string) => {
    dispatch({ type: 'DELETE_SUBSCRIPTION', payload: { id } });
  };

  const handleDeleteGoal = (id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: { id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & Commitments 🎯"
        subtitle="Protect your future self while managing recurring bills and subscriptions."
        action={
          <div className="flex gap-2">
            {activeTab === 'goals' && (
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="btn-primary text-xs gap-1.5"
              >
                <Plus size={14} />
                <span>New Goal</span>
              </button>
            )}
            {activeTab === 'commitments' && (
              <button
                onClick={() => setIsCommitmentModalOpen(true)}
                className="btn-primary text-xs gap-1.5"
              >
                <Plus size={14} />
                <span>Add Bill</span>
              </button>
            )}
            {activeTab === 'subscriptions' && (
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="btn-primary text-xs gap-1.5"
              >
                <Plus size={14} />
                <span>Add Subscription</span>
              </button>
            )}
          </div>
        }
      />

      {/* Segment Navigation */}
      <div className="flex border-b border-navy-500 gap-6">
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'goals'
              ? 'border-emerald text-emerald'
              : 'border-transparent text-muted hover:text-slate-200'
          }`}
        >
          <Target size={15} />
          <span>Savings Goals ({state.goals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('commitments')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'commitments'
              ? 'border-emerald text-emerald'
              : 'border-transparent text-muted hover:text-slate-200'
          }`}
        >
          <Calendar size={15} />
          <span>Upcoming Commitments ({state.commitments.filter((c) => !c.isPaid).length} unpaid)</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'subscriptions'
              ? 'border-emerald text-emerald'
              : 'border-transparent text-muted hover:text-slate-200'
          }`}
        >
          <RefreshCw size={15} />
          <span>Subscriptions ({state.subscriptions.length})</span>
        </button>
      </div>

      {/* TAB 1: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="default" className="p-4">
              <div className="text-2xs text-muted uppercase tracking-wider mb-1">
                Total Saved in Goals
              </div>
              <div className="text-2xl font-bold text-emerald tabular-nums">
                {formatCurrency(
                  state.goals.reduce((s, g) => s + g.savedAmount, 0),
                )}
              </div>
              <div className="text-2xs text-muted mt-1">Accumulated reserves</div>
            </Card>

            <Card variant="default" className="p-4">
              <div className="text-2xs text-muted uppercase tracking-wider mb-1">
                Target Objective
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {formatCurrency(
                  state.goals.reduce((s, g) => s + g.targetAmount, 0),
                )}
              </div>
              <div className="text-2xs text-muted mt-1">Total goal milestones</div>
            </Card>

            <Card variant="default" className="p-4">
              <div className="text-2xs text-muted uppercase tracking-wider mb-1">
                Savings Reserved This Month
              </div>
              <div className="text-2xl font-bold text-amber tabular-nums">
                {formatCurrency(metrics.savingsReserved)}
              </div>
              <div className="text-2xs text-muted mt-1">Locked from available spend</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.goals.map((goal) => {
              const percent = Math.min(
                Math.round((goal.savedAmount / goal.targetAmount) * 100),
                100,
              );
              const isAchieved = goal.savedAmount >= goal.targetAmount;

              return (
                <Card key={goal.id} variant="default" className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-tight">
                          {goal.name}
                        </span>
                        <Badge variant={isAchieved ? 'emerald' : 'blue'}>
                          {isAchieved ? 'Achieved 🏆' : 'On Track'}
                        </Badge>
                      </div>
                      <div className="text-2xs text-muted mt-0.5">
                        Target Date: {formatDate(goal.targetDate)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-muted hover:text-rose-400 p-1"
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1 text-xs">
                      <span className="font-bold text-white">
                        {formatCurrency(goal.savedAmount)}
                      </span>
                      <span className="text-muted">
                        of {formatCurrency(goal.targetAmount)} ({percent}%)
                      </span>
                    </div>
                    <div className="progress-track h-2">
                      <div
                        className="progress-fill bg-emerald"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-2xs text-muted">
                      Need {formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount))} more
                    </span>
                    {!isAchieved && (
                      <button
                        onClick={() => setContributeGoalId(goal.id)}
                        className="btn-ghost text-xs border border-navy-500 hover:border-emerald/40 gap-1"
                      >
                        <Plus size={13} />
                        <span>Add Money</span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COMMITMENTS */}
      {activeTab === 'commitments' && (
        <div className="space-y-4">
          <Card variant="default" className="p-4 flex items-center justify-between">
            <div>
              <span className="text-2xs text-muted uppercase tracking-wider">
                Unpaid Commitments Due
              </span>
              <div className="text-2xl font-bold text-amber tabular-nums mt-0.5">
                {formatCurrency(metrics.outstandingCommitments)}
              </div>
            </div>
            <p className="text-xs text-muted max-w-sm text-right">
              These are deducted from your actual balance to compute your real available-to-spend allowance.
            </p>
          </Card>

          <Card variant="default" className="p-0 overflow-hidden">
            <div className="divide-y divide-navy-600/70">
              {state.commitments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 hover:bg-navy-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        c.isPaid
                          ? 'bg-emerald/15 text-emerald'
                          : 'bg-amber/15 text-amber'
                      }`}
                    >
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {c.description}
                      </div>
                      <div className="text-2xs text-muted mt-0.5">
                        Due {formatDate(c.dueDate)} • {c.frequency}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white tabular-nums">
                        {formatCurrency(c.amount)}
                      </div>
                      <Badge variant={c.isPaid ? 'emerald' : 'amber'}>
                        {c.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>

                    {!c.isPaid && (
                      <button
                        onClick={() => handleMarkPaid(c.id)}
                        className="btn-primary text-xs py-1.5 px-3 gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Pay</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <Card variant="default" className="p-4 flex items-center justify-between">
            <div>
              <span className="text-2xs text-muted uppercase tracking-wider">
                Monthly Subscriptions Total
              </span>
              <div className="text-2xl font-bold text-purple-400 tabular-nums mt-0.5">
                {formatCurrency(
                  state.subscriptions
                    .filter((s) => !s.isPaused)
                    .reduce((sum, s) => sum + s.amount, 0),
                )}
                <span className="text-xs text-muted font-normal"> / month</span>
              </div>
            </div>
            <p className="text-xs text-muted max-w-sm text-right">
              Pause unused subscriptions anytime to immediately unlock more daily allowance.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.subscriptions.map((sub) => (
              <Card
                key={sub.id}
                variant="default"
                className={`p-4 flex items-center justify-between ${
                  sub.isPaused ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <RefreshCw size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{sub.name}</span>
                      {sub.isPaused && <Badge variant="slate">Paused</Badge>}
                    </div>
                    <div className="text-2xs text-muted mt-0.5">
                      Billed on {sub.billingDate}th of each month
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white tabular-nums">
                      {formatCurrency(sub.amount)}
                    </div>
                    <div className="text-2xs text-muted">monthly</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleSub(sub.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-navy-600 transition-colors"
                      title={sub.isPaused ? 'Resume Subscription' : 'Pause Subscription'}
                    >
                      {sub.isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-rose-400 hover:bg-navy-600 transition-colors"
                      title="Remove Subscription"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Savings Goal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Create Savings Goal"
        description="Set a target to lock funds away from discretionary spending"
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="e.g. Goa Trip, New iPad"
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Target Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="e.g. 5000"
                className="input-field text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Already Saved (₹)
              </label>
              <input
                type="number"
                min="0"
                value={goalSaved}
                onChange={(e) => setGoalSaved(e.target.value)}
                placeholder="0"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              required
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Create Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Contribute to Goal */}
      <Modal
        isOpen={!!contributeGoalId}
        onClose={() => setContributeGoalId(null)}
        title="Add Money to Goal"
        description="Deposit cash towards this savings milestone"
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Contribution Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              required
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              placeholder="e.g. 500"
              className="input-field text-lg font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setContributeGoalId(null)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Deposit
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Commitment */}
      <Modal
        isOpen={isCommitmentModalOpen}
        onClose={() => setIsCommitmentModalOpen(false)}
        title="Add Fixed Commitment"
        description="Scheduled bills and expenses due this month"
      >
        <form onSubmit={handleAddCommitment} className="space-y-4">
          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Bill Name
            </label>
            <input
              type="text"
              required
              value={commDesc}
              onChange={(e) => setCommDesc(e.target.value)}
              placeholder="e.g. Electricity bill, WiFi recharge"
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                value={commAmount}
                onChange={(e) => setCommAmount(e.target.value)}
                placeholder="e.g. 800"
                className="input-field text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={commDate}
                onChange={(e) => setCommDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCommitmentModalOpen(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Commitment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Subscription */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title="Add Recurring Subscription"
        description="Track monthly digital services and memberships"
      >
        <form onSubmit={handleAddSub} className="space-y-4">
          <div>
            <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
              Service Name
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="e.g. Netflix, YouTube Premium"
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Monthly Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                placeholder="e.g. 199"
                className="input-field text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-2xs text-muted uppercase tracking-wider mb-1">
                Day of Month (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
                placeholder="15"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSubModalOpen(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
