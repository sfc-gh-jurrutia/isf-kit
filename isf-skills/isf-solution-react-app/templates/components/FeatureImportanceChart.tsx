import React from 'react';
import clsx from 'clsx';
import { Badge } from './ThemedCard';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

export interface FeatureImportance {
  featureName: string;
  /** Absolute SHAP importance (always positive). */
  shapImportance: number;
  importanceRank: number;
  /** Optional: the raw SHAP value (can be negative for opposing direction). */
  shapValue?: number;
}

/* ----------------------------------------------------------------
   Color by relative magnitude
   ---------------------------------------------------------------- */

function barColor(ratio: number): string {
  if (ratio >= 0.7) return 'var(--chart-danger, #ef4444)';
  if (ratio >= 0.4) return 'var(--chart-warning, #f59e0b)';
  return 'var(--chart-primary, #6366f1)';
}

/* ----------------------------------------------------------------
   FeatureImportanceChart
   Horizontal bar chart for SHAP feature importance.
   ---------------------------------------------------------------- */

export interface FeatureImportanceChartProps {
  features: FeatureImportance[];
  /** Optional overall score to display in the header badge. */
  score?: number;
  /** Header title. */
  title?: string;
  /** Max features to display. Default 8. */
  maxFeatures?: number;
  /** Show base rate vertical line at this position (0-1). */
  baseRate?: number;
  /** Click-to-ask callback for individual features. */
  onAsk?: (question: string) => void;
  className?: string;
}

export function FeatureImportanceChart({
  features,
  score,
  title = 'Risk Explainability (SHAP)',
  maxFeatures = 8,
  baseRate,
  onAsk,
  className,
}: FeatureImportanceChartProps) {
  const sorted = [...features]
    .sort((a, b) => b.shapImportance - a.shapImportance)
    .slice(0, maxFeatures);

  const maxImportance = sorted.length > 0
    ? Math.max(...sorted.map((f) => f.shapImportance))
    : 1;

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {title}
        </span>
        {score !== undefined && (
          <Badge variant={score >= 0.7 ? 'danger' : score >= 0.4 ? 'warning' : 'success'}>
            Score: {Math.round(score * 100)}%
          </Badge>
        )}
      </div>

      {/* Base rate label */}
      {baseRate !== undefined && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Base rate: {(baseRate * 100).toFixed(1)}%
        </div>
      )}

      {/* Feature bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((feature) => {
          const ratio = maxImportance > 0 ? feature.shapImportance / maxImportance : 0;
          const pctWidth = Math.max(2, ratio * 100);
          const color = barColor(ratio);

          const handleClick = () => {
            onAsk?.(`Why is ${feature.featureName} a top contributing factor?`);
          };

          return (
            <div
              key={feature.featureName}
              onClick={handleClick}
              role={onAsk ? 'button' : undefined}
              tabIndex={onAsk ? 0 : undefined}
              onKeyDown={onAsk ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: onAsk ? 'pointer' : 'default',
                padding: '2px 0',
                borderRadius: 4,
              }}
              className={clsx(onAsk && 'table-row-interactive')}
            >
              {/* Feature name */}
              <span style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                minWidth: 140,
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {feature.featureName}
              </span>

              {/* Bar container */}
              <div style={{
                flex: 1,
                height: 16,
                background: 'var(--border-subtle)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${pctWidth}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />

                {/* Base rate line */}
                {baseRate !== undefined && (
                  <div style={{
                    position: 'absolute',
                    left: `${baseRate * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--text-muted)',
                    opacity: 0.6,
                    borderStyle: 'dashed',
                  }} />
                )}
              </div>

              {/* Value */}
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color,
                minWidth: 40,
                textAlign: 'right',
              }}>
                {feature.shapImportance >= 1
                  ? feature.shapImportance.toFixed(1)
                  : (feature.shapImportance * 100).toFixed(0) + '%'}
              </span>
            </div>
          );
        })}
      </div>

      {features.length > maxFeatures && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          + {features.length - maxFeatures} more features
        </div>
      )}
    </div>
  );
}
