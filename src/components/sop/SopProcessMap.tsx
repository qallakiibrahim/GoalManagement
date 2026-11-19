import React from 'react';
import { ArrowDown, ArrowRight, RefreshCw } from 'lucide-react';

interface MapNode {
  label: string;
  sub: string;
  chapterId: number;
}

interface ProcessLevel {
  level: string;
  title: string;
  cadence: string;
  accentClass: string;
  nodes: MapNode[];
}

const PROCESS_LEVELS: ProcessLevel[] = [
  {
    level: 'NIVÅ 1',
    title: 'Strategisk styrning',
    cadence: 'Årsvis & 3–5 år',
    accentClass: 'text-teal-700 dark:text-teal-300',
    nodes: [
      { label: 'Organization Strategy', sub: '3–5 års riktning', chapterId: 2 },
      { label: 'Strategic Goals', sub: 'Genombrottspelare', chapterId: 2 },
      { label: 'Annual Site Goals', sub: 'Fabriksmål', chapterId: 3 },
      { label: 'Department Goals', sub: 'Avdelningsmål', chapterId: 3 },
      { label: 'X-Matrix Alignment', sub: '360°-koppling', chapterId: 4 },
      { label: 'Catchball Negotiation', sub: 'Tvåvägsdialog', chapterId: 5 },
      { label: 'Formal Approval', sub: 'Godkänd rev v1', chapterId: 5 },
    ],
  },
  {
    level: 'NIVÅ 2',
    title: 'Taktiskt genomförande',
    cadence: 'Kvartal / projekt',
    accentClass: 'text-sky-700 dark:text-sky-300',
    nodes: [
      { label: 'Approved Goals', sub: 'Styrande mål', chapterId: 5 },
      { label: 'Initiatives & Projects', sub: 'SQDC & TOC', chapterId: 6 },
      { label: 'Project A3', sub: 'Problemlösning', chapterId: 6 },
      { label: 'Root Cause / 5-Why', sub: 'Grundorsak', chapterId: 6 },
      { label: 'Action Plans & Tasks', sub: 'Ägare & datum', chapterId: 6 },
    ],
  },
  {
    level: 'NIVÅ 3',
    title: 'Daglig styrning',
    cadence: 'Dagligen / veckovis (parallellt)',
    accentClass: 'text-emerald-700 dark:text-emerald-300',
    nodes: [
      { label: 'Daily Board Tier 1–3', sub: 'Pulsmöten', chapterId: 7 },
      { label: 'Safety Cross / SQDC / Kanban', sub: 'Visuell styrning', chapterId: 7 },
      { label: 'Daily Performance Review', sub: 'Live KPI-koll', chapterId: 7 },
      { label: 'Escalation of Problems', sub: 'Tier 1 → 2 → 3', chapterId: 7 },
      { label: 'My Focus / Obeya', sub: 'Egna åtgärder', chapterId: 7 },
    ],
  },
  {
    level: 'NIVÅ 4',
    title: 'Prestanda & ständig förbättring',
    cadence: 'Månadsvis & revision (återkopplar)',
    accentClass: 'text-amber-700 dark:text-amber-300',
    nodes: [
      { label: 'KPI Actuals', sub: 'Manuellt / CSV', chapterId: 8 },
      { label: 'Bowling Chart', sub: '12-mån utfall', chapterId: 8 },
      { label: 'Performance Gap Analysis', sub: 'On/At/Off track', chapterId: 8 },
      { label: 'PDCA Review', sub: 'Plan-Do-Check-Act', chapterId: 9 },
      { label: 'Corrective Actions', sub: 'Beslut & ägare', chapterId: 9 },
      { label: 'Management Review', sub: 'ISO 9.3 & bevis', chapterId: 10 },
      { label: 'Revised Plans & CI', sub: 'Ny cykel', chapterId: 10 },
    ],
  },
];

interface SopProcessMapProps {
  activeChapterId: number;
  completedChapters: number[];
  onSelectChapter: (chapterId: number) => void;
}

export const SopProcessMap: React.FC<SopProcessMapProps> = ({
  activeChapterId,
  completedChapters,
  onSelectChapter,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-bold tracking-tight text-[var(--ink)]">
            Interaktiv End-to-End processkarta (Nivå 1–4)
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Klicka på valfritt steg för att öppna tillhörande utbildningskapitel. Flera operativa steg pågår parallellt och iterativt med återkoppling uppåt.
          </p>
        </div>
        <div className="text-[11px] text-[var(--muted)] no-print">
          Grön bock = slutfört kapitel · Salvia ram = aktivt kapitel
        </div>
      </div>

      <div className="space-y-3">
        {PROCESS_LEVELS.map((lvl, lvlIdx) => (
          <React.Fragment key={lvl.level}>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-2">
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-[11px] font-bold tracking-wider ${lvl.accentClass}`}>
                    {lvl.level}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--ink)]">{lvl.title}</h3>
                </div>
                <span className="text-[11px] text-[var(--muted)]">{lvl.cadence}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {lvl.nodes.map((node, nodeIdx) => {
                  const isActive = activeChapterId === node.chapterId;
                  const isDone = completedChapters.includes(node.chapterId);
                  return (
                    <React.Fragment key={`${lvl.level}-${node.label}`}>
                      <button
                        type="button"
                        onClick={() => onSelectChapter(node.chapterId)}
                        className={`group rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer min-w-[138px] ${
                          isActive
                            ? 'border-teal-700 bg-teal-600/12 ring-1 ring-teal-700/20 dark:border-teal-400 dark:bg-teal-400/12'
                            : isDone
                              ? 'border-emerald-600/30 bg-emerald-500/6 hover:border-emerald-600/60 dark:border-emerald-400/25'
                              : 'border-[var(--border-strong)] bg-[var(--bg)] hover:border-teal-600/50 hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[var(--muted)]">
                          <span>Kap {node.chapterId}</span>
                          {isDone && (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[var(--ink)] leading-snug mt-0.5">
                          {node.label}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] leading-tight mt-0.5">
                          {node.sub}
                        </div>
                      </button>

                      {nodeIdx < lvl.nodes.length - 1 && (
                        <ArrowRight
                          className="w-3.5 h-3.5 text-[var(--muted)] shrink-0 hidden sm:block"
                          aria-hidden="true"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {lvlIdx < PROCESS_LEVELS.length - 1 && (
              <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--muted)]">
                <ArrowDown className="w-4 h-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <span>
                  {lvlIdx === 0 && 'Godkända mål bryts ner till initiativ och förbättringsprojekt'}
                  {lvlIdx === 1 && 'Projektuppgifter och standarder drivs i den dagliga pulsen'}
                  {lvlIdx === 2 && 'Dagliga avvikelser & månatliga KPI-utfall följs upp i Bowling Chart och PDCA'}
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Explicit Feedback Loops Banner */}
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-subtle)]/70 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
          <RefreshCw className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
          <span>Återkopplingsloopar (Ständiga förbättringar &amp; parallellt arbete)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => onSelectChapter(6)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:border-teal-600/40 transition-colors cursor-pointer"
          >
            <div className="font-bold text-[var(--ink)]">Daglig styrning → Taktisk A3</div>
            <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
              Upprepade problem i Daily Board Tier 1–3 eskaleras till nya Project A3 / 5-Why och korrigerande initiativ.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelectChapter(9)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:border-teal-600/40 transition-colors cursor-pointer"
          >
            <div className="font-bold text-[var(--ink)]">KPI-gap &amp; PDCA → Omprioritering</div>
            <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
              Röda KPI-utfall i Bowling Chart triggar PDCA Reviews som ändrar motåtgärder, resurser och projektprioritet.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelectChapter(2)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:border-teal-600/40 transition-colors cursor-pointer"
          >
            <div className="font-bold text-[var(--ink)]">Management Review → Reviderad Strategi</div>
            <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
              Ledningens genomgång (ISO 9.3) väger samman resultat, risker och möjligheter och matar tillbaka nya mål till Nivå 1.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
