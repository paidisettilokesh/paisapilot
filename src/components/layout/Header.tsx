import { Calendar, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { Badge } from '@/components/common/Badge';

export function Header() {
  const { metrics, dispatch } = useFinancial();

  // Current day in the month
  const today = new Date();
  const currentDayNum = today.getDate();
  const totalDays = 31; // October cycle

  return (
    <header className="sticky top-0 z-30 border-b border-navy-500/80 bg-navy-900/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Cycle & Simulated Day */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy-700/80 border border-navy-500/80 flex items-center justify-center text-emerald shadow-inner">
              <Calendar size={15} />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>October 2026 Cycle</span>
                <span className="hidden sm:inline-block text-navy-400">•</span>
                <span className="hidden sm:inline-block text-2xs text-muted font-normal">
                  Day 1 – 31
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-muted">
                <Clock size={11} className="text-emerald" />
                <span>
                  Simulated Day <strong>{currentDayNum}</strong> of {totalDays}
                </span>
                <span className="text-navy-400">•</span>
                <span className="text-emerald font-medium">
                  {metrics.remainingDays} days left
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick actions & Reset */}
        <div className="flex items-center gap-2.5">
          <Badge variant="emerald" size="sm" className="hidden sm:inline-flex shadow-sm">
            <Sparkles size={11} className="mr-0.5" /> Live Simulation
          </Badge>

          <button
            onClick={() => dispatch({ type: 'RESET_TO_DEMO' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-medium text-slate-300 hover:text-white bg-navy-700/80 hover:bg-navy-600 border border-navy-500 hover:border-emerald/40 transition-all shadow-sm active:scale-95"
            title="Reset simulation to initial ₹10,000 demo state"
          >
            <RotateCcw size={12} className="text-emerald" />
            <span className="hidden xs:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
