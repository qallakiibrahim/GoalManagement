import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const ToastHost: React.FC = () => {
  const { toasts } = useWorkspace();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none no-print">
      {toasts.map((t) => {
        const tone = t.tone || 'info';
        const styles =
          tone === 'error'
            ? 'border-rose-600/25 bg-[var(--surface)] text-rose-800 ring-1 ring-inset ring-rose-600/10 dark:border-rose-400/25 dark:text-rose-200 dark:ring-rose-400/10'
            : tone === 'success'
              ? 'border-emerald-600/25 bg-[var(--surface)] text-emerald-800 ring-1 ring-inset ring-emerald-600/10 dark:border-emerald-400/25 dark:text-emerald-200 dark:ring-emerald-400/10'
              : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)]';
        const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-xl ${styles}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};
