import React, { useMemo, useState } from 'react';
import { Download, FileCheck2, Printer, RotateCcw, Upload } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  auditPacket,
  goalEvidenceCheck,
  goalPlanCheck,
  isoShort,
  managementSummary,
  normalizeCatalog,
  roleCan,
  roleVisibleGoals,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { HelpTip } from '../ui/HelpTip';

export const IsoPage: React.FC = () => {
  const {
    scope,
    goals,
    kpis,
    isoStandards,
    isoCatalogSource,
    isActualAdmin,
    importIsoCatalog,
    restoreDemoIso,
    navigate,
    toast,
  } = useWorkspace();
  const { t } = useLanguage();

  const visibleGoals = roleVisibleGoals(goals, scope, isActualAdmin ? 'Administratör' : 'QMS auditor');
  const [jsonError, setJsonError] = useState('');

  const handleCatalogFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setJsonError('');
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      const standards = normalizeCatalog(parsed);
      await importIsoCatalog(standards, f.name);
    } catch (err: any) {
      const msg = err?.message || t('Invalid ISO catalog JSON', 'Ogiltig ISO-katalog (JSON)');
      setJsonError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('ISO 9001 · 14001 · 45001 Goal Compliance', 'ISO 9001 · 14001 · 45001 Målefterlevnad')}
        subtitle={`${t('Standard source', 'Standardkatalog')}: ${isoCatalogSource}. ${t(
          'Verify clause traceability, Clause 6.2 planning completeness, and linked evidence.',
          'Verifiera kravspårbarhet, komplett planering enligt avsnitt 6.2 samt kopplade bevis.'
        )}`}
        actions={
          <button
            type="button"
            onClick={() => navigate('evidence')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            {t('Audit Evidence Pack', 'Revisionsbevis (Audit Pack)')}
          </button>
        }
      />

      <ScopeBar />

      {isActualAdmin && (
        <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-bold text-[var(--ink)]">{t('ISO Standards Catalog Management', 'Hantering av ISO-kravkatalog')}</div>
            <div className="text-[var(--muted)]">
              {t(
                'Import custom JSON clause registry or restore default ISO 9001 / 14001 / 45001 catalog.',
                'Importera egen JSON-katalog med kravpunkter eller återställ standardkatalogen för ISO 9001 / 14001 / 45001.'
              )}
            </div>
            {jsonError && <div className="text-rose-600 mt-1 font-medium">{jsonError}</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-[var(--surface-subtle)]">
              <Upload className="w-3.5 h-3.5" />
              {t('Import JSON Catalog', 'Importera JSON-katalog')}
              <input type="file" accept=".json,application/json" onChange={handleCatalogFile} className="hidden" />
            </label>
            <button
              type="button"
              onClick={restoreDemoIso}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('Restore Default Catalog', 'Återställ standardkatalog')}
            </button>
          </div>
        </Card>
      )}

      <div data-tour="iso-table">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t('Goal', 'Mål')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('ISO Clauses', 'ISO-krav')}</th>
                <th className="px-4 py-2.5 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <span>{t('Clause 6.2 Planning', 'Avsnitt 6.2 Planering')}</span>
                    <HelpTip
                      title="Planeringskomplett ≠ Verifierad ISO-efterlevnad"
                      body="Kolumnen 'Clause 6.2 Planning' verifierar att målets obligatoriska planeringsfält är ifyllda. För komplett ISO-revision krävs dessutom faktiska KPI-mätvärden, godkännandehistorik och dokumenterade PDCA-beslut."
                      chapterId={10}
                    />
                  </span>
                </th>
                <th className="px-4 py-2.5 font-semibold">{t('Risk / Process / Doc Refs', 'Risk / Process / Dokument')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('KPI Actuals', 'KPI-utfall')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visibleGoals.map((g) => {
                const plan = goalPlanCheck(g, kpis);
                const ev = goalEvidenceCheck(g, kpis);
                return (
                  <tr
                    key={g.id}
                    onClick={() => navigate('goal', g.id)}
                    className="hover:bg-[var(--surface-subtle)]/50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">
                      <span className="font-mono text-[var(--muted)] mr-1.5">{g.id}</span>
                      {g.title}
                    </td>
                    <td className="px-4 py-3 font-medium">{isoShort(isoStandards, g)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={plan.ready ? 'Complete' : 'Incomplete'} tone={plan.ready ? 'green' : 'amber'} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)] font-mono">
                      {[g.riskRefs, g.processRefs, g.evidenceRefs].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={ev.hasActual ? 'Measured' : 'Missing'} tone={ev.hasActual ? 'green' : 'amber'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
};

export const EvidencePage: React.FC = () => {
  const { scope, goals, activeRole, domainSnapshot } = useWorkspace();
  const { t, tScope } = useLanguage();
  const visibleGoals = roleVisibleGoals(goals, scope, activeRole);
  const [goalFilter, setGoalFilter] = useState<string>('ALL');
  const effectiveFilter = goalFilter === 'ALL' || visibleGoals.some((g) => g.id === goalFilter) ? goalFilter : 'ALL';

  const selectedGoals = useMemo(
    () => (effectiveFilter === 'ALL' ? visibleGoals : visibleGoals.filter((g) => g.id === effectiveFilter)),
    [visibleGoals, effectiveFilter]
  );

  const packet = useMemo(() => auditPacket(selectedGoals, domainSnapshot), [selectedGoals, domainSnapshot]);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeqms-audit-pack-${packet.generatedAt}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('Audit Evidence Pack', 'Revisionsbevis (Audit Evidence Pack)')}
        subtitle={t(
          'Audit-ready ISO 9001/14001/45001 traceability bundle combining objectives, planning fields, monthly measurements, approvals, and review decisions.',
          'Revisionsklart spårbarhetspaket för ISO 9001/14001/45001 som samlar mål, planeringsfält, månadsmätningar, godkännanden och PDCA-beslut.'
        )}
        actions={
          <div data-tour="evidence-actions" className="flex flex-wrap gap-2 no-print">
            <select
              value={effectiveFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold"
            >
              <option value="ALL">
                {t('All Goals in', 'Alla mål i')} {tScope(scope)} ({visibleGoals.length})
              </option>
              {visibleGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.id} · {g.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {t('Export JSON', 'Exportera JSON')}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('Print Report', 'Skriv ut rapport')}
            </button>
          </div>
        }
      />

      <ScopeBar />

      <div className="a3-sheet space-y-4">
        {packet.goals.map((entry) => (
          <Card key={entry.goal.id} className="a3-box p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-[var(--border)]">
              <div>
                <div className="font-mono text-xs font-bold text-[var(--muted)]">
                  {entry.goal.id} · {tScope(entry.goal.level)} · Rev v{entry.goal.revision}
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">{entry.goal.title}</h3>
              </div>
              <div className="flex gap-1.5">
                <StatusBadge label={entry.goal.approval} />
                <StatusBadge label={entry.goal.performance} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[var(--muted)] uppercase text-[10px]">{t('ISO Requirements', 'ISO-krav')}</div>
                {entry.isoRequirements.length === 0 ? (
                  <p className="text-[var(--muted)]">{t('None linked', 'Inga kopplade')}</p>
                ) : (
                  entry.isoRequirements.map((r: any, idx: number) => (
                    <div key={idx}>
                      <strong>{r.standard} §{r.clause}</strong> · {r.title}
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[var(--muted)] uppercase text-[10px]">{t('Clause 6.2 Planning', 'Avsnitt 6.2 Planering')}</div>
                <div>{t('What', 'Vad')}: {entry.planning.what || '—'}</div>
                <div>{t('Resources', 'Resurser')}: {entry.planning.resources || '—'}</div>
                <div>{t('Due', 'Klardatum')}: {entry.planning.due || '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[var(--muted)] uppercase text-[10px]">{t('Evidence & Measurement', 'Bevis & mätning')}</div>
                <div>{t('Risk', 'Risk')}: {entry.linkedRecords.riskReferences || '—'}</div>
                <div>{t('Process', 'Process')}: {entry.linkedRecords.processReferences || '—'}</div>
                <div>{t('Doc Ref', 'Dokument')}: {entry.linkedRecords.documentReferences || '—'}</div>
                {entry.measurement && (
                  <div className="font-mono font-bold pt-1">
                    {t('Latest', 'Senaste')}: {entry.measurement.latest.actual ?? '—'} / {entry.measurement.latest.target ?? '—'} {entry.measurement.unit}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const ManagementReviewPage: React.FC = () => {
  const { scope, activeRole, goals, initiatives, domainSnapshot, prepareManagementReview, navigate } = useWorkspace();
  const { t, tScope } = useLanguage();
  const summary = managementSummary(domainSnapshot);
  const canPrepare = roleCan(activeRole, 'reviewPrepare', null, { goals, initiatives });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('ISO 9.3 Management Review Input', 'ISO 9.3 Underlag för ledningens genomgång')}
        subtitle={`${t('Automated executive readiness summary for', 'Automatiserad sammanställning för')} ${tScope(scope)}. ${t(
          'Compile live performance, open blockers, and planning gaps into a PDCA Review draft.',
          'Samla måluppfyllnad, öppna hinder och planeringsluckor direkt i ett nytt PDCA-utkast.'
        )}`}
        actions={
          canPrepare && (
            <button
              type="button"
              onClick={async () => {
                const revId = await prepareManagementReview();
                if (revId) navigate('review', revId);
              }}
              className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              {t('Create PDCA Review Draft', 'Skapa PDCA-genomgångsutkast')}
            </button>
          )
        }
      />

      <ScopeBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase text-[var(--muted)]">{t('On Track Goals', 'Mål i fas')}</div>
          <div className="text-2xl font-bold tabular-nums text-emerald-600">{summary.on.length}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase text-[var(--muted)]">{t('At Risk / Off Track', 'I riskzon / Avvikelse')}</div>
          <div className="text-2xl font-bold tabular-nums text-amber-600">{summary.risk.length + summary.off.length}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase text-[var(--muted)]">{t('Escalated Blockers', 'Eskalerade hinder')}</div>
          <div className="text-2xl font-bold tabular-nums text-rose-600">{summary.blockers.length}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase text-[var(--muted)]">{t('Open PDCA Actions', 'Öppna PDCA-beslut')}</div>
          <div className="text-2xl font-bold tabular-nums">{summary.open.length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('Goals with Planning Gaps', 'Mål med planeringsluckor')} ({summary.gaps.length})</h2>
          {summary.gaps.length === 0 ? (
            <p className="text-xs text-emerald-600">{t('All visible objectives satisfy ISO Clause 6.2 planning checks.', 'Alla synliga mål uppfyller planeringskraven enligt ISO avsnitt 6.2.')}</p>
          ) : (
            <div className="space-y-2 text-xs">
              {summary.gaps.map((g) => (
                <div key={g.id} className="rounded-lg border border-[var(--border)] p-2.5 flex justify-between">
                  <span className="font-semibold">{g.id} · {g.title}</span>
                  <button type="button" onClick={() => navigate('goal', g.id)} className="text-teal-600 hover:underline cursor-pointer">
                    {t('Complete', 'Komplettera')} ↗
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('At-Risk Strategic Initiatives', 'Initiativ i riskzon')} ({summary.atRiskInits.length})</h2>
          {summary.atRiskInits.length === 0 ? (
            <p className="text-xs text-emerald-600">{t('No initiatives flagged At risk.', 'Inga initiativ är flaggade i riskzon.')}</p>
          ) : (
            <div className="space-y-2 text-xs">
              {summary.atRiskInits.map((i) => (
                <div key={i.id} className="rounded-lg border border-[var(--border)] p-2.5 flex justify-between">
                  <span className="font-semibold">{i.id} · {i.title} ({i.progress}%)</span>
                  <button type="button" onClick={() => navigate('initiative', i.id)} className="text-teal-600 hover:underline cursor-pointer">
                    {t('Inspect', 'Granska')} ↗
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
