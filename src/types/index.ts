// ============================================================
// PaisaPilot — Shared Type Definitions
// All financial entities and state shapes live here.
// ============================================================

// -----------------------------------------------------------
// Primitives
// -----------------------------------------------------------

/** ISO 8601 date string  e.g. "2026-10-11" */
export type DateString = string;

/** Unique identifier — nanoid-style short string */
export type ID = string;

export type TransactionType = 'income' | 'expense';

export type Category =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'education'
  | 'health'
  | 'shopping'
  | 'utilities'
  | 'rent'
  | 'subscriptions'
  | 'savings'
  | 'income'
  | 'emergency'
  | 'other';

export type CommitmentFrequency = 'once' | 'monthly' | 'weekly';

export type GoalStatus = 'on_track' | 'at_risk' | 'achieved' | 'failed';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// -----------------------------------------------------------
// Core Entities
// -----------------------------------------------------------

export interface Transaction {
  id: ID;
  type: TransactionType;
  amount: number; // always positive
  category: Category;
  description: string;
  date: DateString;
  isSimulated?: boolean; // true only during What-If preview — never persisted
  commitmentId?: ID; // linked commitment, if payment was made
  subscriptionId?: ID; // linked subscription
}

export interface Commitment {
  id: ID;
  description: string;
  amount: number;
  dueDate: DateString;
  category: Category;
  isPaid: boolean;
  paidDate?: DateString;
  frequency: CommitmentFrequency;
  isRecurring: boolean;
}

export interface Subscription {
  id: ID;
  name: string;
  amount: number;
  billingDate: number; // day of month 1-31
  category: Category;
  isPaused: boolean;
  color?: string; // display accent
}

export interface SavingsGoal {
  id: ID;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: DateString;
  category: Category;
  color?: string;
}

// -----------------------------------------------------------
// Financial State
// -----------------------------------------------------------

export interface FinancialState {
  /** The starting monthly budget (fixed, set once) */
  startingBudget: number;
  /** Current calendar month ISO string e.g. "2026-10" */
  currentMonth: string;
  /** All transactions (income + expenses) in the current month */
  transactions: Transaction[];
  /** Upcoming bills and one-time payments */
  commitments: Commitment[];
  /** Recurring subscription charges */
  subscriptions: Subscription[];
  /** Savings goals */
  goals: SavingsGoal[];
  /** User profile display name */
  userName: string;
  /** Last reset timestamp — for localStorage validation */
  lastUpdated: string;
}

// -----------------------------------------------------------
// Computed / Derived Metrics (never stored — always calculated)
// -----------------------------------------------------------

export interface ComputedMetrics {
  /** Starting budget + all income transactions */
  actualBalance: number;
  /** Sum of all income transactions */
  totalIncome: number;
  /** Sum of all expense transactions */
  totalExpenses: number;
  /** Sum of unpaid commitments due this month */
  outstandingCommitments: number;
  /** Sum of upcoming subscription charges (not yet billed) */
  upcomingSubscriptions: number;
  /** Separately reserved funds locked to savings goals */
  savingsReserved: number;
  /** actualBalance − outstandingCommitments − upcomingSubscriptions − savingsReserved */
  availableToSpend: number;
  /** Estimated balance at month-end after all outgoings */
  projectedMonthEnd: number;
  /** Safe spend per remaining day */
  dailyAllowance: number;
  /** Remaining days in the current month */
  remainingDays: number;
  /** 30-point cash-flow projection array */
  cashFlow: CashFlowPoint[];
  /** 0–100 risk score */
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  /** 0–100 health score */
  healthScore: number;
  healthFactors: HealthFactor[];
  /** Actionable insight cards */
  insights: Insight[];
  /** Savings goal progress and feasibility analysis */
  goalFeasibility: GoalFeasibility[];
}

export interface GoalFeasibility {
  goalId: ID;
  name: string;
  progressPercent: number;
  remainingAmount: number;
  monthlyTargetNeeded: number;
  status: GoalStatus;
  feasible: boolean;
}

export interface CashFlowPoint {
  day: number; // 1-31
  date: DateString;
  balance: number;
  projected: boolean; // true if in the future
}

export interface RiskFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  points: number; // contribution to risk score
  description: string;
}

export interface HealthFactor {
  label: string;
  score: number; // 0–25 per factor (4 factors = 100 max)
  maxScore: number;
  description: string;
}

export interface Insight {
  id: ID;
  type: 'tip' | 'warning' | 'alert' | 'positive';
  title: string;
  body: string;
  priority: number; // 1 = highest
}

// -----------------------------------------------------------
// What-If Simulator
// -----------------------------------------------------------

export type ScenarioType = 'expense' | 'income' | 'payment' | 'savings';

export interface SimulationScenario {
  type: ScenarioType;
  amount: number;
  category: Category;
  description: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  before: ComputedMetrics;
  after: ComputedMetrics;
  delta: MetricsDelta;
}

export interface MetricsDelta {
  actualBalance: number;
  availableToSpend: number;
  projectedMonthEnd: number;
  dailyAllowance: number;
  riskScore: number;
  healthScore: number;
}

// -----------------------------------------------------------
// Context Actions (Reducer)
// -----------------------------------------------------------

export type FinancialAction =
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
  | { type: 'DELETE_TRANSACTION'; payload: { id: ID } }
  | { type: 'ADD_COMMITMENT'; payload: Omit<Commitment, 'id'> }
  | { type: 'UPDATE_COMMITMENT'; payload: { id: ID; updates: Partial<Commitment> } }
  | { type: 'DELETE_COMMITMENT'; payload: { id: ID } }
  | { type: 'MARK_COMMITMENT_PAID'; payload: { id: ID; date: DateString } }
  | { type: 'ADD_SUBSCRIPTION'; payload: Omit<Subscription, 'id'> }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: { id: ID; updates: Partial<Subscription> } }
  | { type: 'DELETE_SUBSCRIPTION'; payload: { id: ID } }
  | { type: 'TOGGLE_SUBSCRIPTION_PAUSE'; payload: { id: ID } }
  | { type: 'ADD_GOAL'; payload: Omit<SavingsGoal, 'id'> }
  | { type: 'UPDATE_GOAL'; payload: { id: ID; updates: Partial<SavingsGoal> } }
  | { type: 'DELETE_GOAL'; payload: { id: ID } }
  | { type: 'CONTRIBUTE_TO_GOAL'; payload: { id: ID; amount: number } }
  | { type: 'SET_STARTING_BUDGET'; payload: { amount: number } }
  | { type: 'SET_USER_NAME'; payload: { name: string } }
  | { type: 'RESET_TO_DEMO' }
  | { type: 'LOAD_STATE'; payload: FinancialState };

// -----------------------------------------------------------
// Context Shape
// -----------------------------------------------------------

export interface FinancialContextValue {
  state: FinancialState;
  metrics: ComputedMetrics;
  dispatch: React.Dispatch<FinancialAction>;
}
