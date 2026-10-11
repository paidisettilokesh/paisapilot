import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Sparkles,
  Flame,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatCurrency } from '@/utils/helpers';
import { RISK_META } from '@/lib/constants';

export function HealthPage() {
  const { metrics } = useFinancial();
  const navigate = useNavigate();

  // Determine health grade
  const getGrade = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald', badge: 'emerald' as const };
    if (score >= 65) return { label: 'Good', color: 'text-emerald', badge: 'emerald' as const };
    if (score >= 50) return { label: 'Fair / Vulnerable', color: 'text-amber', badge: 'amber' as const };
    return { label: 'Critical Alert', color: 'text-rose-400', badge: 'rose' as const };
  };

  const grade = getGrade(metrics.healthScore);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Health & Risk 🩺"
        subtitle="Transparent, rule-based diagnostic of your financial resilience and spending velocity."
      />

      {/* Hero Diagnostic Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Health Score Main Card */}
        <Card variant="glow" className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted">
                Financial Health Index
              </span>
              <Badge variant={grade.badge}>{grade.label}</Badge>
            </div>

            <div className="flex items-center gap-6 my-4">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                {/* SVG Radial Meter */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-navy-700"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * metrics.healthScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                    {metrics.healthScore}
                  </span>
                  <span className="text-2xs text-muted">/ 100</span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Status: {grade.label}
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Based on budget discipline, liquidity buffer, and commitment coverage.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-600/70 text-xs text-slate-300">
            Available liquidity: <strong className="text-white">{formatCurrency(metrics.availableToSpend)}</strong> with{' '}
            <strong className="text-white">{metrics.remainingDays} days</strong> remaining in the cycle.
          </div>
        </Card>

        {/* Risk Level Diagnosis */}
        <Card variant="default" className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted">
                Risk Engine Evaluation
              </span>
              <Badge
                variant={
                  metrics.riskLevel === 'low'
                    ? 'emerald'
                    : metrics.riskLevel === 'moderate'
                    ? 'amber'
                    : 'rose'
                }
              >
                {RISK_META[metrics.riskLevel]?.label || metrics.riskLevel}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">Risk Exposure</span>
                <span className="text-lg font-bold text-amber tabular-nums">
                  {metrics.riskScore}%
                </span>
              </div>
              <div className="progress-track h-2">
                <div
                  className={`progress-fill ${
                    metrics.riskScore < 30
                      ? 'bg-emerald'
                      : metrics.riskScore < 60
                      ? 'bg-amber'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${metrics.riskScore}%` }}
                />
              </div>
            </div>

            {/* Risk Drivers */}
            <div className="space-y-2 mt-4">
              <div className="text-2xs font-bold uppercase tracking-wider text-muted">
                Key Diagnostic Drivers
              </div>
              {metrics.riskFactors.length > 0 ? (
                metrics.riskFactors.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-navy-700/50 border border-navy-500/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {f.impact === 'positive' ? (
                        <CheckCircle2 size={14} className="text-emerald shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber shrink-0" />
                      )}
                      <span className="text-slate-200">{f.label}</span>
                    </div>
                    <span
                      className={`font-semibold tabular-nums ${
                        f.impact === 'positive' ? 'text-emerald' : 'text-amber'
                      }`}
                    >
                      {f.impact === 'positive' ? '-' : '+'}
                      {Math.abs(f.points)} pts
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">No significant risk triggers detected.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 4-Pillar Health Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
          <Activity size={16} className="text-emerald" />
          The 4 Pillars of Your Financial Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.healthFactors.map((hf, idx) => (
            <Card key={idx} variant="default" className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-white">{hf.label}</span>
                <span className="text-xs font-bold text-emerald tabular-nums">
                  {hf.score} / {hf.maxScore}
                </span>
              </div>
              <div className="progress-track h-1.5">
                <div
                  className="progress-fill bg-emerald"
                  style={{ width: `${(hf.score / hf.maxScore) * 100}%` }}
                />
              </div>
              <p className="text-2xs text-muted leading-relaxed">{hf.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Actionable Insights */}
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald" />
          Algorithmic Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.insights.map((insight) => (
            <Card key={insight.id} variant="default" className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    insight.type === 'alert'
                      ? 'bg-rose-400'
                      : insight.type === 'warning'
                      ? 'bg-amber'
                      : 'bg-emerald'
                  }`}
                />
                <h4 className="text-xs font-bold text-white tracking-tight">
                  {insight.title}
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{insight.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Stress Test Section */}
      <Card variant="accent" className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-amber" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Emergency Stress Test ⚡
              </h3>
            </div>
            <p className="text-xs text-muted max-w-xl">
              Can your budget survive an unexpected ₹2,000 emergency expense right now?
              Simulate high-impact shocks in the Money Lab to check your safety margin.
            </p>
          </div>

          <button
            onClick={() => navigate('/lab')}
            className="btn-primary text-xs shrink-0 gap-2"
          >
            <span>Run Stress Test in Lab</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </Card>
    </div>
  );
}
