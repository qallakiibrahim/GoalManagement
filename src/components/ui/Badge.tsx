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
  green: 'bg-emerald-500/10 text-emerald-800 border-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20',
  amber: 'bg-amber-500/10 text-amber-800 border-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20',
  red: 'bg-rose-500/10 text-rose-800 border-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/20',
  blue: 'bg-sky-500/10 text-sky-800 border-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20',
  teal: 'bg-teal-600/10 text-teal-800 border-teal-700/20 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/20',
  slate: 'bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border-strong)]/60',
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

const SQDC_PILLARS = [
  {
    key: 'S',
    label: 'Safety',
    primary: 'bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-600 dark:border-emerald-500',
    secondary: 'bg-emerald-500/12 text-emerald-800 border-emerald-600/30 dark:bg-emerald-400/12 dark:text-emerald-300 dark:border-emerald-400/30',
  },
  {
    key: 'Q',
    label: 'Quality',
    primary: 'bg-sky-700 text-white border-sky-800 dark:bg-sky-600 dark:border-sky-500',
    secondary: 'bg-sky-500/12 text-sky-800 border-sky-600/30 dark:bg-sky-400/12 dark:text-sky-300 dark:border-sky-400/30',
  },
  {
    key: 'D',
    label: 'Delivery',
    primary: 'bg-indigo-700 text-white border-indigo-800 dark:bg-indigo-600 dark:border-indigo-500',
    secondary: 'bg-indigo-500/12 text-indigo-800 border-indigo-600/30 dark:bg-indigo-400/12 dark:text-indigo-300 dark:border-indigo-400/30',
  },
  {
    key: 'C',
    label: 'Cost',
    primary: 'bg-amber-700 text-white border-amber-800 dark:bg-amber-600 dark:border-amber-500',
    secondary: 'bg-amber-500/12 text-amber-800 border-amber-600/30 dark:bg-amber-400/12 dark:text-amber-300 dark:border-amber-400/30',
  },
] as const;

export const SqdcStrip: React.FC<{
  initiative: Initiative;
  compact?: boolean;
}> = ({ initiative, compact = false }) => {
  const { s, weighted } = sqdcScore(initiative);
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <div className="inline-flex items-center gap-1">
        {SQDC_PILLARS.map(({ key, label, primary, secondary }) => {
          const val = Number(s[key] || 0);
          const color =
            val === 2
              ? primary
              : val === 1
                ? secondary
                : 'bg-[var(--surface-subtle)] text-[var(--muted)]/60 border-[var(--border)]';
          return (
            <span
              key={key}
              title={`${label} (${key}): ${val === 2 ? 'Primary (2)' : val === 1 ? 'Secondary (1)' : 'None (0)'}`}
              className={`inline-flex items-center justify-center rounded border text-[10px] font-bold font-mono tabular-nums ${
                compact ? 'w-5 h-5' : 'px-1.5 h-5 gap-0.5 min-w-[26px]'
              } ${color}`}
            >
              <span>{key}</span>
              {!compact && val > 0 && (
                <span className="text-[9px] font-semibold opacity-85">{val}</span>
              )}
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
        <span className="inline-flex items-center rounded border border-amber-600/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
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
  <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] ${className}`}>
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
      <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.015em] text-[var(--ink)]">{title}</h1>
      {subtitle && <p className="mt-1 text-xs sm:text-sm text-[var(--muted)] max-w-3xl leading-relaxed">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
