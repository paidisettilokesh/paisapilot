import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Coins } from 'lucide-react';
import { NAV_ROUTES } from '@/lib/constants';
import { getIcon } from '@/lib/icons';
import { useFinancial } from '@/context/FinancialContext';
import { formatCurrency } from '@/utils/helpers';

export function Sidebar() {
  const { state, metrics, dispatch } = useFinancial();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-navy-500 bg-navy-800">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald to-lime flex items-center justify-center shadow-glow shrink-0">
            <Coins size={16} className="text-navy-900" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">PaisaPilot</div>
            <div className="text-2xs text-muted leading-none">by {state.userName}</div>
          </div>
        </div>
      </div>

      {/* Balance snapshot */}
      <div className="mx-3 mb-4 p-3 rounded-xl bg-navy-700 border border-navy-500">
        <p className="text-2xs text-muted uppercase tracking-widest mb-1">Available</p>
        <p className="text-lg font-bold text-emerald tabular-nums">
          {formatCurrency(metrics.availableToSpend)}
        </p>
        <div className="mt-1.5 progress-track">
          <div
            className="progress-fill bg-emerald"
            style={{
              width: `${Math.min(
                (metrics.availableToSpend / state.startingBudget) * 100,
                100,
              )}%`,
            }}
          />
        </div>
        <p className="text-2xs text-muted mt-1">
          of {formatCurrency(state.startingBudget)} budget
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5" aria-label="Main navigation">
        {NAV_ROUTES.map((route) => {
          const Icon = getIcon(route.icon);
          return (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald/15 text-emerald border border-emerald/20'
                    : 'text-muted hover:text-slate-200 hover:bg-navy-600/60',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <motion.span
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Icon size={16} />
                  </motion.span>
                  <span>{route.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator-sidebar"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-navy-500">
        <button
          onClick={() => dispatch({ type: 'RESET_TO_DEMO' })}
          className="btn-ghost w-full justify-start gap-2 text-xs"
          title="Reset to demo data"
        >
          <RotateCcw size={13} />
          Reset to demo
        </button>
        <p className="text-2xs text-navy-400 mt-2 px-1 leading-relaxed">
          Demo prototype — not financial advice.
        </p>
      </div>
    </aside>
  );
}
