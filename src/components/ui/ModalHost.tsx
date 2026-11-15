import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const ModalHost: React.FC = () => {
  const { modal, closeModal } = useWorkspace();
  const [promptVal, setPromptVal] = useState('');
  const [counterTarget, setCounterTarget] = useState('');
  const [counterResources, setCounterResources] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [escCategory, setEscCategory] = useState('Resource');
  const [escSeverity, setEscSeverity] = useState('High');
  const [escSummary, setEscSummary] = useState('');
  const [escNeededAction, setEscNeededAction] = useState('');
  const [pdcaReviewId, setPdcaReviewId] = useState('__new__');
  const [pdcaText, setPdcaText] = useState('');
  const [pdcaOwner, setPdcaOwner] = useState('');
  const [pdcaDue, setPdcaDue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!modal.isOpen) return;
    setErrorMsg('');
    setPromptVal(modal.defaultValue ?? '');
    setCounterTarget(modal.counterTarget !== undefined ? String(modal.counterTarget) : '');
    setCounterResources(modal.counterResources ?? '');
    setCounterReason('');
    setEscCategory(modal.defaultCategory || 'Resource');
    setEscSeverity(modal.defaultSeverity || 'High');
    setEscSummary('');
    setEscNeededAction('');
    setPdcaReviewId(modal.defaultReviewId || '__new__');
    setPdcaText(modal.defaultValue || '');
    setPdcaOwner(modal.defaultOwner || '');
    setPdcaDue(modal.defaultDue || '');
  }, [modal]);

  useEffect(() => {
    if (!modal.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal(modal.type === 'confirm' ? false : null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.isOpen, modal.type, closeModal]);

  if (!modal.isOpen) return null;

  const cancel = () => closeModal(modal.type === 'confirm' ? false : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (modal.type === 'alert') {
      closeModal(true);
      return;
    }
    if (modal.type === 'confirm') {
      closeModal(true);
      return;
    }
    if (modal.type === 'prompt') {
      if (modal.required && !promptVal.trim()) {
        setErrorMsg('Please enter a value before continuing.');
        return;
      }
      if (modal.isNumber && (!promptVal.trim() || !Number.isFinite(Number(promptVal)))) {
        setErrorMsg('Please enter a valid number.');
        return;
      }
      closeModal(promptVal.trim());
      return;
    }
    if (modal.type === 'counter') {
      if (!counterTarget.trim() || !Number.isFinite(Number(counterTarget))) {
        setErrorMsg('Enter a valid numeric target.');
        return;
      }
      if (!counterReason.trim()) {
        setErrorMsg('Counterproposal rationale is required.');
        return;
      }
      closeModal({
        target: Number(counterTarget),
        resources: counterResources.trim(),
        reason: counterReason.trim(),
      });
      return;
    }
    if (modal.type === 'escalate') {
      if (!escSummary.trim() || !escNeededAction.trim()) {
        setErrorMsg('Both blocker summary and requested management decision are required.');
        return;
      }
      closeModal({
        category: escCategory,
        severity: escSeverity,
        summary: escSummary.trim(),
        neededAction: escNeededAction.trim(),
      });
      return;
    }
    if (modal.type === 'pdcaDecision') {
      if (!pdcaText.trim() || !pdcaOwner.trim() || !pdcaDue.trim()) {
        setErrorMsg('Decision text, accountable owner, and due date are required.');
        return;
      }
      closeModal({
        reviewId: pdcaReviewId,
        text: pdcaText.trim(),
        owner: pdcaOwner.trim(),
        due: pdcaDue.trim(),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px] no-print"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">{modal.title}</h2>
            {modal.message && <p className="mt-1 text-xs text-[var(--muted)]">{modal.message}</p>}
          </div>
          <button
            type="button"
            onClick={cancel}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {modal.itemLabel && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-medium text-[var(--ink)]">
              {modal.itemLabel}
            </div>
          )}

          {modal.items && modal.items.length > 0 && (
            <ul className="space-y-1.5 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 list-disc pl-6">
              {modal.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}

          {modal.type === 'prompt' && (
            <div>
              <input
                autoFocus
                type={modal.isNumber ? 'number' : 'text'}
                step="any"
                value={promptVal}
                onChange={(e) => setPromptVal(e.target.value)}
                placeholder={modal.placeholder || 'Enter value...'}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {modal.type === 'counter' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Proposed Target</label>
                <input
                  autoFocus
                  type="number"
                  step="any"
                  value={counterTarget}
                  onChange={(e) => setCounterTarget(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Resources Required</label>
                <input
                  type="text"
                  value={counterResources}
                  onChange={(e) => setCounterResources(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Rationale (required)</label>
                <textarea
                  rows={3}
                  value={counterReason}
                  onChange={(e) => setCounterReason(e.target.value)}
                  placeholder="Explain trade-offs, capacity, or target assumptions..."
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {modal.type === 'escalate' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Category</label>
                  <select
                    value={escCategory}
                    onChange={(e) => setEscCategory(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  >
                    <option value="Resource">Resource</option>
                    <option value="Budget">Budget</option>
                    <option value="Technical">Technical</option>
                    <option value="Cross-functional">Cross-functional</option>
                    <option value="Safety">Safety</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Severity</label>
                  <select
                    value={escSeverity}
                    onChange={(e) => setEscSeverity(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">What is blocked? (required)</label>
                <textarea
                  autoFocus
                  rows={2}
                  value={escSummary}
                  onChange={(e) => setEscSummary(e.target.value)}
                  placeholder="Describe the operational obstacle or deviation..."
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Decision / Support Needed (required)</label>
                <textarea
                  rows={2}
                  value={escNeededAction}
                  onChange={(e) => setEscNeededAction(e.target.value)}
                  placeholder="Specify the decision, funding, or cross-functional escalation needed..."
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
            </div>
          )}

          {modal.type === 'pdcaDecision' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Target PDCA Review</label>
                <select
                  value={pdcaReviewId}
                  onChange={(e) => setPdcaReviewId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                >
                  {(modal.reviewsList || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                  <option value="__new__">+ Create new PDCA Review for this decision</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">PDCA Decision / Action</label>
                <textarea
                  autoFocus
                  rows={2}
                  value={pdcaText}
                  onChange={(e) => setPdcaText(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Accountable Owner</label>
                  <input
                    type="text"
                    value={pdcaOwner}
                    onChange={(e) => setPdcaOwner(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={pdcaDue}
                    onChange={(e) => setPdcaDue(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  />
                </div>
              </div>
            </div>
          )}

          {errorMsg && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            {modal.type !== 'alert' && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              {modal.type === 'alert' ? 'OK' : modal.type === 'confirm' ? 'Confirm' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
