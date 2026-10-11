import { useFinancial } from '@/context/FinancialContext';

/**
 * Convenience hook — returns only the computed financial metrics.
 * Use this instead of useFinancial() when you don't need dispatch or raw state.
 */
export function useMetrics() {
  const { metrics } = useFinancial();
  return metrics;
}
