import React, { ReactNode } from 'react';
import clsx from 'clsx';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

export type FactorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  id: string;
  name: string;
  /** 0-100 percentage value. */
  value: number;
  severity?: FactorSeverity;
  icon?: ReactNode;
}

/* ----------------------------------------------------------------
   Severity → color mapping
   ---------------------------------------------------------------- */

const severityColor: Record<FactorSeverity, string> = {
  low: 'var(--chart-success, #10b981)',
  medium: 'var(--chart-warning, #f59e0b)',
  high: 'var(--chart-danger, #ef4444)',
  critical: 'var(--status-danger, #f43f5e)',
};

function autoSeverity(value: number): FactorSeverity {
  if (value >= 75) return 'critical';
  if (value >= 50) return 'high';
  if (value >= 25) return 'medium';
  return 'low';
}

/* ----------------------------------------------------------------
   Factor Row
   ---------------------------------------------------------------- */

interface FactorRowProps {
  factor: RiskFactor;
  onAsk?: (question: string) => void;
}

function FactorRow({ factor, onAsk }: FactorRowProps) {
  const sev = factor.severity ?? autoSeverity(factor.value);
  const color = severityColor[sev];
  const pct = Math.max(0, Math.min(100, Math.round(factor.value)));

  const handleClick = () => {
    onAsk?.(`What is driving the ${factor.name} risk factor at ${pct}%?`);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        cursor: onAsk ? 'pointer' : 'default',
        borderRadius: 6,
      }}
      className="table-row-interactive"
    >
      {factor.icon && (
        <span style={{ display: 'flex', alignItems: 'center', width: 20, flexShrink: 0, color: 'var(--text-muted)' }}>
          {factor.icon}
        </span>
      )}

      <span style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        minWidth: 100,
        flexShrink: 0,
      }}>
        {factor.name}
      </span>

      <div style={{
        flex: 1,
        height: 8,
        background: 'var(--border-subtle)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div
          className={clsx(sev === 'critical' && 'animate-crisis-glow')}
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color,
        minWidth: 36,
        textAlign: 'right',
      }}>
        {pct}%
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------
   RiskFactorPanel
   ---------------------------------------------------------------- */

export interface RiskFactorPanelProps {
  factors: RiskFactor[];
  title?: string;
  onAsk?: (question: string) => void;
  className?: string;
}

export function RiskFactorPanel({
  factors,
  title = 'Risk Factors',
  onAsk,
  className,
}: RiskFactorPanelProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {title && (
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {title}
        </div>
      )}

      {factors.map((factor) => (
        <FactorRow key={factor.id} factor={factor} onAsk={onAsk} />
      ))}
    </div>
  );
}
