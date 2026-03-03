import React, { ReactNode } from 'react';
import clsx from 'clsx';
import { DataState } from './ThemedCard';

/* ----------------------------------------------------------------
   KPI / Stat Card
   ---------------------------------------------------------------- */

export interface KPI {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  critical?: boolean;
  icon?: ReactNode;
}

export interface StatCardProps {
  kpi: KPI;
  onAsk?: (question: string) => void;
}

function trendArrow(trend?: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '\u2191';
  if (trend === 'down') return '\u2193';
  return '';
}

function trendColor(trend?: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return 'var(--status-danger)';
  if (trend === 'down') return 'var(--status-success)';
  return 'var(--text-muted)';
}

export function StatCard({ kpi, onAsk }: StatCardProps) {
  const handleClick = () => {
    onAsk?.(`Why is ${kpi.label} at ${kpi.value}${kpi.unit ? ' ' + kpi.unit : ''}? Is this normal?`);
  };

  return (
    <div
      className={clsx('stat-card', 'cursor-pointer', kpi.critical && 'animate-crisis-glow')}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      style={{
        flex: '1 1 0',
        minWidth: 140,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {kpi.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{kpi.icon}</span>}
        {kpi.label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 28,
          fontWeight: 700,
          color: kpi.critical ? 'var(--status-danger)' : 'var(--text-primary)',
          lineHeight: 1.1,
        }}>
          {kpi.value}
        </span>
        {kpi.unit && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            {kpi.unit}
          </span>
        )}
      </div>

      {kpi.trend && (
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: trendColor(kpi.trend),
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>{trendArrow(kpi.trend)}</span>
          {kpi.previousValue !== undefined && (
            <span>from {kpi.previousValue}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   KPI Strip
   Row of 4-8 stat cards with loading state and stagger animation.
   ---------------------------------------------------------------- */

export interface KPIStripProps {
  kpis: KPI[];
  onAsk?: (question: string) => void;
  isLoading?: boolean;
  className?: string;
  /** Split into 2 rows when more than this many KPIs. Default 4. */
  splitAt?: number;
}

export function KPIStrip({ kpis, onAsk, isLoading = false, className, splitAt = 4 }: KPIStripProps) {
  const rows: KPI[][] = [];
  if (kpis.length > splitAt) {
    rows.push(kpis.slice(0, splitAt));
    rows.push(kpis.slice(splitAt));
  } else {
    rows.push(kpis);
  }

  return (
    <DataState isLoading={isLoading} className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 16px' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {row.map((kpi) => (
              <StatCard key={kpi.id} kpi={kpi} onAsk={onAsk} />
            ))}
          </div>
        ))}
      </div>
    </DataState>
  );
}
