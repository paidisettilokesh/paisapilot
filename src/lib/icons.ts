/**
 * Resolves a Lucide icon name string to the actual component.
 * Used by category badges, nav items, and insight cards.
 */
import {
  LayoutDashboard,
  FlaskConical,
  ArrowLeftRight,
  Target,
  Activity,
  UtensilsCrossed,
  Train,
  Tv,
  GraduationCap,
  Heart,
  ShoppingBag,
  Zap,
  Home,
  RefreshCw,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  MoreHorizontal,
  TrendingDown,
  Wallet,
  CalendarClock,
  BadgePercent,
  Lightbulb,
  ShieldCheck,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  LayoutDashboard,
  FlaskConical,
  ArrowLeftRight,
  Target,
  Activity,
  UtensilsCrossed,
  Train,
  Tv,
  GraduationCap,
  Heart,
  ShoppingBag,
  Zap,
  Home,
  RefreshCw,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MoreHorizontal,
  Wallet,
  CalendarClock,
  BadgePercent,
  Lightbulb,
  ShieldCheck,
};

export function getIcon(name: string): ComponentType<LucideProps> {
  return ICON_MAP[name] ?? MoreHorizontal;
}
