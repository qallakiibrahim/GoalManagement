import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const FirestoreErrorBanner: React.FC = () => {
  const { firestoreError, clearFirestoreError } = useWorkspace();
  if (!firestoreError) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-100 flex items-start justify-between gap-3 no-print">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
        <div>
          <div className="font-semibold">Workspace Sync Notice</div>
          <p className="mt-0.5 opacity-90">{firestoreError}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={clearFirestoreError}
        className="rounded p-1 hover:bg-rose-200/50 dark:hover:bg-rose-900/50"
        aria-label="Dismiss error"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const SkeletonView: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="h-8 w-64 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <div className="h-3 w-24 rounded bg-[var(--surface-subtle)]" />
          <div className="h-7 w-16 rounded bg-[var(--surface-subtle)]" />
          <div className="h-2.5 w-32 rounded bg-[var(--surface-subtle)]" />
        </div>
      ))}
    </div>
    <div className="h-64 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
  </div>
);
