import React from 'react';
import clsx from 'clsx';

/* ----------------------------------------------------------------
   Icons (inline SVG to avoid external icon-library dependency)
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
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="28 10" />
    </svg>
  );
}

/* ----------------------------------------------------------------
   AIThinking
   ---------------------------------------------------------------- */

const DEFAULT_STAGES = [
  'Classifying intent…',
  'Querying data…',
  'Analyzing results…',
  'Generating response…',
];

export interface AIThinkingProps {
  /** Labels for each processing stage. */
  stages?: string[];
  /** Zero-based index of the currently active stage. Stages before this are complete. */
  currentStage?: number;
  /** When false the component renders nothing. */
  isActive: boolean;
  className?: string;
}

export function AIThinking({
  stages = DEFAULT_STAGES,
  currentStage = 0,
  isActive,
  className,
}: AIThinkingProps) {
  if (!isActive) return null;

  const clampedStage = Math.max(0, Math.min(currentStage, stages.length - 1));
  const progressPct = stages.length > 1
    ? ((clampedStage + 1) / stages.length) * 100
    : 100;

  return (
    <div className={clsx('ai-thinking-border', className)} role="status" aria-label="Processing">
      <div className="ai-thinking-inner">
        {/* Progress bar */}
        <div className="ai-thinking-progress-track">
          <div
            className="ai-thinking-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stage list */}
        <ul className="ai-thinking-stages">
          {stages.map((label, idx) => {
            const isComplete = idx < clampedStage;
            const isCurrent = idx === clampedStage;

            return (
              <li
                key={idx}
                className={clsx(
                  'ai-thinking-stage',
                  isComplete && 'ai-thinking-stage-complete',
                  isCurrent && 'ai-thinking-stage-active',
                  !isComplete && !isCurrent && 'ai-thinking-stage-pending',
                )}
              >
                <span className="ai-thinking-stage-icon">
                  {isComplete && <CheckIcon className="ai-thinking-check" />}
                  {isCurrent && <SpinnerIcon className="ai-thinking-spinner" />}
                  {!isComplete && !isCurrent && <span className="ai-thinking-dot" />}
                </span>
                <span className="ai-thinking-stage-label">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
