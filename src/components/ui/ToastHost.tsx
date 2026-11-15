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
            ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100'
            : tone === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
              : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)]';
        const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs font-medium shadow-lg ${styles}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};
