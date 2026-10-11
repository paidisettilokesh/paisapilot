import { useState, useCallback } from 'react';
import type { SimulationScenario, SimulationResult } from '@/types';
import { useFinancial } from '@/context/FinancialContext';
import { simulateScenario } from '@/engine/compute';

/**
 * Hook that powers the What-If Money Simulator.
 *
 * - `preview(scenario)` computes before/after using the pure simulateScenario engine without touching real state.
 * - `confirm(result)` dispatches a single ADD_TRANSACTION from the confirmed scenario with duplicate prevention.
 * - `reset()` clears the simulation result.
 *
 * Previewing NEVER mutates the financial context.
 * Confirming dispatches EXACTLY ONE action.
 */
export function useSimulator() {
  const { state, dispatch } = useFinancial();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const preview = useCallback(
    (scenario: SimulationScenario) => {
      setIsSimulating(true);
      setHasConfirmed(false);

      const simResult = simulateScenario(state, scenario);

      setResult(simResult);
      setIsSimulating(false);
      return simResult;
    },
    [state],
  );

  const confirm = useCallback(
    (simResult: SimulationResult) => {
      // Duplicate confirmation prevention
      if (hasConfirmed || !simResult) return;

      const { scenario } = simResult;
      setHasConfirmed(true);

      // Single dispatch — creates one real transaction
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          type: scenario.type === 'income' ? 'income' : 'expense',
          amount: Math.max(Math.round(scenario.amount), 0),
          category: scenario.category,
          description: scenario.description,
          date: new Date().toISOString().slice(0, 10),
        },
      });
      setResult(null);
    },
    [dispatch, hasConfirmed],
  );

  const reset = useCallback(() => {
    setResult(null);
    setHasConfirmed(false);
  }, []);

  return { result, isSimulating, preview, confirm, reset, hasConfirmed };
}
