import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

/* ----------------------------------------------------------------
   Inline SVG icons (no external icon-library dependency)
   ---------------------------------------------------------------- */

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 5.5v-.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

interface LineageStep {
  layer: string;
  description: string;
  detail?: string;
  badges?: string[];
}

interface BusinessImpact {
  headline: string;
  questionAnswered: string;
  valueProposition: string;
  beforeState: string;
  afterState: string;
}

export interface DataLineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  lineageSteps: LineageStep[];
  businessImpact?: BusinessImpact;
}

export interface DataLineageButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

/* ----------------------------------------------------------------
   Layer color palette (deterministic per-layer)
   ---------------------------------------------------------------- */

const LAYER_COLORS: Record<string, string> = {
  RAW: '#f59e0b',
  ATOMIC: '#3b82f6',
  DATA_MART: '#8b5cf6',
  Agent: '#22c55e',
};

function layerColor(layer: string): string {
  return LAYER_COLORS[layer] ?? 'var(--accent, var(--snowflake-blue))';
}

/* ----------------------------------------------------------------
   Tabs
   ---------------------------------------------------------------- */

type ModalTab = 'how-it-works' | 'business-impact';

/* ----------------------------------------------------------------
   DataLineageModal
   ---------------------------------------------------------------- */

export function DataLineageModal({
  isOpen,
  onClose,
  title,
  lineageSteps,
  businessImpact,
}: DataLineageModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('how-it-works');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const tabs: { key: ModalTab; label: string; disabled?: boolean }[] = [
    { key: 'how-it-works', label: 'How It Works' },
    { key: 'business-impact', label: 'Business Impact', disabled: !businessImpact },
  ];

  return ReactDOM.createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-overlay, rgba(0,0,0,0.5))',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Modal panel */}
      <div
        className="animate-slide-up theme-card-elevated"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '85vh',
          margin: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 6,
              transition: 'color 0.15s',
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: activeTab === tab.key ? 'var(--bg-surface, transparent)' : 'transparent',
                color: tab.disabled
                  ? 'var(--text-dim)'
                  : activeTab === tab.key
                    ? 'var(--snowflake-blue)'
                    : 'var(--text-muted)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: 13,
                cursor: tab.disabled ? 'default' : 'pointer',
                borderBottom:
                  activeTab === tab.key
                    ? '2px solid var(--snowflake-blue)'
                    : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content (scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 'how-it-works' && (
            <HowItWorksTab steps={lineageSteps} />
          )}
          {activeTab === 'business-impact' && businessImpact && (
            <BusinessImpactTab impact={businessImpact} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <SnowflakeIcon />
          <span>Powered by Snowflake Cortex</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ----------------------------------------------------------------
   How It Works tab — vertical pipeline
   ---------------------------------------------------------------- */

function HowItWorksTab({ steps }: { steps: LineageStep[] }) {
  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, idx) => {
        const color = layerColor(step.layer);
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} style={{ display: 'flex', gap: 14 }}>
            {/* Connector column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 20,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 8px ${color}44`,
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    background: `linear-gradient(to bottom, ${color}, ${layerColor(steps[idx + 1].layer)})`,
                    opacity: 0.4,
                  }}
                />
              )}
            </div>

            {/* Step content */}
            <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  className="theme-badge"
                  style={{
                    background: `${color}22`,
                    color,
                    borderColor: `${color}44`,
                    fontWeight: 600,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {step.layer}
                </span>
              </div>

              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {step.description}
              </p>

              {step.detail && (
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {step.detail}
                </p>
              )}

              {step.badges && step.badges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {step.badges.map((badge) => (
                    <span
                      key={badge}
                      className="theme-badge"
                      style={{ fontSize: 10 }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------
   Business Impact tab
   ---------------------------------------------------------------- */

function BusinessImpactTab({ impact }: { impact: BusinessImpact }) {
  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Headline */}
      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          {impact.headline}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {impact.valueProposition}
        </p>
      </div>

      {/* Question answered */}
      <div
        className="theme-card-accent"
        style={{ padding: 14 }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Question Answered
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontStyle: 'italic' }}>
          &ldquo;{impact.questionAnswered}&rdquo;
        </p>
      </div>

      {/* Before / After comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div
          className="dashboard-card"
          style={{
            padding: 14,
            borderTop: '3px solid var(--color-before, var(--valencia-orange))',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-before, var(--valencia-orange))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Before
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {impact.beforeState}
          </p>
        </div>

        <div
          className="dashboard-card"
          style={{
            padding: 14,
            borderTop: '3px solid var(--color-after, var(--snowflake-blue))',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-after, var(--snowflake-blue))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            After
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {impact.afterState}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   DataLineageButton — small info icon trigger
   ---------------------------------------------------------------- */

export function DataLineageButton({ onClick, className, label = 'View data lineage' }: DataLineageButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx('theme-button-ghost', className)}
      aria-label={label}
      title={label}
      style={{
        padding: '4px 8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: 'var(--text-muted)',
        borderRadius: 6,
      }}
    >
      <InfoIcon />
    </button>
  );
}

export type { DataLineageModalProps as DataLineageModalPropsType };
