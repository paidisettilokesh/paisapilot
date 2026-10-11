import type { FinancialState } from '@/types';
import { generateId } from '@/utils/helpers';

/**
 * Demo seed data representing a Gen Z student in the middle of a month.
 * Month is set dynamically to the current month so dates always make sense.
 */
export function createDemoState(): FinancialState {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonth = `${year}-${month}`;
  const d = (day: number) => `${currentMonth}-${String(day).padStart(2, '0')}`;

  return {
    startingBudget: 10000,
    currentMonth,
    userName: 'Arjun',
    lastUpdated: new Date().toISOString(),

    transactions: [
      // Income
      {
        id: generateId(),
        type: 'income',
        amount: 2000,
        category: 'income',
        description: 'Part-time tutoring',
        date: d(3),
      },
      {
        id: generateId(),
        type: 'income',
        amount: 500,
        category: 'income',
        description: 'Freelance graphic design',
        date: d(7),
      },
      // Expenses
      {
        id: generateId(),
        type: 'expense',
        amount: 1200,
        category: 'food',
        description: 'Groceries & mess',
        date: d(2),
      },
      {
        id: generateId(),
        type: 'expense',
        amount: 400,
        category: 'transport',
        description: 'Metro & auto',
        date: d(5),
      },
      {
        id: generateId(),
        type: 'expense',
        amount: 299,
        category: 'entertainment',
        description: 'Movie night',
        date: d(6),
      },
      {
        id: generateId(),
        type: 'expense',
        amount: 650,
        category: 'shopping',
        description: 'Stationery & books',
        date: d(8),
      },
      {
        id: generateId(),
        type: 'expense',
        amount: 199,
        category: 'subscriptions',
        description: 'Spotify Premium',
        date: d(1),
      },
      {
        id: generateId(),
        type: 'expense',
        amount: 149,
        category: 'subscriptions',
        description: 'YouTube Premium',
        date: d(1),
      },
    ],

    commitments: [
      {
        id: generateId(),
        description: 'Room rent',
        amount: 3500,
        dueDate: d(25),
        category: 'rent',
        isPaid: false,
        frequency: 'monthly',
        isRecurring: true,
      },
      {
        id: generateId(),
        description: 'Electricity bill',
        amount: 380,
        dueDate: d(20),
        category: 'utilities',
        isPaid: false,
        frequency: 'monthly',
        isRecurring: true,
      },
      {
        id: generateId(),
        description: 'College fee instalment',
        amount: 1500,
        dueDate: d(28),
        category: 'education',
        isPaid: false,
        frequency: 'monthly',
        isRecurring: false,
      },
    ],

    subscriptions: [
      {
        id: generateId(),
        name: 'Spotify Premium',
        amount: 199,
        billingDate: 1,
        category: 'entertainment',
        isPaused: false,
        color: '#1DB954',
      },
      {
        id: generateId(),
        name: 'YouTube Premium',
        amount: 149,
        billingDate: 1,
        category: 'entertainment',
        isPaused: false,
        color: '#FF0000',
      },
      {
        id: generateId(),
        name: 'Netflix (shared)',
        amount: 100,
        billingDate: 15,
        category: 'entertainment',
        isPaused: false,
        color: '#E50914',
      },
      {
        id: generateId(),
        name: 'Notion Pro',
        amount: 83,
        billingDate: 18,
        category: 'education',
        isPaused: true,
        color: '#000000',
      },
    ],

    goals: [
      {
        id: generateId(),
        name: 'Emergency Fund',
        targetAmount: 5000,
        savedAmount: 1200,
        targetDate: `${year}-12-31`,
        category: 'savings',
        color: '#10B981',
      },
      {
        id: generateId(),
        name: 'New Laptop',
        targetAmount: 45000,
        savedAmount: 8000,
        targetDate: `${year + 1}-03-31`,
        category: 'shopping',
        color: '#7C3AED',
      },
      {
        id: generateId(),
        name: 'Goa Trip',
        targetAmount: 8000,
        savedAmount: 2500,
        targetDate: `${year}-12-15`,
        category: 'entertainment',
        color: '#C5F467',
      },
    ],
  };
}
