import React, { useState } from 'react';
import { CheckCircle2, MessageSquareMore, Plus, RefreshCw, Send } from 'lucide-react';
import { ASSIGNED_DEPARTMENT } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  cbCanAct,
  cbCanRead,
  cbTurn,
  goalById,
  isoShort,
  pdcaExceptionQueue,
  roleCan,
  roleVisibleGoals,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerBox } from '../ui/BlockerPanel';

export const CatchballListPage: React.FC = () => {
  const { catchballs, goals, activeRole, navigate } = useWorkspace();
  const visible = catchballs.filter((c) => cbCanRead(c, goals, activeRole));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Catchball Bidirectional Alignment"
        subtitle="Negotiate realistic KPI targets and departmental resources between Leadership and Department Directors prior to formal approval."
        actions={
          roleCan(activeRole, 'goalEdit', { level: ASSIGNED_DEPARTMENT }, { goals, initiatives: [] }) && (
            <button
              type="button"
              onClick={() => navigate('catchballnew')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Catchball Thread
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((c) => {
          const g = goalById(goals, c.goal);
          const turn = cbTurn(c);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate('catchballitem', c.id)}
              className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-teal-500 transition-colors space-y-2.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--muted)]">
                  {c.id} · {c.goal}
                </span>
                <StatusBadge label={c.status} />
              </div>
              <div className="text-sm font-bold text-[var(--ink)]">{g?.title || c.goal}</div>
              <div className="text-xs text-[var(--muted)]">
                Proposed target: <strong className="font-mono text-[var(--ink)]">{c.proposal.target} {g?.unit || ''}</strong> · {c.recipientScope || 'Department'}
              </div>
              <div className="text-[11px] text-[var(--muted)] pt-2 border-t border-[var(--border)] flex items-center justify-between">
                <span>{turn ? `Awaiting: ${turn}` : 'Completed'}</span>
                <span>{c.messages.length} messages</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const CatchballCreatePage: React.FC = () => {
  const { scope, goals, initiatives, activeRole, createCatchball, navigate } = useWorkspace();
  const candidates = roleVisibleGoals(goals, scope, activeRole).filter((g) =>
    roleCan(activeRole, 'goalEdit', g, { goals, initiatives })
  );

  const [goalId, setGoalId] = useState(candidates[0]?.id || '');
  const [target, setTarget] = useState(String(candidates[0]?.target ?? 0));
  const [resources, setResources] = useState(candidates[0]?.resources || '');
  const [due, setDue] = useState(candidates[0]?.planDue || '2027-12-31');
  const [recipientScope, setRecipientScope] = useState(ASSIGNED_DEPARTMENT);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId || !reason.trim()) return;
    const id = await createCatchball({
      goalId,
      target: Number(target),
      resources,
      due,
      reason,
      recipientScope,
    });
    if (id) navigate('catchballitem', id);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="New Catchball Thread" subtitle="Initiate target and resource negotiation for a deployed objective." />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Strategic Goal</label>
            <select
              value={goalId}
              onChange={(e) => {
                setGoalId(e.target.value);
                const found = goalById(goals, e.target.value);
                if (found) {
                  setTarget(String(found.target ?? 0));
                  setResources(found.resources || '');
                }
              }}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
            >
              {candidates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.id} · {g.title} ({g.level})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Proposed Target</label>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Due Date</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Recipient Department</label>
            <input
              type="text"
              value={recipientScope}
              onChange={(e) => setRecipientScope(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Resource Allocation Proposal</label>
            <input
              type="text"
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Opening Proposal Rationale</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('catchball')} className="rounded-lg border border-[var(--border-strong)] px-3.5 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 cursor-pointer">
              Create Catchball Draft
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const CatchballDetailPage: React.FC = () => {
  const {
    routeId,
    catchballs,
    goals,
    initiatives,
    activeRole,
    commentCatchball,
    sendCatchball,
    counterCatchball,
    alignCatchball,
    requestChangesCatchball,
    submitCatchballForApproval,
    navigate,
  } = useWorkspace();

  const [comment, setComment] = useState('');
  const c = catchballs.find((x) => x.id === routeId);
  const g = c ? goalById(goals, c.goal) : undefined;

  if (!c) {
    return (
      <Card className="p-6 text-xs text-[var(--muted)]">
        Catchball thread not found.{' '}
        <button type="button" onClick={() => navigate('catchball')} className="text-teal-600 underline cursor-pointer">
          Back to Catchball
        </button>
      </Card>
    );
  }

  const canSend = cbCanAct(c, 'send', activeRole, goals, initiatives);
  const canCounter = cbCanAct(c, 'counter', activeRole, goals, initiatives);
  const canAlign = cbCanAct(c, 'align', activeRole, goals, initiatives);
  const canChanges = cbCanAct(c, 'changes', activeRole, goals, initiatives);
  const canApproval = cbCanAct(c, 'approval', activeRole, goals, initiatives);
  const canComment = cbCanAct(c, 'comment', activeRole, goals, initiatives);

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title={`${c.id} · ${g?.title || c.goal}`}
        subtitle={`Origin: ${c.origin} · Recipient: ${c.recipientScope || 'Department'} · Turn: ${cbTurn(c) || 'Completed'}`}
        actions={<StatusBadge label={c.status} />}
      />

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-[var(--surface-subtle)]/60 p-4 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Proposed Target</div>
            <div className="text-base font-bold font-mono tabular-nums mt-0.5">
              {c.proposal.target} {g?.unit || ''}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Current Approved Goal</div>
            <div className="text-base font-bold font-mono tabular-nums mt-0.5">
              {g?.target ?? '—'} {g?.unit || ''}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Agreed Resources</div>
            <div className="font-semibold text-[var(--ink)] mt-0.5">{c.proposal.resources || '—'}</div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap gap-2">
          {canSend && (
            <button
              type="button"
              onClick={() => sendCatchball(c.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send Proposal
            </button>
          )}
          {canAlign && (
            <button
              type="button"
              onClick={() => alignCatchball(c.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Agree &amp; Align
            </button>
          )}
          {canCounter && (
            <button
              type="button"
              onClick={() => counterCatchball(c.id)}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              Send Counterproposal
            </button>
          )}
          {canChanges && (
            <button
              type="button"
              onClick={() => requestChangesCatchball(c.id)}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
            >
              Request Changes
            </button>
          )}
          {canApproval && (
            <button
              type="button"
              onClick={() => submitCatchballForApproval(c.id)}
              className="rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 cursor-pointer"
            >
              Submit for Formal Approval
            </button>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <MessageSquareMore className="w-4 h-4 text-teal-600" />
          <span>Negotiation Timeline ({c.messages.length})</span>
        </div>

        <div className="space-y-2.5">
          {c.messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 text-xs space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--ink)]">{m.by}</span>
                  <StatusBadge label={m.kind} />
                </div>
                <span className="font-mono text-[11px] text-[var(--muted)]">{m.at}</span>
              </div>
              <p className="text-[var(--ink)]">{m.text}</p>
              {m.target !== null && m.target !== undefined && (
                <div className="text-[11px] font-mono text-[var(--muted)]">
                  Target: {m.target} {g?.unit || ''} {m.resources ? `· Resources: ${m.resources}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {canComment && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              await commentCatchball(c.id, comment);
              setComment('');
            }}
            className="flex gap-2 pt-2 border-t border-[var(--border)]"
          >
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add Catchball discussion note..."
              className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              Comment
            </button>
          </form>
        )}
      </Card>
    </div>
  );
};

export const ReviewsPage: React.FC = () => {
  const { scope, reviews, blockers, domainSnapshot, activeRole, goals, initiatives, navigate } = useWorkspace();
  const [filter, setFilter] = useState<'active' | 'manual' | 'auto' | 'resolved'>('active');

  const activeQueue = pdcaExceptionQueue(domainSnapshot, scope, true);
  const manualOpen = activeQueue.filter((b) => !b.isAuto);
  const autoOpen = activeQueue.filter((b) => b.isAuto);
  const resolved = blockers.filter((b) => b.status === 'Resolved');
  const shownList = filter === 'active' ? activeQueue : filter === 'manual' ? manualOpen : filter === 'auto' ? autoOpen : resolved;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="PDCA Reviews &amp; Management by Exception"
        subtitle="Track escalated blockers, red KPI auto-signals, and formal PDCA review decisions."
        actions={
          roleCan(activeRole, 'reviewWrite', null, { goals, initiatives }) && (
            <button
              type="button"
              onClick={() => navigate('newreview')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New PDCA Review
            </button>
          )
        }
      />

      <ScopeBar />

      {/* Exception Queue */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--ink)]">Exception Queue ({scope})</h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'active', label: `Active (${activeQueue.length})` },
                { id: 'manual', label: `Manual Blockers (${manualOpen.length})` },
                { id: 'auto', label: `KPI/Init Signals (${autoOpen.length})` },
                { id: 'resolved', label: `Resolved (${resolved.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  filter === f.id
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {shownList.length === 0 ? (
          <Card className="p-5 text-xs text-[var(--muted)]">No exceptions in this view.</Card>
        ) : (
          <div className="space-y-3">
            {shownList.map((b) => (
              <BlockerBox key={b.id} blocker={b} />
            ))}
          </div>
        )}
      </div>

      {/* Review Meetings */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--ink)]">PDCA Review Records ({reviews.length})</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {reviews.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate('review', r.id)}
              className="w-full text-left px-5 py-3.5 hover:bg-[var(--surface-subtle)]/50 flex flex-wrap items-center justify-between gap-3 cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-[var(--ink)]">
                  <span className="font-mono text-[var(--muted)] mr-2">{r.id}</span>
                  {r.title}
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  {r.scope} · {r.date}
                </div>
              </div>
              <div className="text-xs font-mono">
                <span className="font-bold">{r.decisions.filter((d) => d.status === 'Open').length} open</span> /{' '}
                {r.decisions.length} decisions
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export const NewReviewPage: React.FC = () => {
  const { scope, createReview, navigate } = useWorkspace();
  const [title, setTitle] = useState(`PDCA Strategy Review · ${scope}`);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [revScope, setRevScope] = useState(scope);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const id = await createReview({ title, date, scope: revScope, notes });
    if (id) navigate('review', id);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="New PDCA Review" subtitle="Record management strategy review notes and tracked corrective decisions." />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Review Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2" />
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Scope</label>
              <input type="text" value={revScope} onChange={(e) => setRevScope(e.target.value)} className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Meeting Notes</label>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('reviews')} className="rounded-lg border border-[var(--border-strong)] px-3.5 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 cursor-pointer">
              Create Review
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const ReviewDetailPage: React.FC = () => {
  const { routeId, reviews, activeRole, goals, initiatives, toggleDecision, addDecision, navigate } = useWorkspace();
  const rev = reviews.find((r) => r.id === routeId);
  const [text, setText] = useState('');
  const [owner, setOwner] = useState('Production Manager');
  const [due, setDue] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  if (!rev) {
    return (
      <Card className="p-6 text-xs text-[var(--muted)]">
        PDCA Review not found.{' '}
        <button type="button" onClick={() => navigate('reviews')} className="text-teal-600 underline cursor-pointer">
          Back to Reviews
        </button>
      </Card>
    );
  }

  const canWrite = roleCan(activeRole, 'reviewWrite', null, { goals, initiatives });

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionHeader
        title={`${rev.id} · ${rev.title}`}
        subtitle={`${rev.scope} · Date ${rev.date}${rev.source ? ` · Source: ${rev.source}` : ''}`}
      />

      <Card className="p-5 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Review Summary Notes</div>
        <pre className="whitespace-pre-wrap font-sans text-xs text-[var(--ink)]">{rev.notes || 'No notes recorded.'}</pre>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <RefreshCw className="w-4 h-4 text-teal-600" />
          <span>PDCA Decisions &amp; Carry-Forward Actions ({rev.decisions.length})</span>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Completing a decision linked to an escalated blocker automatically resolves the blocker and closes its Daily Board Kanban card.
        </p>

        <div className="space-y-2">
          {rev.decisions.map((d, idx) => (
            <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--ink)]">{d.text}</div>
                <div className="text-[11px] text-[var(--muted)]">
                  Owner: {d.owner} · Due {d.due}
                  {d.blockerId ? ` · Linked Blocker ${d.blockerId}` : ''}
                </div>
              </div>
              <button
                type="button"
                disabled={!canWrite}
                onClick={() => toggleDecision(rev.id, idx)}
                className="cursor-pointer shrink-0"
              >
                <StatusBadge label={d.status} />
              </button>
            </div>
          ))}
        </div>

        {canWrite && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!text.trim()) return;
              await addDecision(rev.id, { text: text.trim(), owner: owner.trim(), due });
              setText('');
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-[var(--border)] text-xs"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="New PDCA management decision..."
              className="sm:col-span-6 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
            />
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner"
              className="sm:col-span-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-2"
            />
            <button type="submit" className="sm:col-span-1 rounded-lg bg-teal-600 px-3 py-2 font-semibold text-white hover:bg-teal-700 cursor-pointer">
              Add
            </button>
          </form>
        )}
      </Card>
    </div>
  );
};

export const ApprovalsPage: React.FC = () => {
  const {
    approvals,
    plans,
    goals,
    initiatives,
    activities,
    isoStandards,
    activeRole,
    decideApproval,
    revisePlan,
    navigate,
  } = useWorkspace();

  const canApprove = roleCan(activeRole, 'approve', null, { goals, initiatives });
  const canConfig = roleCan(activeRole, 'config', null, { goals, initiatives });
  const pending = approvals.filter((a) => a.status === 'Pending');
  const history = activities.filter((a) => a.kind === 'history');
  const revisions = activities.filter((a) => a.kind === 'goalRevision');

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Formal Approvals, Revisions &amp; Audit Trail"
        subtitle="ISO 9001/14001/45001 governance gate for strategic goals, strategy plans, and archived approved snapshots."
      />

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-[var(--ink)]">Pending Approval Queue ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No pending goal approvals.</p>
        ) : (
          <div className="space-y-2.5">
            {pending.map((a) => {
              const g = goalById(goals, a.goal);
              return (
                <div key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--muted)]">{a.id}</span>
                      <StatusBadge label={a.status} />
                      {a.catchballId && <StatusBadge label={`Catchball ${a.catchballId}`} tone="teal" />}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('goal', a.goal)}
                      className="mt-1 text-sm font-bold text-[var(--ink)] hover:underline text-left cursor-pointer"
                    >
                      {a.goal} · {g?.title}
                    </button>
                    <div className="text-[11px] text-[var(--muted)]">
                      Requester: {a.requester} · {a.date} · {isoShort(isoStandards, g)}
                    </div>
                    {a.comment && <div className="text-[var(--muted)] mt-1">{a.comment}</div>}
                  </div>
                  {canApprove && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => decideApproval(a.id, 'Approved')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => decideApproval(a.id, 'Changes requested')}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
                      >
                        Request Changes
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Strategy Plans */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-[var(--ink)]">Strategy Plans &amp; Revisions ({plans.length})</h2>
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="rounded-lg border border-[var(--border)] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-bold text-[var(--ink)]">
                  <span className="font-mono text-[var(--muted)] mr-1.5">{p.id}</span>
                  {p.name}
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  {p.scope} · {p.period} · Rev v{p.revision} · <StatusBadge label={p.status} />
                </div>
              </div>
              {(canApprove || canConfig) && (
                <button
                  type="button"
                  onClick={() => revisePlan(p.id)}
                  className="rounded-lg border border-[var(--border-strong)] px-3 py-1 font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                >
                  Create Revision
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Audit Log & Archived Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Governance Audit Trail ({history.length})</h2>
          <div className="space-y-1.5 max-h-60 overflow-y-auto text-xs">
            {history.slice().reverse().map((h) => (
              <div key={h.id} className="border-b border-[var(--border)] pb-1.5 last:border-0">
                <span className="font-mono text-[var(--muted)] mr-2">{String(h.payload?.time)}</span>
                <span className="text-[var(--ink)]">{String(h.payload?.text)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Archived Approved Goal Revisions ({revisions.length})</h2>
          {revisions.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Approved goal baselines archive automatically upon revision.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {revisions.slice().reverse().map((r) => (
                <div key={r.id} className="rounded-lg border border-[var(--border)] p-2.5">
                  <div className="font-semibold">
                    {String(r.payload?.goalId)} v{String(r.payload?.revision)} · Archived {String(r.payload?.at)}
                  </div>
                  {r.payload?.reason && <div className="text-[var(--muted)]">{String(r.payload.reason)}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
