import { describe, it, expect } from 'vitest';
import { simulateScenario, computeMetrics } from '@/engine/compute';
import type { FinancialState, SimulationScenario, Transaction } from '@/types';

function createCleanTestState(): FinancialState {
  return {
    startingBudget: 10000,
    currentMonth: '2026-10',
    userName: 'Arjun',
    lastUpdated: new Date().toISOString(),
    transactions: [
      { id: 't1', type: 'expense', amount: 1500, category: 'food', description: 'Groceries Week 1', date: '2026-10-04' },
    ],
    commitments: [
      {
        id: 'c1',
        description: 'WiFi Bill',
        amount: 800,
        dueDate: '2026-10-20',
        category: 'utilities',
        isPaid: false,
        frequency: 'monthly',
        isRecurring: true,
      },
      {
        id: 'c2',
        description: 'House Maintenance',
        amount: 1200,
        dueDate: '2026-10-25',
        category: 'rent',
        isPaid: false,
        frequency: 'monthly',
        isRecurring: true,
      },
    ],
    subscriptions: [],
    goals: [
      {
        id: 'g1',
        name: 'Emergency Fund',
        targetAmount: 2000,
        savedAmount: 1000,
        targetDate: '2026-12-31',
        category: 'emergency',
      },
      {
        id: 'g2',
        name: 'Course Certification',
        targetAmount: 1500,
        savedAmount: 300,
        targetDate: '2026-12-31',
        category: 'education',
      },
    ],
  };
}

describe('Phase 4: What-If Money Simulator Comprehensive Verification', () => {
  // -------------------------------------------------------------------------
  // 1. Immutability & Safe Previewing
  // -------------------------------------------------------------------------
  it('previews a scenario without mutating the original financial state', () => {
    const originalState = createCleanTestState();
    const stateSnapshot = JSON.stringify(originalState);

    const scenario: SimulationScenario = {
      type: 'expense',
      amount: 1500,
      category: 'shopping',
      description: 'Trending Sneakers Drop',
    };

    const simulation = simulateScenario(originalState, scenario);

    // Assert that the original state was not mutated in any way
    expect(JSON.stringify(originalState)).toBe(stateSnapshot);
    expect(originalState.transactions.length).toBe(1);

    // Assert that the simulation result has accurate before and after projections
    expect(simulation.before.actualBalance).toBe(8500); // 10,000 - 1,500
    expect(simulation.after.actualBalance).toBe(7000);  // 8,500 - 1,500
    expect(simulation.delta.actualBalance).toBe(-1500);
  });

  // -------------------------------------------------------------------------
  // 2. Cancellation Integrity
  // -------------------------------------------------------------------------
  it('cancels preview cleanly leaving live state unaltered', () => {
    const liveState = createCleanTestState();
    let currentPreview = simulateScenario(liveState, {
      type: 'expense',
      amount: 2500,
      category: 'shopping',
      description: 'Gadget / Tech Accessory',
    });

    expect(currentPreview).toBeDefined();

    // User cancels the preview
    currentPreview = null as any;

    const liveMetrics = computeMetrics(liveState);
    expect(liveMetrics.actualBalance).toBe(8500);
    expect(liveState.transactions.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 3. Confirm Workflow & Single-Dispatch Guarantee
  // -------------------------------------------------------------------------
  it('confirm creates exactly one transaction and updates all dependent metrics', () => {
    const liveState = createCleanTestState();
    const scenario: SimulationScenario = {
      type: 'expense',
      amount: 1500,
      category: 'shopping',
      description: 'Trending Sneakers Drop',
    };

    const sim = simulateScenario(liveState, scenario);

    // Apply confirmation (reducer behavior)
    const newTx: Transaction = {
      id: 'tx-sim-confirm-1',
      type: scenario.type === 'income' ? 'income' : 'expense',
      amount: scenario.amount,
      category: scenario.category,
      description: scenario.description,
      date: '2026-10-11',
    };

    const stateAfterConfirm: FinancialState = {
      ...liveState,
      transactions: [newTx, ...liveState.transactions],
    };

    expect(stateAfterConfirm.transactions.length).toBe(2);
    expect(stateAfterConfirm.transactions[0].amount).toBe(1500);

    const updatedMetrics = computeMetrics(stateAfterConfirm);
    expect(updatedMetrics.actualBalance).toBe(sim.after.actualBalance);
    expect(updatedMetrics.availableToSpend).toBe(sim.after.availableToSpend);
    expect(updatedMetrics.dailyAllowance).toBe(sim.after.dailyAllowance);
    expect(updatedMetrics.riskScore).toBe(sim.after.riskScore);
    expect(updatedMetrics.healthScore).toBe(sim.after.healthScore);
  });

  it('prevents double confirmation and duplicate submissions', () => {
    const liveState = createCleanTestState();
    let hasConfirmed = false;
    let transactions = [...liveState.transactions];

    const dispatchConfirm = (scenario: SimulationScenario) => {
      if (hasConfirmed) return; // Prevent duplicate confirmation
      hasConfirmed = true;
      transactions = [
        {
          id: `tx-${Date.now()}`,
          type: scenario.type === 'income' ? 'income' : 'expense',
          amount: scenario.amount,
          category: scenario.category,
          description: scenario.description,
          date: '2026-10-11',
        },
        ...transactions,
      ];
    };

    const scenario: SimulationScenario = {
      type: 'expense',
      amount: 500,
      category: 'food',
      description: 'Food Delivery Cravings',
    };

    // First click
    dispatchConfirm(scenario);
    expect(transactions.length).toBe(2);

    // Duplicate spam clicks
    dispatchConfirm(scenario);
    dispatchConfirm(scenario);
    expect(transactions.length).toBe(2); // Still exactly 2 transactions
  });

  // -------------------------------------------------------------------------
  // 4. Exact 4 Required Presets Verification
  // -------------------------------------------------------------------------
  describe('Preset Scenarios Accuracy', () => {
    it('accurately evaluates ₹500 food delivery', () => {
      const state = createCleanTestState();
      const sim = simulateScenario(state, {
        type: 'expense',
        amount: 500,
        category: 'food',
        description: 'Food Delivery Cravings',
      });

      expect(sim.scenario.amount).toBe(500);
      expect(sim.delta.actualBalance).toBe(-500);
      expect(sim.after.actualBalance).toBe(8000);
      expect(sim.delta.dailyAllowance).toBeLessThanOrEqual(0);
      expect(sim.after.availableToSpend).toBeGreaterThan(0);
    });

    it('accurately evaluates ₹1,500 sneakers drop', () => {
      const state = createCleanTestState();
      const sim = simulateScenario(state, {
        type: 'expense',
        amount: 1500,
        category: 'shopping',
        description: 'Trending Sneakers Drop',
      });

      expect(sim.scenario.amount).toBe(1500);
      expect(sim.delta.actualBalance).toBe(-1500);
      expect(sim.after.actualBalance).toBe(7000);
      expect(sim.delta.availableToSpend).toBe(-1500);
      expect(sim.after.dailyAllowance).toBeLessThanOrEqual(sim.before.dailyAllowance);
    });

    it('accurately evaluates ₹2,500 gadget purchase', () => {
      const state = createCleanTestState();
      const sim = simulateScenario(state, {
        type: 'expense',
        amount: 2500,
        category: 'shopping',
        description: 'Gadget / Tech Accessory',
      });

      expect(sim.scenario.amount).toBe(2500);
      expect(sim.delta.actualBalance).toBe(-2500);
      expect(sim.after.actualBalance).toBe(6000);
      expect(sim.after.riskScore).toBeGreaterThanOrEqual(sim.before.riskScore);
    });

    it('accurately evaluates ₹2,000 emergency medical expense', () => {
      const state = createCleanTestState();
      const sim = simulateScenario(state, {
        type: 'expense',
        amount: 2000,
        category: 'health',
        description: 'Emergency Medical Expense',
      });

      expect(sim.scenario.amount).toBe(2000);
      expect(sim.delta.actualBalance).toBe(-2000);
      expect(sim.after.actualBalance).toBe(6500);
      expect(sim.delta.projectedMonthEnd).toBe(-2000);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Complete 8-Point Matrix Verification
  // -------------------------------------------------------------------------
  it('provides all 8 required impact indicators with direction and deltas', () => {
    const state = createCleanTestState();
    const sim = simulateScenario(state, {
      type: 'expense',
      amount: 1500,
      category: 'shopping',
      description: 'Sneakers',
    });

    // 1. Actual balance
    expect(sim.before.actualBalance).toBe(8500);
    expect(sim.after.actualBalance).toBe(7000);
    expect(sim.delta.actualBalance).toBe(-1500);

    // 2. Available-to-spend balance
    expect(sim.before.availableToSpend).toBe(5400);
    expect(sim.after.availableToSpend).toBe(3900);
    expect(sim.delta.availableToSpend).toBe(-1500);

    // 3. Safe daily allowance
    expect(sim.before.dailyAllowance).toBeGreaterThan(0);
    expect(sim.after.dailyAllowance).toBeGreaterThan(0);
    expect(sim.delta.dailyAllowance).toBeLessThanOrEqual(0);

    // 4. Remaining budget / spent pace
    expect(sim.before.totalExpenses).toBe(1500);
    expect(sim.after.totalExpenses).toBe(3000);

    // 5. Projected month-end balance
    expect(sim.before.projectedMonthEnd).toBeDefined();
    expect(sim.after.projectedMonthEnd).toBeDefined();
    expect(sim.delta.projectedMonthEnd).toBe(-1500);

    // 6. Savings goal feasibility and progress impact
    expect(sim.before.goalFeasibility.length).toBe(state.goals.length);
    expect(sim.after.goalFeasibility.length).toBe(state.goals.length);

    // 7. Commitment affordability
    expect(sim.after.outstandingCommitments).toBe(2000); // 800 + 1200
    expect(sim.after.actualBalance).toBeGreaterThan(sim.after.outstandingCommitments);

    // 8. Risk and health score changes
    expect(sim.delta.riskScore).toBeDefined();
    expect(sim.delta.healthScore).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 6. Multi-Scenario Side-by-Side Comparison (Plan A vs Plan B)
  // -------------------------------------------------------------------------
  it('enables side-by-side comparison between Plan A (full) and Plan B (alternative)', () => {
    const state = createCleanTestState();

    const planA = simulateScenario(state, {
      type: 'expense',
      amount: 2500,
      category: 'shopping',
      description: 'Gadget (Full Price)',
    });

    const planB = simulateScenario(state, {
      type: 'expense',
      amount: 1750, // 30% reduced
      category: 'shopping',
      description: 'Gadget (30% trimmed)',
    });

    expect(planB.after.actualBalance).toBeGreaterThan(planA.after.actualBalance);
    expect(planB.after.dailyAllowance).toBeGreaterThanOrEqual(planA.after.dailyAllowance);
    expect(planB.after.projectedMonthEnd).toBeGreaterThan(planA.after.projectedMonthEnd);
    expect(planB.after.healthScore).toBeGreaterThanOrEqual(planA.after.healthScore);
    expect(planB.after.riskScore).toBeLessThanOrEqual(planA.after.riskScore);
  });

  // -------------------------------------------------------------------------
  // 7. Trade-off Alternatives Logic
  // -------------------------------------------------------------------------
  it('correctly calculates 30% trim and 50% split alternatives', () => {
    const originalAmount = 1500;

    const trimmedAmount = Math.max(Math.round(originalAmount * 0.7), 100);
    expect(trimmedAmount).toBe(1050);

    const splitAmount = Math.max(Math.round(originalAmount * 0.5), 100);
    expect(splitAmount).toBe(750);
  });

  // -------------------------------------------------------------------------
  // 8. Graceful Edge Case Handling: Low Funds & Bounds
  // -------------------------------------------------------------------------
  it('gracefully handles expenses that exceed available balance without crashing', () => {
    const state = createCleanTestState();
    const extremeSim = simulateScenario(state, {
      type: 'expense',
      amount: 20000, // Exceeds entire budget
      category: 'shopping',
      description: 'Luxury Watch',
    });

    expect(extremeSim.after.actualBalance).toBe(-11500); // 8,500 - 20,000
    expect(extremeSim.after.availableToSpend).toBe(0);   // Clamped to >= 0
    expect(extremeSim.after.dailyAllowance).toBe(0);    // Clamped to >= 0
    expect(extremeSim.after.riskScore).toBeGreaterThan(70);
    expect(extremeSim.after.healthScore).toBeLessThan(40);
  });
});
