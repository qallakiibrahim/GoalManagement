import React from 'react';
import { ALL_SCOPES, ASSIGNED_DEPARTMENT, ASSIGNED_SITE } from '../../types/safeqms';
import { isLimitedRole } from '../../domain/syncEngine';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useLanguage } from '../../context/LanguageContext';

export const ScopeBar: React.FC<{
  showYear?: boolean;
  rightContent?: React.ReactNode;
}> = ({ showYear = true, rightContent }) => {
  const { scope, setScope, year, setYear, activeRole } = useWorkspace();
  const { t, tScope } = useLanguage();
  const allowedScopes = isLimitedRole(activeRole) ? ['Organization', ASSIGNED_SITE, ASSIGNED_DEPARTMENT] : ALL_SCOPES;

  return (
    <div
      data-tour="scope-bar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] px-3.5 py-2.5 no-print"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t('Scope', 'Omfattning')}
          </span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label={t('Organizational scope', 'Organisationsnivå')}
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
          >
            {allowedScopes.map((s) => (
              <option key={s} value={s}>
                {tScope(s)}
              </option>
            ))}
          </select>
        </div>

        {showYear && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {t('Horizon', 'Horisont')}
            </span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              aria-label={t('Strategy year', 'Strategiår')}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
            >
              {['2027', '2028', '2029'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {rightContent && <div className="flex flex-wrap items-center gap-2">{rightContent}</div>}
    </div>
  );
};
