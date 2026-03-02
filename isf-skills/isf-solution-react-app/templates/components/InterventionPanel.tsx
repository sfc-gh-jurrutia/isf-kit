import React, { useState, useCallback } from 'react';
import clsx from 'clsx';

/* ----------------------------------------------------------------
   Inline SVG icons (no external icon-library dependency)
   ---------------------------------------------------------------- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="28 10" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1L2 4v4c0 3.5 2.5 6.4 6 7 3.5-.6 6-3.5 6-7V4L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

export interface Intervention {
  id: string;
  title: string;
  system: string;
  confidence: number;
  reason: string;
  riskBefore: number;
  riskAfter: number;
  itemsProtected?: number;
  revenueSaved?: string;
  feasibility: 'high' | 'medium' | 'low';
  status?: 'pending' | 'executing' | 'executed' | 'failed';
}

export interface InterventionPanelProps {
  interventions: Intervention[];
  onExecute?: (id: string) => Promise<void>;
  title?: string;
  className?: string;
}

/* ----------------------------------------------------------------
   Feasibility color mapping
   ---------------------------------------------------------------- */

const FEASIBILITY_MAP: Record<Intervention['feasibility'], { bg: string; color: string; cssClass: string }> = {
  high:   { bg: 'rgba(34,197,94,0.1)',  color: '#16a34a', cssClass: 'badge-success' },
  medium: { bg: 'rgba(245,158,11,0.1)', color: '#d97706', cssClass: 'badge-warning' },
  low:    { bg: 'rgba(244,63,94,0.1)',   color: '#e11d48', cssClass: 'badge-danger' },
};

/* ----------------------------------------------------------------
   RiskBar — animated from → to
   ---------------------------------------------------------------- */

function RiskBar({ before, after }: { before: number; after: number }) {
  const beforePct = Math.round(before * 100);
  const afterPct = Math.round(after * 100);
  const reduction = beforePct - afterPct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Risk</span>
        <span>{beforePct}% → {afterPct}%{reduction > 0 && ` (−${reduction}%)`}</span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 6,
          borderRadius: 3,
          background: 'var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        {/* Before (faded background) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${beforePct}%`,
            borderRadius: 3,
            background: 'rgba(244,63,94,0.25)',
            transition: 'width 0.6s ease',
          }}
        />
        {/* After (solid foreground, animated) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${afterPct}%`,
            borderRadius: 3,
            background: afterPct > 60
              ? '#f43f5e'
              : afterPct > 30
                ? '#f59e0b'
                : '#22c55e',
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   InterventionCard
   ---------------------------------------------------------------- */

function InterventionCard({
  intervention,
  onExecute,
}: {
  intervention: Intervention;
  onExecute?: (id: string) => Promise<void>;
}) {
  const [localStatus, setLocalStatus] = useState<Intervention['status']>(intervention.status ?? 'pending');
  const [executing, setExecuting] = useState(false);

  const handleExecute = useCallback(async () => {
    if (!onExecute || executing || localStatus === 'executed') return;
    setExecuting(true);
    setLocalStatus('executing');
    try {
      await onExecute(intervention.id);
      setLocalStatus('executed');
    } catch {
      setLocalStatus('failed');
    } finally {
      setExecuting(false);
    }
  }, [onExecute, executing, localStatus, intervention.id]);

  const feasibility = FEASIBILITY_MAP[intervention.feasibility];
  const confidencePct = Math.round(intervention.confidence * 100);

  return (
    <div
      className={clsx(
        'dashboard-card animate-data-fade-in',
        localStatus === 'executing' && 'ai-thinking-border',
      )}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {intervention.title}
          </h4>
          <span className="theme-badge" style={{ fontSize: 10 }}>
            {intervention.system}
          </span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: confidencePct >= 80 ? '#22c55e' : confidencePct >= 50 ? '#f59e0b' : '#f43f5e',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {confidencePct}%
        </div>
      </div>

      {/* Reason */}
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {intervention.reason}
      </p>

      {/* Risk bar */}
      <RiskBar before={intervention.riskBefore} after={intervention.riskAfter} />

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {intervention.itemsProtected != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <ShieldIcon />
            <span><strong style={{ color: 'var(--text-primary)' }}>{intervention.itemsProtected.toLocaleString()}</strong> protected</span>
          </div>
        )}
        {intervention.revenueSaved && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Saved: <strong style={{ color: 'var(--status-success)' }}>{intervention.revenueSaved}</strong>
          </div>
        )}
      </div>

      {/* Feasibility + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span className={clsx('theme-badge', feasibility.cssClass)} style={{ fontSize: 10, textTransform: 'capitalize' }}>
          {intervention.feasibility} feasibility
        </span>

        {onExecute && localStatus !== 'executed' && (
          <button
            className="theme-button-primary"
            onClick={handleExecute}
            disabled={executing || localStatus === 'failed'}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {executing && <SpinnerIcon />}
            {localStatus === 'failed' ? 'Failed' : 'Execute'}
          </button>
        )}

        {localStatus === 'executed' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--status-success)',
            }}
          >
            <CheckIcon /> Done
          </span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   InterventionPanel
   ---------------------------------------------------------------- */

export function InterventionPanel({
  interventions,
  onExecute,
  title = 'Recommended Actions',
  className,
}: InterventionPanelProps) {
  if (interventions.length === 0) return null;

  return (
    <div className={className}>
      {/* Section header */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="section-header-icon">⚡</span>
          <h3 className="section-header-title">{title}</h3>
        </div>
        <span className="theme-badge" style={{ fontSize: 10 }}>
          {interventions.length} {interventions.length === 1 ? 'action' : 'actions'}
        </span>
      </div>

      {/* Card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {interventions.map((intervention) => (
          <InterventionCard
            key={intervention.id}
            intervention={intervention}
            onExecute={onExecute}
          />
        ))}
      </div>

      {/* Inline keyframe for spinner (scoped, avoids global stylesheet mutation) */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
