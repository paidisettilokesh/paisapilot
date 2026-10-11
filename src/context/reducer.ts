import type { FinancialState, FinancialAction, Commitment } from '@/types';
import { generateId } from '@/utils/helpers';
import { createDemoState } from '@/data/demoData';

const STORAGE_KEY = 'paisapilot_state_v1';

// -----------------------------------------------------------
// Persistence helpers
// -----------------------------------------------------------

export function loadPersistedState(): FinancialState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinancialState;
    // Validate required shape
    if (
      typeof parsed.startingBudget !== 'number' ||
      !Array.isArray(parsed.transactions) ||
      !Array.isArray(parsed.commitments) ||
      !Array.isArray(parsed.subscriptions) ||
      !Array.isArray(parsed.goals)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistState(state: FinancialState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export function clearPersistedState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// -----------------------------------------------------------
// Reducer
// -----------------------------------------------------------

export function financialReducer(
  state: FinancialState,
  action: FinancialAction,
): FinancialState {
  let next: FinancialState;

  switch (action.type) {
    // ---- Transactions ----------------------------------------
    case 'ADD_TRANSACTION': {
      const tx = { ...action.payload, id: generateId() };
      next = { ...state, transactions: [...state.transactions, tx] };
      break;
    }
    case 'DELETE_TRANSACTION': {
      next = {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload.id),
      };
      break;
    }

    // ---- Commitments -----------------------------------------
    case 'ADD_COMMITMENT': {
      const c = { ...action.payload, id: generateId() };
      next = { ...state, commitments: [...state.commitments, c] };
      break;
    }
    case 'UPDATE_COMMITMENT': {
      next = {
        ...state,
        commitments: state.commitments.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c,
        ),
      };
      break;
    }
    case 'DELETE_COMMITMENT': {
      next = {
        ...state,
        commitments: state.commitments.filter((c) => c.id !== action.payload.id),
      };
      break;
    }
    case 'MARK_COMMITMENT_PAID': {
      next = {
        ...state,
        commitments: state.commitments.map((c) =>
          c.id === action.payload.id
            ? { ...c, isPaid: true, paidDate: action.payload.date }
            : c,
        ),
        // Also add an expense transaction for the payment
        transactions: [
          ...state.transactions,
          {
            id: generateId(),
            type: 'expense' as const,
            amount: state.commitments.find((c) => c.id === action.payload.id)!.amount,
            category: state.commitments.find((c) => c.id === action.payload.id)!.category,
            description: `Paid: ${state.commitments.find((c) => c.id === action.payload.id)!.description}`,
            date: action.payload.date,
            commitmentId: action.payload.id,
          },
        ],
      };
      break;
    }

    // ---- Subscriptions ---------------------------------------
    case 'ADD_SUBSCRIPTION': {
      const s = { ...action.payload, id: generateId() };
      next = { ...state, subscriptions: [...state.subscriptions, s] };
      break;
    }
    case 'UPDATE_SUBSCRIPTION': {
      next = {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s,
        ),
      };
      break;
    }
    case 'DELETE_SUBSCRIPTION': {
      next = {
        ...state,
        subscriptions: state.subscriptions.filter((s) => s.id !== action.payload.id),
      };
      break;
    }
    case 'TOGGLE_SUBSCRIPTION_PAUSE': {
      next = {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.payload.id ? { ...s, isPaused: !s.isPaused } : s,
        ),
      };
      break;
    }

    // ---- Goals -----------------------------------------------
    case 'ADD_GOAL': {
      const g = { ...action.payload, id: generateId() };
      next = { ...state, goals: [...state.goals, g] };
      break;
    }
    case 'UPDATE_GOAL': {
      next = {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g,
        ),
      };
      break;
    }
    case 'DELETE_GOAL': {
      next = {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload.id),
      };
      break;
    }
    case 'CONTRIBUTE_TO_GOAL': {
      next = {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id
            ? { ...g, savedAmount: g.savedAmount + action.payload.amount }
            : g,
        ),
        // Record as expense/savings transaction
        transactions: [
          ...state.transactions,
          {
            id: generateId(),
            type: 'expense' as const,
            amount: action.payload.amount,
            category: 'savings' as const,
            description: `Goal contribution: ${state.goals.find((g) => g.id === action.payload.id)?.name ?? ''}`,
            date: new Date().toISOString().slice(0, 10),
          },
        ],
      };
      break;
    }

    // ---- Settings --------------------------------------------
    case 'SET_STARTING_BUDGET': {
      if (action.payload.amount <= 0) return state;
      next = { ...state, startingBudget: action.payload.amount };
      break;
    }
    case 'SET_USER_NAME': {
      next = { ...state, userName: action.payload.name };
      break;
    }

    // ---- State management ------------------------------------
    case 'RESET_TO_DEMO': {
      const demo = createDemoState();
      persistState(demo);
      return demo;
    }
    case 'LOAD_STATE': {
      return action.payload;
    }

    default:
      return state;
  }

  const updated: FinancialState = { ...next, lastUpdated: new Date().toISOString() };
  persistState(updated);
  return updated;
}

// -----------------------------------------------------------
// Helpers used by the engine — exported for reuse
// -----------------------------------------------------------

/**
 * Returns the sum of unpaid commitments due this month (not yet linked to a payment tx).
 * Commitments that have already been paid via MARK_COMMITMENT_PAID are excluded.
 */
export function getUnpaidCommitmentsTotal(commitments: Commitment[]): number {
  return commitments
    .filter((c) => !c.isPaid)
    .reduce((sum, c) => sum + c.amount, 0);
}
