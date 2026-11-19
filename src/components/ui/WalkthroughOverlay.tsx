import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, SkipForward, X } from 'lucide-react';
import { useWalkthrough } from '../../context/WalkthroughContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatRoleLabel } from '../../types/safeqms';

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const WalkthroughOverlay: React.FC = () => {
  const { isActive, steps, currentIndex, currentStep, nextStep, prevStep, skipStep, exitTour } = useWalkthrough();
  const { activeRole, route } = useWorkspace();
  const [rect, setRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const measure = (scrollIfFound = false) => {
      if (cancelled) return;
      const el = document.querySelector(currentStep.selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        if (attempts < 18) {
          attempts += 1;
          setTimeout(() => measure(scrollIfFound), 90);
        }
        return;
      }
      if (scrollIfFound) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      const pad = 6;
      setRect({
        top: Math.max(4, r.top - pad),
        left: Math.max(4, r.left - pad),
        width: Math.min(window.innerWidth - 8, r.width + pad * 2),
        height: r.height + pad * 2,
      });
    };

    const timer = setTimeout(() => measure(true), 120);
    const onResizeOrScroll = () => measure(false);
    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, true);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll, true);
    };
  }, [isActive, currentStep, route]);

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitTour(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, exitTour, nextStep, prevStep]);

  if (!isActive || !currentStep) return null;

  const isLast = currentIndex === steps.length - 1;
  const pct = Math.round(((currentIndex + 1) / Math.max(1, steps.length)) * 100);

  return (
    <div className="no-print">
      {/* Real UI Element Spotlight Ring (non-blocking so user can interact) */}
      {rect && (
        <div
          aria-hidden="true"
          className="fixed z-40 pointer-events-none rounded-xl border-2 border-teal-600 dark:border-teal-400 shadow-[0_0_0_4px_rgba(79,111,88,0.22)] transition-all duration-200"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />
      )}

      {/* Compact Contextual Instruction Panel */}
      <aside
        role="dialog"
        aria-label={`Guidad genomgång: ${currentStep.title}`}
        className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl overflow-hidden"
      >
        <div className="h-1 w-full bg-[var(--surface-subtle)]">
          <div
            className="h-full bg-teal-700 dark:bg-teal-500 transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-mono font-semibold text-teal-700 dark:text-teal-300">
                Steg {currentIndex + 1} av {steps.length} · Kapitel {currentStep.chapterId} · {formatRoleLabel(activeRole)}
              </div>
              <h3 className="text-sm font-bold text-[var(--ink)] leading-snug">
                {currentStep.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => exitTour(false)}
              aria-label="Avsluta guidad genomgång"
              title="Avsluta (Esc)"
              className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs leading-relaxed">
            <p className="text-[var(--ink)]">
              <strong className="font-semibold">Varför:</strong> {currentStep.why}
            </p>
            <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]">
              <strong className="font-semibold text-teal-700 dark:text-teal-300">Gör så här:</strong>{' '}
              {currentStep.action}
            </p>
            <p className="text-[11px] text-[var(--muted)]">{currentStep.roleTip}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Föregående</span>
              </button>
              <button
                type="button"
                onClick={() => exitTour(true)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
                title="Tillbaka till SOP & User Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Till guiden</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {!isLast && (
                <button
                  type="button"
                  onClick={skipStep}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Hoppa över</span>
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Slutför</span>
                  </>
                ) : (
                  <>
                    <span>Nästa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
