import React from 'react';
import { Initiative } from '../../types/safeqms';
import { sqdcScore } from '../../domain/syncEngine';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'teal' | 'slate';

const STATUS_TONE: Record<string, Tone> = {
  Approved: 'green',
  'On track': 'green',
  Done: 'green',
  Completed: 'green',
  Aligned: 'teal',
  Resolved: 'green',
  'At risk': 'amber',
  Pending: 'amber',
  'Pending approval': 'amber',
  'Awaiting director': 'amber',
  'Awaiting department': 'amber',
  'In review': 'amber',
  'In progress': 'blue',
  Active: 'blue',
  High: 'amber',
  'Off track': 'red',
  Critical: 'red',
  Rejected: 'red',
  'Changes requested': 'red',
  Escalated: 'red',
  Open: 'red',
  Draft: 'slate',
  Planned: 'slate',
  'Not measured': 'slate',
  Medium: 'blue',
  'Team action': 'blue',
  'Direct fix': 'slate',
  'Direct Fix': 'slate',
  '5-Why': 'blue',
  'Full A3': 'amber',
  A3: 'blue',
  Escalate: 'red',
};

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
  red: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
  blue: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
  teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/70',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
};

export const StatusBadge: React.FC<{
  label: string;
  tone?: Tone;
  className?: string;
}> = ({ label, tone, className = '' }) => {
  const resolved = tone || STATUS_TONE[label] || 'slate';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap ${TONE_CLASSES[resolved]} ${className}`}
    >
      {label}
    </span>
  );
};

export const SqdcStrip: React.FC<{
  initiative: Initiative;
  compact?: boolean;
}> = ({ initiative, compact = false }) => {
  const { s, weighted } = sqdcScore(initiative);
  const letters = ['S', 'Q', 'D', 'C'] as const;
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <div className="inline-flex items-center gap-1">
        {letters.map((key) => {
          const val = Number(s[key] || 0);
          const color =
            val === 2
              ? key === 'S'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-teal-600 text-white border-teal-700'
              : val === 1
                ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                : 'bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border)]';
          return (
            <span
              key={key}
              title={`${key}: ${val === 2 ? 'Primary' : val === 1 ? 'Secondary' : 'None'}`}
              className={`inline-flex items-center justify-center rounded border text-[10px] font-bold font-mono ${
                compact ? 'w-5 h-5' : 'w-6 h-5'
              } ${color}`}
            >
              {key}
            </span>
          );
        })}
      </div>
      {!compact && (
        <span className="text-[11px] font-mono tabular-nums text-[var(--muted)]">
          Score {weighted}/8
        </span>
      )}
      {initiative.isBottleneck && (
        <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          TOC Bottleneck
        </span>
      )}
    </div>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] ${className}`}>
    {children}
  </div>
);

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">{title}</h1>
      {subtitle && <p className="mt-1 text-xs sm:text-sm text-[var(--muted)] max-w-3xl">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
