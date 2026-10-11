import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Wifi,
  Lock,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { Badge } from '@/components/common/Badge';

interface BalanceCard3DProps {
  availableToSpend: number;
  actualBalance: number;
  startingBudget: number;
  outstandingCommitments: number;
  savingsReserved: number;
  userName: string;
  onExploreLab?: () => void;
}

export function BalanceCard3D({
  availableToSpend,
  actualBalance,
  startingBudget,
  outstandingCommitments,
  savingsReserved,
  userName,
}: BalanceCard3DProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse move handler for realistic 3D card tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
    const rotateY = ((x - centerX) / centerX) * 6;  // max 6 deg

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Utilization calculation
  const totalLocked = outstandingCommitments + savingsReserved;
  const utilizationPercent = Math.min(
    Math.round(((startingBudget - availableToSpend) / startingBudget) * 100),
    100,
  );

  return (
    <div
      className="perspective-1000 w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          scale: isHovered ? 1.01 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-br from-navy-800 via-[#121c33] to-[#0d1629] p-6 lg:p-7 shadow-2xl transition-shadow duration-300 hover:shadow-emerald/10"
      >
        {/* Soft Ambient Radial Lights */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
          }}
        />

        {/* Card Header: Chip, Contactless, Brand */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Metallic Smart Chip */}
            <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-1 shadow-md border border-amber-200/40 flex flex-col justify-between">
              <div className="h-0.5 w-full bg-amber-700/40 rounded-full" />
              <div className="flex justify-between">
                <div className="w-2 h-2 rounded-sm border border-amber-800/40" />
                <div className="w-2 h-2 rounded-sm border border-amber-800/40" />
              </div>
              <div className="h-0.5 w-full bg-amber-700/40 rounded-full" />
            </div>
            {/* Contactless symbol */}
            <Wifi size={18} className="rotate-90 text-slate-400 opacity-60" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs tracking-widest text-slate-400">
              PAISAPILOT 30D
            </span>
            <Badge variant={availableToSpend > 1000 ? 'emerald' : 'rose'} size="sm">
              <Sparkles size={11} className="mr-0.5" />
              {availableToSpend > 0 ? 'Safe Liquidity' : 'Budget Deficit'}
            </Badge>
          </div>
        </div>

        {/* Hero Figure: Available to Spend */}
        <div className="space-y-1 mb-5">
          <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted">
            <span>Available to Spend (Safe Margin)</span>
            <span
              title="Actual balance minus all unpaid commitments and reserved savings"
              className="cursor-help"
            >
              <Info size={12} className="text-navy-400 hover:text-emerald" />
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black text-white tracking-tight tabular-nums">
              {formatCurrency(availableToSpend)}
            </span>
            <span className="text-xs font-semibold text-emerald">
              INR
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-lg leading-relaxed pt-0.5">
            Your true disposable spending cushion after locking <strong className="text-white">₹{totalLocked}</strong> for scheduled bills and future savings.
          </p>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between items-center text-2xs">
            <span className="text-muted">
              Monthly Budget Utilization: <strong className="text-white">{utilizationPercent}%</strong>
            </span>
            <span className="text-slate-400 font-mono">
              ₹{startingBudget - availableToSpend} committed of {formatCurrency(startingBudget)}
            </span>
          </div>
          <div className="progress-track h-2 bg-navy-950/60 border border-navy-600/40">
            <div
              className={`progress-fill ${
                utilizationPercent < 75
                  ? 'bg-gradient-to-r from-emerald to-lime'
                  : utilizationPercent < 90
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600'
              }`}
              style={{ width: `${Math.max(4, utilizationPercent)}%` }}
            />
          </div>
        </div>

        {/* Layered Glass Footer Shelf: Transparent Equation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-navy-600/70">
          <div className="p-2.5 rounded-xl bg-navy-900/60 border border-navy-600/40 text-2xs">
            <div className="text-muted mb-0.5">1. Total In-Account</div>
            <div className="font-bold text-slate-100 text-xs tabular-nums">
              {formatCurrency(actualBalance)}
            </div>
            <div className="text-navy-400 text-3xs">Gross bank balance</div>
          </div>

          <div className="p-2.5 rounded-xl bg-navy-900/60 border border-navy-600/40 text-2xs">
            <div className="text-amber mb-0.5 flex items-center gap-1">
              <Lock size={10} />
              <span>2. Unpaid Bills</span>
            </div>
            <div className="font-bold text-amber text-xs tabular-nums">
              -{formatCurrency(outstandingCommitments)}
            </div>
            <div className="text-navy-400 text-3xs">Reserved for bills</div>
          </div>

          <div className="p-2.5 rounded-xl bg-navy-900/60 border border-navy-600/40 text-2xs">
            <div className="text-purple-400 mb-0.5 flex items-center gap-1">
              <Lock size={10} />
              <span>3. Savings Goals</span>
            </div>
            <div className="font-bold text-purple-300 text-xs tabular-nums">
              -{formatCurrency(savingsReserved)}
            </div>
            <div className="text-navy-400 text-3xs">Locked for goals</div>
          </div>
        </div>

        {/* Card Holder & Cycle Details */}
        <div className="flex items-center justify-between text-3xs font-mono uppercase tracking-widest text-slate-400 mt-4 pt-3 border-t border-navy-700/60">
          <span>{userName}</span>
          <span>CYCLE 10/26 • DAY 1-31</span>
        </div>
      </motion.div>
    </div>
  );
}
