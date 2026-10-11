/**
 * PaisaPilot Financial Calculation Engine
 *
 * All functions here are PURE — deterministic, typed TypeScript functions with zero side-effects.
 * No UI components, no React dependencies, no dispatch, no DOM access.
 *
 * Single Source of Truth formulas:
 *
 *   actualBalance          = startingBudget + totalIncome − totalExpenses
 *   outstandingCommitments = Σ unpaid commitments (excluding already paid ones)
 *   upcomingSubscriptions  = Σ active subscription amounts due later this month
 *   savingsReserved        = Σ monthly target contributions locked for savings goals
 *   availableToSpend       = max(0, actualBalance − outstandingCommitments − upcomingSubscriptions − savingsReserved)
 *   projectedMonthEnd      = actualBalance − outstandingCommitments − upcomingSubscriptions
 *   dailyAllowance         = remainingDays > 0 ? availableToSpend / remainingDays : 0
 *
 * Internal arithmetic uses integer-rupee rounding (Math.round) to avoid IEEE 754 float precision errors.
 */

import type {
  FinancialState,
  CashFlowPoint,
  RiskFactor,
  HealthFactor,
  Insight,
  RiskLevel,
  SavingsGoal,
  GoalFeasibility,
  SimulationScenario,
  SimulationResult,
  ComputedMetrics,
} from '@/types';
import { clamp, remainingDaysInMonth, daysInMonth, generateId } from '@/utils/helpers';

export interface BalancesResult {
  totalIncome: number;
  totalExpenses: number;
  actualBalance: number;
  outstandingCommitments: number;
  upcomingSubscriptions: number;
  savingsReserved: number;
  availableToSpend: number;
  projectedMonthEnd: number;
}

// -----------------------------------------------------------
// 1. Balance Computations
// -----------------------------------------------------------

export function computeBalances(
  state: FinancialState,
  options: { includeSimulated?: boolean } = {},
): BalancesResult {
  const includeSimulated = options.includeSimulated ?? false;
  const budget = Math.round(state.startingBudget || 0);

  // 1. Total income (completed positive earnings, refunds, etc. - non-simulated unless explicitly allowed)
  const totalIncome = Math.round(
    state.transactions
      .filter((t) => t.type === 'income' && (includeSimulated || !t.isSimulated))
      .reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0),
  );

  // 2. Completed expenses
  const totalExpenses = Math.round(
    state.transactions
      .filter((t) => t.type === 'expense' && (includeSimulated || !t.isSimulated))
      .reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0),
  );

  // 3. Actual Balance in account right now
  const actualBalance = Math.round(budget + totalIncome - totalExpenses);

  // 4. Outstanding Commitments:
  // Exclude commitments marked isPaid, AND commitments already recorded as expense transactions
  const paidCommitmentIds = new Set(
    state.transactions
      .filter((t) => t.commitmentId && (includeSimulated || !t.isSimulated))
      .map((t) => t.commitmentId),
  );

  const outstandingCommitments = Math.round(
    state.commitments
      .filter((c) => !c.isPaid && !paidCommitmentIds.has(c.id))
      .reduce((s, c) => s + (c.amount > 0 ? c.amount : 0), 0),
  );

  // 5. Active subscription charges not yet billed in the current cycle
  const today = new Date();
  const todayDay = today.getDate();
  const upcomingSubscriptions = Math.round(
    state.subscriptions
      .filter((s) => !s.isPaused && s.billingDate > todayDay)
      .reduce((s, sub) => s + (sub.amount > 0 ? sub.amount : 0), 0),
  );

  // 6. Savings reserved:
  // Calculates monthly allocation needed for each goal to stay on track.
  // Kept strictly separate from commitment totals to prevent double counting.
  const savingsReserved = Math.round(
    state.goals.reduce((s, g) => {
      const remaining = Math.max(g.targetAmount - g.savedAmount, 0);
      if (remaining <= 0) return s;

      const monthsLeft = Math.max(
        monthsBetween(state.currentMonth || today.toISOString().slice(0, 7), g.targetDate),
        1,
      );
      // Monthly contribution needed this cycle
      const monthlyNeeded = Math.min(remaining / monthsLeft, remaining);
      return s + monthlyNeeded;
    }, 0),
  );

  // 7. Available to spend: disposable funds after all obligations and reserves
  const availableToSpend = Math.max(
    Math.round(actualBalance - outstandingCommitments - upcomingSubscriptions - savingsReserved),
    0,
  );

  // 8. Projected month-end balance (after remaining commitments and subscriptions)
  const projectedMonthEnd = Math.round(
    actualBalance - outstandingCommitments - upcomingSubscriptions,
  );

  return {
    totalIncome,
    totalExpenses,
    actualBalance,
    outstandingCommitments,
    upcomingSubscriptions,
    savingsReserved,
    availableToSpend,
    projectedMonthEnd,
  };
}

/** Helper calculating integer months between YYYY-MM and targetDate */
function monthsBetween(fromMonth: string, toDateStr: string): number {
  try {
    const [fy, fm] = fromMonth.split('-').map(Number);
    const to = new Date(toDateStr);
    const ty = to.getFullYear();
    const tm = to.getMonth() + 1;
    return Math.max((ty - fy) * 12 + (tm - fm), 1);
  } catch {
    return 1;
  }
}

// -----------------------------------------------------------
// 2. Safe Daily Allowance
// -----------------------------------------------------------

export function computeDailyAllowance(
  availableToSpend: number,
  month: string,
  customDay?: number,
): { dailyAllowance: number; remainingDays: number } {
  const remaining = remainingDaysInMonth(month, customDay);

  if (remaining <= 0) {
    return { dailyAllowance: 0, remainingDays: 0 };
  }

  const spendable = Math.max(availableToSpend, 0);
  const dailyAllowance = Math.round(spendable / remaining);

  return {
    dailyAllowance,
    remainingDays: remaining,
  };
}

// -----------------------------------------------------------
// 3. Savings Goal Progress & Feasibility
// -----------------------------------------------------------

export function computeGoalFeasibility(
  goals: SavingsGoal[],
  availableToSpend: number,
  currentMonth: string,
): GoalFeasibility[] {
  return goals.map((goal) => {
    const target = Math.max(goal.targetAmount, 1);
    const saved = Math.max(goal.savedAmount, 0);
    const progressPercent = Math.min(Math.round((saved / target) * 100), 100);
    const remainingAmount = Math.max(target - saved, 0);

    const monthsLeft = monthsBetween(currentMonth, goal.targetDate);
    const monthlyTargetNeeded = Math.round(remainingAmount / monthsLeft);

    const isAchieved = saved >= target;
    const isFeasible = isAchieved || availableToSpend >= monthlyTargetNeeded;

    let status: 'achieved' | 'on_track' | 'at_risk' | 'failed' = 'at_risk';
    if (isAchieved) {
      status = 'achieved';
    } else if (isFeasible) {
      status = 'on_track';
    } else {
      status = 'at_risk';
    }

    return {
      goalId: goal.id,
      name: goal.name,
      progressPercent,
      remainingAmount,
      monthlyTargetNeeded,
      status,
      feasible: isFeasible,
    };
  });
}

// -----------------------------------------------------------
// 4. Cash Flow Projection (30 Days)
// -----------------------------------------------------------

export function computeCashFlow(
  state: FinancialState,
  _actualBalance: number,
  customTodayDay?: number,
  options: { includeSimulated?: boolean } = {},
): CashFlowPoint[] {
  const includeSimulated = options.includeSimulated ?? false;
  const today = new Date();
  const year = parseInt(state.currentMonth.split('-')[0], 10);
  const month = parseInt(state.currentMonth.split('-')[1], 10);
  const totalDays = daysInMonth(state.currentMonth);
  const todayDay = customTodayDay !== undefined ? customTodayDay : today.getDate();

  // Aggregate past actual transaction events by day
  const dailyTxMap: Record<number, number> = {};
  for (const tx of state.transactions.filter((t) => includeSimulated || !t.isSimulated)) {
    const day = parseInt(tx.date.split('-')[2], 10);
    if (!dailyTxMap[day]) dailyTxMap[day] = 0;
    dailyTxMap[day] += tx.type === 'income' ? tx.amount : -tx.amount;
  }

  // Pre-index unpaid commitments by due day
  const commitmentsByDay: Record<number, number> = {};
  for (const c of state.commitments.filter((c) => !c.isPaid)) {
    const dueDay = parseInt(c.dueDate.split('-')[2], 10);
    commitmentsByDay[dueDay] = (commitmentsByDay[dueDay] || 0) + c.amount;
  }

  // Pre-index upcoming active subscriptions by billing day
  const subscriptionsByDay: Record<number, number> = {};
  for (const s of state.subscriptions.filter((sub) => !sub.isPaused)) {
    subscriptionsByDay[s.billingDate] = (subscriptionsByDay[s.billingDate] || 0) + s.amount;
  }

  const points: CashFlowPoint[] = [];
  let runningBalance = state.startingBudget;

  for (let day = 1; day <= totalDays; day++) {
    // Past days: incorporate actual transaction diffs
    runningBalance += dailyTxMap[day] ?? 0;

    // Future days: project planned obligations (commitments & subscriptions)
    if (day > todayDay) {
      if (commitmentsByDay[day]) {
        runningBalance -= commitmentsByDay[day];
      }
      if (subscriptionsByDay[day]) {
        runningBalance -= subscriptionsByDay[day];
      }
    }

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    points.push({
      day,
      date: dateStr,
      balance: Math.max(Math.round(runningBalance), 0),
      projected: day > todayDay,
    });
  }

  return points;
}

// -----------------------------------------------------------
// 5. Deterministic Risk Score (0–100, Higher = More Risk)
// -----------------------------------------------------------
/**
 * Component Weights (Total = 100 max points):
 * 1. Available Spend Ratio (35 pts max): liquidity relative to starting budget.
 * 2. Commitment Coverage (25 pts max): ratio of unpaid commitments to actual balance.
 * 3. Projected Shortfall (25 pts max): month-end forecast deficit or thin cushion.
 * 4. Emergency Reserve Shortfall (15 pts max): adequacy of emergency buffer.
 *
 * Note: These algorithmic scores represent a mathematical budget heuristic
 * and are not clinically or scientifically validated measures.
 */
export function computeRiskScore(
  state: FinancialState,
  balances: BalancesResult,
): {
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
} {
  const factors: RiskFactor[] = [];
  let score = 0;
  const budget = state.startingBudget > 0 ? state.startingBudget : 10000;

  // 1. Available Spend Ratio (Weight: 35)
  const availableRatio = balances.availableToSpend / budget;
  if (availableRatio <= 0.05) {
    factors.push({
      label: 'Critical Liquidity Shortage',
      impact: 'negative',
      points: 35,
      description: 'Under 5% of monthly budget remains available for discretionary spending.',
    });
    score += 35;
  } else if (availableRatio < 0.20) {
    factors.push({
      label: 'Tight Available Spend',
      impact: 'negative',
      points: 20,
      description: 'Less than 20% of your starting budget remains available.',
    });
    score += 20;
  } else if (availableRatio < 0.40) {
    factors.push({
      label: 'Moderate Discretionary Buffer',
      impact: 'neutral',
      points: 10,
      description: 'Discretionary buffer is moderate but manageable.',
    });
    score += 10;
  } else {
    factors.push({
      label: 'Healthy Spendable Cushion',
      impact: 'positive',
      points: 0,
      description: 'Ample spendable liquidity remaining in this cycle.',
    });
  }

  // 2. Commitment Coverage Ratio (Weight: 25)
  if (balances.actualBalance <= 0) {
    factors.push({
      label: 'Unfunded Obligations',
      impact: 'negative',
      points: 25,
      description: 'Zero or negative cash balance while commitments are due.',
    });
    score += 25;
  } else {
    const commitRatio = balances.outstandingCommitments / balances.actualBalance;
    if (commitRatio > 0.8) {
      factors.push({
        label: 'High Commitment Pressure',
        impact: 'negative',
        points: 25,
        description: 'Over 80% of current cash is already earmarked for unpaid bills.',
      });
      score += 25;
    } else if (commitRatio > 0.5) {
      factors.push({
        label: 'Moderate Commitment Load',
        impact: 'negative',
        points: 15,
        description: 'Upcoming obligations consume more than half of current cash.',
      });
      score += 15;
    } else {
      factors.push({
        label: 'Safe Commitment Coverage',
        impact: 'positive',
        points: 0,
        description: 'Upcoming bills are fully covered by cash in account.',
      });
    }
  }

  // 3. Projected Month-End Stability (Weight: 25)
  if (balances.projectedMonthEnd < 0) {
    factors.push({
      label: 'Projected Month-End Deficit',
      impact: 'negative',
      points: 25,
      description: 'Projected to exhaust all funds before day 31 at current pace.',
    });
    score += 25;
  } else if (balances.projectedMonthEnd < 500) {
    factors.push({
      label: 'Thin Month-End Surplus',
      impact: 'negative',
      points: 12,
      description: 'Forecasted month-end buffer is under ₹500.',
    });
    score += 12;
  } else {
    factors.push({
      label: 'Positive Month-End Surplus',
      impact: 'positive',
      points: 0,
      description: 'Trajectory maintains a healthy positive cash reserve.',
    });
  }

  // 4. Emergency Reserve Shortfall (Weight: 15)
  const emergencyGoal = state.goals.find((g) => g.name.toLowerCase().includes('emergency'));
  if (!emergencyGoal) {
    factors.push({
      label: 'No Emergency Reserve Goal',
      impact: 'negative',
      points: 15,
      description: 'No emergency buffer defined to absorb unexpected financial shocks.',
    });
    score += 15;
  } else if (emergencyGoal.savedAmount < 2000) {
    factors.push({
      label: 'Low Emergency Cushion',
      impact: 'negative',
      points: 8,
      description: 'Emergency fund has under ₹2,000 saved.',
    });
    score += 8;
  } else {
    factors.push({
      label: 'Active Emergency Reserve',
      impact: 'positive',
      points: 0,
      description: 'Solid emergency reserve maintained for unforeseen events.',
    });
  }

  const riskScore = clamp(score, 0, 100);
  const riskLevel: RiskLevel =
    riskScore >= 75 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'moderate' : 'low';

  return { riskScore, riskLevel, riskFactors: factors };
}

// -----------------------------------------------------------
// 6. Deterministic Financial Health Score (0–100, Higher = Healthier)
// -----------------------------------------------------------
/**
 * 4 Normalized Health Pillars (25 Points Max Each = 100 Total):
 * Pillar 1: Spendable Liquidity After Commitments (0–25 pts)
 * Pillar 2: Savings Goal Progress & Feasibility (0–25 pts)
 * Pillar 3: Budget Discipline & Expense Control (0–25 pts)
 * Pillar 4: Month-End Surplus & Trajectory Stability (0–25 pts)
 *
 * Missing values and zero denominators are guarded against safely.
 */
export function computeHealthScore(
  state: FinancialState,
  balances: BalancesResult,
): { healthScore: number; healthFactors: HealthFactor[] } {
  const budget = state.startingBudget > 0 ? state.startingBudget : 10000;
  const factors: HealthFactor[] = [];

  // Pillar 1: Liquidity & Available Buffer (Max: 25)
  const liquidityRatio = balances.availableToSpend / budget;
  const liquidityScore = clamp(Math.round(liquidityRatio * 25), 0, 25);
  factors.push({
    label: 'Available Spendable Liquidity',
    score: liquidityScore,
    maxScore: 25,
    description: `${Math.round(liquidityRatio * 100)}% of budget available after all deductions.`,
  });

  // Pillar 2: Savings Goal Progress & Feasibility (Max: 25)
  let goalScore = 12; // Baseline if no goals
  if (state.goals.length > 0) {
    const avgProgress =
      state.goals.reduce((s, g) => {
        const target = g.targetAmount > 0 ? g.targetAmount : 1;
        return s + Math.min(g.savedAmount / target, 1);
      }, 0) / state.goals.length;
    goalScore = clamp(Math.round(avgProgress * 25), 0, 25);
  }
  factors.push({
    label: 'Savings Goal Feasibility',
    score: goalScore,
    maxScore: 25,
    description: state.goals.length > 0
      ? `Active progress across ${state.goals.length} defined savings goals.`
      : 'No active savings goals defined yet.',
  });

  // Pillar 3: Budget Discipline & Expense Velocity (Max: 25)
  const totalInflow = budget + balances.totalIncome;
  const expenseRatio = totalInflow > 0 ? balances.totalExpenses / totalInflow : 1;
  const disciplineScore = clamp(Math.round((1 - expenseRatio) * 25), 0, 25);
  factors.push({
    label: 'Budget Expense Control',
    score: disciplineScore,
    maxScore: 25,
    description: `${Math.round(expenseRatio * 100)}% of total funds expended so far.`,
  });

  // Pillar 4: Month-End Stability & Cushion (Max: 25)
  const surplusRatio = budget > 0 ? Math.max(balances.projectedMonthEnd, 0) / budget : 0;
  const stabilityScore = clamp(Math.round(surplusRatio * 25), 0, 25);
  factors.push({
    label: 'Month-End Trajectory Stability',
    score: stabilityScore,
    maxScore: 25,
    description: `Projected to retain ${Math.round(surplusRatio * 100)}% of monthly budget at day 31.`,
  });

  const healthScore = clamp(
    factors.reduce((s, f) => s + f.score, 0),
    0,
    100,
  );

  return { healthScore, healthFactors: factors };
}

// -----------------------------------------------------------
// 7. Actionable Insights
// -----------------------------------------------------------

export function computeInsights(
  state: FinancialState,
  balances: BalancesResult,
  dailyAllowance: number,
): Insight[] {
  const insights: Insight[] = [];

  if (balances.availableToSpend < 500) {
    insights.push({
      id: generateId(),
      type: 'alert',
      title: 'Critically Low Available Funds',
      body: `Only ₹${balances.availableToSpend} remains spendable. Review upcoming commitments to prevent overdrafts.`,
      priority: 1,
    });
  }

  if (dailyAllowance < 100) {
    insights.push({
      id: generateId(),
      type: 'warning',
      title: 'Low Safe Daily Allowance',
      body: `Your safe spend pace is down to ₹${dailyAllowance}/day. Consider pausing non-essential subscriptions.`,
      priority: 2,
    });
  }

  if (balances.projectedMonthEnd < 0) {
    insights.push({
      id: generateId(),
      type: 'alert',
      title: 'Projected Month-End Deficit',
      body: 'You are on track to exceed your ₹10,000 monthly limit. Simulate cuts in the Money Lab.',
      priority: 1,
    });
  }

  const activeSubTotal = state.subscriptions
    .filter((s) => !s.isPaused)
    .reduce((s, sub) => s + sub.amount, 0);

  if (activeSubTotal > 500) {
    insights.push({
      id: generateId(),
      type: 'tip',
      title: 'Recurring Subscription Squeeze',
      body: `₹${activeSubTotal}/month is committed to subscriptions. Pausing one will free up daily cash immediately.`,
      priority: 3,
    });
  }

  const emergencyGoal = state.goals.find((g) => g.name.toLowerCase().includes('emergency'));
  if (!emergencyGoal || emergencyGoal.savedAmount < 2000) {
    insights.push({
      id: generateId(),
      type: 'tip',
      title: 'Strengthen Emergency Cushion',
      body: 'Building at least ₹2,000 in emergency savings shields you from unexpected bills.',
      priority: 4,
    });
  }

  if (balances.totalIncome > 0) {
    insights.push({
      id: generateId(),
      type: 'positive',
      title: 'Extra Income Recorded!',
      body: `₹${balances.totalIncome} added this cycle. Consider channeling a portion toward your savings goals.`,
      priority: 5,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

// -----------------------------------------------------------
// 8. Pure Scenario Simulator (Before-and-After Projections)
// -----------------------------------------------------------

export function simulateScenario(
  state: FinancialState,
  scenario: SimulationScenario,
): SimulationResult {
  // 1. Calculate metrics BEFORE the scenario
  const before = computeMetrics(state, { includeSimulated: false });

  // 2. Pure immutable clone with simulated transaction injected
  const simulatedAmount = Math.max(Math.round(scenario.amount || 0), 0);
  const clonedState: FinancialState = {
    ...state,
    transactions: [
      ...state.transactions,
      {
        id: '__sim__',
        type: scenario.type === 'income' ? 'income' : 'expense',
        amount: simulatedAmount,
        category: scenario.category,
        description: scenario.description,
        date: new Date().toISOString().slice(0, 10),
        isSimulated: true,
      },
    ],
  };

  // 3. Calculate metrics AFTER the scenario with simulation factored in
  const after = computeMetrics(clonedState, { includeSimulated: true });

  // 4. Calculate exact deltas
  return {
    scenario,
    before,
    after,
    delta: {
      actualBalance: after.actualBalance - before.actualBalance,
      availableToSpend: after.availableToSpend - before.availableToSpend,
      projectedMonthEnd: after.projectedMonthEnd - before.projectedMonthEnd,
      dailyAllowance: after.dailyAllowance - before.dailyAllowance,
      riskScore: after.riskScore - before.riskScore,
      healthScore: after.healthScore - before.healthScore,
    },
  };
}

// -----------------------------------------------------------
// 9. Master Metric Aggregator
// -----------------------------------------------------------

export function computeMetrics(
  state: FinancialState,
  options: { includeSimulated?: boolean } = {},
): ComputedMetrics {
  const balances = computeBalances(state, options);
  const { dailyAllowance, remainingDays } = computeDailyAllowance(
    balances.availableToSpend,
    state.currentMonth,
  );
  const cashFlow = computeCashFlow(state, balances.actualBalance, undefined, options);
  const { riskScore, riskLevel, riskFactors } = computeRiskScore(state, balances);
  const { healthScore, healthFactors } = computeHealthScore(state, balances);
  const insights = computeInsights(state, balances, dailyAllowance);
  const goalFeasibility = computeGoalFeasibility(
    state.goals,
    balances.availableToSpend,
    state.currentMonth,
  );

  return {
    ...balances,
    dailyAllowance,
    remainingDays,
    cashFlow,
    riskScore,
    riskLevel,
    riskFactors,
    healthScore,
    healthFactors,
    insights,
    goalFeasibility,
  };
}
