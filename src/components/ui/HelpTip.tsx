import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, HelpCircle, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface HelpTipProps {
  title: string;
  body: string;
  note?: string;
  chapterId?: number;
  align?: 'left' | 'right';
}

export const HelpTip: React.FC<HelpTipProps> = ({
  title,
  body,
  note,
  chapterId,
  align = 'left',
}) => {
  const { navigate } = useWorkspace();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex items-center align-middle no-print">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`Hjälp: ${title}`}
        aria-expanded={open}
        title={`Hjälp: ${title}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--muted)] hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-600/10 transition-colors cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-40 top-full mt-2 w-72 sm:w-80 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-3.5 text-left shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="text-xs font-bold text-[var(--ink)] leading-snug">{title}</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Stäng hjälp"
              className="rounded p-0.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] font-normal text-[var(--ink)]/90 leading-relaxed whitespace-normal">
            {body}
          </p>
          {note && (
            <p className="mt-2 rounded-lg border border-amber-600/20 bg-amber-500/8 px-2.5 py-1.5 text-[11px] font-normal text-[var(--ink)] leading-relaxed whitespace-normal">
              {note}
            </p>
          )}
          {chapterId && (
            <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('sop', `chapter-${chapterId}`);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
              >
                <span>Öppna Kapitel {chapterId} i SOP-guiden</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
