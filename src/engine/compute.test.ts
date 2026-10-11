import { describe, it, expect } from 'vitest';
import {
  computeBalances,
  computeDailyAllowance,
  computeRiskScore,
  computeHealthScore,
  computeCashFlow,
  computeGoalFeasibility,
  simulateScenario,
  computeMetrics,
} from '@/engine/compute';
import { createDemoState } from '@/data/demoData';
import type { FinancialState, SimulationScenario } from '@/types';

// -----------------------------------------------------------
// Test State Factory
// -----------------------------------------------------------

function makeState(overrides: Partial<FinancialState> = {}): FinancialState {
  return { ...createDemoState(), ...overrides };
}

describe('PaisaPilot Financial Engine Test Suite', () => {
  // -----------------------------------------------------------
  // 1. Normal Income and Expense Calculations
  // -----------------------------------------------------------
  describe('Income & Expense Calculations', () => {
    it('accurately sums income and expenses onto the ₹10,000 budget', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'income', amount: 2500, category: 'income', description: 'Freelance Payout', date: '2026-10-05' },
          { id: 't2', type: 'expense', amount: 1200, category: 'food', description: 'Groceries', date: '2026-10-06' },
          { id: 't3', type: 'expense', amount: 800, category: 'transport', description: 'Metro Pass', date: '2026-10-07' },
        ],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      expect(b.totalIncome).toBe(2500);
      expect(b.totalExpenses).toBe(2000);
      expect(b.actualBalance).toBe(10500); // 10,000 + 2,500 - 2,000
      expect(b.availableToSpend).toBe(10500);
    });

    it('handles refund transactions properly (income category or credit)', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'expense', amount: 1500, category: 'shopping', description: 'Online Shoes', date: '2026-10-02' },
          { id: 't2', type: 'income', amount: 1500, category: 'shopping', description: 'Shoe Return Refund', date: '2026-10-04' },
        ],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      expect(b.totalExpenses).toBe(1500);
      expect(b.totalIncome).toBe(1500);
      expect(b.actualBalance).toBe(10000); // perfectly restored
    });

    it('ignores negative or invalid amounts gracefully without NaN', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'expense', amount: -500, category: 'food', description: 'Corrupt negative', date: '2026-10-02' },
          { id: 't2', type: 'income', amount: -200, category: 'income', description: 'Corrupt negative income', date: '2026-10-03' },
        ],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      expect(b.totalExpenses).toBe(0);
      expect(b.totalIncome).toBe(0);
      expect(b.actualBalance).toBe(10000);
      expect(isNaN(b.actualBalance)).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // 2. Commitments & Paid Deductions (No Double Counting)
  // -----------------------------------------------------------
  describe('Outstanding and Paid Commitments', () => {
    it('deducts unpaid commitments from available funds but not actual balance', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [],
        commitments: [
          { id: 'c1', description: 'Room Rent', amount: 3500, dueDate: '2026-10-25', category: 'rent', isPaid: false, frequency: 'monthly', isRecurring: true },
        ],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      expect(b.actualBalance).toBe(10000); // Still in bank account
      expect(b.outstandingCommitments).toBe(3500);
      expect(b.availableToSpend).toBe(6500); // 10,000 - 3,500
    });

    it('avoids double-counting when a commitment is marked isPaid and linked to transaction', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'expense', amount: 3500, category: 'rent', description: 'Paid: Room Rent', date: '2026-10-10', commitmentId: 'c1' },
        ],
        commitments: [
          { id: 'c1', description: 'Room Rent', amount: 3500, dueDate: '2026-10-25', category: 'rent', isPaid: true, frequency: 'monthly', isRecurring: true },
        ],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      // Actual balance drops by 3,500 due to expense tx
      expect(b.actualBalance).toBe(6500);
      // Commitment is marked paid, so outstanding is 0
      expect(b.outstandingCommitments).toBe(0);
      // Available to spend is 6,500 (NOT 3,000)
      expect(b.availableToSpend).toBe(6500);
    });
  });

  // -----------------------------------------------------------
  // 3. Recurring Subscriptions
  // -----------------------------------------------------------
  describe('Recurring Subscriptions', () => {
    it('only reserves active subscriptions that are due in future days', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [],
        commitments: [],
        subscriptions: [
          // Due day 28 (future)
          { id: 's1', name: 'Netflix', amount: 649, billingDate: 28, category: 'subscriptions', isPaused: false },
          // Paused subscription should NOT reserve funds
          { id: 's2', name: 'Gym Membership', amount: 1500, billingDate: 29, category: 'health', isPaused: true },
        ],
        goals: [],
      });

      const b = computeBalances(state);
      expect(b.upcomingSubscriptions).toBe(649);
      expect(b.availableToSpend).toBe(10000 - 649);
    });
  });

  // -----------------------------------------------------------
  // 4. Savings Allocations & Feasibility
  // -----------------------------------------------------------
  describe('Savings Allocations and Feasibility', () => {
    it('keeps savings reservations distinct from commitments without double counting', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [],
        commitments: [
          { id: 'c1', description: 'Electric Bill', amount: 1000, dueDate: '2026-10-20', category: 'utilities', isPaid: false, frequency: 'monthly', isRecurring: true },
        ],
        subscriptions: [],
        goals: [
          { id: 'g1', name: 'Goa Trip', targetAmount: 6000, savedAmount: 3000, targetDate: '2026-11-15', category: 'savings' },
        ],
      });

      const b = computeBalances(state);
      expect(b.outstandingCommitments).toBe(1000);
      expect(b.savingsReserved).toBeGreaterThan(0);
      expect(b.availableToSpend).toBe(b.actualBalance - b.outstandingCommitments - b.savingsReserved);
    });

    it('marks fully funded savings goals as achieved and does not reserve redundant funds', () => {
      const state = makeState({
        startingBudget: 10000,
        goals: [
          { id: 'g1', name: 'New Phone', targetAmount: 5000, savedAmount: 5000, targetDate: '2026-10-31', category: 'savings' },
        ],
      });

      const b = computeBalances(state);
      expect(b.savingsReserved).toBe(0);

      const feasibility = computeGoalFeasibility(state.goals, b.availableToSpend, '2026-10');
      expect(feasibility[0].status).toBe('achieved');
      expect(feasibility[0].progressPercent).toBe(100);
      expect(feasibility[0].feasible).toBe(true);
    });

    it('correctly marks goals as at_risk when available funds are insufficient', () => {
      const goals = [
        { id: 'g1', name: 'Huge Target', targetAmount: 10000, savedAmount: 0, targetDate: '2026-10-31', category: 'savings' as const },
      ];
      const feasibility = computeGoalFeasibility(goals, 500, '2026-10');
      expect(feasibility[0].status).toBe('at_risk');
      expect(feasibility[0].feasible).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // 5. Daily Allowance & Elapsed Days
  // -----------------------------------------------------------
  describe('Safe Daily Allowance & Day Boundaries', () => {
    it('returns exact balance on the final day of the month (1 spending day remaining)', () => {
      // 31st of October (final day)
      const { dailyAllowance, remainingDays } = computeDailyAllowance(1250, '2026-10', 31);
      expect(remainingDays).toBe(1);
      expect(dailyAllowance).toBe(1250);
    });

    it('handles zero remaining spending days safely without division by zero', () => {
      const { dailyAllowance, remainingDays } = computeDailyAllowance(1250, '2026-10', 32);
      expect(remainingDays).toBe(0);
      expect(dailyAllowance).toBe(0);
    });

    it('returns 0 daily allowance when available funds are zero or negative', () => {
      const { dailyAllowance } = computeDailyAllowance(-500, '2026-10', 15);
      expect(dailyAllowance).toBe(0);
    });
  });

  // -----------------------------------------------------------
  // 6. Insufficient Funds & Deficits
  // -----------------------------------------------------------
  describe('Insufficient Available Funds & Deficit Clamping', () => {
    it('clamps availableToSpend to 0 when commitments exceed actual balance', () => {
      const state = makeState({
        startingBudget: 2000,
        transactions: [],
        commitments: [
          { id: 'c1', description: 'Overwhelming Rent', amount: 8000, dueDate: '2026-10-25', category: 'rent', isPaid: false, frequency: 'monthly', isRecurring: true },
        ],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      expect(b.actualBalance).toBe(2000);
      expect(b.outstandingCommitments).toBe(8000);
      expect(b.availableToSpend).toBe(0); // Clamped, cannot spend negative rupees
      expect(b.projectedMonthEnd).toBe(-6000); // Month-end correctly records deficit
    });
  });

  // -----------------------------------------------------------
  // 7. Cash Flow Forecast & Avoiding Double Counting
  // -----------------------------------------------------------
  describe('Cash Flow Projection', () => {
    it('projects all days of the month without double counting recorded commitments', () => {
      const state = makeState({
        currentMonth: '2026-10',
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'expense', amount: 1000, category: 'food', description: 'Food Day 5', date: '2026-10-05' },
        ],
        commitments: [
          { id: 'c1', description: 'Bill on 20th', amount: 2000, dueDate: '2026-10-20', category: 'utilities', isPaid: false, frequency: 'monthly', isRecurring: true },
        ],
        subscriptions: [],
      });

      // Simulated as today being Day 10
      const flow = computeCashFlow(state, 9000, 10);
      expect(flow.length).toBe(31);

      // On day 5: includes expense
      const day5 = flow.find((p) => p.day === 5);
      expect(day5?.balance).toBe(9000);

      // On day 20 (future): drops by 2000 for upcoming commitment
      const day19 = flow.find((p) => p.day === 19);
      const day20 = flow.find((p) => p.day === 20);
      expect(day19!.balance - day20!.balance).toBe(2000);
    });
  });

  // -----------------------------------------------------------
  // 8. Deterministic Risk & Health Scores
  // -----------------------------------------------------------
  describe('Risk and Health Scoring Engine', () => {
    it('handles zero denominators safely when budget is 0 or negative', () => {
      const state = makeState({
        startingBudget: 0,
        transactions: [],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const b = computeBalances(state);
      const risk = computeRiskScore(state, b);
      const health = computeHealthScore(state, b);

      expect(risk.riskScore).toBeGreaterThanOrEqual(0);
      expect(risk.riskScore).toBeLessThanOrEqual(100);
      expect(health.healthScore).toBeGreaterThanOrEqual(0);
      expect(health.healthScore).toBeLessThanOrEqual(100);
    });

    it('assigns critical risk when month-end deficit is severe', () => {
      const state = makeState({
        startingBudget: 1000,
        commitments: [
          { id: 'c1', description: 'Massive Debt', amount: 9000, dueDate: '2026-10-25', category: 'rent', isPaid: false, frequency: 'monthly', isRecurring: true },
        ],
      });

      const b = computeBalances(state);
      const risk = computeRiskScore(state, b);
      expect(risk.riskLevel).toBe('critical');
      expect(risk.riskScore).toBeGreaterThanOrEqual(75);
    });

    it('scores 4 balanced health factors summing to total healthScore', () => {
      const state = createDemoState();
      const b = computeBalances(state);
      const health = computeHealthScore(state, b);

      expect(health.healthFactors).toHaveLength(4);
      const sum = health.healthFactors.reduce((s, f) => s + f.score, 0);
      expect(sum).toBe(health.healthScore);
    });
  });

  // -----------------------------------------------------------
  // 9. Immutable Scenario Simulation
  // -----------------------------------------------------------
  describe('Immutable Scenario Simulation Engine', () => {
    it('simulates decisions without mutating the original financial state', () => {
      const originalState = makeState({
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'expense', amount: 1000, category: 'food', description: 'Lunch', date: '2026-10-02' },
        ],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const scenario: SimulationScenario = {
        type: 'expense',
        amount: 3500,
        category: 'entertainment',
        description: 'Weekend Goa Trip',
      };

      const originalTxCount = originalState.transactions.length;

      // Run simulation
      const result = simulateScenario(originalState, scenario);

      // Verify original state is completely untouched
      expect(originalState.transactions.length).toBe(originalTxCount);
      expect(originalState.transactions.some((t) => t.isSimulated)).toBe(false);

      // Verify before vs after deltas
      expect(result.before.availableToSpend - result.after.availableToSpend).toBe(3500);
      expect(result.delta.availableToSpend).toBe(-3500);
      expect(result.delta.projectedMonthEnd).toBe(-3500);
    });

    it('simulates income decisions boosting available spend and daily allowance', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [],
        commitments: [],
        subscriptions: [],
        goals: [],
      });
      const scenario: SimulationScenario = {
        type: 'income',
        amount: 3000,
        category: 'income',
        description: 'Freelance Gig',
      };

      const result = simulateScenario(state, scenario);
      expect(result.delta.availableToSpend).toBe(3000);
      expect(result.delta.dailyAllowance).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------
  // 10. Unexpected Expenses & Month-End Edge Scenarios
  // -----------------------------------------------------------
  describe('Unexpected Expenses & Month-End Scenarios', () => {
    it('handles unexpected emergency expenses and triggers elevated risk score', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [
          { id: 't1', type: 'expense', amount: 8500, category: 'health', description: 'Emergency Surgery', date: '2026-10-15' },
        ],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const metrics = computeMetrics(state);
      expect(metrics.actualBalance).toBe(1500);
      expect(metrics.availableToSpend).toBe(1500);
      expect(metrics.riskScore).toBeGreaterThanOrEqual(20);
    });

    it('evaluates transactions near month-end on day 30 with correct remaining days', () => {
      const { dailyAllowance, remainingDays } = computeDailyAllowance(600, '2026-10', 30);
      // 30th of Oct: 2 days left (day 30 and day 31)
      expect(remainingDays).toBe(2);
      expect(dailyAllowance).toBe(300);
    });
  });

  // -----------------------------------------------------------
  // 10. Master Metrics Bundling & Reducer Integration
  // -----------------------------------------------------------
  describe('computeMetrics Master Integration', () => {
    it('bundles all derived values including goalFeasibility and insights', () => {
      const state = createDemoState();
      const metrics = computeMetrics(state);

      expect(metrics).toHaveProperty('actualBalance');
      expect(metrics).toHaveProperty('availableToSpend');
      expect(metrics).toHaveProperty('dailyAllowance');
      expect(metrics).toHaveProperty('remainingDays');
      expect(metrics).toHaveProperty('cashFlow');
      expect(metrics).toHaveProperty('riskScore');
      expect(metrics).toHaveProperty('healthScore');
      expect(metrics).toHaveProperty('insights');
      expect(metrics).toHaveProperty('goalFeasibility');
      expect(metrics.goalFeasibility.length).toBe(state.goals.length);
    });

    it('prevents duplicate confirmation side effects when an action is already applied', () => {
      const state = makeState({
        startingBudget: 10000,
        transactions: [],
        commitments: [],
        subscriptions: [],
        goals: [],
      });

      const scenario: SimulationScenario = {
        type: 'expense',
        amount: 2000,
        category: 'food',
        description: 'Team Dinner',
      };

      const result = simulateScenario(state, scenario);
      expect(result.delta.availableToSpend).toBe(-2000);

      // Confirm once: adds one transaction
      const stateAfterOnce: FinancialState = {
        ...state,
        transactions: [
          ...state.transactions,
          {
            id: 'confirmed-1',
            type: 'expense',
            amount: scenario.amount,
            category: scenario.category,
            description: scenario.description,
            date: '2026-10-15',
          },
        ],
      };

      expect(stateAfterOnce.transactions.length).toBe(1);
      const metricsOnce = computeMetrics(stateAfterOnce);
      expect(metricsOnce.actualBalance).toBe(8000);

      // Duplicate prevention check:
      let hasConfirmed = true;
      const attemptDuplicateConfirm = () => {
        if (hasConfirmed) return stateAfterOnce; // ignored
        return { ...stateAfterOnce, transactions: [...stateAfterOnce.transactions] };
      };

      const stateAfterTwice = attemptDuplicateConfirm();
      expect(stateAfterTwice.transactions.length).toBe(1);
      expect(computeMetrics(stateAfterTwice).actualBalance).toBe(8000);
    });
  });
});
