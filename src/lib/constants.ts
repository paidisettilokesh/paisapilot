/**
 * Category metadata — display labels, colors, and icons
 * (icons are Lucide icon names resolved at the component level)
 */
import type { Category, RiskLevel } from '@/types';

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bg: string; icon: string }
> = {
  food:          { label: 'Food & Dining',    color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',   icon: 'UtensilsCrossed' },
  transport:     { label: 'Transport',         color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',   icon: 'Train' },
  entertainment: { label: 'Entertainment',     color: '#EC4899', bg: 'rgba(236,72,153,0.15)',   icon: 'Tv' },
  education:     { label: 'Education',         color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',   icon: 'GraduationCap' },
  health:        { label: 'Health',            color: '#EF4444', bg: 'rgba(239,68,68,0.15)',    icon: 'Heart' },
  shopping:      { label: 'Shopping',          color: '#F97316', bg: 'rgba(249,115,22,0.15)',   icon: 'ShoppingBag' },
  utilities:     { label: 'Utilities',         color: '#06B6D4', bg: 'rgba(6,182,212,0.15)',    icon: 'Zap' },
  rent:          { label: 'Rent & Housing',    color: '#64748B', bg: 'rgba(100,116,139,0.15)',  icon: 'Home' },
  subscriptions: { label: 'Subscriptions',     color: '#A78BFA', bg: 'rgba(167,139,250,0.15)', icon: 'RefreshCw' },
  savings:       { label: 'Savings',           color: '#10B981', bg: 'rgba(16,185,129,0.15)',   icon: 'PiggyBank' },
  income:        { label: 'Income',            color: '#C5F467', bg: 'rgba(197,244,103,0.15)',  icon: 'TrendingUp' },
  emergency:     { label: 'Emergency',         color: '#EF4444', bg: 'rgba(239,68,68,0.2)',     icon: 'AlertTriangle' },
  other:         { label: 'Other',             color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', icon: 'MoreHorizontal' },
};

export const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low Risk',      color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  moderate: { label: 'Moderate Risk', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  high:     { label: 'High Risk',     color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  critical: { label: 'Critical',      color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

/** Navigation route definitions */
export const NAV_ROUTES = [
  { path: '/',            label: 'Overview',   icon: 'LayoutDashboard' },
  { path: '/lab',         label: 'Money Lab',  icon: 'FlaskConical' },
  { path: '/transactions',label: 'Transactions',icon: 'ArrowLeftRight' },
  { path: '/goals',       label: 'Goals',      icon: 'Target' },
  { path: '/health',      label: 'Health',     icon: 'Activity' },
] as const;

export type NavRoute = (typeof NAV_ROUTES)[number];

/** Month names for display */
export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
