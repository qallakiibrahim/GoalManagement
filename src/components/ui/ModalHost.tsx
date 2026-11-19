import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useLanguage } from '../../context/LanguageContext';

export const ModalHost: React.FC = () => {
  const { modal, closeModal } = useWorkspace();
  const { t } = useLanguage();
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
  const [kpiActualInput, setKpiActualInput] = useState('');
  const [kpiTargetInput, setKpiTargetInput] = useState('');
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
    setKpiActualInput(
      modal.kpiMonth?.actual !== null && modal.kpiMonth?.actual !== undefined ? String(modal.kpiMonth.actual) : ''
    );
    setKpiTargetInput(
      modal.kpiMonth?.target !== null && modal.kpiMonth?.target !== undefined ? String(modal.kpiMonth.target) : ''
    );
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
        setErrorMsg(t('Please enter a value before continuing.', 'Ange ett värde innan du fortsätter.'));
        return;
      }
      if (modal.isNumber && (!promptVal.trim() || !Number.isFinite(Number(promptVal)))) {
        setErrorMsg(t('Please enter a valid number.', 'Ange ett giltigt tal.'));
        return;
      }
      closeModal(promptVal.trim());
      return;
    }
    if (modal.type === 'counter') {
      if (!counterTarget.trim() || !Number.isFinite(Number(counterTarget))) {
        setErrorMsg(t('Enter a valid numeric target.', 'Ange ett giltigt numeriskt målvärde.'));
        return;
      }
      if (!counterReason.trim()) {
        setErrorMsg(t('Counterproposal rationale is required.', 'Motivering för motförslaget krävs.'));
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
        setErrorMsg(t('Both blocker summary and requested management decision are required.', 'Både sammanfattning av hindret och önskat ledningsbeslut krävs.'));
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
        setErrorMsg(t('Decision text, accountable owner, and due date are required.', 'Beslutstext, ansvarig och slutdatum krävs.'));
        return;
      }
      closeModal({
        reviewId: pdcaReviewId,
        text: pdcaText.trim(),
        owner: pdcaOwner.trim(),
        due: pdcaDue.trim(),
      });
      return;
    }
    if (modal.type === 'kpiMonth') {
      const aTrim = kpiActualInput.trim();
      const tTrim = kpiTargetInput.trim();
      if (aTrim !== '' && !Number.isFinite(Number(aTrim))) {
        setErrorMsg(t('Actual must be a valid number or left blank.', 'Utfall måste vara ett giltigt tal eller lämnas tomt.'));
        return;
      }
      if (tTrim !== '' && !Number.isFinite(Number(tTrim))) {
        setErrorMsg(t('Target must be a valid number or left blank.', 'Målvärde måste vara ett giltigt tal eller lämnas tomt.'));
        return;
      }
      closeModal({
        actual: aTrim === '' ? null : Number(aTrim),
        target: tTrim === '' ? null : Number(tTrim),
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
            <ul className="space-y-1.5 rounded-lg border border-rose-600/20 bg-rose-500/10 p-3 text-xs text-rose-800 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200 list-disc pl-6">
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
                placeholder={modal.placeholder || t('Enter value...', 'Ange värde...')}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
              />
            </div>
          )}

          {modal.type === 'counter' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('Proposed Target', 'Föreslaget målvärde')}
                </label>
                <input
                  autoFocus
                  type="number"
                  step="any"
                  value={counterTarget}
                  onChange={(e) => setCounterTarget(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('Resources Required', 'Resursbehov')}
                </label>
                <input
                  type="text"
                  value={counterResources}
                  onChange={(e) => setCounterResources(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('Rationale (required)', 'Motivering (obligatorisk)')}
                </label>
                <textarea
                  rows={3}
                  value={counterReason}
                  onChange={(e) => setCounterReason(e.target.value)}
                  placeholder={t('Explain trade-offs, capacity, or target assumptions...', 'Förklara avvägningar, kapacitet eller antaganden...')}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
                />
              </div>
            </div>
          )}

          {modal.type === 'escalate' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    {t('Category', 'Kategori')}
                  </label>
                  <select
                    value={escCategory}
                    onChange={(e) => setEscCategory(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  >
                    <option value="Resource">{t('Resource', 'Resurs')}</option>
                    <option value="Budget">{t('Budget', 'Budget')}</option>
                    <option value="Technical">{t('Technical', 'Teknisk')}</option>
                    <option value="Cross-functional">{t('Cross-functional', 'Tvärfunktionell')}</option>
                    <option value="Safety">{t('Safety', 'Säkerhet')}</option>
                    <option value="Supplier">{t('Supplier', 'Leverantör')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    {t('Severity', 'Allvarlighetsgrad')}
                  </label>
                  <select
                    value={escSeverity}
                    onChange={(e) => setEscSeverity(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  >
                    <option value="Critical">{t('Critical', 'Kritisk')}</option>
                    <option value="High">{t('High', 'Hög')}</option>
                    <option value="Medium">{t('Medium', 'Medel')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('What is blocked? (required)', 'Vad är blockerat? (obligatoriskt)')}
                </label>
                <textarea
                  autoFocus
                  rows={2}
                  value={escSummary}
                  onChange={(e) => setEscSummary(e.target.value)}
                  placeholder={t('Describe the operational obstacle or deviation...', 'Beskriv hindret eller avvikelsen...')}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('Decision / Support Needed (required)', 'Beslut / stöd som krävs (obligatoriskt)')}
                </label>
                <textarea
                  rows={2}
                  value={escNeededAction}
                  onChange={(e) => setEscNeededAction(e.target.value)}
                  placeholder={t('Specify the decision, funding, or cross-functional escalation needed...', 'Specificera beslut, budget eller tvärfunktionellt stöd...')}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
            </div>
          )}

          {modal.type === 'pdcaDecision' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('Target PDCA Review', 'PDCA-genomgång')}
                </label>
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
                  <option value="__new__">{t('+ Create new PDCA Review for this decision', '+ Skapa ny PDCA-genomgång för detta beslut')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                  {t('PDCA Decision / Action', 'PDCA-beslut / Åtgärd')}
                </label>
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
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    {t('Accountable Owner', 'Ansvarig')}
                  </label>
                  <input
                    type="text"
                    value={pdcaOwner}
                    onChange={(e) => setPdcaOwner(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    {t('Due Date', 'Slutdatum')}
                  </label>
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

          {modal.type === 'kpiMonth' && modal.kpiMonth && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    {t('Actual', 'Utfall')} ({modal.kpiMonth.unit || t('value', 'värde')})
                  </label>
                  <input
                    autoFocus
                    type="number"
                    step="any"
                    value={kpiActualInput}
                    onChange={(e) => setKpiActualInput(e.target.value)}
                    placeholder={t('Leave blank to clear', 'Lämna tomt för att rensa')}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm font-mono tabular-nums text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    {t('Target', 'Målvärde')} ({modal.kpiMonth.unit || t('value', 'värde')})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={kpiTargetInput}
                    onChange={(e) => setKpiTargetInput(e.target.value)}
                    placeholder={t('Leave blank to clear', 'Lämna tomt för att rensa')}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm font-mono tabular-nums text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:border-teal-700 dark:focus:ring-teal-400/25 dark:focus:border-teal-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                <span>{t('Leave Actual blank if this month is not yet reported.', 'Lämna utfall tomt om månaden inte rapporterats ännu.')}</span>
                <button
                  type="button"
                  onClick={() => closeModal({ actual: null, target: null })}
                  className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {t('Clear month', 'Rensa månad')}
                </button>
              </div>
            </div>
          )}

          {errorMsg && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            {modal.type !== 'alert' && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              >
                {t('Cancel', 'Avbryt')}
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
            >
              {modal.type === 'alert'
                ? 'OK'
                : modal.type === 'confirm'
                  ? t('Confirm', 'Bekräfta')
                  : modal.type === 'kpiMonth'
                    ? t('Save Month', 'Spara månad')
                    : t('Save & Continue', 'Spara & fortsätt')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
