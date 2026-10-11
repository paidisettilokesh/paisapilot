import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
} from 'react';
import type { FinancialContextValue, FinancialState } from '@/types';
import { financialReducer, loadPersistedState } from './reducer';
import { computeMetrics } from '@/engine/compute';
import { createDemoState } from '@/data/demoData';

// -----------------------------------------------------------
// Context
// -----------------------------------------------------------

const FinancialContext = createContext<FinancialContextValue | null>(null);

// -----------------------------------------------------------
// Provider
// -----------------------------------------------------------

function getInitialState(): FinancialState {
  const persisted = loadPersistedState();
  if (persisted) return persisted;
  return createDemoState();
}

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financialReducer, undefined, getInitialState);

  // Re-derive metrics whenever state changes
  const metrics = useMemo(() => computeMetrics(state), [state]);

  // Sync currentMonth on mount (state might be from a previous month)
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (state.currentMonth !== currentMonth) {
      // Month rolled over — keep goals/subscriptions but reset month-specific data
      dispatch({ type: 'RESET_TO_DEMO' });
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: FinancialContextValue = useMemo(
    () => ({ state, metrics, dispatch }),
    [state, metrics],
  );

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------

export function useFinancial(): FinancialContextValue {
  const ctx = useContext(FinancialContext);
  if (!ctx) {
    throw new Error('useFinancial must be used inside <FinancialProvider>');
  }
  return ctx;
}
