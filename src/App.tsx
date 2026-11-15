/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

// Custom modal state types
interface ModalConfig {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt' | 'counter' | 'escalate' | 'pdcaDecision';
  title: string;
  message: string;
  items?: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  isNumber?: boolean;
  // Multi-field counter
  counterTarget?: number;
  counterResources?: string;
  // Multi-field escalate blocker
  itemLabel?: string;
  defaultCategory?: string;
  defaultSeverity?: string;
  // Multi-field PDCA decision
  reviewsList?: { id: string; label: string }[];
  defaultReviewId?: string;
  defaultOwner?: string;
  defaultDue?: string;
  resolve?: (value: any) => void;
}

export default function App() {
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });
  const [inputValue, setInputValue] = useState('');
  const [counterTarget, setCounterTarget] = useState<number>(0);
  const [counterResources, setCounterResources] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [escCategory, setEscCategory] = useState('Resource');
  const [escSeverity, setEscSeverity] = useState('High');
  const [escSummary, setEscSummary] = useState('');
  const [escNeeded, setEscNeeded] = useState('');
  const [pdcaReviewId, setPdcaReviewId] = useState('__new__');
  const [pdcaText, setPdcaText] = useState('');
  const [pdcaOwner, setPdcaOwner] = useState('');
  const [pdcaDue, setPdcaDue] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('safeqms_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const initialized = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('safeqms_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // Helper for async custom modal dialogs
  const showModal = (config: Omit<ModalConfig, 'isOpen' | 'resolve'>): Promise<any> => {
    return new Promise((resolve) => {
      setInputValue(config.defaultValue || '');
      if (config.type === 'counter') {
        setCounterTarget(config.counterTarget || 0);
        setCounterResources(config.counterResources || '');
        setCounterReason('');
      }
      if (config.type === 'escalate') {
        setEscCategory(config.defaultCategory || 'Resource');
        setEscSeverity(config.defaultSeverity || 'High');
        setEscSummary('');
        setEscNeeded('');
      }
      if (config.type === 'pdcaDecision') {
        setPdcaReviewId(config.defaultReviewId || config.reviewsList?.[0]?.id || '__new__');
        setPdcaText(config.defaultValue || '');
        setPdcaOwner(config.defaultOwner || '');
        setPdcaDue(config.defaultDue || '');
      }
      setModal({
        ...config,
        isOpen: true,
        resolve
      });
    });
  };

  const closeModal = (result: any) => {
    if (modal.resolve) {
      modal.resolve(result);
    }
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Attach custom modal handlers to window for app engine
    (window as any).__showAppAlert = (title: string, message: string, items?: string[]) => {
      return showModal({ type: 'alert', title, message, items });
    };
    (window as any).__showAppConfirm = (title: string, message: string) => {
      return showModal({ type: 'confirm', title, message });
    };
    (window as any).__showAppPrompt = (title: string, message: string, defaultValue = '', required = false, isNumber = false) => {
      return showModal({ type: 'prompt', title, message, defaultValue, required, isNumber });
    };
    (window as any).__showAppCounter = (currentTarget: number, currentResources: string) => {
      return showModal({
        type: 'counter',
        title: 'Send Counterproposal',
        message: 'Revise the proposed target, discuss resources, and provide a clear rationale.',
        counterTarget: currentTarget,
        counterResources: currentResources
      });
    };
    (window as any).__showAppEscalate = (cfg: { itemLabel: string; defaultCategory?: string; defaultSeverity?: string }) => {
      return showModal({
        type: 'escalate',
        title: 'Escalate Blocker to PDCA Review',
        message: 'Flag an implementation obstacle that requires management support, resources or cross-functional decision.',
        itemLabel: cfg.itemLabel,
        defaultCategory: cfg.defaultCategory,
        defaultSeverity: cfg.defaultSeverity
      });
    };
    (window as any).__showAppPdcaDecision = (cfg: { itemLabel: string; reviewsList: { id: string; label: string }[]; defaultReviewId?: string; defaultText: string; defaultOwner: string; defaultDue: string }) => {
      return showModal({
        type: 'pdcaDecision',
        title: 'Convert to PDCA Decision',
        message: 'Create a tracked management decision tied directly to this escalated blocker or red KPI signal.',
        itemLabel: cfg.itemLabel,
        reviewsList: cfg.reviewsList,
        defaultReviewId: cfg.defaultReviewId,
        defaultValue: cfg.defaultText,
        defaultOwner: cfg.defaultOwner,
        defaultDue: cfg.defaultDue
      });
    };

    initSafeQMSEngine();
  }, []);

  return (
    <div>
      <header className="top">
        <div className="brand"><i>✓</i>SAFEQMS</div>
        <span className="sub">Goal Management · Strategy Deployment · Prototype v5.2</span>
        <span className="user">
          Demo Organization &nbsp; · &nbsp; <label htmlFor="roleSelectorTop">Role:</label>{' '}
          <select id="roleSelectorTop" onChange={(e) => (window as any).setRole(e.target.value)}></select>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </span>
      </header>

      <div className="shell">
        <aside>
          <div className="group">Goal Management</div>
          <button className="nav" data-route="overview"><span>▦</span><span>Overview</span></button>
          <button className="nav" data-route="daily"><span>◫</span><span>Daily Board</span></button>
          <button className="nav" data-route="strategy"><span>⑂</span><span>Strategy & Goals</span></button>
          <button className="nav" data-route="execution"><span>▤</span><span>Initiatives & Projects</span></button>
          <button className="nav" data-route="performance"><span>▥</span><span>Performance</span></button>
          <button className="nav" data-route="alignment"><span>⟳</span><span>Reviews & Alignment</span></button>
          <button className="nav" data-route="compliance"><span>▣</span><span>ISO & Evidence</span></button>
          
          <div className="group">Demo Role Preview</div>
          <div className="rolepanel">
            <label htmlFor="roleSelectorSide">Active SafeQMS role</label>
            <select id="roleSelectorSide" onChange={(e) => (window as any).setRole(e.target.value)}></select>
            <div className="rolehelp">UI demonstration only. Real access is checked by the Django API.</div>
          </div>
          
          <div className="group" id="adminSettingsGroup">Settings</div>
          <button className="nav" id="adminSettings" data-route="settings"><span>⚙</span><span>Admin / Demo Settings</span></button>
        </aside>

        <main id="app"></main>
      </div>

      <div id="toast" className="toast"></div>

      {/* Non-blocking Accessible Modal Dialog replacing browser alerts/prompts/confirms */}
      {modal.isOpen && (
        <div className="sq-modal-backdrop" onClick={() => modal.type !== 'alert' && closeModal(null)}>
          <div className="sq-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="sq-modal-header">
              <span>{modal.title}</span>
              <button
                type="button"
                className="btn ghost text-white p-1 hover:opacity-80"
                style={{ color: '#fff', border: 0 }}
                onClick={() => closeModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="sq-modal-body">
              <p>{modal.message}</p>

              {modal.items && modal.items.length > 0 && (
                <ul className="sq-modal-list">
                  {modal.items.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              )}

              {modal.type === 'prompt' && (
                <div>
                  <input
                    type={modal.isNumber ? 'number' : 'text'}
                    className="sq-modal-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    placeholder={modal.placeholder || 'Type response...'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (modal.required && !inputValue.trim()) return;
                        closeModal(inputValue);
                      }
                    }}
                  />
                </div>
              )}

              {modal.type === 'counter' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="sq-modal-field">
                    <label>Revised Target *</label>
                    <input
                      type="number"
                      className="sq-modal-input"
                      value={counterTarget}
                      onChange={(e) => setCounterTarget(Number(e.target.value))}
                      autoFocus
                    />
                  </div>
                  <div className="sq-modal-field">
                    <label>Required Resources</label>
                    <input
                      type="text"
                      className="sq-modal-input"
                      value={counterResources}
                      onChange={(e) => setCounterResources(e.target.value)}
                    />
                  </div>
                  <div className="sq-modal-field">
                    <label>Counterproposal Rationale *</label>
                    <textarea
                      className="sq-modal-input"
                      style={{ minHeight: '65px' }}
                      value={counterReason}
                      onChange={(e) => setCounterReason(e.target.value)}
                      placeholder="Explain why this revised target is realistic..."
                    ></textarea>
                  </div>
                </div>
              )}

              {modal.type === 'escalate' && (
                <div className="sq-modal-grid">
                  {modal.itemLabel && (
                    <div className="controlled">
                      <div className="xs muted">Linked Strategy / Operational Record</div>
                      <b>{modal.itemLabel}</b>
                    </div>
                  )}
                  <div className="sq-modal-row2">
                    <div className="sq-modal-field">
                      <label>Blocker Category *</label>
                      <select className="sq-modal-input" value={escCategory} onChange={(e) => setEscCategory(e.target.value)}>
                        <option value="Resource">Resource / Staffing</option>
                        <option value="Budget">Budget / Capex</option>
                        <option value="Decision">Management Decision</option>
                        <option value="Cross-functional">Cross-functional Alignment</option>
                        <option value="Technical">Equipment / Technical</option>
                        <option value="Prioritization">Target / Prioritization</option>
                      </select>
                    </div>
                    <div className="sq-modal-field">
                      <label>Severity *</label>
                      <select className="sq-modal-input" value={escSeverity} onChange={(e) => setEscSeverity(e.target.value)}>
                        <option value="Critical">Critical (Immediate Stopper)</option>
                        <option value="High">High (Threatens Target)</option>
                        <option value="Medium">Medium (Needs Steering)</option>
                      </select>
                    </div>
                  </div>
                  <div className="sq-modal-field">
                    <label>What is blocking progress? *</label>
                    <textarea
                      className="sq-modal-input"
                      style={{ minHeight: '68px' }}
                      value={escSummary}
                      onChange={(e) => setEscSummary(e.target.value)}
                      placeholder="E.g. Lack of 2nd-shift electrical technician delays SMED pre-heating pilot on Line 3..."
                      autoFocus
                    />
                  </div>
                  <div className="sq-modal-field">
                    <label>Decision or support needed in PDCA Review *</label>
                    <textarea
                      className="sq-modal-input"
                      style={{ minHeight: '60px' }}
                      value={escNeeded}
                      onChange={(e) => setEscNeeded(e.target.value)}
                      placeholder="E.g. Approve 4 hrs/week cross-shift maintenance support or authorize contractor..."
                    />
                  </div>
                </div>
              )}

              {modal.type === 'pdcaDecision' && (
                <div className="sq-modal-grid">
                  {modal.itemLabel && (
                    <div className="controlled">
                      <div className="xs muted">Source Exception / Escalation</div>
                      <b>{modal.itemLabel}</b>
                    </div>
                  )}
                  <div className="sq-modal-field">
                    <label>Target PDCA Review Meeting *</label>
                    <select className="sq-modal-input" value={pdcaReviewId} onChange={(e) => setPdcaReviewId(e.target.value)}>
                      {(modal.reviewsList || []).map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                      <option value="__new__">+ Create new PDCA Review for this cycle</option>
                    </select>
                  </div>
                  <div className="sq-modal-field">
                    <label>Decision / Carry-Forward Countermeasure *</label>
                    <textarea
                      className="sq-modal-input"
                      style={{ minHeight: '68px' }}
                      value={pdcaText}
                      onChange={(e) => setPdcaText(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="sq-modal-row2">
                    <div className="sq-modal-field">
                      <label>Accountable Owner *</label>
                      <input
                        type="text"
                        className="sq-modal-input"
                        value={pdcaOwner}
                        onChange={(e) => setPdcaOwner(e.target.value)}
                      />
                    </div>
                    <div className="sq-modal-field">
                      <label>Due Date *</label>
                      <input
                        type="date"
                        className="sq-modal-input"
                        value={pdcaDue}
                        onChange={(e) => setPdcaDue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sq-modal-footer">
              {modal.type !== 'alert' && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => closeModal(modal.type === 'confirm' ? false : null)}
                >
                  Cancel
                </button>
              )}

              {modal.type === 'alert' && (
                <button type="button" className="btn primary" onClick={() => closeModal(true)}>
                  OK
                </button>
              )}

              {modal.type === 'confirm' && (
                <button type="button" className="btn primary" onClick={() => closeModal(true)}>
                  Confirm
                </button>
              )}

              {modal.type === 'prompt' && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={modal.required && !inputValue.trim()}
                  onClick={() => closeModal(inputValue)}
                >
                  Submit
                </button>
              )}

              {modal.type === 'counter' && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={!counterReason.trim() || isNaN(counterTarget)}
                  onClick={() => closeModal({ target: counterTarget, resources: counterResources, reason: counterReason })}
                >
                  Send Counterproposal
                </button>
              )}

              {modal.type === 'escalate' && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={!escSummary.trim() || !escNeeded.trim()}
                  onClick={() => closeModal({ category: escCategory, severity: escSeverity, summary: escSummary.trim(), neededAction: escNeeded.trim() })}
                >
                  Escalate to PDCA Review
                </button>
              )}

              {modal.type === 'pdcaDecision' && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={!pdcaText.trim() || !pdcaOwner.trim()}
                  onClick={() => closeModal({ reviewId: pdcaReviewId, text: pdcaText.trim(), owner: pdcaOwner.trim(), due: pdcaDue })}
                >
                  Create PDCA Decision
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SafeQMS Application Engine (Port of SafeQMS Goal Management v5.2)
// -------------------------------------------------------------

function initSafeQMSEngine() {
  const KEY = 'safeqms_goal_mgmt_v4';
  const today = new Date().toISOString().slice(0, 10);

  const seed = () => ({
    scope: 'Site: Uppsala',
    year: '2027',
    tab: 'overview',
    matrixGroup: 'goal-initiative',
    demoRole: 'General director',
    plans: [
      { id: 'PL-001', scope: 'Organization', period: '2027–2029', name: 'Group Strategy · Quality, Environment, Safety & Operational Excellence', status: 'Approved', revision: 1, owner: 'Executive Management' },
      { id: 'PL-002', scope: 'Site: Uppsala', period: '2027', name: 'Uppsala Site Annual Strategy', status: 'Approved', revision: 2, owner: 'Site Manager' },
      { id: 'PL-003', scope: 'Site: Falkenberg', period: '2027', name: 'Falkenberg Site Annual Strategy', status: 'Approved', revision: 1, owner: 'Site Manager' }
    ],
    goals: [
      {
        id: 'G-001', title: 'Operational Excellence', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
        kpi: 'K-001', baseline: 68, target: 80, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 9001 · 6.2', description: 'Drive end-to-end manufacturing and operational excellence through standardized work, flow and total productive maintenance.',
        planWhat: 'Deploy group-wide operational excellence system across manufacturing sites.', resources: 'Executive leadership team, site managers, central OpEx steering group',
        planDue: '2029-12-31', evaluation: 'Quarterly management review and aggregated multi-site OEE tracking', isoRefs: ['req-9001-6.2'],
        riskRefs: 'RISK-OPS-01', processRefs: 'PR-MANUF-01', evidenceRefs: 'DOC-OPEX-2027', revision: 1
      },
      {
        id: 'G-002', title: 'Increase OEE to 75%', level: 'Site: Uppsala', parent: 'G-001', owner: 'Site Manager', year: '2027',
        kpi: 'K-001', baseline: 68, target: 75, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 9001 · 6.2', description: 'Improve production availability, performance and quality on primary packaging and assembly lines.',
        planWhat: 'Deliver SMED changeover reduction pilot and TPM routines on packaging line 3.', resources: 'Production and Maintenance cross-functional improvement teams',
        planDue: '2027-12-31', evaluation: 'Monthly OEE review against agreed line targets in Bowling Chart', isoRefs: ['req-9001-6.2'],
        riskRefs: 'RISK-CAP-02', processRefs: 'PR-PROD-03', evidenceRefs: 'DOC-OEE-UPP', revision: 1
      },
      {
        id: 'G-003', title: 'Reduce changeover losses by 30%', level: 'Department: Production', parent: 'G-002', owner: 'Production Manager', year: '2027',
        kpi: 'K-002', baseline: 60, target: 42, unit: 'min', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 9001 · 8.5', description: 'Reduce average changeover duration on Line 3 from 60 minutes to 42 minutes.',
        planWhat: 'Standardize tool carts, externalize pre-heating, and implement SMED checklist.', resources: 'Production operators, shift supervisors and process engineer (2h/wk)',
        planDue: '2027-10-31', evaluation: 'Shift handover changeover logs and weekly line pace tracking', isoRefs: ['req-9001-8.5'],
        riskRefs: 'RISK-CHG-01', processRefs: 'PR-PROD-02', evidenceRefs: 'DOC-SMED-01', revision: 1
      },
      {
        id: 'G-004', title: 'Reduce unplanned downtime by 20%', level: 'Department: Maintenance', parent: 'G-002', owner: 'Maintenance Manager', year: '2027',
        kpi: 'K-003', baseline: 100, target: 80, unit: 'h', status: 'Active', approval: 'Approved', performance: 'On track',
        iso: 'ISO 9001 · 8.5', description: 'Improve asset reliability and prevent breakdown-induced stoppages.',
        planWhat: 'Deploy Autonomous Maintenance Step 1-3 and predictive vibration diagnostics.', resources: 'Maintenance technicians and line operator training hours',
        planDue: '2027-11-30', evaluation: 'CMMS work order analysis and monthly stop hour tracking', isoRefs: ['req-9001-8.5'],
        riskRefs: 'RISK-EQUIP-04', processRefs: 'PR-MAINT-01', evidenceRefs: 'DOC-TPM-04', revision: 1
      },
      {
        id: 'G-005', title: 'Quality Excellence & Customer Trust', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
        kpi: 'K-004', baseline: 100, target: 70, unit: 'index', status: 'Active', approval: 'Approved', performance: 'On track',
        iso: 'ISO 9001 · 6.2', description: 'Achieve zero critical defects and reduce customer complaint index through robust quality gates.',
        planWhat: 'Implement group-wide Zero Defect culture, standardized Poka-Yoke and audit trails.', resources: 'Global Quality Director, site quality managers and validation engineers',
        planDue: '2029-12-31', evaluation: 'Monthly complaint trends, cost of poor quality and external audit findings', isoRefs: ['req-9001-6.2'],
        riskRefs: 'RISK-QUAL-01', processRefs: 'PR-QMS-01', evidenceRefs: 'DOC-QEX-2027', revision: 1
      },
      {
        id: 'G-006', title: 'Reduce energy intensity by 15%', level: 'Site: Falkenberg', parent: 'G-009', owner: 'Site Manager', year: '2027',
        kpi: 'K-005', baseline: 100, target: 85, unit: 'kWh/unit index', status: 'Active', approval: 'Approved', performance: 'On track',
        iso: 'ISO 14001 · 6.2', description: 'Lower energy consumption per unit of production across all utility systems.',
        planWhat: 'Ultrasonic air leak detection, heat recovery integration and LED retrofitting.', resources: 'Falkenberg facility engineer and external energy audit consultants',
        planDue: '2027-12-31', evaluation: 'Sub-metered energy management system and quarterly utility bills', isoRefs: ['req-14001-6.2'],
        riskRefs: 'RISK-ENV-02', processRefs: 'PR-FAC-01', evidenceRefs: 'DOC-ENERGY-FAL', revision: 1
      },
      {
        id: 'G-007', title: 'Improve safety action closure', level: 'Site: Uppsala', parent: 'G-008', owner: 'EHS Manager', year: '2027',
        kpi: 'K-006', baseline: 82, target: 95, unit: '%', status: 'Active', approval: 'Pending', performance: 'At risk',
        iso: 'ISO 45001 · 6.2', description: 'Close safety audit and near-miss corrective actions on time.',
        planWhat: 'Implement digital Gemba safety walks and daily visual safety huddles.', resources: 'EHS team and department safety representatives',
        planDue: '2027-12-31', evaluation: 'Weekly safety action tracker and monthly EHS committee review', isoRefs: ['req-45001-6.2'],
        riskRefs: 'RISK-OHS-03', processRefs: 'PR-EHS-01', evidenceRefs: 'DOC-SAF-UPP', revision: 1
      },
      {
        id: 'G-008', title: 'Safety & Wellbeing First', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
        kpi: 'K-006', baseline: 82, target: 95, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 45001 · 6.2', description: 'Prevent work-related injury and ill health through measurable OH&S objectives and proactive culture.',
        planWhat: 'Deploy global proactive hazard identification and ergonomic standard work.', resources: 'Executive safety committee, site EHS directors and ergonomics consultants',
        planDue: '2029-12-31', evaluation: 'Lost time injury frequency rate and safety action closure percentage', isoRefs: ['req-45001-6.2'],
        riskRefs: 'RISK-OHS-01', processRefs: 'PR-EHS-01', evidenceRefs: 'DOC-OHS-GRP', revision: 1
      },
      {
        id: 'G-009', title: 'Environmental Sustainability', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
        kpi: 'K-005', baseline: 100, target: 85, unit: 'index', status: 'Active', approval: 'Approved', performance: 'On track',
        iso: 'ISO 14001 · 6.2', description: 'Reduce environmental impact, greenhouse gas emissions and resource consumption.',
        planWhat: 'Transition group operations toward renewable power and zero waste-to-landfill.', resources: 'Sustainability steering group and site environmental officers',
        planDue: '2029-12-31', evaluation: 'Annual ESG audit and monthly resource consumption metrics', isoRefs: ['req-14001-6.2'],
        riskRefs: 'RISK-ENV-01', processRefs: 'PR-ENV-01', evidenceRefs: 'DOC-ESG-2027', revision: 1
      },
      {
        id: 'G-010', title: 'First-Time-Right Yield >96%', level: 'Site: Uppsala', parent: 'G-005', owner: 'Quality Manager', year: '2027',
        kpi: 'K-007', baseline: 89, target: 96, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 9001 · 6.2', description: 'Increase direct production yield to 96% by preventing manufacturing defects and packaging misalignments.',
        planWhat: 'Integrate automated in-line inspection and workstation error-proofing.', resources: 'Site quality team, manufacturing engineers and vision system supplier',
        planDue: '2027-12-31', evaluation: 'Daily scrap reporting and weekly Statistical Process Control (SPC) runs', isoRefs: ['req-9001-6.2'],
        riskRefs: 'RISK-QUAL-02', processRefs: 'PR-QA-02', evidenceRefs: 'DOC-YIELD-UPP', revision: 1
      },
      {
        id: 'G-011', title: 'Packaging Throughput & Reliability', level: 'Site: Falkenberg', parent: 'G-001', owner: 'Site Manager', year: '2027',
        kpi: 'K-001', baseline: 65, target: 74, unit: '%', status: 'Active', approval: 'Approved', performance: 'On track',
        iso: 'ISO 9001 · 6.2', description: 'Stabilize high-speed carton packing line output and reduce bottle-filler jams.',
        planWhat: 'Adopt autonomous maintenance checklists and standardized conveyor speeds.', resources: 'Falkenberg line leads and maintenance team',
        planDue: '2027-12-31', evaluation: 'Monthly site OEE calculation and throughput reports', isoRefs: ['req-9001-6.2'],
        riskRefs: 'RISK-OPS-03', processRefs: 'PR-PROD-FAL', evidenceRefs: 'DOC-FAL-TPM', revision: 1
      },
      {
        id: 'G-012', title: 'Eliminate Line 2 Micro-stops', level: 'Department: Production', parent: 'G-002', owner: 'Production Manager', year: '2027',
        kpi: 'K-003', baseline: 45, target: 18, unit: 'stops/wk', status: 'Active', approval: 'Approved', performance: 'On track',
        iso: 'ISO 9001 · 8.5', description: 'Eliminate short recurring sensor trips and packaging feeder jams under 5 minutes.',
        planWhat: 'Implement sensor cleaning standard work and guide rail centerlining.', resources: 'Line 2 production shift teams and tooling specialists',
        planDue: '2027-11-30', evaluation: 'SCADA micro-stop frequency logs and daily production huddle review', isoRefs: ['req-9001-8.5'],
        riskRefs: 'RISK-STOP-01', processRefs: 'PR-PROD-02', evidenceRefs: 'DOC-MSTOP-01', revision: 1
      },
      {
        id: 'G-013', title: 'In-Line Quality Gates & Verification', level: 'Department: Quality', parent: 'G-010', owner: 'Quality Manager', year: '2027',
        kpi: 'K-007', baseline: 91, target: 97, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 9001 · 8.5', description: 'Prevent defective product escapes by deploying standardized optical verification at critical stations.',
        planWhat: 'Install vision camera verification for barcode, cap torque and seal integrity.', resources: 'Quality engineers and automation technicians',
        planDue: '2027-12-15', evaluation: 'Verification test records and zero customer escape audit results', isoRefs: ['req-9001-8.5'],
        riskRefs: 'RISK-DEF-02', processRefs: 'PR-QA-03', evidenceRefs: 'DOC-QGATE-01', revision: 1
      },
      {
        id: 'G-014', title: 'Proactive Hazard & Near-Miss Resolution', level: 'Department: Maintenance', parent: 'G-007', owner: 'Safety Coordinator', year: '2027',
        kpi: 'K-008', baseline: 75, target: 95, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
        iso: 'ISO 45001 · 6.2', description: 'Ensure all recorded near-misses and safety concerns are addressed within 7 days.',
        planWhat: 'Deploy QR-code hazard reporting on machinery and conduct weekly safety audits.', resources: 'Maintenance safety representative and shopfloor technicians',
        planDue: '2027-12-31', evaluation: 'Weekly ticket closure reports and safety representative minutes', isoRefs: ['req-45001-6.2'],
        riskRefs: 'RISK-HAZ-01', processRefs: 'PR-EHS-02', evidenceRefs: 'DOC-HAZ-01', revision: 1
      }
    ],
    kpis: [
      { id: 'K-001', name: 'Overall Equipment Effectiveness', unit: '%', direction: 'higher', tolerance: 2, values: [68, 69, 70, 71, 70, 72, 73], targets: [69, 70, 71, 72, 73, 74, 75, 75, 75, 75, 75, 75], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-002', name: 'Average changeover time', unit: 'min', direction: 'lower', tolerance: 3, values: [60, 58, 55, 54, 53, 51, 49], targets: [58, 56, 53, 50, 48, 45, 42, 42, 42, 42, 42, 42], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-003', name: 'Unplanned downtime', unit: 'h', direction: 'lower', tolerance: 5, values: [100, 95, 93, 91, 89, 85, 82], targets: [98, 95, 92, 89, 86, 83, 80, 80, 80, 80, 80, 80], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-004', name: 'Customer complaint index', unit: 'index', direction: 'lower', tolerance: 5, values: [100, 96, 93, 90, 85, 80, 76], targets: [98, 95, 90, 85, 80, 75, 70, 70, 70, 70, 70, 70], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-005', name: 'Energy intensity index', unit: 'index', direction: 'lower', tolerance: 4, values: [100, 98, 96, 94, 93, 90, 88], targets: [98, 96, 94, 92, 90, 87, 85, 85, 85, 85, 85, 85], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-006', name: 'Safety action closure on time', unit: '%', direction: 'higher', tolerance: 3, values: [82, 84, 85, 86, 88, 90, 91], targets: [85, 87, 89, 91, 92, 94, 95, 95, 95, 95, 95, 95], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-007', name: 'First-Time-Right Yield', unit: '%', direction: 'higher', tolerance: 2, values: [89, 90, 91, 92, 93, 94, 95], targets: [90, 91, 92, 93, 94, 95, 96, 96, 96, 96, 96, 96], source: 'Demo / manually entered', sourceUpdated: '' },
      { id: 'K-008', name: 'Near-miss closure within 7 days', unit: '%', direction: 'higher', tolerance: 3, values: [75, 78, 82, 85, 87, 91, 92], targets: [80, 83, 86, 89, 91, 93, 95, 95, 95, 95, 95, 95], source: 'Demo / manually entered', sourceUpdated: '' }
    ],
    initiatives: [
      { id: 'I-001', title: 'SMED Programme & Setup Reduction', owner: 'Production Manager', goal: 'G-003', status: 'At risk', progress: 65, budget: '€25,000', description: 'Standardize tooling carts, externalize setup tasks and implement single-minute exchange of dies.', sqdc: { S: 1, Q: 1, D: 2, C: 2 }, valueStream: 'Line 3 Packaging Stream · TOC Bottleneck #1 (Capacity)', isBottleneck: true },
      { id: 'I-002', title: 'TPM Autonomous Maintenance Rollout', owner: 'Maintenance Manager', goal: 'G-004', status: 'On track', progress: 78, budget: '€40,000', description: 'Operator care routines, predictive vibration sensors, and planned maintenance cycles.', sqdc: { S: 1, Q: 1, D: 2, C: 2 }, valueStream: 'Uppsala Packing & Assembly · Uptime Bottleneck', isBottleneck: true },
      { id: 'I-003', title: 'Energy & Compressed Air Optimization', owner: 'Site Manager', goal: 'G-006', status: 'Planned', progress: 20, budget: '€15,000', description: 'Ultrasonic air leak surveys, compressor heat recovery and sub-metering.', sqdc: { S: 0, Q: 0, D: 0, C: 2 }, valueStream: 'Falkenberg Utilities · Non-Bottleneck ESG/Cost', isBottleneck: false },
      { id: 'I-004', title: 'Quality Gate Standardization & Poka-Yoke', owner: 'Quality Manager', goal: 'G-010', status: 'On track', progress: 55, budget: '€18,000', description: 'Mistake-proofing fixtures, digital defect capture and standardized verification gates.', sqdc: { S: 0, Q: 2, D: 1, C: 2 }, valueStream: 'Uppsala Final Pack · Rework & Scrap Gate', isBottleneck: true },
      { id: 'I-005', title: 'Digital Standard Work & Line Balancing', owner: 'Production Manager', goal: 'G-012', status: 'Planned', progress: 30, budget: '€12,000', description: 'Visual standard work tablet guides, cycle time harmonization and micro-stop logging.', sqdc: { S: 1, Q: 1, D: 2, C: 1 }, valueStream: 'Line 2 Packaging · Cycle-Time Pacing', isBottleneck: false },
      { id: 'I-006', title: 'Safety Leadership & Daily Gemba Walks', owner: 'EHS Manager', goal: 'G-014', status: 'On track', progress: 70, budget: '€8,000', description: 'Management Gemba walks, instant hazard flagging via QR codes and quick corrective action.', sqdc: { S: 2, Q: 0, D: 0, C: 1 }, valueStream: 'Site-wide Shopfloor · Mandatory Safety Priority', isBottleneck: false },
      { id: 'I-007', title: 'Automated Vision Inspection System Pilot', owner: 'Quality Manager', goal: 'G-013', status: 'At risk', progress: 40, budget: '€35,000', description: 'High-speed camera inspection for label alignment, seal integrity and packaging defect rejection.', sqdc: { S: 0, Q: 2, D: 1, C: 2 }, valueStream: 'Line 1 Exit Gate · Customer Escape Constraint', isBottleneck: true }
    ],
    projects: [
      {
        id: 'P-001', title: 'Line 3 Changeover Reduction', initiative: 'I-001', owner: 'Project Leader', status: 'At risk', progress: 72,
        problem: 'Average changeover takes 60 minutes and varies significantly between shifts.',
        current: '60 minutes', target: '42 minutes',
        root: 'Tools are not pre-staged; internal and external steps are mixed; heating elements wait for line stop.',
        counter: 'Externalize preparation, standardize tool carts, trial pre-heated nozzles and new sequence.',
        learning: 'Standard work to be verified after pilot and rolled out to shift B and C.'
      },
      {
        id: 'P-002', title: 'Autonomous Maintenance Pilot', initiative: 'I-002', owner: 'Maintenance Engineer', status: 'On track', progress: 78,
        problem: 'Minor stops and recurring conveyor jams reduce line availability.',
        current: '100 h downtime / month', target: '80 h downtime / month',
        root: 'Insufficient basic equipment care and irregular lubrication cycles.',
        counter: 'Train operators on visual standards, introduce 10-minute shift start inspection routines.',
        learning: 'Operators detected two bearing failures before line stoppage during week 24.'
      },
      {
        id: 'P-003', title: 'Automated Vision Inspection Pilot', initiative: 'I-007', owner: 'Vision Specialist', status: 'At risk', progress: 40,
        problem: 'Manual inspection misses 1 in 2,000 label skew defects, triggering customer sorting requests.',
        current: '95% first-time-right yield on line 1 packaging', target: '97% first-time-right yield with zero escapes',
        root: 'High conveyor velocity and operator visual fatigue during extended packaging batches.',
        counter: 'Install high-speed strobe cameras with optical character verification (OCV) at exit gate.',
        learning: 'Lighting reflection requires polarizing filter to prevent false rejection of glossy packaging.'
      },
      {
        id: 'P-004', title: 'Safety Hazard Elimination & Ergonomics', initiative: 'I-006', owner: 'Safety Coordinator', status: 'On track', progress: 70,
        problem: 'Repetitive lifting of heavy dye plates creates ergonomic strain and near-miss hazard.',
        current: '75% near-miss closure within 7 days', target: '95% near-miss closure within 7 days',
        root: 'Manual tool staging requires awkward bending and lifting.',
        counter: 'Install pneumatic spring balancer lift assist and rolling scissor cart.',
        learning: 'Ergonomic score improved by 40%; operator satisfaction high.'
      }
    ],
    tasks: [
      { id: 'T-001', project: 'P-001', title: 'Film current changeover on Line 3', owner: 'Process Engineer', due: '2027-02-10', status: 'Done' },
      { id: 'T-002', project: 'P-001', title: 'Separate internal and external tasks', owner: 'Production Engineer', due: '2027-03-15', status: 'Done' },
      { id: 'T-003', project: 'P-001', title: 'Pilot new standardized tool cart', owner: 'Team Leader', due: '2027-07-20', status: 'In progress' },
      { id: 'T-004', project: 'P-001', title: 'Verify sustained OEE improvement', owner: 'OpEx Manager', due: '2027-09-15', status: 'Open' },
      { id: 'T-005', project: 'P-002', title: 'Clean to inspect routine definitions', owner: 'Maintenance Engineer', due: '2027-03-01', status: 'Done' },
      { id: 'T-006', project: 'P-002', title: 'Operator lubrication training', owner: 'Maintenance Technician', due: '2027-05-10', status: 'Done' },
      { id: 'T-007', project: 'P-002', title: 'Install visual pressure and vibration tags', owner: 'Maintenance Engineer', due: '2027-08-15', status: 'In progress' },
      { id: 'T-008', project: 'P-002', title: 'Evaluate downtime reduction vs baseline', owner: 'Maintenance Manager', due: '2027-11-01', status: 'Open' },
      { id: 'T-009', project: 'P-003', title: 'Camera mounting bracket installation', owner: 'Automation Tech', due: '2027-06-15', status: 'Done' },
      { id: 'T-010', project: 'P-003', title: 'Train defect classification AI model', owner: 'Vision Specialist', due: '2027-08-30', status: 'In progress' },
      { id: 'T-011', project: 'P-003', title: 'Integrate automated reject diverter arm', owner: 'Automation Tech', due: '2027-10-15', status: 'Open' },
      { id: 'T-012', project: 'P-003', title: 'Statistical validation run (100k units)', owner: 'Quality Engineer', due: '2027-11-30', status: 'Open' },
      { id: 'T-013', project: 'P-004', title: 'Procure pneumatic lift assist arm', owner: 'Safety Coordinator', due: '2027-04-10', status: 'Done' },
      { id: 'T-014', project: 'P-004', title: 'Install scissor cart at die change area', owner: 'Maintenance Tech', due: '2027-05-20', status: 'Done' },
      { id: 'T-015', project: 'P-004', title: 'Conduct weekly gemba safety walk', owner: 'EHS Manager', due: '2027-07-25', status: 'In progress' },
      { id: 'T-016', project: 'P-004', title: 'Audit 7-day near-miss ticket resolution', owner: 'Safety Coordinator', due: '2027-09-30', status: 'Open' }
    ],
    relations: [
      { from: 'G-002', to: 'I-001', strength: 2, note: 'SMED directly drives Uppsala site OEE increase' },
      { from: 'G-002', to: 'I-002', strength: 2, note: 'TPM downtime reduction elevates line availability' },
      { from: 'G-002', to: 'I-005', strength: 1, note: 'Standard work stabilizes line rate' },
      { from: 'G-003', to: 'I-001', strength: 2, note: 'Primary initiative for 30% changeover reduction' },
      { from: 'G-004', to: 'I-002', strength: 2, note: 'Preventive maintenance reduces downtime' },
      { from: 'G-006', to: 'I-003', strength: 2, note: 'Energy efficiency project at Falkenberg' },
      { from: 'G-007', to: 'I-006', strength: 2, note: 'Gemba safety walks accelerate closure' },
      { from: 'G-010', to: 'I-004', strength: 2, note: 'Poka-yoke directly improves first-time-right yield' },
      { from: 'G-010', to: 'I-007', strength: 2, note: 'Vision inspection detects defects early' },
      { from: 'G-011', to: 'I-002', strength: 1, note: 'Cross-site TPM knowledge sharing' },
      { from: 'G-012', to: 'I-005', strength: 2, note: 'Standard work eliminates micro-stops' },
      { from: 'G-012', to: 'I-001', strength: 0.5, note: 'Tool changes occasionally introduce micro-stops' },
      { from: 'G-013', to: 'I-007', strength: 2, note: 'Automated gates prevent escapes' },
      { from: 'G-014', to: 'I-006', strength: 2, note: 'Gemba walks resolve near misses' },
      { from: 'I-001', to: 'K-001', strength: 2, note: 'Changeover reduction frees line capacity' },
      { from: 'I-001', to: 'K-002', strength: 2, note: 'Primary metric for changeover speed' },
      { from: 'I-002', to: 'K-001', strength: 2, note: 'Increased uptime lifts OEE' },
      { from: 'I-002', to: 'K-003', strength: 2, note: 'Direct reduction of unplanned stop hours' },
      { from: 'I-003', to: 'K-005', strength: 2, note: 'Energy savings reduce intensity index' },
      { from: 'I-004', to: 'K-004', strength: 2, note: 'Defect reduction lowers customer complaints' },
      { from: 'I-004', to: 'K-007', strength: 2, note: 'Mistake proofing increases first time yield' },
      { from: 'I-005', to: 'K-001', strength: 1, note: 'Standard work improves line rate' },
      { from: 'I-005', to: 'K-003', strength: 1, note: 'Micro-stop reduction saves operating hours' },
      { from: 'I-006', to: 'K-006', strength: 2, note: 'Management presence accelerates safety actions' },
      { from: 'I-006', to: 'K-008', strength: 2, note: 'Directly tracks 7-day near-miss closure' },
      { from: 'I-007', to: 'K-004', strength: 2, note: 'Vision inspection halts defective batches' },
      { from: 'I-007', to: 'K-007', strength: 2, note: 'Instant defect detection boosts yield' }
    ],
    approvals: [
      { id: 'AP-001', goal: 'G-007', requester: 'EHS Manager', approver: 'Site Manager', status: 'Pending', comment: 'Review proposed target and resource allocation.', date: '2027-01-12' },
      { id: 'AP-002', goal: 'G-010', requester: 'Quality Manager', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Target aligns with ISO 9001 customer quality strategy.', date: '2027-02-05' },
      { id: 'AP-003', goal: 'G-002', requester: 'Site Manager', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Uppsala site OEE plan approved with SMED and TPM resources.', date: '2027-01-18' },
      { id: 'AP-004', goal: 'G-001', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Group Operational Excellence strategy approved.', date: '2027-01-10' },
      { id: 'AP-005', goal: 'G-005', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Quality Excellence pillar approved.', date: '2027-01-10' },
      { id: 'AP-006', goal: 'G-008', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Safety & Wellbeing pillar approved.', date: '2027-01-10' },
      { id: 'AP-007', goal: 'G-009', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Sustainability pillar approved.', date: '2027-01-10' }
    ],
    reviews: [
      {
        id: 'R-001', title: 'Site Strategy Review – June', date: '2027-06-30', scope: 'Site: Uppsala',
        notes: 'OEE remains below target. Prioritize changeover pilot and vision inspection.',
        decisions: [
          { text: 'Accelerate SMED pilot on Line 3', owner: 'Production Manager', due: '2027-07-20', status: 'Open', linkedType: 'initiative', linkedId: 'I-001' },
          { text: 'Complete camera calibration for packaging', owner: 'Quality Manager', due: '2027-08-15', status: 'Open', linkedType: 'initiative', linkedId: 'I-007' },
          { text: 'Enforce joint Production & Maintenance centerline audit across shifts A/B/C', owner: 'Site Manager', due: '2027-07-25', status: 'Open', blockerId: 'BL-003', linkedType: 'kpi', linkedId: 'K-001' }
        ]
      },
      { id: 'R-002', title: 'Q2 Group Operations Review', date: '2027-07-15', scope: 'Organization', notes: 'Quality customer index improving ahead of pace. Energy intensity on track.', decisions: [{ text: 'Standardize autonomous maintenance across Falkenberg', owner: 'Maintenance Manager', due: '2027-09-30', status: 'Open', linkedType: 'initiative', linkedId: 'I-002' }] }
    ],
    blockers: [
      {
        id: 'BL-001', targetType: 'initiative', targetId: 'I-001', scope: 'Department: Production',
        category: 'Resource', severity: 'High',
        summary: 'Lack of dedicated 2nd-shift electrical technician delays SMED pre-heating pilot on Line 3.',
        neededAction: 'Authorize 4 hrs/week cross-shift maintenance support or external contractor coverage.',
        owner: 'Production Manager', raisedBy: 'Department director', raisedAt: '2027-07-02',
        status: 'Open', source: 'Manual'
      },
      {
        id: 'BL-002', targetType: 'initiative', targetId: 'I-007', scope: 'Department: Quality',
        category: 'Budget', severity: 'Critical',
        summary: 'Polarizing strobe filter kit requires €4,200 capex variance due to glossy packaging glare.',
        neededAction: 'Approve €4,200 pilot budget delta so optical validation run can complete on schedule.',
        owner: 'Quality Manager', raisedBy: 'Quality Manager', raisedAt: '2027-07-05',
        status: 'Open', source: 'Manual'
      },
      {
        id: 'BL-003', targetType: 'kpi', targetId: 'K-001', scope: 'Site: Uppsala',
        category: 'Cross-functional', severity: 'Medium',
        summary: 'Conveyor centerline speed drift between Shift A and Shift B causes recurring OEE micro-stops.',
        neededAction: 'Enforce joint Production + Maintenance standard centerline sign-off at shift handover.',
        owner: 'Site Manager', raisedBy: 'Site Manager', raisedAt: '2027-06-28',
        status: 'In review', reviewId: 'R-001', decisionIndex: 2, source: 'Manual'
      }
    ],
    blockerFilter: 'active',
    sqdcFilter: 'all',
    kpiOwners: [
      { kpi: 'K-001', owner: 'Site Manager', strength: 2, note: 'Primary accountable owner for overall Uppsala & Falkenberg OEE delivery' },
      { kpi: 'K-001', owner: 'Production Manager', strength: 1, note: 'Cross-functional support via changeover speed and shift pacing' },
      { kpi: 'K-001', owner: 'Maintenance Manager', strength: 1, note: 'Cross-functional support via equipment availability & TPM' },
      { kpi: 'K-001', owner: 'Executive Management', strength: 1, note: 'Executive sponsor for group-wide OEE benchmark' },
      { kpi: 'K-002', owner: 'Production Manager', strength: 2, note: 'Primary owner for SMED setup standardization' },
      { kpi: 'K-002', owner: 'Maintenance Manager', strength: 1, note: 'Supports quick-release tooling and pre-heating readiness' },
      { kpi: 'K-002', owner: 'Quality Manager', strength: 1, note: 'Supports fast first-piece release verification' },
      { kpi: 'K-003', owner: 'Maintenance Manager', strength: 2, note: 'Primary owner for breakdown reduction & predictive maintenance' },
      { kpi: 'K-003', owner: 'Production Manager', strength: 1, note: 'Autonomous operator clean-to-inspect routines' },
      { kpi: 'K-004', owner: 'Quality Manager', strength: 2, note: 'Primary owner for customer complaint prevention' },
      { kpi: 'K-004', owner: 'Production Manager', strength: 1, note: 'In-station Poka-Yoke execution' },
      { kpi: 'K-004', owner: 'Executive Management', strength: 1, note: 'Strategic sponsor for Customer Trust pillar' },
      { kpi: 'K-005', owner: 'Site Manager', strength: 2, note: 'Primary owner for site energy intensity target' },
      { kpi: 'K-005', owner: 'Maintenance Manager', strength: 1, note: 'Air leak repair and utility heat recovery execution' },
      { kpi: 'K-006', owner: 'EHS Manager', strength: 2, note: 'Primary owner for safety closure cadence' },
      { kpi: 'K-006', owner: 'Site Manager', strength: 1, note: 'Weekly Gemba walk accountability across departments' },
      { kpi: 'K-006', owner: 'Maintenance Manager', strength: 1, note: 'Technical hazard safeguarding engineering' },
      { kpi: 'K-007', owner: 'Quality Manager', strength: 2, note: 'Primary owner for First-Time-Right yield & vision gates' },
      { kpi: 'K-007', owner: 'Production Manager', strength: 1, note: 'Standard work adherence on packaging lines' },
      { kpi: 'K-008', owner: 'EHS Manager', strength: 2, note: 'Primary owner for 7-day near-miss resolution' },
      { kpi: 'K-008', owner: 'Maintenance Manager', strength: 1, note: 'Supports mechanical/ergonomic hazard remediation' },
      { kpi: 'K-008', owner: 'Safety Coordinator', strength: 1, note: 'Shopfloor hazard & 7-day near-miss follow-up coordinator' }
    ],
    history: [
      { time: '2027-01-10', text: 'Organization strategy approved (rev 1)' },
      { time: '2027-01-18', text: 'Uppsala site annual goals approved' },
      { time: '2027-02-05', text: 'First-Time-Right Yield goal approved' },
      { time: '2027-06-30', text: 'Mid-year strategy review recorded' }
    ],
    collapsed: [] as string[],
    matrixView: 'visual',
    cascadeView: 'tree',
    isoStandards: [] as any[],
    isoCatalogSource: '',
    goalRevisions: [] as any[],
    csvImports: [] as any[],
    catchballs: [] as any[],
    catchballNotifications: [] as any[],
    catchballEvents: [] as any[],
    directorDecisionLog: [] as any[],
    directorDecisionNotifications: [] as any[],
    dailyTier: 'tier1',
    safetyCross: {
      'Department: Production': { '1': 'green', '2': 'green', '3': 'green', '4': 'amber', '5': 'green', '6': 'green', '7': 'green', '8': 'green', '9': 'red', '10': 'green', '11': 'green', '12': 'amber', '13': 'green', '14': 'green', '15': 'green' },
      'Site: Uppsala': { '1': 'green', '2': 'green', '3': 'green', '4': 'amber', '5': 'green', '6': 'green', '7': 'green', '8': 'green', '9': 'red', '10': 'green', '11': 'green', '12': 'amber', '13': 'green', '14': 'green', '15': 'green' },
      'Organization': { '1': 'green', '2': 'green', '3': 'green', '4': 'amber', '5': 'green', '6': 'green', '7': 'green', '8': 'green', '9': 'red', '10': 'green', '11': 'green', '12': 'amber', '13': 'green', '14': 'green', '15': 'green' }
    } as Record<string, Record<string, string>>,
    pulseCards: [
      { id: 'PC-001', title: 'Line 3 pre-heating electrical delay on Shift B changeover', details: 'Pre-heater zone 2 trips thermal relay during rapid format switchovers, adding ~14 min downtime per batch.', due: '2027-07-18', scope: 'Department: Production', routeType: 'Escalate', owner: 'Team Leader', kpi: 'K-002', initiative: 'I-001', project: 'P-001', blockerId: 'BL-001', status: 'Escalated', createdAt: '2027-07-02', comments: [{ by: 'Team Leader', at: '2027-07-02', text: 'Occurred twice on Shift B. Needs electrical maintenance support & relay spare review.' }] },
      { id: 'PC-002', title: 'Set up 5S shadow board for changeover wrenches at Line 3', details: 'Operators lose 4-6 min searching for torque wrench #14 during die swaps. Shadow board next to HMI solves this directly.', due: '2027-07-20', scope: 'Department: Production', routeType: 'Direct fix', owner: 'Team Leader', kpi: 'K-002', initiative: 'I-001', project: 'P-001', blockerId: '', status: 'Team action', createdAt: '2027-07-10', comments: [{ by: 'Team Leader', at: '2027-07-10', text: 'Foam insert ordered; mounting planned at Friday 5S slot.' }] },
      { id: 'PC-003', title: 'Recurring glossy label glare causing false vision rejects', details: 'Overhead LED reflection on batch film triggers false camera reject alarms (~3.2% micro-stops on Line 1).', due: '2027-07-25', scope: 'Department: Quality', routeType: 'A3', owner: 'Quality Manager', kpi: 'K-007', initiative: 'I-007', project: 'P-003', blockerId: 'BL-002', status: 'Escalated', createdAt: '2027-07-05', comments: [{ by: 'Quality Manager', at: '2027-07-06', text: 'Linked to Vision Pilot P-003; awaiting polarizing lens quote.' }] },
      { id: 'PC-004', title: 'Install QR hazard placard on hydraulic press guard', details: 'Quick-scan QR code linking straight to LOTO lockout checklist at press station.', due: '2027-06-30', scope: 'Department: Maintenance', routeType: 'Direct fix', owner: 'Safety Coordinator', kpi: 'K-008', initiative: 'I-006', project: 'P-004', blockerId: '', status: 'Done', createdAt: '2027-06-22', comments: [{ by: 'Safety Coordinator', at: '2027-06-28', text: 'Placard laminated, mounted, and verified during morning Gemba walk.' }] }
    ],
    myFocusOwner: ''
  });

  let S: any;
  let pulseDelegateCardId: string | null = null;
  let pulseOpenCardId: string | null = null;
  try {
    S = JSON.parse(localStorage.getItem(KEY) || '') || seed();
  } catch (e) {
    S = seed();
  }

  const ISO_EXAMPLE_CATALOG = [
    {
      id: 'safeqms-9001',
      code: 'ISO 9001',
      edition: 'Use edition configured in SafeQMS',
      requirements: [
        { id: 'req-9001-6.1', number: '6.1', title: 'Actions to address risks and opportunities' },
        { id: 'req-9001-6.2', number: '6.2', title: 'Quality objectives and planning to achieve them' },
        { id: 'req-9001-8.5', number: '8.5', title: 'Production and service provision' },
        { id: 'req-9001-9.1', number: '9.1', title: 'Monitoring, measurement, analysis and evaluation' },
        { id: 'req-9001-9.3', number: '9.3', title: 'Management review' }
      ]
    },
    {
      id: 'safeqms-14001',
      code: 'ISO 14001',
      edition: 'Use edition configured in SafeQMS',
      requirements: [
        { id: 'req-14001-6.1', number: '6.1', title: 'Actions to address risks and opportunities' },
        { id: 'req-14001-6.2', number: '6.2', title: 'Environmental objectives and planning to achieve them' },
        { id: 'req-14001-9.1', number: '9.1', title: 'Monitoring, measurement, analysis and evaluation' },
        { id: 'req-14001-9.3', number: '9.3', title: 'Management review' }
      ]
    },
    {
      id: 'safeqms-45001',
      code: 'ISO 45001',
      edition: 'Use edition configured in SafeQMS',
      requirements: [
        { id: 'req-45001-6.1', number: '6.1', title: 'Actions to address risks and opportunities' },
        { id: 'req-45001-6.2', number: '6.2', title: 'OH&S objectives and planning to achieve them' },
        { id: 'req-45001-9.1', number: '9.1', title: 'Monitoring, measurement, analysis and performance evaluation' },
        { id: 'req-45001-9.3', number: '9.3', title: 'Management review' }
      ]
    }
  ];

  function migrateDemo() {
    const defaults = seed();
    let changed = false;

    // Merge missing synchronized goals from defaults
    for (const dg of defaults.goals) {
      if (!S.goals.some((g: any) => g.id === dg.id)) {
        S.goals.push(JSON.parse(JSON.stringify(dg)));
        changed = true;
      }
    }
    // Merge missing KPIs from defaults
    for (const dk of defaults.kpis) {
      if (!S.kpis.some((k: any) => k.id === dk.id)) {
        S.kpis.push(JSON.parse(JSON.stringify(dk)));
        changed = true;
      }
    }
    // Merge missing initiatives from defaults
    for (const di of defaults.initiatives) {
      if (!S.initiatives.some((i: any) => i.id === di.id)) {
        S.initiatives.push(JSON.parse(JSON.stringify(di)));
        changed = true;
      }
    }
    // Merge missing projects from defaults
    for (const dp of defaults.projects) {
      if (!S.projects.some((p: any) => p.id === dp.id)) {
        S.projects.push(JSON.parse(JSON.stringify(dp)));
        changed = true;
      }
    }
    // Merge missing tasks from defaults
    for (const dt of defaults.tasks) {
      if (!S.tasks.some((t: any) => t.id === dt.id)) {
        S.tasks.push(JSON.parse(JSON.stringify(dt)));
        changed = true;
      }
    }
    // Merge missing strategic relations from defaults
    for (const dr of defaults.relations) {
      if (!S.relations.some((r: any) => r.from === dr.from && r.to === dr.to)) {
        S.relations.push(JSON.parse(JSON.stringify(dr)));
        changed = true;
      }
    }
    // Merge missing approvals
    if (Array.isArray(defaults.approvals)) {
      if (!Array.isArray(S.approvals)) S.approvals = [];
      for (const da of defaults.approvals) {
        if (!S.approvals.some((a: any) => a.id === da.id)) {
          S.approvals.push(JSON.parse(JSON.stringify(da)));
          changed = true;
        }
      }
    }

    const nextGoalID = () => {
      let n = Math.max(0, ...S.goals.map((g: any) => Number(g.id.split('-')[1]) || 0)) + 1;
      return 'G-' + String(n).padStart(3, '0');
    };
    const ensurePillar = (templateID: string, iso: string, titleRegex: RegExp) => {
      let found = S.goals.find((g: any) => g.level === 'Organization' && (g.iso || '').includes(iso));
      if (!found) found = S.goals.find((g: any) => g.level === 'Organization' && titleRegex.test(g.title));
      if (!found) {
        let template = defaults.goals.find((g: any) => g.id === templateID);
        let id = S.goals.some((g: any) => g.id === templateID) ? nextGoalID() : templateID;
        found = { ...template, id };
        S.goals.push(found);
        changed = true;
      }
      return found;
    };
    const safetyPillar = ensurePillar('G-008', 'ISO 45001', /safety|occupational health/i);
    const environmentalPillar = ensurePillar('G-009', 'ISO 14001', /environment|sustainab/i);
    const safety = S.goals.find((g: any) => g.id === 'G-007'), env = S.goals.find((g: any) => g.id === 'G-006');
    if (safety && safety.parent === '') { safety.parent = safetyPillar.id; changed = true; }
    if (env && env.parent === '') { env.parent = environmentalPillar.id; changed = true; }
    if (!Array.isArray(S.collapsed)) { S.collapsed = []; changed = true; }
    if (!S.matrixView) { S.matrixView = 'visual'; changed = true; }
    if (!S.cascadeView) { S.cascadeView = 'tree'; changed = true; }
    if (changed) try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  }

  function migrateAdvanced() {
    if (!Array.isArray(S.isoStandards) || !S.isoStandards.length) S.isoStandards = JSON.parse(JSON.stringify(ISO_EXAMPLE_CATALOG));
    if (!S.isoCatalogSource) S.isoCatalogSource = 'Bundled demonstration adapter — no live SafeQMS API connection';
    if (!Array.isArray(S.goalRevisions)) S.goalRevisions = [];
    if (!Array.isArray(S.csvImports)) S.csvImports = [];
    if (!Array.isArray(S.blockers)) {
      S.blockers = JSON.parse(JSON.stringify(seed().blockers));
      const r1 = S.reviews?.find((r: any) => r.id === 'R-001');
      if (r1 && !r1.decisions.some((d: any) => d.blockerId === 'BL-003')) {
        r1.decisions.push({ text: 'Enforce joint Production & Maintenance centerline audit across shifts A/B/C', owner: 'Site Manager', due: '2027-07-25', status: 'Open', blockerId: 'BL-003', linkedType: 'kpi', linkedId: 'K-001' });
      }
    }
    if (!S.blockerFilter) S.blockerFilter = 'active';
    if (!S.sqdcFilter) S.sqdcFilter = 'all';
    const defInits = seed().initiatives;
    for (const i of S.initiatives || []) {
      const def = defInits.find((x: any) => x.id === i.id);
      if (!i.sqdc) i.sqdc = def?.sqdc ? { ...def.sqdc } : { S: 0, Q: 0, D: 1, C: 1 };
      if (!('valueStream' in i)) i.valueStream = def?.valueStream || 'Operational Value Stream';
      if (!('isBottleneck' in i)) i.isBottleneck = def?.isBottleneck ?? false;
    }
    if (!Array.isArray(S.kpiOwners)) {
      S.kpiOwners = JSON.parse(JSON.stringify(seed().kpiOwners));
    } else if (!S.kpiOwners.some((r: any) => r.owner === 'Safety Coordinator') && S.goals?.some((g: any) => g.id === 'G-014' && g.owner === 'Safety Coordinator')) {
      S.kpiOwners.push({ kpi: 'K-008', owner: 'Safety Coordinator', strength: 1, note: 'Shopfloor hazard & 7-day near-miss follow-up coordinator' });
    }
    const ap001 = S.approvals?.find((a: any) => a.id === 'AP-001' && a.goal === 'G-007' && a.status === 'Pending');
    const g007 = S.goals?.find((g: any) => g.id === 'G-007');
    if (ap001 && g007 && (g007.revision || 1) === 1 && g007.approval === 'Approved') {
      g007.approval = 'Pending';
    }
    for (const k of S.kpis) if (!k.source) k.source = 'Demo / manually entered';
    for (const g of S.goals) {
      if (!Array.isArray(g.isoRefs)) {
        let m = (g.iso || '').match(/ISO\s*(9001|14001|45001)[^\d]*(\d+\.\d+)/i);
        let ref = m ? `req-${m[1]}-${m[2]}` : null;
        g.isoRefs = ref && isoRequirement(ref) ? [ref] : [];
      }
      if (!('planWhat' in g)) g.planWhat = '';
      if (!('resources' in g)) g.resources = '';
      if (!('planDue' in g)) g.planDue = '';
      if (!('evaluation' in g)) g.evaluation = '';
      if (!('riskRefs' in g)) g.riskRefs = '';
      if (!('processRefs' in g)) g.processRefs = '';
      if (!('evidenceRefs' in g)) g.evidenceRefs = '';
      if (!g.revision) g.revision = 1;
    }
    if (!S.dailyTier) S.dailyTier = 'tier1';
    if (!S.safetyCross || typeof S.safetyCross !== 'object') S.safetyCross = JSON.parse(JSON.stringify(seed().safetyCross));
    if (!Array.isArray(S.pulseCards)) S.pulseCards = JSON.parse(JSON.stringify(seed().pulseCards));
    const defCards = seed().pulseCards;
    for (const pc of S.pulseCards) {
      const def = defCards.find((x: any) => x.id === pc.id);
      if (pc.details === undefined) pc.details = def?.details || '';
      if (pc.due === undefined) pc.due = def?.due || '';
      if (!Array.isArray(pc.comments)) pc.comments = def?.comments ? JSON.parse(JSON.stringify(def.comments)) : [];
    }
    if (!('myFocusOwner' in S)) S.myFocusOwner = '';
  }

  function cleanFalseCompleteness() {
    let changed = false;
    const fake: Record<string, string> = {
      'Execute coordinated improvement actions and review measurable outcomes.': 'planWhat',
      'Assigned improvement team, process data and management review time.': 'resources',
      'Monthly KPI monitoring and management review.': 'evaluation',
      'RISK-EXAMPLE-01': 'riskRefs',
      'RISK-EHS-01': 'riskRefs'
    };
    for (const g of S.goals) {
      for (const [t, k] of Object.entries(fake)) {
        if (g[k] === t) { g[k] = ''; changed = true; }
      }
      if ((g.processRefs === 'Operations' || g.processRefs === 'Management Process') && !g.processId) {
        g.processRefs = ''; changed = true;
      }
      if (!g.planWhat && !g.resources && !g.evaluation && ['2027-12-31', '2029-12-31'].includes(g.planDue)) {
        g.planDue = ''; changed = true;
      }
    }
    if (!S.demoRole) { S.demoRole = 'General director'; changed = true; }
    if (changed) save();
  }

  function catchballMigrate() {
    if (!Array.isArray(S.catchballs)) {
      S.catchballs = [
        {
          id: 'CB-001', goal: 'G-003', status: 'Awaiting director', recipientScope: 'Department: Production', recipientRole: 'General director', createdAt: '2027-01-15', updatedAt: '2027-01-17', origin: 'Department director',
          proposal: { target: 42, resources: 'Production engineering support · 2 hours/week per team', due: '2027-12-31', reason: 'Reduce average changeover duration from 60 to 42 minutes using SMED.' },
          messages: [
            { id: 'M-001', at: '2027-01-15', by: 'Department director', kind: 'Proposal', text: 'Propose a 30% reduction in changeover time. We need production engineering support and time for trials.', target: 42, resources: 'Production engineering support · 2 hours/week per team' },
            { id: 'M-002', at: '2027-01-17', by: 'Department director', kind: 'Comment', text: 'Current method analysis and baseline evidence will be attached before final approval.' }
          ]
        },
        {
          id: 'CB-002', goal: 'G-002', status: 'Awaiting department', recipientScope: 'Department: Production', recipientRole: 'Department director', createdAt: '2027-01-08', updatedAt: '2027-01-11', origin: 'General director',
          proposal: { target: 75, resources: 'Site OpEx coordination and monthly performance review', due: '2027-12-31', reason: 'Annual site ambition linked to the group Operational Excellence strategy.' },
          messages: [
            { id: 'M-003', at: '2027-01-08', by: 'General director', kind: 'Proposal', text: 'Annual target proposed for Uppsala site, subject to confirmed resources.', target: 75, resources: 'Site OpEx coordination and monthly performance review' },
            { id: 'M-004', at: '2027-01-11', by: 'General director', kind: 'Comment', text: 'Please review this site-level OEE objective and respond with departmental resources or a counterproposal.' }
          ]
        }
      ];
    }
    if (!Array.isArray(S.catchballNotifications)) {
      S.catchballNotifications = [{ id: 'N-001', recipient: 'General director', catchballId: 'CB-001', text: 'Production changeover proposal needs your response', read: false, at: '2027-01-17' }];
    }
    if (!Array.isArray(S.catchballEvents)) S.catchballEvents = [];
    for (const c of S.catchballs) {
      if (!c.recipientScope) c.recipientScope = 'Department: Production';
      if (!c.recipientRole) c.recipientRole = c.origin === 'General director' ? 'Department director' : 'General director';
      if (c.id === 'CB-002' && c.origin === 'General director' && c.status === 'Aligned' && c.messages.length === 2 && c.messages.every((m: any) => m.by === 'General director')) {
        c.status = 'Awaiting department'; c.messages[1].kind = 'Comment';
        c.messages[1].text = 'Please review this site-level OEE objective and respond with departmental resources or a counterproposal.';
      }
      if (c.status === 'Awaiting department') c.turn = 'Department director';
      if (c.status === 'Awaiting director') c.turn = 'General director';
    }
    const topDown = S.catchballs.find((c: any) => c.id === 'CB-002' && c.status === 'Awaiting department');
    if (topDown && !S.catchballNotifications.some((n: any) => n.catchballId === topDown.id && n.recipient === 'Department director')) {
      S.catchballNotifications.push({ id: 'N-' + String(Math.max(0, ...S.catchballNotifications.map((n: any) => Number(n.id.split('-')[1]) || 0)) + 1).padStart(3, '0'), recipient: 'Department director', catchballId: topDown.id, text: 'General director requests your response on ' + (goal(topDown.goal)?.title || 'the goal'), read: false, at: today });
    }
    if (!S.catchballs.some((c: any) => c.id === 'CB-003')) {
      S.catchballs.push({
        id: 'CB-003', goal: 'G-010', status: 'Aligned', recipientScope: 'Department: Quality', recipientRole: 'General director', createdAt: '2027-01-20', updatedAt: '2027-02-04', origin: 'Department director',
        proposal: { target: 96, resources: 'Quality inspection engineering + in-line vision pilot funding', due: '2027-12-31', reason: 'Raise first-time-right yield to 96% and eliminate customer complaints.' },
        messages: [
          { id: 'M-005', at: '2027-01-20', by: 'Department director', kind: 'Proposal', text: 'Target 96% First-Time-Right yield proposed for Uppsala with vision pilot.', target: 96, resources: 'Quality inspection engineering + in-line vision pilot funding' },
          { id: 'M-006', at: '2027-02-04', by: 'General director', kind: 'Agreement', text: 'Strategic alignment agreed. Poka-yoke and vision resources endorsed.' }
        ]
      });
    }
    if (!Array.isArray(S.directorDecisionLog)) S.directorDecisionLog = [];
    if (!Array.isArray(S.directorDecisionNotifications)) S.directorDecisionNotifications = [];
    for (const a of S.approvals || []) {
      if (a.status === 'Pending' && ['General director', 'Site Manager', 'Executive Management'].includes(a.approver)) a.approver = 'General director / QMS auditor';
    }
    save();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {
      toast('Local browser storage is full');
    }
  }

  function esc(x: any) {
    return String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] || c));
  }

  function go(route: string, id?: string) {
    pulseOpenCardId = null;
    pulseDelegateCardId = null;
    location.hash = route + (id ? '/' + id : '');
    render();
  }

  function btn(txt: string, call: string, cls = '') {
    return roleButtonAllowed(call) ? `<button class="btn ${cls}" onclick="${call}">${txt}</button>` : '';
  }

  function badge(x: string) {
    return `<span class="pill ${/approved|active|on track|done|completed|resolved/i.test(x) ? 'green' : /at risk|pending|in progress|draft|in review|high/i.test(x) ? 'amber' : /off track|rejected|overdue|critical|blocked/i.test(x) ? 'red' : 'teal'}">${esc(x)}</span>`;
  }

  function head(title: string, sub = '', buttons = '') {
    return `<div class="crumb">SafeQMS / Goal Management</div><div class="pagehead"><div><h1>${title}</h1><div class="muted small">${sub}</div></div><div class="actions">${buttons}</div></div>`;
  }

  function panel(title: string, content: string) {
    return `<section class="panel"><h2>${title}</h2>${content}</section>`;
  }

  function table(headers: string[], rows: string[]) {
    return `<div class="tablewrap"><table><thead><tr>${headers.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="muted" style="text-align:center;padding:28px">No records</td></tr>`}</tbody></table></div>`;
  }

  function field(label: string, name: string, value: any = '', type = 'text', extra = '') {
    return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
  }

  function select(label: string, name: string, opts: any[], val: any) {
    return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(x => { let v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select></div>`;
  }

  function goal(id: string) {
    return S.goals.find((g: any) => g.id === id);
  }

  function kpi(id: string) {
    return S.kpis.find((k: any) => k.id === id);
  }

  function initiative(id: string) {
    return S.initiatives.find((i: any) => i.id === id);
  }

  function last(k: any) {
    return k?.values[k.values.length - 1] ?? null;
  }

  function toast(m: string) {
    let e = document.getElementById('toast');
    if (!e) return;
    e.textContent = m;
    e.style.display = 'block';
    setTimeout(() => { if (e) e.style.display = 'none'; }, 2500);
  }

  const SAFEQMS_ROLES = ['Administratör', 'General director', 'Department director', 'QMS auditor', 'Auditor', 'Basic user'];
  const ROUTE_GROUP: Record<string, string> = {
    overview: 'overview',
    daily: 'daily', myfocus: 'daily',
    strategy: 'strategy', pillars: 'strategy', cascade: 'strategy', matrix: 'strategy', a3: 'strategy', goal: 'strategy', newgoal: 'strategy',
    execution: 'execution', projects: 'execution', project: 'execution', initiative: 'execution', newinitiative: 'execution',
    performance: 'performance', kpis: 'performance', import: 'performance',
    alignment: 'alignment', catchball: 'alignment', catchballitem: 'alignment', catchballnew: 'alignment', reviews: 'alignment', review: 'alignment', newreview: 'alignment', approvals: 'alignment',
    compliance: 'compliance', iso: 'compliance', evidence: 'compliance', management: 'compliance', settings: 'settings'
  };

  const role = () => S.demoRole || 'General director';
  const isAdmin = () => role() === 'Administratör';
  const isGeneral = () => role() === 'General director';
  const isDirector = () => role() === 'Department director';
  const isQMS = () => role() === 'QMS auditor';
  const isLeadership = () => isGeneral() || isQMS();
  const leadershipRole = (x: string) => x === 'General director' || x === 'QMS auditor';
  const isAuditor = () => role() === 'Auditor';
  const isBasic = () => role() === 'Basic user';
  const limitedRole = () => isDirector() || isAuditor() || isBasic();

  const ASSIGNED_DEPARTMENT = 'Department: Production';
  const ASSIGNED_SITE = 'Site: Uppsala';

  function visibleInitiative(i: any) {
    return !limitedRole() || (visibleToRole(goal(i.goal)) && (i.goal === 'G-003' || goal(i.goal)?.level === 'Site: Uppsala' || goal(i.goal)?.level === 'Organization'));
  }
  function visibleProject(p: any) {
    return visibleInitiative(initiative(p.initiative) || { goal: '' });
  }

  const roleCan = (verb: string, obj?: any): boolean => {
    if (verb === 'config') return isAdmin();
    if (verb === 'approve') return isLeadership();
    if (verb === 'evidence') return !isBasic();
    if (verb === 'viewISO') return !isBasic();
    if (verb === 'reviewWrite') return isAdmin() || isLeadership() || isDirector();
    if (verb === 'reviewPrepare') return isAdmin() || isLeadership();
    if (verb === 'goalCreate') return isAdmin() || isLeadership() || (isDirector() && (!obj || obj.level === ASSIGNED_DEPARTMENT));
    if (verb === 'goalEdit') return isAdmin() || isLeadership() || (isDirector() && obj?.level === ASSIGNED_DEPARTMENT);
    if (verb === 'matrixEdit') {
      if (isAdmin() || isLeadership()) return true;
      if (!isDirector()) return false;
      const gid = obj?.from?.startsWith('G-') ? obj.from : initiative(obj?.from)?.goal;
      return !!gid && goal(gid)?.level === ASSIGNED_DEPARTMENT;
    }
    if (verb === 'initiativeWrite') return isAdmin() || isLeadership() || (isDirector() && (!obj || goal(obj.goal)?.level === ASSIGNED_DEPARTMENT));
    if (verb === 'projectWrite') return isAdmin() || isLeadership() || (isDirector() && (!obj || roleCan('initiativeWrite', initiative(obj.initiative))));
    if (verb === 'kpiWrite') return isAdmin() || isLeadership() || (isDirector() && obj?.id === 'K-002');
    if (verb === 'taskOwn') return isBasic() && obj?.owner === 'Team Leader';
    if (verb === 'readAll') return !limitedRole();
    return false;
  };

  function visibleToRole(g: any) {
    if (!g) return false;
    if (!limitedRole()) return true;
    if (isDirector()) return g.level === 'Organization' || g.level === ASSIGNED_SITE || g.level === ASSIGNED_DEPARTMENT;
    if (isAuditor()) return g.level === 'Organization' || g.level === ASSIGNED_SITE || g.level === ASSIGNED_DEPARTMENT;
    return g.approval === 'Approved' && (g.level === 'Organization' || g.level === ASSIGNED_SITE || g.level === ASSIGNED_DEPARTMENT);
  }

  function roleVisibleGoals() {
    let gs = S.goals.filter(visibleToRole);
    if (S.scope === 'Organization') return gs;
    return gs.filter((g: any) => g.level === 'Organization' || xm4ScopeIncludes(g));
  }

  function roleScopebar() {
    let scopes = ['Organization', 'Site: Uppsala', 'Site: Falkenberg', 'Department: Production', 'Department: Maintenance', 'Department: Quality'];
    if (limitedRole()) scopes = ['Organization', ASSIGNED_SITE, ASSIGNED_DEPARTMENT];
    if (!scopes.includes(S.scope)) S.scope = limitedRole() ? ASSIGNED_DEPARTMENT : 'Organization';
    return `<div class="toolbar no-print"><select aria-label="Organizational scope" onchange="window.setScope(this.value)">${scopes.map(s => `<option ${S.scope === s ? 'selected' : ''}>${s}</option>`).join('')}</select><select aria-label="Strategy period" onchange="window.setYear(this.value)">${['2027', '2028', '2029'].map(y => `<option ${S.year === y ? 'selected' : ''}>${y}</option>`).join('')}</select><span class="muted small" style="align-self:center">${limitedRole() ? 'Assigned demo unit: Uppsala / Production' : 'Organization-wide demo access'} · Sample data</span></div>`;
  }

  function roleButtonAllowed(call: string) {
    if (!S || !S.demoRole) return true;
    const x = String(call || '');
    if (/go\('newgoal'.*'main'/.test(x)) return roleCan('goalCreate', { level: 'Organization' });
    if (/go\('newgoal'/.test(x)) return roleCan('goalCreate');
    if (/go\('newinitiative'/.test(x)) return roleCan('initiativeWrite');
    if (/go\('newreview'/.test(x)) return roleCan('reviewWrite');
    if (/go\('import'/.test(x)) return isAdmin() || isLeadership() || isDirector();
    if (/go\('settings'/.test(x)) return isAdmin();
    if (/submitGoal\(/.test(x)) { let id = (x.match(/'(G-[^']+)'/) || [])[1]; return roleCan('goalEdit', goal(id)); }
    if (/decide\(/.test(x)) return roleCan('approve');
    if (/revisePlan\(/.test(x)) return roleCan('config') || roleCan('approve');
    if (/cycleLink\(/.test(x)) return roleCan('matrixEdit');
    if (/go\('goal'/.test(x)) return true;
    if (/focusParent\(/.test(x)) { let id = (x.match(/'(G-[^']+)'/) || [])[1]; return roleCan('goalEdit', goal(id)); }
    if (/saveProjectA3\(|addTask\(/.test(x)) {
      let pid = (x.match(/'(P-[^']+)'/) || [])[1];
      return roleCan('projectWrite', pid ? S.projects.find((p: any) => p.id === pid) : undefined);
    }
    if (/toggleTaskStatus\(/.test(x)) {
      let tid = (x.match(/'(T-[^']+)'/) || [])[1];
      let t = tid ? (S.tasks || []).find((y: any) => y.id === tid) : null;
      return roleCan('projectWrite', t ? S.projects.find((p: any) => p.id === t.project) : undefined);
    }
    if (/recordKPI\(/.test(x)) { let id = (x.match(/'(K-[^']+)'/) || [])[1]; return roleCan('kpiWrite', kpi(id)); }
    if (/prepareManagementReview\(/.test(x)) return roleCan('reviewPrepare');
    if (/escalateBlocker\(/.test(x)) {
      const m = x.match(/'([^']+)','([^']+)'/);
      return m ? canEscalateTarget(m[1], m[2]) : (isAdmin() || isLeadership() || isDirector());
    }
    if (/resolveBlocker\(|reopenBlocker\(|convertToPdcaDecision\(|quickAddReviewDecision\(/.test(x)) return roleCan('reviewWrite');
    if (/xm3OwnerCycle\(|xm3OwnerNote\(/.test(x)) return isAdmin() || isLeadership() || isDirector();
    if (/updateInitiativeFocus\(/.test(x)) return roleCan('initiativeWrite');
    if (/restoreDemoISO\(|downloadISOSample\(|resetDemo\(|exportData\(/.test(x)) return isAdmin();
    if (/exportEvidence\(/.test(x)) return roleCan('evidence');
    if (/toggleSafetyDay\(|createPulseCard\(|togglePulseCardDone\(|toggleDailyTask\(|escalatePulseCard\(|openPulseDelegate\(|closePulseDelegate\(|delegatePulseCard\(|savePulseCardDetails\(|addPulseCardComment\(/.test(x)) return !isAuditor();
    return true;
  }

  function setRole(name: string) {
    if (!SAFEQMS_ROLES.includes(name)) return;
    S.demoRole = name;
    if (limitedRole() && !['Organization', ASSIGNED_SITE, ASSIGNED_DEPARTMENT].includes(S.scope)) S.scope = ASSIGNED_DEPARTMENT;
    save();
    let current = (location.hash.slice(1) || 'overview').split('/')[0];
    if (!allowedRoute(current)) go('overview');
    else render();
    toast('Role preview: ' + name);
  }

  function allowedRoute(r: string) {
    if (r === 'settings' || r === 'integration') return isAdmin();
    if (['catchball', 'catchballitem', 'catchballnew'].includes(r)) return !isBasic() && (r !== 'catchballnew' || isLeadership() || isDirector());
    if (r === 'import') return isAdmin() || isLeadership() || isDirector();
    if (['newgoal'].includes(r)) return roleCan('goalCreate');
    if (['newinitiative'].includes(r)) return roleCan('initiativeWrite');
    if (['newreview'].includes(r)) return roleCan('reviewWrite');
    if (['iso', 'evidence', 'management', 'compliance'].includes(r)) return roleCan('viewISO');
    if (r === 'approvals') return !isBasic();
    if (r === 'alignment' || r === 'reviews' || r === 'review') return !isBasic() || r === 'reviews';
    return true;
  }

  const roleTabs: Record<string, string[][]> = {
    daily: [['Tier 1–3 Pulse Board', 'daily'], ['My Focus', 'myfocus']],
    strategy: [['Main Goals', 'pillars'], ['Goal Cascade', 'cascade'], ['X-Matrix', 'matrix'], ['Strategy A3', 'a3']],
    execution: [['Portfolio & Projects', 'projects']],
    performance: [['KPI & Bowling Chart', 'kpis'], ['CSV Import', 'import']],
    alignment: [['Catchball & Alignment', 'catchball'], ['PDCA Reviews', 'reviews'], ['Formal Approvals', 'approvals']],
    compliance: [['ISO Goal Compliance', 'iso'], ['Audit Evidence Pack', 'evidence'], ['Management Review Inputs', 'management']]
  };

  function workspaceTabs(group: string, active: string) {
    return `<div class="workspace-tabs no-print">${(roleTabs[group] || []).filter(([_, r]) => allowedRoute(r)).map(([label, r]) => `<button class="workspace-tab ${active === r ? 'active' : ''}" onclick="go('${r}')">${label}</button>`).join('')}</div>`;
  }

  function roleBanner() {
    return `<div class="role-banner no-print"><div><b>${esc(role())}</b><span class="pill">Role preview</span><div class="xs" style="margin-top:2px">${isAdmin() ? 'Configure all · formal approval requires General director or QMS auditor authority' : isGeneral() ? 'Organization strategy, all approvals and QMS decision notifications' : isDirector() ? 'Assigned unit: Uppsala / Production · create, propose, execute' : isQMS() ? 'Full strategy creation and approval · ISO responsibility · director substitute' : isAuditor() ? 'Read-only audit review within assigned scope' : 'Published goals · own assigned activities only'}</div></div><span class="small muted">Demo permissions — not backend security</span></div>`;
  }

  function isoRequirement(id: string) {
    for (const s of S.isoStandards || ISO_EXAMPLE_CATALOG) {
      for (const r of s.requirements || []) {
        if (r.id === id) return { ...r, standard: s.code, edition: s.edition, standardId: s.id };
      }
    }
    return null;
  }

  function isoName(id: string) {
    let r = isoRequirement(id);
    return r ? `${r.standard} · ${r.number} — ${r.title}` : 'Unknown requirement (relink needed)';
  }

  function isoShort(g: any) {
    return (g.isoRefs || []).map((id: string) => {
      let r = isoRequirement(id);
      return r ? `${r.standard} §${r.number}` : 'Missing ISO ID';
    }).join(' · ') || 'Not linked';
  }

  function goalPlanCheck(g: any) {
    let fields: [string, string, any][] = [
      ['title', 'Goal defined', g.title],
      ['owner', 'Accountable owner', g.owner],
      ['kpi', 'Measurable KPI linked', kpi(g.kpi)],
      ['isoRefs', 'ISO requirement reference', (g.isoRefs || []).length],
      ['planWhat', 'What will be done', g.planWhat],
      ['resources', 'Required resources', g.resources],
      ['planDue', 'When it will be completed', g.planDue],
      ['evaluation', 'How results will be evaluated', g.evaluation]
    ];
    if (g.level !== 'Organization') fields.push(['parent', 'Primary parent goal', g.parent]);
    return {
      checks: fields.map(([key, label, v]) => ({ key, label, ok: !!v })),
      ready: fields.every(([, , v]) => !!v)
    };
  }

  function goalEvidenceCheck(g: any) {
    return {
      riskLinked: !!(g.riskRefs || '').trim(),
      processLinked: !!(g.processRefs || '').trim(),
      evidenceLinked: !!(g.evidenceRefs || '').trim(),
      hasActual: kpi(g.kpi)?.values?.some((v: any) => v !== null && v !== undefined) || false
    };
  }

  function planningUI(g: any) {
    let x = goalPlanCheck(g), failed = x.checks.filter(a => !a.ok);
    return `<div class="split"><b>Goal Planning Completeness</b>${x.ready ? '<span class="isoem">Complete</span>' : `<span class="isoem warn">${failed.length} missing</span>`}</div><div class="readygrid" style="margin-top:10px">${x.checks.map(c => `<div class="readyitem ${c.ok ? '' : 'missing'}">${c.ok ? '✓' : '!'} ${esc(c.label)}</div>`).join('')}</div><p class="xs muted">This checks planning completeness, not ISO certification or proof of conformity.</p>`;
  }

  function computeKpiStatus(k: any) {
    if (!k || !Array.isArray(k.values)) return { label: 'Not measured', gap: null };
    let n = -1;
    for (let i = k.values.length - 1; i >= 0; i--) {
      if (k.values[i] !== null && k.values[i] !== undefined && Number.isFinite(Number(k.values[i]))) {
        n = i;
        break;
      }
    }
    if (n < 0 || k.targets[n] === null || k.targets[n] === undefined || !Number.isFinite(Number(k.targets[n]))) {
      return { label: 'Not measured', gap: null };
    }
    let actual = Number(k.values[n]), target = Number(k.targets[n]), direction = k.direction || 'higher', tolerance = Math.max(0, Number(k.tolerance) || 0);
    let gap = direction === 'lower' ? target - actual : direction === 'range' ? -Math.abs(actual - target) : actual - target;
    let label = gap >= 0 ? 'On track' : gap >= -tolerance ? 'At risk' : 'Off track';
    return { label, gap, actual, target, month: n, unit: k.unit, direction, tolerance };
  }

  function initiativeLinkedToGoal(i: any, goalId: string) {
    return i?.goal === goalId || S.relations.some((r: any) => r.from === goalId && r.to === i?.id && r.strength > 0);
  }

  function syncKpiTargetsFromGoal(g: any) {
    const k = kpi(g?.kpi);
    if (!k || !Number.isFinite(Number(g?.target))) return;
    const hasMoreSpecificGoal = g.level === 'Organization' && S.goals.some((x: any) => x.id !== g.id && x.level !== 'Organization' && x.kpi === g.kpi);
    if (hasMoreSpecificGoal) return;
    if (!Array.isArray(k.targets)) k.targets = [];
    while (k.targets.length < 12) k.targets.push(Number(g.target));
    let lastIdx = -1;
    if (Array.isArray(k.values)) {
      for (let i = k.values.length - 1; i >= 0; i--) {
        if (k.values[i] !== null && k.values[i] !== undefined && Number.isFinite(Number(k.values[i]))) {
          lastIdx = i;
          break;
        }
      }
    }
    const startIdx = lastIdx >= 0 ? lastIdx : 0;
    for (let i = startIdx; i < 12; i++) k.targets[i] = Number(g.target);
  }

  function syncExecutionProgress(projectId?: string) {
    const projectsToSync = projectId ? S.projects.filter((p: any) => p.id === projectId) : S.projects;
    const touchedInitiatives = new Set<string>();
    for (const p of projectsToSync) {
      const ts = (S.tasks || []).filter((t: any) => t.project === p.id);
      if (ts.length) {
        const score = ts.reduce((acc: number, t: any) => acc + (t.status === 'Done' ? 1 : t.status === 'In progress' ? 0.5 : 0), 0);
        p.progress = Math.round((score / ts.length) * 100);
        if (p.progress === 100 && p.status !== 'Completed') p.status = 'Completed';
        else if (p.progress < 100 && p.status === 'Completed') p.status = 'On track';
      }
      if (p.initiative) touchedInitiatives.add(p.initiative);
    }
    for (const initId of touchedInitiatives) {
      const i = initiative(initId);
      if (!i) continue;
      const ps = (S.projects || []).filter((p: any) => p.initiative === initId);
      if (ps.length) {
        i.progress = Math.round(ps.reduce((sum: number, p: any) => sum + Number(p.progress || 0), 0) / ps.length);
        if (i.progress === 100 && i.status !== 'Completed') i.status = 'Completed';
        else if (i.progress < 100 && i.status === 'Completed') i.status = 'On track';
      }
    }
  }

  function syncGoalPerformance() {
    let changed = false;
    for (const g of S.goals) {
      let n = computeKpiStatus(kpi(g.kpi)).label;
      if (g.performance !== n) { g.performance = n; changed = true; }
    }
    if (changed) save();
  }

  function syncBlockerLifecycle() {
    if (!Array.isArray(S.blockers)) return;
    let changed = false;
    for (const b of S.blockers) {
      if (b.reviewId && typeof b.decisionIndex === 'number') {
        const rev = S.reviews.find((r: any) => r.id === b.reviewId);
        const dec = rev?.decisions?.[b.decisionIndex];
        if (dec) {
          if (dec.status === 'Done' && b.status !== 'Resolved') {
            b.status = 'Resolved';
            b.resolvedAt = today;
            b.resolutionNote = b.resolutionNote || `Resolved via PDCA decision in ${rev.id}`;
            changed = true;
          } else if (dec.status === 'Open' && b.status === 'Resolved') {
            b.status = 'In review';
            delete b.resolvedAt;
            changed = true;
          }
        }
      }
      if (Array.isArray(S.pulseCards)) {
        for (const pc of S.pulseCards) {
          if (pc.blockerId === b.id) {
            if (!Array.isArray(pc.comments)) pc.comments = [];
            if (b.status === 'Resolved' && pc.status !== 'Done') {
              pc.status = 'Done';
              pc.comments.push({ by: 'PDCA / Blocker Sync', at: today, text: `✓ Closed via Blocker ${b.id}${b.resolutionNote ? ': ' + b.resolutionNote : ''}` });
              changed = true;
            } else if (b.status !== 'Resolved' && pc.status === 'Done') {
              pc.status = pc.delegatedBy ? 'Team action' : 'Escalated';
              pc.comments.push({ by: 'PDCA / Blocker Sync', at: today, text: `Reopened via Blocker ${b.id}` });
              changed = true;
            }
          }
        }
      }
    }
    if (changed) save();
  }

  function blockerTargetInfo(targetType: string, targetId: string) {
    if (targetType === 'initiative') {
      const i = initiative(targetId);
      const g = i ? goal(i.goal) : null;
      return {
        title: i?.title || targetId,
        code: targetId,
        typeLabel: 'Initiative',
        scope: g?.level || 'Organization',
        owner: i?.owner || g?.owner || 'Initiative Owner',
        status: i?.status || 'Unknown',
        route: 'initiative',
        routeId: targetId,
        goal: g
      };
    }
    if (targetType === 'project') {
      const p = S.projects.find((x: any) => x.id === targetId);
      const i = p ? initiative(p.initiative) : null;
      const g = i ? goal(i.goal) : null;
      return {
        title: p?.title || targetId,
        code: targetId,
        typeLabel: 'Project A3',
        scope: g?.level || 'Organization',
        owner: p?.owner || i?.owner || 'Project Leader',
        status: p?.status || 'Unknown',
        route: 'project',
        routeId: targetId,
        goal: g
      };
    }
    if (targetType === 'kpi') {
      const k = kpi(targetId);
      const linkedGoals = S.goals.filter((g: any) => g.kpi === targetId);
      const primaryGoal = linkedGoals.find((g: any) => g.level !== 'Organization') || linkedGoals[0] || null;
      const st = computeKpiStatus(k);
      return {
        title: k?.name || targetId,
        code: targetId,
        typeLabel: 'KPI',
        scope: primaryGoal?.level || 'Organization',
        owner: primaryGoal?.owner || 'KPI Owner',
        status: st.label,
        route: 'kpis',
        routeId: targetId,
        goal: primaryGoal
      };
    }
    const g = goal(targetId);
    return {
      title: g?.title || targetId,
      code: targetId,
      typeLabel: 'Goal',
      scope: g?.level || 'Organization',
      owner: g?.owner || 'Goal Owner',
      status: g?.performance || 'Unknown',
      route: 'goal',
      routeId: targetId,
      goal: g
    };
  }

  function blockerAllowedByRole(b: any) {
    if (!limitedRole()) return true;
    const info = blockerTargetInfo(b.targetType, b.targetId);
    if (info.goal) return visibleToRole(info.goal);
    return [ASSIGNED_DEPARTMENT, ASSIGNED_SITE, 'Organization'].includes(b.scope);
  }

  function blockerMatchesScope(scope: string, activeScope: string) {
    if (!activeScope || activeScope === 'Organization') return true;
    if (scope === activeScope || scope === 'Organization') return true;
    if (activeScope.startsWith('Department:') && scope === ASSIGNED_SITE) return true;
    if (activeScope === ASSIGNED_SITE && scope.startsWith('Department:')) return true;
    return false;
  }

  function canEscalateTarget(targetType: string, targetId: string) {
    if (isAdmin() || isLeadership()) return true;
    if (!isDirector()) return false;
    if (targetType === 'initiative') return visibleInitiative(initiative(targetId) || { goal: '' });
    if (targetType === 'project') return visibleProject(S.projects.find((p: any) => p.id === targetId) || { initiative: '' });
    if (targetType === 'kpi') return S.goals.some((g: any) => visibleToRole(g) && g.kpi === targetId);
    const g = goal(targetId);
    return !!g && (g.level === ASSIGNED_DEPARTMENT || g.level === ASSIGNED_SITE);
  }

  function computeKpiStreak(k: any) {
    if (!k || !Array.isArray(k.values)) return 0;
    let streak = 0;
    for (let i = k.values.length - 1; i >= 0; i--) {
      const a = k.values[i], t = k.targets?.[i];
      if (a === null || a === undefined || t === null || t === undefined) continue;
      const gap = (k.direction || 'higher') === 'lower' ? Number(t) - Number(a) : Number(a) - Number(t);
      if (gap < 0) streak++;
      else break;
    }
    return streak;
  }

  function hasOpenReviewDecision(targetType: string, targetId: string) {
    for (const r of S.reviews || []) {
      const idx = (r.decisions || []).findIndex((d: any) => d.status === 'Open' && d.linkedType === targetType && d.linkedId === targetId);
      if (idx >= 0) return { reviewId: r.id, decisionIndex: idx, decision: r.decisions[idx] };
    }
    return null;
  }

  function detectAutoSignals(activeScope = S.scope, respectScope = true) {
    const signals: any[] = [];
    const activeManualKeys = new Set((S.blockers || []).filter((b: any) => b.status !== 'Resolved').map((b: any) => `${b.targetType}:${b.targetId}`));

    for (const k of S.kpis || []) {
      const st = computeKpiStatus(k);
      const streak = computeKpiStreak(k);
      if (st.label === 'Off track' || (st.label === 'At risk' && streak >= 2)) {
        const info = blockerTargetInfo('kpi', k.id);
        if (limitedRole() && info.goal && !visibleToRole(info.goal)) continue;
        if (respectScope && !blockerMatchesScope(info.scope, activeScope)) continue;
        const linkedRev = hasOpenReviewDecision('kpi', k.id);
        signals.push({
          id: `AUTO-KPI-${k.id}`,
          isAuto: true,
          targetType: 'kpi',
          targetId: k.id,
          scope: info.scope,
          category: st.label === 'Off track' ? 'Off-track KPI' : 'Recurring KPI Risk',
          severity: st.label === 'Off track' ? 'Critical' : 'High',
          summary: `${k.name}: actual ${st.actual} ${k.unit} vs target ${st.target} ${k.unit} (gap ${st.gap !== null ? Number(st.gap).toFixed(1) : '—'}, ${streak} consecutive month${streak === 1 ? '' : 's'} adverse).`,
          neededAction: `Investigate root cause and agree corrective countermeasures in PDCA Review.`,
          owner: info.owner,
          status: linkedRev ? 'In review' : 'Open',
          reviewId: linkedRev?.reviewId,
          hasManualBlocker: activeManualKeys.has(`kpi:${k.id}`),
          kpiStatus: st.label
        });
      }
    }

    for (const i of S.initiatives || []) {
      if (i.status === 'At risk' && visibleInitiative(i)) {
        const info = blockerTargetInfo('initiative', i.id);
        if (respectScope && !blockerMatchesScope(info.scope, activeScope)) continue;
        if (activeManualKeys.has(`initiative:${i.id}`)) continue;
        const linkedRev = hasOpenReviewDecision('initiative', i.id);
        signals.push({
          id: `AUTO-INIT-${i.id}`,
          isAuto: true,
          targetType: 'initiative',
          targetId: i.id,
          scope: info.scope,
          category: 'At-risk Initiative',
          severity: 'High',
          summary: `${i.title} is flagged At risk (${i.progress}% executed) without a logged blocker escalation.`,
          neededAction: `Verify delivery barriers or escalate specific resource needs to PDCA Review.`,
          owner: i.owner,
          status: linkedRev ? 'In review' : 'Open',
          reviewId: linkedRev?.reviewId,
          hasManualBlocker: false
        });
      }
    }
    return signals;
  }

  function pdcaExceptionQueue(activeScope = S.scope, respectScope = true) {
    const manual = (S.blockers || [])
      .filter((b: any) => b.status !== 'Resolved' && blockerAllowedByRole(b) && (!respectScope || blockerMatchesScope(b.scope, activeScope)))
      .map((b: any) => ({ ...b, isAuto: false }));
    const auto = detectAutoSignals(activeScope, respectScope);
    const sevOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2 };
    return [...manual, ...auto].sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));
  }

  function itemBlockers(targetType: string, targetId: string, includeResolved = false) {
    return (S.blockers || []).filter((b: any) => b.targetType === targetType && b.targetId === targetId && (includeResolved || b.status !== 'Resolved'));
  }

  function blockerBoxHtml(b: any, showTargetLink = false) {
    const info = blockerTargetInfo(b.targetType, b.targetId);
    const sevCls = b.status === 'Resolved' ? 'resolved' : b.severity === 'Critical' ? '' : b.severity === 'High' ? 'high' : 'medium';
    const kpiLive = b.targetType === 'kpi' ? computeKpiStatus(kpi(b.targetId)) : null;
    const readyHint = b.status !== 'Resolved' && kpiLive?.label === 'On track' ? `<span class="pill green">KPI now On track · Ready to close</span>` : '';
    return `<div class="bl-box ${sevCls}">
      <div class="bl-box-head">
        <div class="bl-box-meta">
          ${b.isAuto ? `<span class="pill red">⚠ Auto Exception</span>` : `<span class="pill teal">⚑ ${esc(b.id)}</span>`}
          ${badge(b.severity)}
          <span class="pill">${esc(b.category)}</span>
          ${badge(b.status)}
          ${readyHint}
          ${b.reviewId ? `<button class="link xs" onclick="go('review','${esc(b.reviewId)}')">Linked to ${esc(b.reviewId)}</button>` : ''}
        </div>
        <span class="xs muted">${esc(b.scope)} · Owner: <b>${esc(b.owner)}</b>${b.raisedAt ? ' · ' + esc(b.raisedAt) : ''}</span>
      </div>
      ${showTargetLink ? `<div style="margin-top:7px"><button class="link" onclick="go('${info.route}','${info.routeId}')"><b>${esc(info.typeLabel)} ${esc(info.code)}: ${esc(info.title)}</b></button></div>` : ''}
      <p style="margin:6px 0 4px"><b>Blocker / Gap:</b> ${esc(b.summary)}</p>
      <div class="bl-need"><b>Needed PDCA Support:</b> ${esc(b.neededAction)}</div>
      ${b.status === 'Resolved' && b.resolutionNote ? `<p class="xs muted" style="margin:7px 0 0"><b>Resolution (${esc(b.resolvedAt || today)}):</b> ${esc(b.resolutionNote)}</p>` : ''}
      <div class="actions no-print" style="margin-top:9px">
        ${b.status === 'Open' ? btn('→ Convert to PDCA Decision', `window.convertToPdcaDecision('${esc(b.isAuto ? '' : b.id)}','${esc(b.targetType)}','${esc(b.targetId)}')`, 'primary') : ''}
        ${!b.isAuto && b.status !== 'Resolved' ? btn('✓ Mark resolved', `window.resolveBlocker('${esc(b.id)}')`, 'teal') : ''}
        ${!b.isAuto && b.status === 'Resolved' ? btn('Reopen', `window.reopenBlocker('${esc(b.id)}')`) : ''}
        ${b.isAuto && !b.hasManualBlocker ? btn('⚑ Add manual escalation context', `window.escalateBlocker('${esc(b.targetType)}','${esc(b.targetId)}')`) : ''}
      </div>
    </div>`;
  }

  function blockerSectionHtml(targetType: string, targetId: string, heading = 'Escalated Blockers & PDCA Exceptions') {
    const active = itemBlockers(targetType, targetId, false);
    const resolved = itemBlockers(targetType, targetId, true).filter((b: any) => b.status === 'Resolved');
    const auto = detectAutoSignals('Organization', false).filter((a: any) => a.targetType === targetType && a.targetId === targetId && !a.hasManualBlocker);
    const canEsc = canEscalateTarget(targetType, targetId);
    const headerBtn = canEsc ? btn('⚑ Escalate blocker to PDCA', `window.escalateBlocker('${targetType}','${targetId}')`, 'primary') : '';
    const emptyMsg = !active.length && !auto.length
      ? `<p class="small muted">No active blockers escalated for this record. Use <b>Escalate blocker to PDCA</b> whenever resource bottlenecks, budget variances or cross-functional obstacles require leadership intervention.</p>`
      : '';
    return panel(`${heading}${active.length ? `<span class="bl-queue-count">${active.length}</span>` : ''}`,
      `<div class="split" style="margin-bottom:11px"><span class="xs muted">Hoshin Implementation Review · Escalated issues feed directly into PDCA Reviews & Management Attention.</span>${headerBtn}</div>` +
      emptyMsg +
      active.map((b: any) => blockerBoxHtml(b, false)).join('') +
      auto.map((a: any) => blockerBoxHtml(a, false)).join('') +
      (resolved.length ? `<details style="margin-top:8px"><summary class="xs muted" style="cursor:pointer">Resolved blockers (${resolved.length})</summary><div style="margin-top:8px">${resolved.map((b: any) => blockerBoxHtml(b, false)).join('')}</div></details>` : '')
    );
  }

  function newISORefs(g: any) {
    let ids = new Set(g.isoRefs || []);
    return `<div class="isohead"><b>Applicable ISO Requirements</b><span class="pill teal">Linked to existing SafeQMS ISO module</span></div><p class="xs muted">Select one or several requirement IDs. The list below is demonstration reference data; production reads your real ISO Standards records.</p>
    <div class="filterbar"><label class="small">Filter standard <select id="standardFilter" onchange="window.filterISORequirements()"><option value="">All available standards</option>${S.isoStandards.map((s: any) => `<option value="${esc(s.id)}">${esc(s.code)}</option>`).join('')}</select></label></div>
    <div class="isogrid" id="isoReqList">${S.isoStandards.map((s: any) => (s.requirements || []).map((r: any) => `<div class="isoreq" data-standard="${esc(s.id)}"><label><input type="checkbox" name="isoRefs" value="${esc(r.id)}" ${ids.has(r.id) ? 'checked' : ''}><span><b>${esc(s.code)} · ${esc(r.number)}</b> ${esc(r.title)}</span></label><small>${esc(s.edition)}</small></div>`).join('')).join('')}</div>`;
  }

  function overview() {
    let vg = roleVisibleGoals(), open = isBasic() ? 0 : S.approvals.filter((a: any) => a.status === 'Pending' && visibleToRole(goal(a.goal))).length;
    const exceptions = pdcaExceptionQueue(S.scope, true);
    const openBlockers = (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && blockerAllowedByRole(b) && blockerMatchesScope(b.scope, S.scope));
    const attentionRows = [
      ...exceptions.slice(0, 4).map((e: any) => {
        const info = blockerTargetInfo(e.targetType, e.targetId);
        return `<div class="minirow">${e.isAuto ? '⚠' : '⚑'} <button class="link" onclick="go('${info.route}','${info.routeId}')"><b>${esc(info.code)} · ${esc(info.title)}</b></button> ${badge(e.severity)} ${e.reviewId ? `<span class="pill teal">${esc(e.reviewId)}</span>` : ''}<div class="xs muted" style="margin-top:3px">${esc(e.summary)}</div></div>`;
      }),
      ...(open > 0 ? [`<div class="minirow">◷ <button class="link" onclick="go('approvals')"><b>${open} goal(s) awaiting formal approval</b></button></div>`] : [])
    ];
    const basicTasks = isBasic() ? S.tasks.filter((t: any) => roleCan('taskOwn', t) && t.status !== 'Done') : [];
    const basicCards = isBasic() ? (S.pulseCards || []).filter((c: any) => c.status !== 'Done' && String(c.owner || '').toLowerCase() === 'team leader') : [];
    return head(
      isBasic() ? 'My Goals & Actions' : isDirector() ? 'Department Goal Overview' : isAuditor() ? 'Assigned Audit Scope' : isQMS() ? 'QMS Strategy & ISO Overview' : 'Strategy Overview',
      'From long-term ambition to measurable execution',
      btn('+ New goal', "go('newgoal')", 'primary') + btn('Manage Main Goals', "go('pillars')") + btn('Open X-Matrix', "go('matrix')", 'teal') + btn('Sync Demo Strategy', 'window.loadSyncDemo()', 'teal') + btn('ISO Compliance', "go('iso')")
    ) + roleScopebar() +
    `${strategicPillarCards(true)}<div class="cards">${[
      ['Strategic & Annual Goals', vg.length, 'Aligned across levels'],
      ['On Track', vg.filter((g: any) => g.performance === 'On track').length, 'Performance status'],
      ['Active Initiatives', S.initiatives.filter((i: any) => visibleInitiative(i) && i.status !== 'Planned').length, 'Projects in execution'],
      [isBasic() ? 'My Actions' : 'Escalated Blockers', isBasic() ? (basicTasks.length + basicCards.length) : openBlockers.length, isBasic() ? `${basicTasks.length} tasks · ${basicCards.length} kanban` : `${exceptions.filter(e => e.isAuto).length} red/at-risk signals · ${open} approvals`]
    ].map(c => `<div class="card"><div class="label">${c[0]}</div><div class="num">${c[1]}</div><div class="xs muted">${c[2]}</div></div>`).join('')}</div>
    <div class="grid2">${panel('Strategic Priorities', table(['Goal', 'Level', 'Performance'], vg.slice(0, 7).map((g: any) => `<tr class="click" onclick="go('goal','${g.id}')"><td><b>${esc(g.title)}</b><div class="xs muted">${g.id}</div></td><td class="small">${esc(g.level)}</td><td>${badge(g.performance)}</td></tr>`)))}
    ${isBasic() ? panel('My Assigned Actions', [
      ...basicCards.map((c: any) => `<div class="minirow"><button class="link" onclick="window.openPulseCardFromFocus('${esc(c.id)}')"><b>${esc(c.title)}</b></button> <span class="pill ${c.delegatedBy ? 'teal' : 'amber'}">${c.delegatedBy ? '↳ Delegated' : 'Kanban'}</span><div class="xs muted">${esc(c.scope)} · ${esc(c.due || c.createdAt)}</div></div>`),
      ...S.tasks.filter((t: any) => roleCan('taskOwn', t)).map((t: any) => `<div class="minirow"><b>${esc(t.title)}</b> ${badge(t.status)}<div class="xs muted">${esc(t.owner)} · ${esc(t.due)}</div></div>`)
    ].join('') || '<p>No assigned tasks or Kanban actions</p>') : panel(`Management Attention · Exceptions (${exceptions.length})`, `${attentionRows.join('') || '<p class="small muted">All KPIs on track and no active blockers escalated in this scope.</p>'}<div class="actions" style="margin-top:15px">${btn('Open PDCA Exception Queue', "go('reviews')", 'primary')}${btn('Review approvals', "go('approvals')")}</div>`)}</div>
    ${panel('Strategy-to-execution flow', `<div class="flow"><div class="step active">Organization strategy</div>→<div class="step active">Site annual goals</div>→<div class="step active">Department objectives</div>→<div class="step">Initiatives / projects</div>→<div class="step">Activities</div>→<div class="step">KPI / PDCA</div></div><p class="small muted">One shared data model. Project completion and actual goal performance are deliberately separate; escalated blockers surface directly into PDCA Reviews.</p>`)}`;
  }

  function safetyCrossHtml(scopeKey: string) {
    const daysMap = S.safetyCross?.[scopeKey] || S.safetyCross?.['Organization'] || {};
    const rows = [
      [0, 0, 1, 2, 3, 0, 0],
      [0, 0, 4, 5, 6, 0, 0],
      [7, 8, 9, 10, 11, 12, 13],
      [14, 15, 16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25, 26, 27],
      [0, 0, 28, 29, 30, 0, 0],
      [0, 0, 0, 31, 0, 0, 0]
    ];
    let g = 0, a = 0, r = 0;
    for (let d = 1; d <= 31; d++) {
      const st = daysMap[String(d)];
      if (st === 'green') g++; else if (st === 'amber') a++; else if (st === 'red') r++;
    }
    const disabled = isAuditor() ? 'disabled' : '';
    return `<div class="sc-wrap"><div class="sc-cross">${rows.flat().map(d => {
      if (!d) return '<div class="sc-cell empty"></div>';
      const st = daysMap[String(d)] || '';
      return `<button type="button" class="sc-cell ${st}" ${disabled} title="Day ${d}: ${st || 'Not logged'} (click to toggle)" onclick="window.toggleSafetyDay('${esc(scopeKey)}',${d})">${d}</button>`;
    }).join('')}</div><div class="sc-legend"><span><b style="color:var(--green)">● ${g}</b> OK</span><span><b style="color:var(--amber)">● ${a}</b> Near-miss</span><span><b style="color:var(--red)">● ${r}</b> Incident</span><span class="xs">${isAuditor() ? 'Read-only' : 'Click day to toggle'}</span></div></div>`;
  }

  function dailyBoard() {
    const tier = S.dailyTier || 'tier1';
    const scopedGoals = roleVisibleGoals();
    const scopedKpis = S.kpis.filter((k: any) => (S.scope === 'Organization' && !limitedRole()) || scopedGoals.some((g: any) => g.kpi === k.id));
    const cards = (S.pulseCards || []).filter((pc: any) =>
      (!limitedRole() || blockerMatchesScope(pc.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(pc.scope, S.scope)
    );
    const canEditBoard = !isAuditor();
    const delegateScopes = ['Department: Production', 'Department: Maintenance', 'Department: Quality', 'Site: Uppsala', 'Site: Falkenberg', 'Organization'];
    const delegateOwners = ['Team Leader', 'Project Leader', 'Production Manager', 'Maintenance Manager', 'Quality Manager', 'EHS Manager', 'Safety Coordinator', 'Site Manager', 'Executive Management'];

    const teamActionCards = cards.filter((c: any) => c.status === 'Team action');
    const escalatedCards = cards.filter((c: any) => c.status === 'Escalated');
    const doneCards = cards.filter((c: any) => c.status === 'Done');

    const renderPulseCard = (c: any) => {
      const k = c.kpi ? kpi(c.kpi) : null;
      const isDelegating = pulseDelegateCardId === c.id;
      const commentCount = Array.isArray(c.comments) ? c.comments.length : 0;
      return `<div class="pulse-card ${c.status === 'Escalated' ? 'escalated' : c.status === 'Done' ? 'done' : c.delegatedBy ? 'delegated' : ''}" onclick="window.openPulseCard('${esc(c.id)}', event)" title="Click card to open details">
        <div class="pulse-card-top">
          <div class="pulse-card-title">${esc(c.title)}</div>
          <span class="xs muted" style="white-space:nowrap">Open ↗</span>
        </div>
        <div class="pulse-card-meta">
          <span class="pill ${c.routeType === 'Escalate' ? 'red' : c.routeType === 'A3' ? 'amber' : 'teal'}">${esc(c.routeType)}</span>
          <span class="pill">${esc(c.scope)}</span>
          <span><b>${esc(c.owner)}</b></span>
          ${k ? `<span>· ${esc(k.id)}</span>` : ''}
          ${c.due ? `<span>· Due ${esc(c.due)}</span>` : ''}
          ${commentCount ? `<span>· 💬 ${commentCount}</span>` : ''}
          ${c.blockerId ? `<span class="pill red">⚑ ${esc(c.blockerId)}</span>` : ''}
          ${c.delegatedBy ? `<span class="pill teal">↳ Delegated by ${esc(c.delegatedBy)}</span>` : ''}
        </div>
        ${c.delegationNote ? `<div class="pulse-note">↳ ${esc(c.delegationNote)}</div>` : ''}
        <div class="actions no-print">
          ${canEditBoard ? `<button type="button" class="btn xs" onclick="window.togglePulseCardDone('${esc(c.id)}')">${c.status === 'Done' ? 'Reopen' : '✓ Done'}</button>` : ''}
          ${canEditBoard && c.status === 'Team action' ? `<button type="button" class="btn xs" onclick="window.escalatePulseCard('${esc(c.id)}')">↑ Escalate</button>` : ''}
          ${canEditBoard && c.status !== 'Done' ? `<button type="button" class="btn xs" onclick="window.openPulseDelegate('${esc(c.id)}')">↳ Delegate</button>` : ''}
          ${c.project ? `<button type="button" class="btn xs" onclick="go('project','${esc(c.project)}')">A3</button>` : ''}
        </div>
        ${isDelegating && canEditBoard ? `<form class="pulse-delegate no-print" onsubmit="window.delegatePulseCard(event,'${esc(c.id)}')">
          <div class="pulse-delegate-row">
            <select name="scope" title="Delegate to team / unit">${delegateScopes.map(sc => `<option value="${esc(sc)}" ${c.scope === sc ? 'selected' : ''}>${esc(sc)}</option>`).join('')}</select>
            <select name="owner" title="Assign responsible owner">${delegateOwners.map(ow => `<option value="${esc(ow)}" ${c.owner === ow ? 'selected' : ''}>${esc(ow)}</option>`).join('')}</select>
          </div>
          <input name="note" type="text" value="${esc(c.delegationNote || '')}" placeholder="Optional action / handover note...">
          <div class="actions"><button type="submit" class="btn xs primary">Confirm Delegate</button><button type="button" class="btn xs" onclick="window.closePulseDelegate()">Cancel</button></div>
        </form>` : ''}
      </div>`;
    };

    const openCard = pulseOpenCardId ? (S.pulseCards || []).find((x: any) => x.id === pulseOpenCardId) : null;
    const pulseCardModalHtml = () => {
      if (!openCard) return '';
      const k = openCard.kpi ? kpi(openCard.kpi) : null;
      const kSt = k ? computeKpiStatus(k) : null;
      const initObj = openCard.initiative ? initiative(openCard.initiative) : null;
      const projObj = openCard.project ? S.projects.find((p: any) => p.id === openCard.project) : null;
      const blockerObj = openCard.blockerId ? (S.blockers || []).find((b: any) => b.id === openCard.blockerId) : null;
      const comments = Array.isArray(openCard.comments) ? openCard.comments : [];
      return `<div class="pulse-modal-backdrop no-print" onclick="if(event.target===this)window.closePulseCard()">
        <div class="pulse-modal" role="dialog" aria-modal="true">
          <div class="pulse-modal-head">
            <div>
              <div class="pulse-card-meta" style="margin-bottom:5px">
                <span class="pill">${esc(openCard.id)}</span>
                ${badge(openCard.status)}
                <span class="pill">${esc(openCard.scope)}</span>
                <span class="xs muted">Created ${esc(openCard.createdAt || today)}</span>
              </div>
              <h2 style="margin:0;font-size:18px">${esc(openCard.title)}</h2>
            </div>
            <button type="button" class="btn xs" onclick="window.closePulseCard()">✕ Close</button>
          </div>

          <div class="pulse-modal-section">
            <h4>Details & Context</h4>
            ${canEditBoard ? `<form onsubmit="window.savePulseCardDetails(event,'${esc(openCard.id)}')">
              <div class="formgrid">
                <div class="field" style="grid-column:1/-1"><label>Title</label><input name="title" type="text" required value="${esc(openCard.title)}"></div>
                <div class="field" style="grid-column:1/-1"><label>Description / Problem & Context</label><textarea name="details" rows="3" placeholder="Describe what happened, station/shift, and what action is needed...">${esc(openCard.details || '')}</textarea></div>
                <div class="field"><label>Path / Method</label><select name="routeType">${['Direct fix', 'A3', 'Escalate'].map(rt => `<option value="${rt}" ${openCard.routeType === rt ? 'selected' : ''}>${rt}</option>`).join('')}</select></div>
                <div class="field"><label>Due Date</label><input name="due" type="date" value="${esc(openCard.due || '')}"></div>
                <div class="field"><label>Linked KPI</label><select name="kpi"><option value="">None</option>${S.kpis.map((x: any) => `<option value="${esc(x.id)}" ${openCard.kpi === x.id ? 'selected' : ''}>${esc(x.id)} · ${esc(x.name)}</option>`).join('')}</select></div>
              </div>
              <div class="actions" style="margin-top:8px"><button type="submit" class="btn xs primary">Save Details</button></div>
            </form>` : `<p class="small">${esc(openCard.details || 'No additional description logged.')}</p><div class="xs muted">Owner: <b>${esc(openCard.owner)}</b> · Due: <b>${esc(openCard.due || 'Not set')}</b></div>`}
          </div>

          <div class="pulse-modal-section">
            <h4>Links, Escalation & Delegation</h4>
            <div class="minirow"><span>Current Owner & Team</span><span><b>${esc(openCard.owner)}</b> · <span class="pill">${esc(openCard.scope)}</span></span></div>
            ${openCard.delegatedBy ? `<div class="minirow"><span>Delegation</span><span>↳ Delegated by <b>${esc(openCard.delegatedBy)}</b> (${esc(openCard.delegatedAt || '')}) ${openCard.delegationNote ? `— "${esc(openCard.delegationNote)}"` : ''}</span></div>` : ''}
            ${k ? `<div class="minirow"><span>Linked KPI: <b>${esc(k.id)} · ${esc(k.name)}</b> (${kSt?.actual ?? '—'} / ${kSt?.target ?? '—'} ${esc(k.unit)})</span><span class="actions">${badge(kSt?.label || '')}<button type="button" class="btn xs" onclick="go('kpis','${esc(k.id)}')">KPI Chart</button></span></div>` : ''}
            ${initObj ? `<div class="minirow"><span>Initiative: <b>${esc(initObj.title)}</b> (${initObj.progress}%)</span><button type="button" class="btn xs" onclick="go('initiative','${esc(initObj.id)}')">Open Initiative</button></div>` : ''}
            ${projObj ? `<div class="minirow"><span>Project A3: <b>${esc(projObj.title)}</b> (${projObj.progress}%)</span><button type="button" class="btn xs" onclick="go('project','${esc(projObj.id)}')">Open A3</button></div>` : ''}
            ${blockerObj ? `<div class="minirow"><span>PDCA Blocker: <b>⚑ ${esc(blockerObj.id)}</b> (${esc(blockerObj.severity)})</span><span class="actions">${badge(blockerObj.status)}<button type="button" class="btn xs" onclick="go('reviews')">PDCA Queue</button></span></div>` : ''}
            ${canEditBoard ? `<div class="actions" style="margin-top:10px">
              <button type="button" class="btn xs" onclick="window.togglePulseCardDone('${esc(openCard.id)}')">${openCard.status === 'Done' ? 'Reopen Card' : '✓ Mark Done'}</button>
              ${openCard.status === 'Team action' ? `<button type="button" class="btn xs" onclick="window.escalatePulseCard('${esc(openCard.id)}')">↑ Escalate to Tier 2/3</button>` : ''}
            </div>
            ${openCard.status !== 'Done' ? `<form class="pulse-delegate" onsubmit="window.delegatePulseCard(event,'${esc(openCard.id)}')">
              <div class="xs muted"><b>↳ Delegate / Reassign to Team or Owner</b></div>
              <div class="pulse-delegate-row">
                <select name="scope">${delegateScopes.map(sc => `<option value="${esc(sc)}" ${openCard.scope === sc ? 'selected' : ''}>${esc(sc)}</option>`).join('')}</select>
                <select name="owner">${delegateOwners.map(ow => `<option value="${esc(ow)}" ${openCard.owner === ow ? 'selected' : ''}>${esc(ow)}</option>`).join('')}</select>
              </div>
              <input name="note" type="text" value="${esc(openCard.delegationNote || '')}" placeholder="Handover / action instruction...">
              <div class="actions"><button type="submit" class="btn xs primary">Confirm Delegate</button></div>
            </form>` : ''}` : ''}
          </div>

          <div class="pulse-modal-section" style="margin-bottom:0">
            <h4>Stand-up Notes & Log (${comments.length})</h4>
            <div class="pulse-comments">
              ${comments.map((cm: any) => `<div class="pulse-comment"><div class="xs muted"><b>${esc(cm.by)}</b> · ${esc(cm.at)}</div><div style="margin-top:2px">${esc(cm.text)}</div></div>`).join('') || '<p class="xs muted">No updates logged yet.</p>'}
            </div>
            ${canEditBoard ? `<form class="actions" style="flex-wrap:nowrap" onsubmit="window.addPulseCardComment(event,'${esc(openCard.id)}')">
              <input name="text" type="text" required placeholder="Add stand-up note or progress update..." style="flex:1">
              <button type="submit" class="btn xs primary">Post</button>
            </form>` : ''}
          </div>
        </div>
      </div>`;
    };

    const pulseBoardPanel = panel(`Daily Pulse & Kaizen Cards (${cards.filter((c: any) => c.status !== 'Done').length} open)`,
      (canEditBoard ? `<form class="pulse-add no-print" onsubmit="window.createPulseCard(event)">
        <div class="field" style="margin:0"><label>Issue / Kaizen improvement *</label><input name="title" type="text" required placeholder="e.g. Sensor trip at Line 2 carton feeder..."></div>
        <div class="field" style="margin:0"><label>Path</label><select name="routeType"><option value="Direct fix">Direct fix (Team)</option><option value="A3">Needs Root Cause (A3)</option><option value="Escalate">Escalate ↑ (Tier 2/3)</option></select></div>
        <div class="field" style="margin:0"><label>KPI / Line</label><select name="kpi"><option value="">Optional KPI</option>${scopedKpis.map((k: any) => `<option value="${esc(k.id)}">${esc(k.id)} · ${esc(k.name)}</option>`).join('')}</select></div>
        <div class="field" style="margin:0"><label>Owner</label><input name="owner" type="text" value="${isBasic() ? 'Team Leader' : isDirector() ? 'Production Manager' : esc(role())}"></div>
        <button class="btn primary" type="submit">+ Add Card</button>
      </form>` : '') +
      `<div class="pulse-cols">
        <div class="pulse-col"><div class="pulse-col-head"><span>Team Action / Delegated</span><span class="pill">${teamActionCards.length}</span></div>${teamActionCards.map(renderPulseCard).join('') || '<p class="xs muted">No active team cards.</p>'}</div>
        <div class="pulse-col"><div class="pulse-col-head"><span>Escalated (Tier 2 / 3)</span><span class="pill red">${escalatedCards.length}</span></div>${escalatedCards.map(renderPulseCard).join('') || '<p class="xs muted">Nothing escalated.</p>'}</div>
        <div class="pulse-col"><div class="pulse-col-head"><span>Done</span><span class="pill green">${doneCards.length}</span></div>${doneCards.slice(0, 6).map(renderPulseCard).join('') || '<p class="xs muted">No completed cards yet.</p>'}</div>
      </div>`
    );

    const units = limitedRole()
      ? [ASSIGNED_SITE, ASSIGNED_DEPARTMENT]
      : ['Site: Uppsala', 'Site: Falkenberg', 'Department: Production', 'Department: Maintenance', 'Department: Quality'];

    const unitMatches = (itemScope: string, unit: string) => itemScope === unit || (unit === ASSIGNED_SITE && String(itemScope || '').startsWith('Department:'));
    const scorecardHtml = `<div class="scorecard-grid">${units.map(u => {
      const uGoals = S.goals.filter((g: any) => visibleToRole(g) && (u === ASSIGNED_SITE ? (g.level === u || g.level.startsWith('Department:')) : g.level === u));
      const onCount = uGoals.filter((g: any) => g.performance === 'On track').length;
      const offCount = uGoals.filter((g: any) => g.performance === 'Off track').length;
      const riskCount = uGoals.filter((g: any) => g.performance === 'At risk').length;
      const uCards = (S.pulseCards || []).filter((c: any) => unitMatches(c.scope, u) && c.status !== 'Done').length;
      const uBlockers = (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && unitMatches(b.scope, u)).length;
      return `<div class="scorecard-tile" onclick="window.focusUnitDaily('${esc(u)}')" title="Click to open ${esc(u)} Tier 1 board">
        <h3><span>${esc(u)}</span>${offCount ? badge('Off track') : riskCount ? badge('At risk') : badge('On track')}</h3>
        <div class="minirow">Goals: <b>${onCount}/${uGoals.length}</b> On track</div>
        <div class="minirow">Open Pulse Cards: <b>${uCards}</b></div>
        <div class="minirow">Escalated Blockers: <b style="color:${uBlockers ? 'var(--red)' : 'inherit'}">${uBlockers}</b></div>
      </div>`;
    }).join('')}</div>`;

    const scopedProjects = S.projects.filter((p: any) => visibleProject(p));
    const scopedTasks = S.tasks.filter((t: any) => scopedProjects.some((p: any) => p.id === t.project) && (!isBasic() || roleCan('taskOwn', t)));

    const tierContent = tier === 'tier1'
      ? `<div class="grid2">
          ${panel(`Safety & Quality Cross · ${esc(S.scope)}`, safetyCrossHtml(S.scope))}
          ${panel(`Live KPI Pulse (${scopedKpis.length})`, scopedKpis.slice(0, 6).map((k: any) => {
            const st = computeKpiStatus(k);
            return `<div class="minirow"><span><b>${esc(k.name)}</b> <span class="xs muted">(${st.actual ?? '—'} / ${st.target ?? '—'} ${esc(k.unit)})</span></span>${badge(st.label)}</div>`;
          }).join('') || '<p class="small muted">No KPIs in selected scope.</p>')}
        </div>
        ${pulseBoardPanel}
        ${panel('Active Team Tasks (1-click syncs Project & Initiative %)', table(['Task', 'Project', 'Owner', 'Due', 'Status'], scopedTasks.filter((t: any) => t.status !== 'Done').slice(0, 10).map((t: any) => {
          const p = S.projects.find((x: any) => x.id === t.project);
          const canToggle = !isAuditor() && (!isBasic() ? roleCan('projectWrite', p) : roleCan('taskOwn', t));
          return `<tr><td><b>${esc(t.title)}</b></td><td class="xs">${esc(p?.title || t.project)}</td><td>${esc(t.owner)}</td><td>${esc(t.due)}</td><td>${canToggle ? `<button type="button" class="link" onclick="window.toggleDailyTask('${t.id}')" title="Click to advance status">${badge(t.status)}</button>` : badge(t.status)}</td></tr>`;
        })))}`
      : tier === 'tier2'
      ? `${panel('Site & Department Scorecard (Tier 2 Roll-Up)', scorecardHtml)}
         ${pulseBoardPanel}`
      : `${panel('Tier 3 · Digital Obeya & Management Exceptions', (() => {
          const queue = pdcaExceptionQueue(S.scope, true);
          return `<p class="small muted">Combines escalated Tier 1/2 Pulse issues, Open Blockers, and Off-track KPIs for leadership decision.</p>` +
            (queue.length ? queue.map((b: any) => blockerBoxHtml(b, true)).join('') : '<p class="small muted">No open exceptions in selected scope.</p>');
        })())}
        ${pulseBoardPanel}`;

    return head('Daily Management Board', 'Tiered stand-up meetings connected directly to Goals, Projects, KPIs & PDCA', btn('My Focus', "go('myfocus')", 'teal') + btn('PDCA Reviews', "go('reviews')")) +
      roleScopebar() +
      `<div class="tierbar no-print">
        <button type="button" class="tierbtn ${tier === 'tier1' ? 'active' : ''}" onclick="window.setDailyTier('tier1')">Tier 1 · Team Pulse</button>
        <button type="button" class="tierbtn ${tier === 'tier2' ? 'active' : ''}" onclick="window.setDailyTier('tier2')">Tier 2 · Site Scorecard</button>
        <button type="button" class="tierbtn ${tier === 'tier3' ? 'active' : ''}" onclick="window.setDailyTier('tier3')">Tier 3 · Management Obeya</button>
      </div>` +
      tierContent +
      pulseCardModalHtml();
  }

  function roleDefaultOwnerNames(): string[] {
    if (S.myFocusOwner) return [S.myFocusOwner];
    if (isGeneral()) return ['Executive Management', 'General director'];
    if (isQMS()) return ['Quality Manager', 'QMS auditor'];
    if (isDirector()) return ['Production Manager', 'Department director', 'Project Leader'];
    if (isBasic()) return ['Team Leader'];
    return ['Site Manager', 'Production Manager', 'Quality Manager', 'Maintenance Manager', 'EHS Manager', 'Safety Coordinator'];
  }

  function myFocus() {
    const names = roleDefaultOwnerNames();
    const match = (owner: string) => names.some(n => String(owner || '').toLowerCase() === n.toLowerCase());
    const allLeaders = ['Executive Management', 'Site Manager', 'Production Manager', 'Maintenance Manager', 'Quality Manager', 'EHS Manager', 'Safety Coordinator', 'Project Leader', 'Team Leader'];

    const myKpis = (S.kpiOwners || [])
      .filter((r: any) => match(r.owner))
      .map((r: any) => ({ ...r, k: kpi(r.kpi), st: computeKpiStatus(kpi(r.kpi)) }))
      .filter((x: any) => x.k);

    const myGoals = S.goals.filter((g: any) => visibleToRole(g) && match(g.owner));
    const showCatchballForOwner = !S.myFocusOwner || ['Executive Management', 'Production Manager', 'Quality Manager'].includes(S.myFocusOwner);
    const myCatchballs = (isBasic() || !showCatchballForOwner) ? [] : (S.catchballs || []).filter((c: any) => {
      const turn = cbTurn(c);
      if (S.myFocusOwner === 'Production Manager') return !['Approved', 'Cancelled'].includes(c.status) && turn === 'Department director';
      if (S.myFocusOwner === 'Executive Management' || S.myFocusOwner === 'Quality Manager') return !['Approved', 'Cancelled'].includes(c.status) && leadershipRole(turn || '');
      return !['Approved', 'Cancelled'].includes(c.status) && (turn === role() || (isLeadership() && leadershipRole(turn || '')));
    });
    const myInits = S.initiatives.filter((i: any) => visibleInitiative(i) && match(i.owner));
    const myTasks = S.tasks.filter((t: any) => t.status !== 'Done' && (match(t.owner) || (!S.myFocusOwner && isDirector() && visibleProject(S.projects.find((p: any) => p.id === t.project) || { initiative: '' }))));
    const myPulseCards = (S.pulseCards || []).filter((c: any) => c.status !== 'Done' && match(c.owner));
    const myDecisions = isBasic() ? [] : S.reviews.flatMap((r: any) => r.decisions.filter((d: any) => d.status === 'Open' && match(d.owner)).map((d: any) => ({ ...d, reviewId: r.id })));
    const myBlockers = isBasic() ? [] : (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && match(b.owner) && blockerAllowedByRole(b));

    return head('My Focus · Personal Obeya', `Personal goals, KPIs, initiatives & actions for ${esc(S.myFocusOwner || role())}`, btn('Daily Pulse Board', "go('daily')", 'teal')) +
      (!isBasic() ? `<div class="toolbar no-print"><label class="small">View leader / role focus <select onchange="window.setMyFocusOwner(this.value)"><option value="">Auto (${esc(role())})</option>${allLeaders.map(l => `<option value="${esc(l)}" ${S.myFocusOwner === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>` : '') +
      `<div class="cards">${[
        ['My KPIs (SE Wing)', myKpis.length, `${myKpis.filter((x: any) => x.strength === 2).length} Primary ●`],
        ['My Goals & Catchball', myGoals.length + myCatchballs.length, `${myCatchballs.length} waiting reply`],
        ['My Initiatives', myInits.length, 'Linked improvement streams'],
        ['Open Actions', myTasks.length + myPulseCards.length + myDecisions.length + myBlockers.length, `${myTasks.length} tasks · ${myPulseCards.length} kanban · ${myDecisions.length + myBlockers.length} PDCA/blockers`]
      ].map(c => `<div class="card"><div class="label">${c[0]}</div><div class="num">${c[1]}</div><div class="xs muted">${c[2]}</div></div>`).join('')}</div>` +
      `<div class="grid2">
        ${panel('My KPI Accountability (from X-Matrix SE)', myKpis.length ? myKpis.map((x: any) => `<div class="minirow"><span><span class="pill ${x.strength === 2 ? 'purple' : 'teal'}">${x.strength === 2 ? '● Primary' : '○ Support'}</span> <b>${esc(x.k.name)}</b> <span class="xs muted">(${x.st.actual ?? '—'} / ${x.st.target ?? '—'})</span></span>${badge(x.st.label)}</div>`).join('') : '<p class="small muted">No KPI accountability assigned to this owner.</p>')}
        ${panel('My Goals & Catchball Queue', [
          ...myCatchballs.map((c: any) => `<div class="minirow"><button class="link" onclick="go('catchballitem','${c.id}')"><b>⟳ ${esc(c.id)}: ${esc(cbGoalReadable(c))}</b></button>${cbStatusBadge(c.status)}</div>`),
          ...myGoals.map((g: any) => `<div class="minirow"><button class="link" onclick="go('goal','${g.id}')"><b>${esc(g.id)} · ${esc(g.title)}</b></button>${badge(g.performance)}</div>`)
        ].join('') || '<p class="small muted">No goals or Catchball items assigned.</p>')}
      </div>` +
      `<div class="grid2">
        ${panel('My Initiatives & Projects', myInits.length ? myInits.map((i: any) => `<div class="minirow"><button class="link" onclick="go('initiative','${i.id}')"><b>${esc(i.title)}</b></button><span>${sqdcStripHtml(i, true)} <b>${i.progress}%</b> ${badge(i.status)}</span></div>`).join('') : '<p class="small muted">No initiatives directly owned.</p>')}
        ${panel('My Open Tasks, Kanban & PDCA Decisions', [
          ...myPulseCards.map((c: any) => `<div class="minirow"><span><span class="pill ${c.delegatedBy ? 'teal' : 'amber'}">${c.delegatedBy ? '↳ Delegated' : 'Kanban'}</span> <button class="link" onclick="window.openPulseCardFromFocus('${esc(c.id)}')"><b>${esc(c.title)}</b></button> <span class="xs muted">· ${esc(c.scope)}</span></span>${!isAuditor() ? `<button type="button" class="btn xs" onclick="window.togglePulseCardDone('${esc(c.id)}')">✓ Done</button>` : badge(c.status)}</div>`),
          ...myBlockers.map((b: any) => `<div class="minirow"><button class="link" onclick="go('reviews')"><b>⚑ ${esc(b.id)}:</b> ${esc(b.summary)}</button>${badge(b.status)}</div>`),
          ...myTasks.slice(0, 8).map((t: any) => {
            const p = S.projects.find((x: any) => x.id === t.project);
            const canToggle = !isAuditor() && (!isBasic() ? roleCan('projectWrite', p) : roleCan('taskOwn', t));
            return `<div class="minirow"><span><b>${esc(t.title)}</b> <span class="xs muted">· ${esc(t.due)}</span></span>${canToggle ? `<button type="button" class="link" onclick="window.toggleDailyTask('${t.id}')">${badge(t.status)}</button>` : badge(t.status)}</div>`;
          }),
          ...myDecisions.map((d: any) => `<div class="minirow"><button class="link" onclick="go('review','${d.reviewId}')"><b>PDCA (${esc(d.reviewId)}):</b> ${esc(d.text)}</button>${badge(d.status)}</div>`)
        ].join('') || '<p class="small muted">All assigned tasks, Kanban cards and PDCA actions are complete!</p>')}
      </div>`;
  }

  function strategicPillarCards(compact = false) {
    let roots = S.goals.filter((g: any) => g.level === 'Organization' && !g.parent && visibleToRole(g));
    let icons = ['⚙', '◆', '♻', '✚'], types = ['operations', 'quality', 'environment', 'ohs'];
    return `<div class="split" style="margin-bottom:11px"><h2 style="margin:0">Organization · Strategic Pillars</h2>${btn('Manage / Edit Main Goals', "go('pillars')")}</div><div class="pillargrid">${roots.map((g: any) => {
      let type = /45001|safety/i.test(g.iso + ' ' + g.title) ? 'ohs' : /14001|environment/i.test(g.iso + ' ' + g.title) ? 'environment' : /quality/i.test(g.title) ? 'quality' : 'operations';
      let ix = types.indexOf(type);
      return `<div class="pillar ${type}"><div class="split"><span class="icon">${icons[ix]}</span>${badge(g.approval)}</div><div class="title">${esc(g.title)}</div><div class="xs muted">${esc(g.iso)} · ${S.goals.filter((x: any) => x.parent === g.id).length} direct objective(s)</div><div class="actions">${btn('Edit Goal', `go('goal','${g.id}')`)}${!compact ? btn('View cascade', "go('cascade')") : ''}</div></div>`;
    }).join('')}</div>`;
  }

  function pillars() {
    let roots = S.goals.filter((g: any) => g.level === 'Organization' && !g.parent && visibleToRole(g));
    return head('Main Strategic Goals', 'Organization-level pillars · Quality, Environment, Safety and Operational Excellence', btn('+ Add Main Goal', "go('newgoal','main')", 'primary') + btn('View Goal Cascade', "go('cascade')")) +
      `<div class="banner"><b>Where to edit the strategic headings:</b> click <b>Edit Goal</b> below any pillar. Change its name, owner, ISO linkage, measurement or target. The same goal is reused in Goal Cascade, X-Matrix and Strategy A3.</div>` +
      strategicPillarCards(false) +
      panel('Organization Goal Register', table(['Strategic goal', 'ISO linkage', 'Accountable owner', 'Site / department connections', 'Approval', 'Edit'], roots.map((g: any) => `<tr><td><b>${esc(g.title)}</b><div class="xs muted">${g.id} · ${esc(g.year)}</div></td><td>${esc(g.iso)}</td><td>${esc(g.owner)}</td><td>${S.goals.filter((x: any) => x.parent === g.id).length} direct linked goal(s)</td><td>${badge(g.approval)}</td><td>${btn('Edit', `go('goal','${g.id}')`)}</td></tr>`))) +
      panel('ISO-integrated goal architecture', `<p><b>ISO 9001</b> quality and process performance · <b>ISO 14001</b> environmental objectives · <b>ISO 45001</b> occupational health and safety objectives.</p><p class="xs muted">These ISO clauses are editable references for the demo, not certification decisions or proof of compliance. A strategic goal can be linked to more than one standard in a production implementation.</p>`);
  }

  function cascade() {
    const scopedIds = new Set<string>(roleVisibleGoals().map((x: any) => String(x.id)));
    let roots = S.goals.filter((g: any) => !g.parent && visibleToRole(g)), top = roots.filter((g: any) => g.level === 'Organization');
    let scopedGoals = S.goals.filter((g: any) => visibleToRole(g) && (S.scope === 'Organization' || scopedIds.has(g.id)));
    let controls = `<div class="hierarchy-bar"><b>View</b>${btn('Hierarchy', "window.setCascadeView('tree')", S.cascadeView === 'tree' ? 'teal' : '')}${btn('Table', "window.setCascadeView('table')", S.cascadeView === 'table' ? 'teal' : '')}${S.cascadeView === 'tree' ? btn('Expand all', 'window.setCollapsed(false)') + btn('Collapse all', 'window.setCollapsed(true)') : ''}${btn('Manage Main Goals', "go('pillars')")}</div>`;
    let content = S.cascadeView === 'tree' ? `<div class="grid2"><div>${top.map((g: any) => node(g, 0, scopedIds)).join('')}</div><div class="tile"><h3>Strategy Deployment</h3><p>Click a goal title to edit it. Use <b>Change parent</b> to move a goal under a different approved strategic parent. Child objectives follow their parent automatically.</p><div class="minirow">Organization pillars: <b>${top.length}</b></div><div class="minirow">Site objectives: <b>${scopedGoals.filter((g: any) => g.level.startsWith('Site')).length}</b></div><div class="minirow">Department objectives: <b>${scopedGoals.filter((g: any) => g.level.startsWith('Department')).length}</b></div><div class="minirow">Unlinked goals: <b>${scopedGoals.filter((g: any) => g.level !== 'Organization' && !g.parent).length}</b></div><p class="small muted" style="margin-top:12px">Hierarchy links are authoritative; X-Matrix correlations are separate supporting relationships.</p></div></div>${roots.filter((g: any) => g.level !== 'Organization' && (S.scope === 'Organization' || scopedIds.has(g.id))).length ? panel('Unlinked objectives – require a parent', roots.filter((g: any) => g.level !== 'Organization' && (S.scope === 'Organization' || scopedIds.has(g.id))).map((g: any) => node(g, 0, scopedIds)).join('')) : ''}` :
      table(['Goal', 'Primary parent', 'Level', 'Performance', 'Actions'], scopedGoals.map((g: any) => `<tr><td><b>${esc(g.title)}</b><div class="xs muted">${g.id}</div></td><td>${esc(goal(g.parent)?.title || 'No parent')}</td><td>${esc(g.level)}</td><td>${badge(g.performance)}</td><td><div class="actions">${btn('Edit', `go('goal','${g.id}')`)}${g.level !== 'Organization' ? btn('Change parent', `window.focusParent('${g.id}')`) : ''}</div></td></tr>`));
    return head('Goal Cascade', 'Interactive hierarchy · editable primary parent · no duplicate records', btn('+ Create Goal', "go('newgoal')", 'primary')) + roleScopebar() +
      `<div class="banner"><b>Quick tip:</b> edit the top-level headings under <b>Main Strategic Goals</b>. To change an annual or department goal's parent, click <b>Change parent</b>. Cyclic links are blocked.</div>` +
      controls + panel('Organization → Site → Department', content);
  }

  function node(g: any, depth: number, scopedIds?: Set<string>): string {
    let kids = S.goals.filter((x: any) => x.parent === g.id && visibleToRole(x) && (!scopedIds || S.scope === 'Organization' || scopedIds.has(x.id))), collapsed = S.collapsed.includes(g.id);
    return `<div class="treeitem ${depth ? 'branch' : ''}"><div class="node"><div class="topline"><div><div class="nodeactions">${kids.length ? `<button class="tinybtn" title="Expand/collapse" onclick="window.toggleCollapse('${g.id}')">${collapsed ? '▸' : '▾'} ${kids.length}</button>` : ''}<button class="titlelink" onclick="go('goal','${g.id}')">${esc(g.title)}</button></div><div class="xs muted">${g.id} · ${esc(g.level)} · ${esc(g.owner)}</div></div>${badge(g.performance)}</div><div class="split" style="margin-top:8px"><div class="xs muted">${esc(g.iso)} · ${esc(g.approval)}</div><div class="nodeactions">${btn('Edit', `go('goal','${g.id}')`)}${g.level !== 'Organization' ? btn('Change parent', `window.focusParent('${g.id}')`) : ''}</div></div></div>${!collapsed ? kids.map((k: any) => node(k, depth + 1, scopedIds)).join('') : ''}</div>`;
  }

  function permittedParents(level: string, id: string) {
    if (level === 'Organization') return [];
    const targetType = level.startsWith('Site:') ? 'Organization' : level.startsWith('Department:') ? 'Site:' : null;
    if (!targetType) return [];
    const descendants = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const candidate of S.goals) {
        if (candidate.parent && descendants.has(candidate.parent) && !descendants.has(candidate.id)) {
          descendants.add(candidate.id);
          changed = true;
        }
      }
    }
    return S.goals.filter((x: any) => !descendants.has(x.id) && (targetType === 'Organization' ? x.level === 'Organization' : x.level.startsWith('Site:')));
  }

  // SQDC & Value Stream / Theory of Constraints Helpers (Cudney Hoshin Ch. 1, 5, 6-9)
  function sqdcScore(i: any) {
    const s = i?.sqdc || { S: 0, Q: 0, D: 0, C: 0 };
    const vals = [Number(s.S || 0), Number(s.Q || 0), Number(s.D || 0), Number(s.C || 0)];
    const pillars = vals.filter(v => v > 0).length;
    const weighted = vals.reduce((a, b) => a + b, 0);
    const safetyPriority = Number(s.S || 0) === 2;
    const multiPillar = pillars >= 3;
    return { s, pillars, weighted, safetyPriority, multiPillar };
  }

  function sqdcStripHtml(i: any, compact = false) {
    const s = i?.sqdc || { S: 0, Q: 0, D: 0, C: 0 };
    const dims: [string, string][] = [['S', 'Safety'], ['Q', 'Quality'], ['D', 'Delivery'], ['C', 'Cost']];
    return `<span class="sqdc-strip" title="${dims.map(([k, lbl]) => `${lbl}: ${s[k] === 2 ? 'Primary ●' : s[k] === 1 ? 'Support ○' : 'None'}`).join(' · ')}">${dims.map(([k, lbl]) => {
      const v = Number(s[k] || 0);
      const cls = v === 2 ? 'pri' : v === 1 ? 'sup' : '';
      return `<span class="sqdc-pill ${cls}" title="${lbl}: ${v === 2 ? 'Primary ●' : v === 1 ? 'Support ○' : 'None'}">${k}</span>`;
    }).join('')}</span>`;
  }

  function sqdcLeverageBadge(i: any) {
    const sc = sqdcScore(i);
    const badges: string[] = [];
    if (i?.isBottleneck) badges.push(`<span class="toc-tag" title="Targets primary Value Stream Constraint (TOC)">TOC Bottleneck</span>`);
    if (sc.safetyPriority) badges.push(`<span class="pill green" title="Critical Safety impact always takes precedence">Safety Priority</span>`);
    if (sc.multiPillar) badges.push(`<span class="pill teal" title="High cross-pillar leverage per Cudney SQDC matrix">${sc.pillars}/4 SQDC</span>`);
    else if (!sc.safetyPriority && !i?.isBottleneck && sc.pillars <= 1) badges.push(`<span class="pill amber" title="Single-dimension impact without bottleneck tag — verify against Value Stream">Narrow Focus</span>`);
    return badges.join(' ');
  }

  // v5.4: One data model, all matching records, full-scope X-Matrix + SE Cross-Functional Ownership wing.
  const xm3Title = (x: any) => x?.title || x?.name || '';
  const xm3Strength = (n: number | null | undefined) => n === 2 ? 'Strong' : n === 1 ? 'Medium' : n === 0.5 ? 'Weak' : 'None';
  const xm3OwnerStrength = (n: number | null | undefined) => n === 2 ? 'Primary Owner' : n === 1 ? 'Cross-Functional Support' : 'None';
  const xm3Impact = (from: string, to: string) => Number(S.relations.find((r: any) => r.from === from && r.to === to)?.strength || 0);
  const xm3OwnerImpact = (kpiId: string, ownerName: string) => Number((S.kpiOwners || []).find((r: any) => r.kpi === kpiId && r.owner === ownerName)?.strength || 0);
  const xm3Dot = (n: number, blue = false) => `<span class="xm3-dot ${n === 2 ? 'strong' : n === 1 ? 'medium' : n === 0.5 ? 'weak' : 'none'} ${blue ? 'blue' : ''}" aria-hidden="true"></span>`;
  const xm3OwnerDot = (n: number) => `<span class="xm3-dot owner ${n === 2 ? 'strong' : n === 1 ? 'medium' : 'none'}" aria-hidden="true"></span>`;
  const xm3Node = (type: string, id: string) => `${type}:${id}`;

  function xm4Ancestors(g: any) {
    const found: any[] = [], visited = new Set(); let parent = g?.parent;
    while (parent && !visited.has(parent)) {
      visited.add(parent); const p = goal(parent); if (!p) break; found.push(p); parent = p.parent;
    }
    return found;
  }

  function xm4OrgParent(g: any) { return xm4Ancestors(g).find((x: any) => x.level === 'Organization') || null; }

  function xm4ScopeIncludes(g: any) {
    if (S.scope === 'Organization') return true;
    if (g.level === S.scope) return true;
    const ancestors = xm4Ancestors(g);
    if (ancestors.some((p: any) => p.level === S.scope)) return true;
    // A department scope also displays the containing site goal, but not its siblings.
    if (S.scope.startsWith('Department:') && g.level.startsWith('Site:')) {
      return S.goals.some((x: any) => x.level === S.scope && visibleToRole(x) && xm4Ancestors(x).some((p: any) => p.id === g.id));
    }
    return false;
  }

  function xm4HierarchyStrength(from: string, to: string) {
    let g = goal(from); if (!g || !goal(to)) return 0;
    if (g.parent === to) return 2;
    return xm4OrgParent(g)?.id === to ? 1 : 0;
  }

  function xm3Data() {
    const annual = S.goals.filter((g: any) => g.level !== 'Organization' && visibleToRole(g) && xm4ScopeIncludes(g));
    const representedRoots = new Set(annual.map((g: any) => xm4OrgParent(g)?.id).filter(Boolean));
    const org = S.goals.filter((g: any) => g.level === 'Organization' && !g.parent && visibleToRole(g) &&
      (S.scope === 'Organization' || representedRoots.has(g.id)));
    const annualIDs = new Set(annual.map((g: any) => g.id));
    const initiatives = S.initiatives.filter((i: any) => visibleInitiative(i) &&
      (S.scope === 'Organization' || annual.some((g: any) => initiativeLinkedToGoal(i, g.id))));
    const linkedKpiIds = new Set([...annual.map((g: any) => g.kpi).filter(Boolean), ...S.relations.filter((r: any) => initiatives.some((i: any) => i.id === r.from) && r.to.startsWith('K-')).map((r: any) => r.to)]);
    // Organization view has all KPI definitions as well, including those not yet linked.
    const kpis = S.kpis.filter((k: any) => (S.scope === 'Organization' && !limitedRole()) || linkedKpiIds.has(k.id));
    const standardOwners = ['Executive Management', 'Site Manager', 'Production Manager', 'Maintenance Manager', 'Quality Manager', 'EHS Manager'];
    const activeOwnerSet = new Set([
      ...standardOwners,
      ...annual.map((g: any) => g.owner).filter(Boolean),
      ...initiatives.map((i: any) => i.owner).filter(Boolean)
    ]);
    const owners = [...activeOwnerSet]
      .filter((name: string) =>
        S.scope === 'Organization' ||
        kpis.some((k: any) => xm3OwnerImpact(k.id, name) > 0) ||
        initiatives.some((i: any) => i.owner === name) ||
        annual.some((g: any) => g.owner === name)
      )
      .map((name: string) => ({ id: name, name, title: name }));
    return { org, annual, initiatives, kpis, owners };
  }

  function xm3Influence(data: any, type: string, id: string) {
    const marked: Record<string, Set<string>> = { corp: new Set(), annual: new Set(), initiative: new Set(), kpi: new Set(), owner: new Set() };
    if (!type || !id || !marked[type]) return marked;
    marked[type].add(id);
    const belongs = (g: any, ancestorId: string) => g.id === ancestorId || xm4Ancestors(g).some((x: any) => x.id === ancestorId);
    const initiativeSupports = (g: any, i: any) => i.goal === g.id || S.relations.some((r: any) => r.from === g.id && r.to === i.id && r.strength > 0);
    if (type === 'owner') {
      data.kpis.filter((k: any) => xm3OwnerImpact(k.id, id) > 0).forEach((k: any) => marked.kpi.add(k.id));
      data.initiatives.filter((i: any) => i.owner === id || [...marked.kpi].some(kid => xm3Impact(i.id, kid) > 0)).forEach((i: any) => marked.initiative.add(i.id));
      data.annual.filter((g: any) => g.owner === id || marked.kpi.has(g.kpi) || [...marked.initiative].some(iid => initiativeSupports(g, initiative(iid) || { goal: '' }))).forEach((g: any) => marked.annual.add(g.id));
    }
    if (type === 'corp') {
      data.annual.filter((g: any) => belongs(g, id)).forEach((g: any) => marked.annual.add(g.id));
    }
    if (type === 'annual') {
      data.annual.filter((g: any) => belongs(g, id)).forEach((g: any) => marked.annual.add(g.id));
    }
    if (type === 'initiative') {
      data.annual.filter((g: any) => initiativeSupports(g, initiative(id) || { goal: '' })).forEach((g: any) => marked.annual.add(g.id));
    }
    if (type === 'kpi') {
      data.annual.filter((g: any) => g.kpi === id).forEach((g: any) => marked.annual.add(g.id));
      data.initiatives.filter((i: any) => xm3Impact(i.id, id) > 0).forEach((i: any) => marked.initiative.add(i.id));
      data.annual.filter((g: any) => [...marked.initiative].some(iid => initiativeSupports(g, initiative(iid) || { goal: '' }))).forEach((g: any) => marked.annual.add(g.id));
    }
    if (type === 'corp' || type === 'annual') {
      data.initiatives.filter((i: any) => [...marked.annual].some(gid => initiativeSupports(goal(gid) || { id: '' }, i))).forEach((i: any) => marked.initiative.add(i.id));
    }
    if (type === 'initiative') marked.initiative.add(id);
    // Every goal has its proper upstream corporate ancestor, including Department → Site → Corporate.
    data.annual.filter((g: any) => marked.annual.has(g.id)).forEach((g: any) => { const root = xm4OrgParent(g); if (root) marked.corp.add(root.id); });
    data.kpis.filter((k: any) => [...marked.annual].some(gid => goal(gid)?.kpi === k.id) ||
      [...marked.initiative].some(iid => xm3Impact(iid, k.id) > 0)).forEach((k: any) => marked.kpi.add(k.id));
    // Highlight Cross-Functional Owners accountable for marked KPIs
    if (type !== 'owner') {
      data.owners.filter((o: any) => [...marked.kpi].some(kid => xm3OwnerImpact(kid, o.id) > 0)).forEach((o: any) => marked.owner.add(o.id));
    }
    return marked;
  }

  function xm3Select(type: string, id: string, from = '', to = '') {
    S.xmSelection = { type, id, from, to }; save(); render();
  }

  function xm3OnlyStrong(v: boolean) { S.xmOnlyStrong = !!v; save(); render(); }
  function xm3Clear() { delete S.xmSelection; S.xmOnlyStrong = false; save(); render(); }

  function xm3LabelClass(type: string, id: string, selection: any, chain: any) {
    if (!selection) return '';
    return type === selection.type && id === selection.id ? ' xm3-selected' : chain[type]?.has(id) ? ' xm3-related' : ' xm3-muted';
  }

  function xm3RelCell(from: string, to: string, label: string, selection: any, chain: any, asParent = false) {
    const n = asParent ? xm4HierarchyStrength(from, to) : xm3Impact(from, to);
    const visible = !(S.xmOnlyStrong && n !== 2), chosen = selection?.from === from && selection?.to === to;
    const dim = !!selection && !chosen && !(asParent ?
      (chain.annual.has(from) && chain.corp.has(to)) :
      ((chain.annual.has(from) || chain.initiative.has(from)) && (chain.initiative.has(to) || chain.kpi.has(to))));
    const cls = chosen ? ' xm3-chosen' : dim ? ' xm3-muted' : n > 0 ? ' xm3-related' : '';
    const linkKind = asParent ? (n === 2 ? 'Direct corporate parent' : n === 1 ? 'Corporate ancestor via site goal' : 'No hierarchy link') :
      `${xm3Strength(n)} impact`;
    const accessibleText = `${label}: ${linkKind}${asParent ? ' (hierarchy, not influence score)' : ''}`;
    const isAssigned = !asParent && from.startsWith('G-') && to.startsWith('I-') && initiative(to)?.goal === from && n === 0;
    return `<button type="button" class="xm3-cell${cls}${asParent && n === 1 ? ' xm4-indirect' : ''}" title="${esc(accessibleText)}" aria-label="${esc(accessibleText)}" onclick="window.xm3Select('${asParent ? 'annual' : from.startsWith('G-') ? 'annual' : 'initiative'}','${from}','${from}','${to}')">${visible ? xm3Dot(n, asParent) : xm3Dot(0)}${isAssigned && !S.xmOnlyStrong ? '<span class="xm4-assigned" aria-label="Primary initiative assignment; impact not rated">↗</span>' : ''}</button>`;
  }

  function xm3OwnerRelCell(ownerName: string, kpiObj: any, selection: any, chain: any) {
    const n = xm3OwnerImpact(kpiObj.id, ownerName);
    const visible = !(S.xmOnlyStrong && n !== 2);
    const chosen = selection?.type === 'owner' && selection?.from === ownerName && selection?.to === kpiObj.id;
    const dim = !!selection && !chosen && !(chain.owner.has(ownerName) && chain.kpi.has(kpiObj.id));
    const cls = chosen ? ' xm3-chosen' : dim ? ' xm3-muted' : n > 0 ? ' xm3-related' : '';
    const accessibleText = `${ownerName} × ${xm3Title(kpiObj)}: ${xm3OwnerStrength(n)}`;
    return `<button type="button" class="xm3-cell${cls}" title="${esc(accessibleText)}" aria-label="${esc(accessibleText)}" onclick="window.xm3Select('owner','${esc(ownerName)}','${esc(ownerName)}','${esc(kpiObj.id)}')">${visible ? xm3OwnerDot(n) : xm3OwnerDot(0)}</button>`;
  }

  function xm3Axis(type: string, items: any[], selection: any, chain: any) {
    return items.map((v: any, i: number) => {
      const kSt = type === 'kpi' ? computeKpiStatus(v) : null;
      const bCount = itemBlockers(type === 'kpi' ? 'kpi' : 'goal', v.id).length;
      const flagHtml = type === 'kpi'
        ? (bCount ? `<span class="xm3-flag" title="${bCount} active blocker(s)">⚑ ${bCount}</span>` : kSt?.label === 'Off track' ? `<span class="xm3-flag" title="Off track KPI">! Off</span>` : kSt?.label === 'At risk' ? `<span class="xm3-flag risk" title="KPI at risk">! Risk</span>` : '')
        : (bCount ? `<span class="xm3-flag" title="${bCount} active blocker(s)">⚑ ${bCount}</span>` : '');
      return `<button type="button" class="xm3-axis${xm3LabelClass(type, v.id, selection, chain)}" title="${esc(xm3Title(v))}" onclick="window.xm3Select('${type}','${v.id}')"><span class="xm3-vertical">${esc(xm3Title(v))}</span>${flagHtml}<span class="xm3-verticalid">${esc(type === 'annual' ? 'A' + (i + 1) : 'K' + (i + 1))}</span></button>`;
    }).join('');
  }

  function xm3Rows(type: string, items: any[], selection: any, chain: any) {
    return items.map((v: any, i: number) => {
      const t = xm3Title(v), owner = v.owner || '', initials = owner.split(' ').filter(Boolean).map((x: string) => x[0]).slice(0, 2).join('').toUpperCase();
      const bCount = itemBlockers(type === 'initiative' ? 'initiative' : 'goal', v.id).length;
      const flagHtml = bCount ? `<span class="xm3-flag" title="${bCount} active blocker(s)">⚑ ${bCount}</span>` : (type === 'initiative' && v.status === 'At risk' ? `<span class="xm3-flag risk" title="Initiative At risk">At risk</span>` : '');
      const sqdcMini = type === 'initiative' ? `${sqdcStripHtml(v, true)}${v.isBottleneck ? '<span class="toc-tag" title="Targets primary Value Stream Constraint (TOC)">TOC</span>' : ''}` : '';
      return `<button type="button" class="xm3-label${xm3LabelClass(type, v.id, selection, chain)}" title="${esc(t)}" onclick="window.xm3Select('${type}','${v.id}')"><span class="xm3-id">${type === 'initiative' ? 'I' : type === 'corp' ? 'C' : 'G'}${i + 1}</span><span class="xm3-name">${esc(t)}</span>${sqdcMini}${flagHtml}${owner ? `<span class="xm3-person">${esc(owner)}</span><span class="xm3-avatar" aria-hidden="true">${esc(initials)}</span>` : ''}</button>`;
    }).join('');
  }

  function xm3OwnersRows(owners: any[], selection: any, chain: any, dataKpis: any[] = []) {
    const kpiIds = new Set(dataKpis.map((k: any) => k.id));
    return owners.map((o: any, i: number) => {
      const initials = o.name.split(' ').filter(Boolean).map((x: string) => x[0]).slice(0, 2).join('').toUpperCase();
      const priCount = (S.kpiOwners || []).filter((r: any) => r.owner === o.id && r.strength === 2 && kpiIds.has(r.kpi)).length;
      const supCount = (S.kpiOwners || []).filter((r: any) => r.owner === o.id && r.strength === 1 && kpiIds.has(r.kpi)).length;
      return `<button type="button" class="xm3-label${xm3LabelClass('owner', o.id, selection, chain)}" title="${esc(o.name)} (${priCount} Primary · ${supCount} Support)" onclick="window.xm3Select('owner','${esc(o.id)}')"><span class="xm3-id xm3-id-owner">W${i + 1}</span><span class="xm3-name">${esc(o.name)}</span><span class="xs muted">${priCount}● ${supCount}○</span><span class="xm3-avatar xm3-avatar-owner" aria-hidden="true">${esc(initials)}</span></button>`;
    }).join('');
  }

  function xm3Inspector(data: any, selection: any, chain: any) {
    if (!selection) return `<div class="xm3-details"><div class="xm3-summary">Select a goal, initiative, KPI, cross-functional owner or matrix circle to explore its end-to-end alignment chain.</div><p class="xm3-hint">Read clockwise: <b>Corporate Goals (S)</b> → <b>Annual Goals (W)</b> → <b>Initiatives + SQDC (N)</b> → <b>KPIs (E)</b> → <b>Cross-Functional Owners (SE)</b>. Red/amber flags (⚑) highlight escalated blockers and off-track KPIs.</p></div>`;
    let obj = selection.type === 'annual' || selection.type === 'corp' ? goal(selection.id)
      : selection.type === 'initiative' ? initiative(selection.id)
      : selection.type === 'kpi' ? kpi(selection.id)
      : { id: selection.id, title: selection.id, name: selection.id };
    let title = xm3Title(obj), chosen = selection.from && selection.to;
    const isOwnerPair = chosen && selection.type === 'owner' && selection.to.startsWith('K-');
    const link = chosen && !isOwnerPair ? S.relations.find((r: any) => r.from === selection.from && r.to === selection.to) : null;
    const ownerLink = isOwnerPair ? (S.kpiOwners || []).find((r: any) => r.kpi === selection.to && r.owner === selection.from) : null;
    const parentLink = chosen && !isOwnerPair && selection.from.startsWith('G-') && selection.to.startsWith('G-');
    let impact = chosen ? (isOwnerPair ? xm3OwnerImpact(selection.to, selection.from) : parentLink ? xm4HierarchyStrength(selection.from, selection.to) : xm3Impact(selection.from, selection.to)) : null;
    const names: Record<string, string> = { corp: 'Corporate Goal', annual: 'Annual / Department Goal', initiative: 'Initiative / Project', kpi: 'KPI', owner: 'Cross-Functional Owner (Who)' };
    const labelMap = (type: string, ids: Set<string>) => {
      const list = type === 'corp' ? data.org : type === 'annual' ? data.annual : type === 'initiative' ? data.initiatives : type === 'kpi' ? data.kpis : data.owners;
      return list.filter((x: any) => ids.has(x.id)).map((x: any) => `<div>${esc(xm3Title(x))}</div>`).join('') || '<div class="muted">None linked in this view</div>';
    };
    const count = (type: string) => chain[type]?.size || 0;
    let detail = '';
    if (isOwnerPair) {
      const kObj = kpi(selection.to);
      const canEditOwner = isAdmin() || isLeadership() || isDirector();
      detail = `<div class="xm3-detailshead"><b>Cross-Functional Accountability: ${esc(selection.from)} → ${esc(xm3Title(kObj))}</b><span class="pill owner">${esc(xm3OwnerStrength(impact))}</span></div><div class="actions">${canEditOwner ? btn('Change accountability (● / ○ / –)', `window.xm3OwnerCycle('${esc(selection.to)}','${esc(selection.from)}')`, 'teal') + btn('Add / edit accountability note', `window.xm3OwnerNote('${esc(selection.to)}','${esc(selection.from)}')`) : '<span class="small muted">Read-only accountability inspection.</span>'}</div>${ownerLink?.note ? `<p class="small" style="margin-top:9px"><b>Accountability Rationale:</b> ${esc(ownerLink.note)}</p>` : ''}`;
    } else if (chosen) {
      let to = selection.to.startsWith('I-') ? initiative(selection.to) : selection.to.startsWith('G-') ? goal(selection.to) : kpi(selection.to);
      const canEdit = !parentLink && roleCan('matrixEdit', { from: selection.from, to: selection.to });
      detail = `<div class="xm3-detailshead"><b>Selected relationship: ${esc(xm3Title(obj))} → ${esc(xm3Title(to))}</b><span class="pill teal">${esc(parentLink ? (impact === 2 ? 'Direct corporate parent' : impact === 1 ? 'Via site goal' : 'No hierarchy link') : xm3Strength(impact))}</span></div><div class="actions">${parentLink ? (roleCan('goalEdit', goal(selection.from)) ? btn('Edit primary parent', `window.focusParent('${selection.from}')`) : '<span class="small muted">Primary parent can be changed by an authorized goal owner.</span>') : canEdit ? btn('Change relationship strength', `window.xm3Cycle('${selection.from}','${selection.to}')`, 'teal') + btn('Add / edit rationale', `window.xm3Rationale('${selection.from}','${selection.to}')`) : '<span class="small muted">You can inspect this connection, but your role cannot modify it.</span>'}</div>${link?.note ? `<p class="small" style="margin-top:9px"><b>Rationale:</b> ${esc(link.note)}</p>` : ''}`;
    }
    const sqdcDetail = selection.type === 'initiative' && obj
      ? `<div class="controlled" style="margin-top:10px"><div class="split"><span><b>SQDC Focus & Value Stream Constraint:</b> ${sqdcStripHtml(obj)} ${sqdcLeverageBadge(obj)}</span><span class="xs muted">${esc(obj.valueStream || 'Not specified')}</span></div></div>`
      : '';
    const targetKind = selection.type === 'initiative' ? 'initiative' : selection.type === 'kpi' ? 'kpi' : 'goal';
    const chainBlockers = (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && (
      (selection.type !== 'owner' && b.targetType === targetKind && b.targetId === selection.id) ||
      (b.targetType === 'initiative' && chain.initiative.has(b.targetId)) ||
      (b.targetType === 'kpi' && chain.kpi.has(b.targetId)) ||
      (b.targetType === 'goal' && (chain.annual.has(b.targetId) || chain.corp.has(b.targetId)))
    ));
    const blockerAlert = chainBlockers.length || (targetKind === 'kpi' && selection.type === 'kpi' && ['Off track', 'At risk'].includes(computeKpiStatus(obj).label))
      ? `<div class="bl-inspector-alert"><div class="split"><b>⚑ Implementation Blockers & PDCA Signals in this Chain (${chainBlockers.length})</b>${btn('Open PDCA Reviews', "go('reviews')")}</div>${chainBlockers.map((b: any) => `<div class="minirow" style="padding:5px 0"><b>${esc(b.id)}</b> (${esc(b.category)} · ${esc(b.severity)}) — ${esc(b.summary)} ${b.reviewId ? `<span class="pill teal">${esc(b.reviewId)}</span>` : ''}</div>`).join('') || '<div class="xs muted" style="margin-top:4px">KPI performance requires PDCA attention; use Escalate Blocker if specific leadership support is needed.</div>'}</div>`
      : '';
    const escBtn = selection.type !== 'owner' && canEscalateTarget(targetKind, selection.id) ? btn('⚑ Escalate blocker', `window.escalateBlocker('${targetKind}','${selection.id}')`) : '';
    const openRecBtn = selection.type !== 'owner' ? btn('Open record', `window.xm3OpenRecord('${selection.type}','${selection.id}')`) : '';
    return `<div class="xm3-details"><div class="xm3-detailshead"><div><span class="xs muted">Selected ${esc(names[selection.type] || 'Item')}</span><div class="xm3-summary">${esc(title)} <span class="xs muted"> · ${esc(selection.id)}</span></div></div><div class="actions">${escBtn}${openRecBtn}${btn('Clear selection', 'window.xm3Clear()')}</div></div>${detail}${sqdcDetail}${blockerAlert}<div class="xm3-detailrows" style="grid-template-columns:repeat(5,minmax(0,1fr))"><div class="xm3-detailitem"><b>Corporate goals (${count('corp')})</b>${labelMap('corp', chain.corp)}</div><div class="xm3-detailitem"><b>Annual goals (${count('annual')})</b>${labelMap('annual', chain.annual)}</div><div class="xm3-detailitem"><b>Initiatives (${count('initiative')})</b>${labelMap('initiative', chain.initiative)}</div><div class="xm3-detailitem"><b>KPIs (${count('kpi')})</b>${labelMap('kpi', chain.kpi)}</div><div class="xm3-detailitem"><b>Cross-functional owners (${count('owner')})</b>${labelMap('owner', chain.owner)}</div></div><div class="xm3-hint">Teal circles = causal impact. Blue circles = goal hierarchy. Purple circles (SE) = cross-functional KPI ownership (● Primary / ○ Support). Impact is not KPI achievement.</div></div>`;
  }

  function xm3OpenRecord(type: string, id: string) {
    if (type === 'kpi') {
      go('kpis');
      setTimeout(() => {
        let s = document.getElementById('kpiSelect') as HTMLSelectElement | null;
        if (s && [...s.options].some(o => o.value === id)) {
          s.value = id;
          kpiDetail(id);
        }
      }, 30);
      return;
    }
    go(type === 'initiative' ? 'initiative' : 'goal', id);
  }

  function xm3Cycle(from: string, to: string) {
    if (!roleCan('matrixEdit', { from, to })) return toast('Only an authorized goal owner can edit this relationship');
    let r = S.relations.find((x: any) => x.from === from && x.to === to), n = Number(r?.strength || 0);
    const next = n === 0 ? 0.5 : n === 0.5 ? 1 : n === 1 ? 2 : 0;
    if (next === 0) {
      S.relations = S.relations.filter((x: any) => x !== r);
    } else if (r) {
      r.strength = next;
    } else {
      S.relations.push({ from, to, strength: next });
    }
    save();
    render();
    toast('Relationship updated to ' + xm3Strength(next));
  }

  async function xm3Rationale(from: string, to: string) {
    if (!roleCan('matrixEdit', { from, to })) return toast('Editing not allowed');
    let r = S.relations.find((x: any) => x.from === from && x.to === to);
    if (!r || r.strength <= 0) return toast('Set a relationship strength before adding rationale');
    let note = await (window as any).__showAppPrompt('Relationship Rationale', 'Why does this item influence the other?', r.note || '');
    if (note === null) return;
    r.note = note.trim();
    save();
    render();
  }

  function xm3OwnerCycle(kpiId: string, ownerName: string) {
    if (!(isAdmin() || isLeadership() || isDirector())) return toast('Only leadership or department directors can edit ownership');
    if (!Array.isArray(S.kpiOwners)) S.kpiOwners = [];
    const r = S.kpiOwners.find((x: any) => x.kpi === kpiId && x.owner === ownerName);
    const n = Number(r?.strength || 0);
    const next = n === 0 ? 1 : n === 1 ? 2 : 0;
    if (next === 0) {
      S.kpiOwners = S.kpiOwners.filter((x: any) => x !== r);
    } else if (r) {
      r.strength = next;
    } else {
      S.kpiOwners.push({ kpi: kpiId, owner: ownerName, strength: next });
    }
    save();
    render();
    toast(`${ownerName} accountability set to ${xm3OwnerStrength(next)}`);
  }

  async function xm3OwnerNote(kpiId: string, ownerName: string) {
    if (!(isAdmin() || isLeadership() || isDirector())) return toast('Editing not allowed');
    const r = (S.kpiOwners || []).find((x: any) => x.kpi === kpiId && x.owner === ownerName);
    if (!r || r.strength <= 0) return toast('Assign Primary ● or Support ○ accountability first');
    const note = await (window as any).__showAppPrompt('Cross-Functional Accountability Note', `Role of ${ownerName} on ${kpiId}:`, r.note || '');
    if (note === null) return;
    r.note = note.trim();
    save();
    render();
  }

  function visualXMatrix() {
    const d = xm3Data(), sel = S.xmSelection || null, chain = xm3Influence(d, sel?.type, sel?.id);
    const bottomRows = Math.max(d.org.length, d.owners.length, 3);
    const style = `--xm-left:${Math.max(360, d.annual.length * 52)}px;--xm-right:${Math.max(340, d.kpis.length * 52)}px;--xm-a:${Math.max(1, d.annual.length)};--xm-k:${Math.max(1, d.kpis.length)};--xm-i:${Math.max(1, d.initiatives.length)};--xm-c:${Math.max(1, d.org.length)};--xm-o:${Math.max(1, d.owners.length)};--xm-top:${Math.max(d.initiatives.length, 4) * 52}px;--xm-bottom:${bottomRows * 52}px`;
    const grid = (a: any[], b: any[], fn: any) => a.length && b.length ? a.map((y: any) => b.map((x: any) => fn(y, x)).join('')).join('') : '<div class="xm3-empty">No links in selected scope</div>';
    return `<div class="xm3-banner"><span><b>How to read clockwise:</b> Corporate Goals → Annual Goals → Initiatives (SQDC) → KPIs → Cross-Functional Owners. <b>${d.org.length} corporate · ${d.annual.length} annual · ${d.initiatives.length} initiatives · ${d.kpis.length} KPIs · ${d.owners.length} leaders</b>.</span><span class="pill teal">Complete 360° Hoshin X-Matrix</span></div>
    <div class="xm3-tools no-print"><label><input type="checkbox" ${S.xmOnlyStrong ? 'checked' : ''} onchange="window.xm3OnlyStrong(this.checked)"> Show only Strong / Primary</label>${btn('Clear highlight', 'window.xm3Clear()')}${btn('Detailed tables', "window.setMatrixView('tables')")}${btn('Goal Cascade', "go('cascade')")}<span class="xs muted">Scroll horizontally on smaller screens · Click any circle or SE owner cell to inspect/edit</span></div>
    <div class="xm3-scroller"><div class="xm3-board" style="${style}">
    <div class="xm3-grid xm3-tl" aria-label="Annual goals to initiatives relationships">${grid(d.initiatives, d.annual, (i: any, g: any) => xm3RelCell(g.id, i.id, `${xm3Title(g)} → ${xm3Title(i)}`, sel, chain))}</div>
    <div class="xm3-toplist" aria-label="Initiatives">${xm3Rows('initiative', d.initiatives, sel, chain)}</div>
    <div class="xm3-grid xm3-tr" aria-label="Initiatives to KPIs relationships">${grid(d.initiatives, d.kpis, (i: any, k: any) => xm3RelCell(i.id, k.id, `${xm3Title(i)} → ${xm3Title(k)}`, sel, chain))}</div>
    <div class="xm3-legendpanel" aria-label="Matrix Legend"><div class="xm3-legendtitle">Symbol Legend</div><div class="xm3-legenditem">${xm3Dot(2)} <span><b>Strong</b> impact</span></div><div class="xm3-legenditem">${xm3Dot(1)} <span><b>Medium</b> impact</span></div><div class="xm3-legenditem">${xm3Dot(0.5)} <span><b>Weak</b> impact</span></div><div class="xm3-legenditem">${xm3Dot(2, true)} <span><b>Hierarchy</b> (● direct / ◐ site)</span></div><div class="xm3-legenditem">${xm3OwnerDot(2)} <span><b>Primary</b> owner (SE)</span></div><div class="xm3-legenditem">${xm3OwnerDot(1)} <span><b>Support</b> role (SE)</span></div><div class="xs muted" style="margin-top:2px">↗ = assigned, unrated · S Q D C = Safety/Quality/Delivery/Cost</div></div>
    <div class="xm3-leftaxis" aria-label="Annual goals">${xm3Axis('annual', d.annual, sel, chain)}</div>
    <div class="xm3-core" aria-label="Four-part SafeQMS X-Matrix"><div class="xm3-quadrant xm3-qtop"><span>⚙ Initiatives</span></div><div class="xm3-quadrant xm3-qleft"><span>◎ Annual Goals</span></div><div class="xm3-quadrant xm3-qright"><span>KPIs ▥</span></div><div class="xm3-quadrant xm3-qbottom"><span>▥ Corporate Goals</span></div><div class="xm3-inner"><div class="xm3-inner-logo">✓ SafeQMS</div><div class="xm3-inner-title">X-Matrix</div><div class="xm3-inner-meta">${esc(S.year)} · + SE Owners</div></div></div>
    <div class="xm3-rightaxis" aria-label="KPIs">${xm3Axis('kpi', d.kpis, sel, chain)}</div>
    <div class="xm3-ownerwinghead" aria-label="Cross-Functional Ownership Header"><b>Cross-Functional Ownership</b><span>WHO is accountable per KPI below:<br><b>● Primary Owner</b> · <b>○ Support</b><br>(Breaks functional silos)</span></div>
    <div class="xm3-grid xm3-bl" aria-label="Corporate goals and annual hierarchy">${grid(d.org, d.annual, (g: any, a: any) => xm3RelCell(a.id, g.id, `${xm3Title(a)} → ${xm3Title(g)}`, sel, chain, true))}</div>
    <div class="xm3-bottomlist" aria-label="Corporate goals">${xm3Rows('corp', d.org, sel, chain)}</div>
    <div class="xm3-br-grid" aria-label="KPIs to Cross-Functional Owners matrix">${grid(d.owners, d.kpis, (o: any, k: any) => xm3OwnerRelCell(o.id, k, sel, chain))}</div>
    <div class="xm3-ownerslist" aria-label="Cross-Functional Owners">${xm3OwnersRows(d.owners, sel, chain, d.kpis)}</div>
    </div></div>${xm3Inspector(d, sel, chain)}`;
  }

  function cycleLink(from: string, to: string) { xm3Cycle(from, to); }

  function matrixCell(a: string, b: string) {
    let n = xm3Impact(a, b);
    return `<td><button type="button" class="cell ${n === 2 ? 'strong' : n === 1 ? 'support' : ''}" title="${esc(xm3Strength(n))}" onclick="window.xm3Select('${a.startsWith('G-') ? 'annual' : 'initiative'}','${a}','${a}','${b}');window.setMatrixView('visual')">${n === 2 ? '●' : n === 1 ? '◐' : n === 0.5 ? '○' : '–'}</button></td>`;
  }

  function matrix() {
    const d = xm3Data(), visual = S.matrixView !== 'tables';
    const tables = () => panel('Annual objectives × Initiatives', `<div class="matrixwrap"><table class="matrix"><thead><tr><th>Annual goal</th>${d.initiatives.map((i: any) => `<th>${esc(i.title)}</th>`).join('')}</tr></thead><tbody>${d.annual.map((g: any) => `<tr><th>${esc(g.title)}</th>${d.initiatives.map((i: any) => matrixCell(g.id, i.id)).join('')}</tr>`).join('')}</tbody></table></div>`) + panel('Initiatives × KPIs', `<div class="matrixwrap"><table class="matrix"><thead><tr><th>Initiative</th>${d.kpis.map((k: any) => `<th>${esc(k.name)}</th>`).join('')}</tr></thead><tbody>${d.initiatives.map((i: any) => `<tr><th>${esc(i.title)}</th>${d.kpis.map((k: any) => matrixCell(i.id, k.id)).join('')}</tr>`).join('')}</tbody></table></div>`);
    return head('X-Matrix', 'Hoshin Kanri · Corporate Goals → Annual Goals → Initiatives → KPIs', btn('Strategy A3', "go('a3')") + btn('Manage Main Goals', "go('pillars')")) +
      roleScopebar() + `<div class="hierarchy-bar">${btn('Visual X-Matrix', "window.setMatrixView('visual')", visual ? 'teal' : '')}${btn('Relationship tables', "window.setMatrixView('tables')", !visual ? 'teal' : '')}</div>` +
      (visual ? visualXMatrix() : tables()) +
      `<div class="banner" style="margin-top:17px"><b>Shared records, not a second strategy database:</b> This visual X-Matrix reads Goal Management goals, parent links, initiative assignments, relations and KPIs. Organization shows every accessible goal without arbitrary item limits; other scopes filter the same hierarchy. Department director edits relationships within assigned scope; General director and QMS auditor can edit company-wide. This HTML is a prototype—real access control belongs in Django.</div>`;
  }

  function projects() {
    const visibleInits = S.initiatives.filter(visibleInitiative);
    const openBlockersCount = (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && blockerAllowedByRole(b) && (b.targetType === 'initiative' || b.targetType === 'project')).length;
    const f = S.sqdcFilter || 'all';
    const highLeverageCount = visibleInits.filter((i: any) => sqdcScore(i).multiPillar).length;
    const bottleneckCount = visibleInits.filter((i: any) => i.isBottleneck).length;
    const safetyCount = visibleInits.filter((i: any) => sqdcScore(i).safetyPriority).length;
    const narrowCount = visibleInits.filter((i: any) => !sqdcScore(i).safetyPriority && !i.isBottleneck && sqdcScore(i).pillars <= 1).length;
    const shownInits = visibleInits.filter((i: any) =>
      f === 'bottleneck' ? !!i.isBottleneck
      : f === 'multi' ? sqdcScore(i).multiPillar
      : f === 'safety' ? sqdcScore(i).safetyPriority
      : f === 'narrow' ? (!sqdcScore(i).safetyPriority && !i.isBottleneck && sqdcScore(i).pillars <= 1)
      : true
    );
    return head('Initiatives & Projects', 'SQDC prioritization, Value Stream bottlenecks (TOC), delivery progress & blockers', btn('+ New initiative', "go('newinitiative')", 'primary') + btn('PDCA Exception Queue', "go('reviews')")) +
      `<div class="cards">${[
        ['Multi-Pillar Leverage (3–4 SQDC)', highLeverageCount, 'Prioritized system initiatives'],
        ['TOC Bottleneck Focus', bottleneckCount, 'Targets system constraint'],
        ['Safety Critical Priority', safetyCount, 'Mandatory S=Primary initiatives'],
        ['Escalated Blockers', openBlockersCount, `${narrowCount} narrow/local scope item(s)`]
      ].map(c => `<div class="card"><div class="label">${c[0]}</div><div class="num">${c[1]}</div><div class="xs muted">${c[2]}</div></div>`).join('')}</div>` +
      `<div class="banner"><b>Cudney Value Stream & SQDC Rule:</b> prioritize initiatives touching multiple <b>SQDC</b> pillars (Safety, Quality, Delivery, Cost) and directly relieving a <b>Value Stream Bottleneck</b> rather than isolated "whack-a-mole" fixes (Safety priorities always stand alone). Execution % does not equal KPI target achievement.</div>` +
      panel('Strategic initiative portfolio (SQDC & Value Stream Prioritized)',
        `<div class="bl-filterbar no-print">
          <button class="bl-chip ${f === 'all' ? 'active' : ''}" onclick="window.setSqdcFilter('all')">All Initiatives (${visibleInits.length})</button>
          <button class="bl-chip ${f === 'bottleneck' ? 'active' : ''}" onclick="window.setSqdcFilter('bottleneck')">TOC Bottleneck (${bottleneckCount})</button>
          <button class="bl-chip ${f === 'multi' ? 'active' : ''}" onclick="window.setSqdcFilter('multi')">High SQDC Leverage (${highLeverageCount})</button>
          <button class="bl-chip ${f === 'safety' ? 'active' : ''}" onclick="window.setSqdcFilter('safety')">Safety Priority (${safetyCount})</button>
          ${narrowCount ? `<button class="bl-chip ${f === 'narrow' ? 'active' : ''}" onclick="window.setSqdcFilter('narrow')">Narrow / Verify (${narrowCount})</button>` : ''}
        </div>` +
        table(['Initiative & Value Stream', 'SQDC Focus', 'Owner', 'Execution', 'Status', 'Blockers'], shownInits.map((i: any) => {
          const bs = itemBlockers('initiative', i.id);
          return `<tr class="click" onclick="go('initiative','${i.id}')"><td><b>${esc(i.title)}</b><div class="xs muted">${i.id} · Goal: ${esc(goal(i.goal)?.title || 'Not linked')}</div><div class="xs muted" style="margin-top:2px">${esc(i.valueStream || 'Value stream not tagged')}</div></td><td><div>${sqdcStripHtml(i)}</div><div style="margin-top:4px">${sqdcLeverageBadge(i)}</div></td><td>${esc(i.owner)}</td><td><div class="progress" style="min-width:85px"><div style="width:${i.progress}%"></div></div><span class="xs">${i.progress}%</span></td><td>${badge(i.status)}</td><td>${bs.length ? `<span class="xm3-flag">⚑ ${bs.length} Open</span>` : '<span class="xs muted">—</span>'}</td></tr>`;
        }))) +
      panel('Projects and A3', table(['Project', 'Initiative', 'Owner', 'Progress', 'Status', 'Blockers'], S.projects.filter(visibleProject).map((p: any) => {
        const bs = itemBlockers('project', p.id).length + itemBlockers('initiative', p.initiative).length;
        return `<tr class="click" onclick="go('project','${p.id}')"><td><b>${esc(p.title)}</b><div class="xs muted">${p.id}</div></td><td>${esc(initiative(p.initiative)?.title)}</td><td>${esc(p.owner)}</td><td>${p.progress}%</td><td>${badge(p.status)}</td><td>${bs ? `<span class="xm3-flag">⚑ ${bs}</span>` : '<span class="xs muted">—</span>'}</td></tr>`;
      })));
  }

  function newInitiative() {
    const sqdcOpts = [['0', 'None (–)'], ['1', 'Support (○)'], ['2', 'Primary (●)']];
    return head('New Initiative', 'Link the improvement programme to a strategic goal, SQDC pillars & Value Stream bottleneck') + panel('Initiative', `<form onsubmit="window.saveInitiative(event)"><div class="formgrid">${field('Title *', 'title', '', 'text', 'required')}${field('Accountable owner', 'owner')}${select('Primary goal', 'goal', S.goals.map((g: any) => [g.id, g.title]), S.goals[0].id)}${field('Budget', 'budget', '')}${field('Progress %', 'progress', '0', 'number', 'min="0" max="100"')}${select('Status', 'status', ['Planned', 'On track', 'At risk', 'Completed'], 'Planned')}${field('Value Stream / System Constraint', 'valueStream', '', 'text', 'placeholder="E.g. Line 3 Packaging Stream · TOC Bottleneck"')}${select('Targets TOC Bottleneck?', 'isBottleneck', [['true', 'Yes — Relieves System Bottleneck'], ['false', 'No — Supporting / Local']], 'false')}${select('Safety (S)', 'sqdcS', sqdcOpts, '0')}${select('Quality (Q)', 'sqdcQ', sqdcOpts, '1')}${select('Delivery (D)', 'sqdcD', sqdcOpts, '1')}${select('Cost (C)', 'sqdcC', sqdcOpts, '1')}</div><div class="field"><label>Description</label><textarea name="description"></textarea></div><button class="btn primary">Create initiative</button></form>`);
  }

  function initiativeDetail(id: string) {
    let i = initiative(id);
    if (!i) return head('Not found');
    let ps = S.projects.filter((p: any) => p.initiative === id && visibleProject(p));
    const sc = sqdcScore(i);
    const sqdcOpts = [['0', 'None (–)'], ['1', 'Support (○)'], ['2', 'Primary (●)']];
    return head(i.title, `${id} · ${i.owner}`, btn('⚑ Escalate blocker', `window.escalateBlocker('initiative','${id}')`, 'primary') + btn('Back', "go('projects')")) +
      `<div class="cards" style="grid-template-columns:repeat(4,1fr)"><div class="card"><div class="label">Execution</div><div class="num">${i.progress}%</div></div><div class="card"><div class="label">Performance</div>${badge(i.status)}</div><div class="card"><div class="label">SQDC System Impact</div><div style="margin:6px 0">${sqdcStripHtml(i)}</div><div class="xs muted">${sc.pillars}/4 pillars · score ${sc.weighted}/8</div></div><div class="card"><div class="label">Primary goal</div><b>${esc(goal(i.goal)?.title || 'None')}</b></div></div>` +
      panel('Initiative details', `<p>${esc(i.description)}</p><p><b>Budget:</b> ${esc(i.budget)} · <b>Owner:</b> ${esc(i.owner)} · ${sqdcLeverageBadge(i)}</p><div class="actions">${btn('Open X-Matrix', "go('matrix')")}${btn('Open linked goal', `go('goal','${i.goal}')`)}${btn('PDCA Reviews', "go('reviews')")}</div>`) +
      panel('SQDC Prioritization, Execution & Value Stream Bottleneck (Hoshin Plan Summary)',
        `<form id="initiativeFocusForm" onsubmit="window.updateInitiativeFocus(event,'${id}')"><div class="formgrid">${field('Progress %', 'progress', i.progress ?? 0, 'number', 'min="0" max="100"')}${select('Execution Status', 'status', ['Planned', 'On track', 'At risk', 'Completed'], i.status || 'Planned')}${field('Value Stream / Bottleneck Target', 'valueStream', i.valueStream || '')}${select('Relieves System Bottleneck (TOC)?', 'isBottleneck', [['true', 'Yes — Relieves TOC Bottleneck'], ['false', 'No — Supporting / Non-Bottleneck']], i.isBottleneck ? 'true' : 'false')}${select('Safety (S)', 'sqdcS', sqdcOpts, String(sc.s.S || 0))}${select('Quality (Q)', 'sqdcQ', sqdcOpts, String(sc.s.Q || 0))}${select('Delivery (D)', 'sqdcD', sqdcOpts, String(sc.s.D || 0))}${select('Cost (C)', 'sqdcC', sqdcOpts, String(sc.s.C || 0))}</div><div class="actions">${btn('Save Initiative & SQDC', '', 'teal')}</div></form>`) +
      blockerSectionHtml('initiative', id, 'Escalated Blockers (Hoshin Implementation Issues)') +
      panel('Projects', table(['Project', 'Progress', 'Status'], ps.map((p: any) => `<tr class="click" onclick="go('project','${p.id}')"><td>${esc(p.title)}</td><td>${p.progress}%</td><td>${badge(p.status)}</td></tr>`)));
  }

  function projectDetail(id: string) {
    let p = S.projects.find((x: any) => x.id === id);
    if (!p) return head('Project not found');
    let ts = S.tasks.filter((t: any) => t.project === id);
    const canEditTasks = roleCan('projectWrite', p);
    const parentBlockers = itemBlockers('initiative', p.initiative, false);
    return head('Project A3 – ' + p.title, `${p.id} · ${esc(initiative(p.initiative)?.title)}`, btn('⚑ Escalate blocker', `window.escalateBlocker('project','${id}')`) + btn('Print A3', 'window.print()', 'primary') + btn('Back', "go('projects')")) +
      `<div class="a3"><div class="split"><div><b>SAFEQMS · PROJECT A3</b><div class="xs muted">${esc(p.title)} · ${p.id} · Owner: ${esc(p.owner)}</div></div>${badge(p.status)}</div><div class="a3grid" style="margin-top:12px">${[['01 · Background / Problem', 'problem'], ['02 · Current Condition', 'current'], ['03 · Target Condition', 'target'], ['04 · Root Cause', 'root'], ['05 · Countermeasures', 'counter'], ['06 · Standardize & Learn', 'learning']].map(x => `<div class="a3box"><h3>${x[0]}</h3><textarea id="${x[1]}" style="width:100%;min-height:75px;border:0;resize:vertical">${esc(p[x[1]])}</textarea></div>`).join('')}<div class="a3box full"><h3>07 · Implementation Plan & Milestones</h3>${table(['Activity', 'Owner', 'Due', 'Status'], ts.map((t: any) => `<tr><td>${esc(t.title)}</td><td>${esc(t.owner)}</td><td>${esc(t.due)}</td><td>${canEditTasks ? `<button type="button" class="link" onclick="window.toggleTaskStatus('${t.id}')" title="Click to cycle: Open → In progress → Done">${badge(t.status)}</button>` : badge(t.status)}</td></tr>`))}</div><div class="a3box full"><h3>08 · Check Results / PDCA & Active Blockers</h3><p>Project execution: <b>${p.progress}%</b> · Goal KPI outcome tracked separately in Bowling Chart.</p>${parentBlockers.length ? `<div class="minirow"><b>Parent Initiative Blockers:</b> ${parentBlockers.map((b: any) => `${esc(b.id)}: ${esc(b.summary)}`).join(' · ')}</div>` : ''}<p class="xs muted">Verify sustained effectiveness before standardization and project closure.</p></div></div></div><div class="actions no-print" style="margin:15px 0">${btn('Save A3 notes', `window.saveProjectA3('${id}')`, 'primary')}${btn('Add activity', `window.addTask('${id}')`)}${btn('View KPIs', "go('kpis')")}</div>` +
      blockerSectionHtml('project', id, '09 · Escalated Project Blockers (PDCA Review Input)');
  }

  function kpis() {
    return head('KPIs & Bowling Chart', 'KPI-derived performance · target direction · CSV import', btn('Import CSV', "go('import')", 'primary')) +
      `<div class="toolbar"><select id="kpiSelect" onchange="window.kpiDetail(this.value)">${S.kpis.map((k: any) => `<option value="${k.id}">${esc(k.name)}</option>`).join('')}</select>${btn('CSV Import', "go('import')")}</div><div id="kpiContent"></div>`;
  }

  function kpiDetail(id: string) {
    let k = kpi(id);
    if (!k) return;
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], summary = computeKpiStatus(k);
    let rows = months.map((m, i) => {
      let a = k.values[i], t = k.targets[i], data = a !== null && a !== undefined && t !== null && t !== undefined;
      let gap = data ? (k.direction === 'lower' ? Number(t) - Number(a) : Number(a) - Number(t)) : null;
      let status = !data || gap === null ? '—' : gap >= 0 ? 'On track' : gap >= -Number(k.tolerance) ? 'At risk' : 'Off track';
      return `<tr><td><b>${m}</b></td><td>${t ?? '—'}</td><td>${a ?? '—'}</td><td>${gap === null ? '—' : `<b style="color:${gap >= 0 ? 'var(--green)' : 'var(--red)'}">${gap >= 0 ? 'favorable +' : 'unfavorable '}${gap.toFixed(1)}</b>`}</td><td>${badge(status)}</td></tr>`;
    });
    let pts = k.values.map((v: any, i: number) => ({ v, t: k.targets[i], i })).filter((p: any) => p.v !== null && p.v !== undefined && p.t !== null && p.t !== undefined);
    let all = pts.flatMap((p: any) => [Number(p.v), Number(p.t)]), min = Math.min(...all) - 3, max = Math.max(...all) + 3;
    let y = (v: number) => 130 - (v - min) / (max - min || 1) * 105, x = (i: number) => 35 + i * (500 / 11);
    let svg = pts.length ? `<svg viewBox="0 0 580 165" width="100%" role="img" aria-label="Monthly target and actual line chart"><path d="M30 15V135H550" fill="none" stroke="var(--svg-axis, #a8b7c0)"/>${[0, .25, .5, .75, 1].map(t => `<line x1="30" x2="550" y1="${25 + t * 105}" y2="${25 + t * 105}" stroke="var(--svg-grid, #edf1f3)"/>`).join('')}${['t', 'v'].map((z, j) => `<polyline fill="none" stroke="${j ? 'var(--teal, #138b86)' : 'var(--amber, #d48b32)'}" stroke-width="3" points="${pts.map((p: any) => `${x(p.i)},${y(p[z])}`).join(' ')}"/>`).join('')}${pts.map((p: any) => `<text x="${x(p.i)}" y="154" font-size="10" fill="var(--svg-text, #687d8b)" text-anchor="middle">${months[p.i]}</text>`).join('')}</svg>` : '<p>No actuals yet.</p>';
    
    const content = document.getElementById('kpiContent');
    if (!content) return;
    content.innerHTML = `<div class="cards" style="grid-template-columns:repeat(4,1fr)"><div class="card"><div class="label">Latest actual</div><div class="num">${summary.actual ?? '—'} ${esc(k.unit)}</div></div><div class="card"><div class="label">Planned target</div><div class="num">${summary.target ?? '—'}</div></div><div class="card"><div class="label">Performance status</div>${badge(summary.label)}</div><div class="card"><div class="label">Improvement direction</div><div class="num" style="font-size:20px">${k.direction === 'lower' ? '↓ Lower' : '↑ Higher'}</div></div></div>${panel('Monthly trend · Actual vs Target', `${svg}<p class="xs muted">Teal: actual · Orange: target · Adverse gaps use the KPI's direction and tolerance of ${k.tolerance}. Better-than-target performance is never penalized.</p>`)}${panel('Bowling Chart', table(['Month', 'Target', 'Actual', 'Favorable / unfavorable gap', 'Status'], rows))}<div class="isooutline"><b>Data source:</b> ${esc(k.source || 'Manual')} ${k.sourceUpdated ? '· updated ' + esc(k.sourceUpdated) : ''}<p class="xs muted">Actual values and linked goal statuses update immediately following a valid import. Off-track KPIs and 2+ month adverse trends automatically appear in PDCA Reviews.</p></div><div class="actions" style="margin-bottom:17px">${btn('Record next month actual', `window.recordKPI('${id}')`, 'primary')}${btn('⚑ Escalate KPI blocker', `window.escalateBlocker('kpi','${id}')`)}${btn('CSV Import', "go('import')")}${btn('PDCA Reviews', "go('reviews')")}${btn('Management Review', "go('management')")}</div>${blockerSectionHtml('kpi', id, 'Escalated KPI Blockers & Review Exceptions')}`;
  }

  function reviews() {
    const queue = pdcaExceptionQueue(S.scope, true);
    const resolved = (S.blockers || []).filter((b: any) => b.status === 'Resolved' && blockerAllowedByRole(b) && blockerMatchesScope(b.scope, S.scope));
    const filter = S.blockerFilter || 'active';
    const filtered = filter === 'resolved'
      ? resolved
      : filter === 'manual'
        ? queue.filter((x: any) => !x.isAuto)
        : filter === 'auto'
          ? queue.filter((x: any) => x.isAuto)
          : queue;
    const openManual = queue.filter((x: any) => !x.isAuto).length;
    const autoCount = queue.filter((x: any) => x.isAuto).length;
    const inReviewCount = queue.filter((x: any) => x.status === 'In review').length;

    const visibleReviews = (S.reviews || []).filter((r: any) =>
      (!limitedRole() || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(r.scope, S.scope)
    );

    return head('PDCA Reviews · Implementation Exceptions', 'Management by Exception · Escalated blockers & red KPIs feed directly into review decisions', btn('+ New review', "go('newreview')", 'primary')) +
      roleScopebar() +
      `<div class="cards">${[
        ['Open Escalated Blockers', openManual, 'Flagged by teams for decision'],
        ['Red / Recurring KPI Signals', autoCount, 'Auto-detected from Bowling Chart'],
        ['In Active PDCA Review', inReviewCount, 'Linked to tracked decisions'],
        ['Resolved Blockers', resolved.length, 'Closed loop in this scope']
      ].map(c => `<div class="card"><div class="label">${c[0]}</div><div class="num">${c[1]}</div><div class="xs muted">${c[2]}</div></div>`).join('')}</div>` +
      panel(`Implementation Blockers & Exception Queue (${filtered.length})`,
        `<p class="small muted">Focus leadership review time on what is blocked or off-track (Cudney Hoshin Implementation Review). Convert any blocker or red signal directly into a carry-forward PDCA decision.</p>
        <div class="bl-filterbar no-print">
          <button class="bl-chip ${filter === 'active' ? 'active' : ''}" onclick="window.setBlockerFilter('active')">Active Queue (${queue.length})</button>
          <button class="bl-chip ${filter === 'manual' ? 'active' : ''}" onclick="window.setBlockerFilter('manual')">Escalated Blockers (${openManual})</button>
          <button class="bl-chip ${filter === 'auto' ? 'active' : ''}" onclick="window.setBlockerFilter('auto')">Red KPIs & At-Risk Signals (${autoCount})</button>
          <button class="bl-chip ${filter === 'resolved' ? 'active' : ''}" onclick="window.setBlockerFilter('resolved')">Resolved History (${resolved.length})</button>
        </div>` +
        (filtered.length ? filtered.map((b: any) => blockerBoxHtml(b, true)).join('') : '<p class="small muted">No exceptions in this filter for the selected scope.</p>')
      ) +
      panel('Management review meetings', table(['Review', 'Date', 'Scope', 'Decisions', 'Actions'], visibleReviews.map((r: any) => `<tr class="click" onclick="go('review','${r.id}')"><td><b>${esc(r.title)}</b></td><td>${esc(r.date)}</td><td>${esc(r.scope)}</td><td>${r.decisions.length}</td><td>${badge(r.decisions.some((d: any) => d.status === 'Open') ? 'In progress' : 'Completed')}</td></tr>`))) +
      panel('Carry-forward actions', table(['Decision', 'Linked Record', 'Owner', 'Due', 'Status'], visibleReviews.flatMap((r: any) => r.decisions.map((d: any) => {
        const link = d.linkedType && d.linkedId ? blockerTargetInfo(d.linkedType, d.linkedId) : null;
        return `<tr><td>${esc(d.text)}${d.blockerId ? ` <span class="pill teal">${esc(d.blockerId)}</span>` : ''}</td><td>${link ? `<button class="link small" onclick="go('${link.route}','${link.routeId}')">${esc(link.code)} · ${esc(link.title)}</button>` : '<span class="xs muted">—</span>'}</td><td>${esc(d.owner)}</td><td>${esc(d.due)}</td><td>${badge(d.status)}</td></tr>`;
      }))));
  }

  function newReview() {
    return head('New PDCA Review', 'Capture performance decisions and carry-forward actions') + panel('Review details', `<form onsubmit="window.createReview(event)"><div class="formgrid">${field('Review title *', 'title', 'Monthly Strategy Review', 'text', 'required')}${field('Date', 'date', today, 'date')}${select('Scope', 'scope', ['Organization', 'Site: Uppsala', 'Site: Falkenberg', 'Department: Production', 'Department: Maintenance'], S.scope)}</div><div class="field"><label>Meeting notes / performance gaps</label><textarea name="notes"></textarea></div><button class="btn primary">Create review</button></form>`);
  }

  function reviewDetail(id: string) {
    let r = S.reviews.find((x: any) => x.id === id);
    if (!r) return head('Review not found');
    const reviewQueue = pdcaExceptionQueue(r.scope, r.scope !== 'Organization').filter((x: any) => x.status === 'Open');
    return head(r.title, `${r.date} · ${r.scope}`, btn('Back', "go('reviews')")) +
      panel('Review agenda', `<div class="flow"><div class="step active">Check: KPIs & Blockers</div><div class="step active">Act: Decisions</div><div class="step active">Plan: Countermeasures</div><div class="step active">Do: Execute</div></div><p style="margin-top:14px;white-space:pre-line">${esc(r.notes)}</p>`) +
      panel(`Open Blockers & Red Exceptions for this Review (${reviewQueue.length})`,
        `<p class="small muted">Scoped blockers and Bowling Chart exceptions waiting for a decision. Add directly to this meeting's action log in one click.</p>` +
        (reviewQueue.length ? table(['Source', 'Linked Item', 'Blocker / Gap & Needed Decision', 'Owner', 'Action'], reviewQueue.map((x: any) => {
          const info = blockerTargetInfo(x.targetType, x.targetId);
          return `<tr><td>${x.isAuto ? '<span class="pill red">⚠ Auto Signal</span>' : `<span class="pill teal">⚑ ${esc(x.id)}</span>`}<div style="margin-top:4px">${badge(x.severity)}</div></td><td><button class="link" onclick="go('${info.route}','${info.routeId}')"><b>${esc(info.code)}</b> · ${esc(info.title)}</button><div class="xs muted">${esc(x.category)}</div></td><td><b>${esc(x.summary)}</b><div class="xs muted" style="margin-top:3px">Need: ${esc(x.neededAction)}</div></td><td>${esc(x.owner)}</td><td>${btn('→ Add to Decisions', `window.quickAddReviewDecision('${esc(id)}','${esc(x.isAuto ? '' : x.id)}','${esc(x.targetType)}','${esc(x.targetId)}')`, 'teal')}</td></tr>`;
        })) : '<p class="small muted">No unreviewed open blockers or red KPI signals in this scope.</p>')
      ) +
      panel('Decisions & carry-forward actions', table(['Decision', 'Linked Exception', 'Owner', 'Due', 'Status'], r.decisions.map((d: any, i: number) => {
        const link = d.linkedType && d.linkedId ? blockerTargetInfo(d.linkedType, d.linkedId) : null;
        return `<tr><td>${esc(d.text)}</td><td>${d.blockerId ? `<span class="pill teal">⚑ ${esc(d.blockerId)}</span> ` : ''}${link ? `<button class="link xs" onclick="go('${link.route}','${link.routeId}')">${esc(link.code)}</button>` : '<span class="xs muted">—</span>'}</td><td>${esc(d.owner)}</td><td>${esc(d.due)}</td><td><button class="link" onclick="window.toggleDecision('${id}',${i})" title="Toggling to Done automatically resolves any linked blocker">${badge(d.status)}</button></td></tr>`;
      }))) +
      panel('Add PDCA action', `<form onsubmit="window.addDecision(event,'${id}')"><div class="formgrid">${field('Decision / action *', 'text', '', 'text', 'required')}${field('Owner *', 'owner', '', 'text', 'required')}${field('Due date', 'due', today, 'date')}</div><button class="btn primary">Add action</button></form>`);
  }

  function a3() {
    let plan = S.plans.find((p: any) => p.scope === S.scope) || S.plans[0], g = roleVisibleGoals(), linked = S.initiatives.filter((i: any) => visibleInitiative(i) && g.some((x: any) => initiativeLinkedToGoal(i, x.id)));
    const openBlockers = (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && blockerAllowedByRole(b) && blockerMatchesScope(b.scope, S.scope));
    const scopedReviews = (S.reviews || []).filter((r: any) => (!limitedRole() || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) && blockerMatchesScope(r.scope, S.scope));
    return head('Strategy A3', 'Printable strategic one-page view · derived from live records', btn('Print / Save PDF (A3)', 'window.print()', 'primary') + btn('Project A3', "go('project','P-001')")) + roleScopebar() +
      `<div class="banner">Strategy A3 is a generated report, not a second data entry form. Print from your browser and select <b>A3 landscape</b> / Save as PDF.</div>
      <div class="a3"><div class="split" style="margin-bottom:10px"><div><b>SAFEQMS · STRATEGY DEPLOYMENT A3</b><div class="xs muted">${esc(plan.name)} · ${esc(S.scope)} · ${esc(S.year)}</div></div><div class="small">Rev ${plan.revision} · ${badge(plan.status)}</div></div><div class="a3grid">
      <div class="a3box"><h3>01 · Strategic Direction</h3>${g.filter((x: any) => x.level === 'Organization').map((x: any) => `<div class="minirow">• ${esc(x.title)}</div>`).join('') || '<p class="small">Refer to organization breakthrough goals.</p>'}</div>
      <div class="a3box"><h3>02 · Annual Objectives</h3>${g.filter((x: any) => x.level !== 'Organization').map((x: any) => `<div class="minirow">${esc(x.title)} ${badge(x.performance)}</div>`).join('') || '<p class="small">No local annual objectives yet.</p>'}</div>
      <div class="a3box full"><h3>03 · X-Matrix Relationship Snapshot</h3><div class="strategy-map"><div><div class="coltitle">Long-term goals</div>${S.goals.filter((z: any) => z.level === 'Organization' && visibleToRole(z)).map((z: any) => `<div class="minirow">${esc(z.title)}</div>`).join('')}</div><div><div class="coltitle">Annual objectives</div>${g.filter((z: any) => z.level !== 'Organization').map((z: any) => `<div class="minirow">${esc(z.title)}</div>`).join('')}</div><div><div class="coltitle">Improvement initiatives</div>${linked.map((z: any) => `<div class="minirow">${esc(z.title)}</div>`).join('')}</div><div><div class="coltitle">KPIs</div>${S.kpis.filter((z: any) => g.some((x: any) => x.kpi === z.id)).slice(0, 6).map((z: any) => `<div class="minirow">${esc(z.name)}</div>`).join('')}</div></div><p class="xs muted">Relationship detail:</p>${table(['Objective', 'Strategic initiative', 'Strength'], S.relations.filter((r: any) => r.from.startsWith('G-') && r.to.startsWith('I-')).filter((r: any) => g.some((x: any) => x.id === r.from)).map((r: any) => `<tr><td>${esc(goal(r.from)?.title)}</td><td>${esc(initiative(r.to)?.title)}</td><td>${xm3Strength(r.strength)}</td></tr>`))}</div>
      <div class="a3box"><h3>04 · KPI / Bowling Snapshot</h3>${g.filter((x: any) => x.kpi).slice(0, 6).map((x: any) => { const st = computeKpiStatus(kpi(x.kpi)); const tgt = st.target ?? x.target; return `<div class="minirow">${esc(kpi(x.kpi)?.name)}: <b>${st.actual ?? '—'}</b> / target ${esc(tgt)} ${esc(x.unit)}</div>`; }).join('')}</div>
      <div class="a3box"><h3>05 · Improvement Priorities, SQDC & Blockers</h3>${linked.map((x: any) => `<div class="minirow"><b>${esc(x.title)}</b> · ${x.progress}% · ${esc(x.owner)}<div class="xs muted" style="margin-top:2px">[SQDC ${sqdcScore(x).pillars}/4${x.isBottleneck ? ' · TOC Bottleneck' : ''}] ${esc(x.valueStream || '')}</div></div>`).join('') || '<p class="small">Open X-Matrix for all initiative links.</p>'}${openBlockers.length ? `<div class="a3-blocker-list"><b class="xs" style="color:var(--red)">Escalated Blockers (${openBlockers.length}):</b>${openBlockers.map((b: any) => `<div class="minirow xs">⚑ <b>${esc(b.id)}</b> (${esc(b.severity)}): ${esc(b.summary)}</div>`).join('')}</div>` : ''}</div>
      <div class="a3box full"><h3>06 · Review Decisions & Governance</h3>${scopedReviews.slice(-2).flatMap((r: any) => r.decisions).map((d: any) => `<div class="minirow">${esc(d.text)} · ${esc(d.owner)} · ${esc(d.due)} ${badge(d.status)}</div>`).join('') || '<p>No open decisions</p>'}<p class="xs muted">Accountable: ${esc(plan.owner)} · Status: ${esc(plan.status)} · Historical revisions preserved in production implementation</p></div>
      </div></div>`;
  }

  function approvals() {
    return head('Approvals & Alignment', 'Formal approval with ISO planning gates and revision snapshots', btn('ISO Compliance', "go('iso')")) +
      `<div class="banner">General director and QMS auditor are both authorized strategic approvers. All approved goals appear in the General director decision feed; QMS approvals also generate an information notification. Only complete goal plans may be approved. No actual email delivery, backend role enforcement or external integrations are implemented.</div>` +
      panel('Approval queue', table(['Goal', 'Requester', 'Approver', 'ISO plan', 'Status', 'Decision'], S.approvals.filter((a: any) => visibleToRole(goal(a.goal))).map((a: any) => {
        let g = goal(a.goal), v = g && goalPlanCheck(g);
        return `<tr><td><button class="link" onclick="go('goal','${a.goal}')"><b>${esc(g?.title || a.goal)}</b></button><div class="xs muted">${a.id}</div></td><td>${esc(a.requester)}</td><td>${esc(a.approvedBy || a.approver)}</td><td>${v ? (v.ready ? '<span class="isoem">Ready</span>' : '<span class="isoem bad">Incomplete</span>') : '—'}</td><td>${badge(a.status)}</td><td>${a.status === 'Pending' ? `<div class="actions">${btn('Approve', `window.decide('${a.id}','Approved')`, 'teal')}${btn('Request changes', `window.decide('${a.id}','Changes requested')`)}</div>` : '—'}</td></tr>`;
      }))) +
      panel('Strategy plans & version control', table(['Plan', 'Period', 'Owner', 'Revision', 'Status', 'Action'], S.plans.map((p: any) => `<tr><td>${esc(p.name)}<div class="xs muted">${esc(p.scope)}</div></td><td>${esc(p.period)}</td><td>${esc(p.owner)}</td><td>v${p.revision}</td><td>${badge(p.status)}</td><td>${btn('Create revision', `window.revisePlan('${p.id}')`)}</td></tr>`))) +
      panel('Archived approved goal snapshots', `<p class="small muted">Archived copies preserve the previous approved state when goal records are changed.</p>${S.goalRevisions.length ? table(['Goal', 'Old revision', 'Date', 'Status'], S.goalRevisions.map((r: any) => `<tr><td>${esc(r.approvedSnapshot.title)}</td><td>v${r.revision}</td><td>${esc(r.at)}</td><td>${badge(r.approvedSnapshot.approval)}</td></tr>`)) : '<p>No archived goal snapshots yet.</p>'}`) +
      panel('Audit trail (demo)', S.history.map((h: any) => `<div class="minirow"><span class="xs muted">${esc(h.time)}</span> · ${esc(h.text)}</div>`).join(''));
  }

  function isoPage() {
    let rows = S.goals.filter(visibleToRole).map((g: any) => {
      let c = goalPlanCheck(g), ev = goalEvidenceCheck(g);
      return `<tr class="click" onclick="go('goal','${g.id}')"><td><b>${esc(g.title)}</b><div class="xs muted">${esc(g.id)} · ${esc(g.level)}</div></td><td>${esc(isoShort(g))}</td><td>${c.ready ? '<span class="isoem">Ready</span>' : `<span class="isoem bad">${c.checks.filter((x: any) => !x.ok).length} missing</span>`}</td><td>${ev.riskLinked ? '✓' : '—'} Risk&nbsp; ${ev.evidenceLinked ? '✓' : '—'} Documents (optional)</td><td>${badge(g.approval)}</td></tr>`;
    });
    let complete = S.goals.filter(visibleToRole).filter((g: any) => goalPlanCheck(g).ready).length;
    return head('ISO Goal Compliance', 'Connect objectives to the ISO chapters already managed in SafeQMS', btn('Audit Evidence Pack', "go('evidence')", 'primary') + btn('Management Review', "go('management')")) +
      `<div class="report-cover"><b>Integration design — reuse your ISO Standards module.</b> In the finished SafeQMS system, ISO chapters are fetched through authenticated ISO Standards endpoints. This standalone HTML has a small demonstration catalog that can be replaced with an exported JSON catalog containing actual requirement IDs. ISO 27001 can then be included without changing Goal Management logic.</div>
      <div class="cards">${[
        ['ISO references', S.isoStandards.reduce((n: number, s: any) => n + s.requirements.length, 0), 'Example / imported requirement IDs'],
        ['Goals with a complete plan', `${complete}/${S.goals.filter(visibleToRole).length}`, 'Ready for submission'],
        ['Planning gaps', S.goals.filter(visibleToRole).length - complete, 'Require correction'],
        ['ISO-linked goals', S.goals.filter(visibleToRole).filter((g: any) => g.isoRefs?.length).length, 'References in goal records']
      ].map(c => `<div class="card"><div class="label">${c[0]}</div><div class="num">${c[1]}</div><div class="xs muted">${c[2]}</div></div>`).join('')}</div>` +
      panel('ISO-linked goal register', table(['Goal', 'ISO clause links', 'Planning completeness', 'Other traceability', 'Approval'], rows)) +
      panel('ISO Standards adapter', `<div class="split"><div><h3>Catalog source</h3><p class="small muted">${esc(S.isoCatalogSource)}</p></div>${btn('Restore demo catalog', 'window.restoreDemoISO()')}</div><div class="isogrid">${S.isoStandards.map((s: any) => `<div class="tile"><h3>${esc(s.code)}</h3><p class="xs muted">${esc(s.edition)}</p><div class="minirow">${s.requirements.length} accessible example clause references</div>${s.requirements.map((r: any) => `<div class="minirow xs"><b>${esc(r.number)}</b> ${esc(r.title)}<div class="xs muted">ID: ${esc(r.id)}</div></div>`).join('')}</div>`).join('')}</div><div class="isooutline"><h3>Import references from your existing ISO Standards module</h3><p class="small">This import demonstrates the data contract. The real app should call your existing Django REST ISO Standards API and store its requirement IDs (FKs), not duplicate the clauses. The sample JSON contains only a subset, not full licensed standard text.</p><div class="actions"><label class="btn">Import ISO catalog JSON <input type="file" accept=".json,application/json" onchange="window.importISOFile(event)" style="display:none"></label>${btn('Download sample API payload', 'window.downloadISOSample()')}</div><p class="xs muted">Expected payload: <code>{ "standards": [{ "id", "code", "edition", "requirements": [{ "id", "number", "title" }] }] }</code>. IDs must remain stable across updates.</p></div>`) +
      panel('Completeness versus conformity', `<p><b>Planning completeness:</b> minimum goal planning fields checked automatically before approval, including what, resources, owner, deadline and how results are evaluated.</p><p><b>Evidence status:</b> links to processes, risks, measurement data and documents. Completing fields is not equivalent to demonstrating conformity with an ISO standard.</p><p><b>Certification:</b> conclusions require actual implementation, records and audit assessment. This HTML is a workflow prototype.</p>`);
  }

  function csvTemplate() {
    return 'kpi_id,month,target,actual\nK-001,2027-08,75,74\nK-002,2027-08,45,43\nK-003,2027-08,80,74\nK-006,2027-08,95,94';
  }

  function parseCsvLine(line: string, delimiter: string) {
    let out = [], cell = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === delimiter && !quoted) {
        out.push(cell.trim()); cell = '';
      } else cell += ch;
    }
    if (quoted) throw new Error('Unclosed quoted CSV value');
    out.push(cell.trim());
    return out;
  }

  function monthIndex(m: string) {
    let months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'], v = String(m || '').trim().toLowerCase(), idx = months.indexOf(v.slice(0, 3));
    if (idx >= 0) return idx;
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return Number(v.slice(5)) - 1;
    if (/^(0?[1-9]|1[012])$/.test(v)) return Number(v) - 1;
    return -1;
  }

  function csvRead(text: string) {
    let lines = String(text || '').replace(/^\ufeff/, '').split(/\r?\n/).map(x => x.trim()).filter(Boolean), errors: string[] = [], records: any[] = [];
    if (lines.length < 2) return { errors: ['Expected CSV header and at least one data row'], records };
    let delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
    let heads = parseCsvLine(lines[0], delimiter).map(x => x.toLowerCase().replace(/[\s-]+/g, '_'));
    for (let c of ['kpi_id', 'month', 'actual']) if (!heads.includes(c)) errors.push('Missing CSV column: ' + c);
    if (errors.length) return { errors, records };
    for (let i = 1; i < lines.length; i++) {
      try {
        let cells = parseCsvLine(lines[i], delimiter), obj = Object.fromEntries(heads.map((h, j) => [h, cells[j] ?? ''])), key = obj.kpi_id, idx = monthIndex(obj.month);
        if (!kpi(key)) throw Error('Unknown KPI ID ' + key);
        if (idx < 0) throw Error('Invalid month ' + obj.month);
        if (/^\d{4}-/.test(obj.month) && obj.month.slice(0, 4) !== '2027') throw Error('Demo KPI series covers 2027 only; connect backend for other years');
        let num = (v: any) => Number(delimiter === ';' ? String(v).replace(',', '.') : v);
        if (!obj.actual || !Number.isFinite(num(obj.actual))) throw Error('Invalid actual ' + obj.actual);
        if (obj.target && !Number.isFinite(num(obj.target))) throw Error('Invalid target ' + obj.target);
        records.push({ key, index: idx, actual: num(obj.actual), target: obj.target !== '' ? num(obj.target) : null, row: i + 1 });
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }
    let keys = new Set();
    for (const r of records) {
      let key = r.key + ':' + r.index;
      if (keys.has(key)) errors.push(`Duplicate row for ${key}`);
      keys.add(key);
    }
    return { errors, records };
  }

  function csvImportPage() {
    return head('KPI CSV Import', 'Manual data entry, bulk data import and source traceability', btn('Back to KPIs', "go('kpis')")) +
      `<div class="banner"><b>CSV adapter v1:</b> import KPI identifiers already in SafeQMS. Rows are validated as one batch before any values are updated. Future integrations should pull from ERP, MES or BI through authenticated connectors.</div><div class="importpane">` +
      panel('Import actuals / targets', `<p class="small muted">Required columns: <code>kpi_id,month,actual</code>. Optional: <code>target</code>. Accepted month formats: <code>2027-08</code>, <code>Aug</code>, <code>8</code>.</p><textarea id="csvInput" class="csvbox" style="width:100%">${csvTemplate()}</textarea><div class="actions" style="margin-top:10px"><label class="btn">Upload CSV <input type="file" accept=".csv,text/csv,text/plain" style="display:none" onchange="window.uploadCsv(event)"></label>${btn('Validate import', 'window.validateCsvUI()')}${btn('Import valid rows', 'window.commitCsv()', 'primary')}</div><p class="xs muted">Semicolon-delimited CSV supports comma decimals. Data remains in browser storage only.</p><div id="csvImportResult"></div>`) +
      panel('Available KPI identifiers', table(['KPI ID', 'Metric', 'Current source'], S.kpis.map((k: any) => `<tr><td><b>${k.id}</b></td><td>${esc(k.name)}</td><td class="xs">${esc(k.source || 'Manual')}</td></tr>`))) + `</div>` +
      panel('Import log', S.csvImports.length ? table(['Date', 'Rows', 'Source'], S.csvImports.slice().reverse().map((x: any) => `<tr><td>${esc(x.date)}</td><td>${x.count}</td><td>${esc(x.source)}</td></tr>`)) : '<p>No CSV batches imported yet.</p>');
  }

  function auditPacket(goals: any[]) {
    let selected = goals.map(g => {
      let k = kpi(g.kpi), q = computeKpiStatus(k), plan = goalPlanCheck(g), ev = goalEvidenceCheck(g);
      return {
        goal: { id: g.id, title: g.title, level: g.level, owner: g.owner, period: g.year, approval: g.approval, revision: g.revision, status: g.status, performance: q.label, parent: g.parent },
        isoRequirements: (g.isoRefs || []).map((r: string) => { let x = isoRequirement(r); return x ? { id: x.id, standardId: x.standardId, standard: x.standard, edition: x.edition, clause: x.number, title: x.title } : { id: r, unresolved: true }; }),
        planning: { what: g.planWhat, resources: g.resources, responsible: g.owner, due: g.planDue, evaluation: g.evaluation, readiness: plan.ready, missing: plan.checks.filter(x => !x.ok).map(x => x.label) },
        linkedRecords: { riskReferences: g.riskRefs, processReferences: g.processRefs, documentReferences: g.evidenceRefs, evidenceStatus: ev },
        measurement: k ? { id: k.id, name: k.name, unit: k.unit, direction: k.direction, tolerance: k.tolerance, source: k.source, monthlyTargets: k.targets, monthlyActuals: k.values, latest: q } : null,
        approvals: S.approvals.filter((a: any) => a.goal === g.id),
        relatedInitiatives: S.initiatives.filter((i: any) => initiativeLinkedToGoal(i, g.id)).map((i: any) => ({ id: i.id, title: i.title, owner: i.owner, progress: i.progress, status: i.status }))
      };
    });
    const scopedReviews = (S.reviews || []).filter((r: any) =>
      (!limitedRole() || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(r.scope, S.scope)
    );
    return {
      title: 'SafeQMS Goal Management — Audit Evidence Pack',
      generatedAt: today,
      scope: S.scope,
      year: S.year,
      catalogSource: S.isoCatalogSource,
      note: 'Prototype / indicative data. Not verified proof of conformity. External records require backend access.',
      goals: selected,
      reviewDecisions: scopedReviews.flatMap((r: any) => r.decisions.map((d: any) => ({ ...d, review: r.id, reviewDate: r.date }))),
      history: S.history,
      goalRevisions: S.goalRevisions
    };
  }

  function evidencePage() {
    let gs = roleVisibleGoals();
    return head('Audit Evidence Pack', 'ISO-linked objectives · live KPI evidence · decisions · plan completeness', btn('Print / Save PDF', 'window.print()', 'primary') + btn('Export evidence JSON', 'window.exportEvidence()')) +
      roleScopebar() + `<div class="report-cover"><b>One-click audit preparation:</b> the pack below is assembled from the Goal Management records already in SafeQMS. Requirement IDs are intended to reference your existing ISO module. All items are demo records: auditors must verify actual documents, process effectiveness and conformity independently.</div>
      <div class="toolbar no-print"><label>Goal filter <select id="evidenceGoalSelect" onchange="window.refreshEvidenceSelection()"><option value="">All goals in scope</option>${gs.map((g: any) => `<option value="${g.id}">${esc(g.id + ' · ' + g.title)}</option>`).join('')}</select></label>${btn('Show planning gaps', "go('iso')")}</div><div id="evidenceContent">${evidenceBody(gs)}</div>`;
  }

  function chosenEvidenceGoals() {
    let id = (document.getElementById('evidenceGoalSelect') as HTMLSelectElement)?.value || '';
    return id ? [goal(id)].filter(Boolean) : roleVisibleGoals();
  }

  function evidenceBody(gs: any[]) {
    const scopedReviews = (S.reviews || []).filter((r: any) =>
      (!limitedRole() || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(r.scope, S.scope)
    );
    return `<div class="cards" style="grid-template-columns:repeat(3,1fr)"><div class="card"><div class="label">Goals in evidence pack</div><div class="num">${gs.length}</div></div><div class="card"><div class="label">Complete objective plans</div><div class="num">${gs.filter(x => goalPlanCheck(x).ready).length}</div></div><div class="card"><div class="label">Unresolved ISO IDs</div><div class="num">${gs.flatMap(g => g.isoRefs || []).filter(id => !isoRequirement(id)).length}</div></div></div>
    ${gs.map((g: any) => {
      let p = goalPlanCheck(g), k = kpi(g.kpi), status = computeKpiStatus(k), ev = goalEvidenceCheck(g), apprvs = S.approvals.filter((x: any) => x.goal === g.id);
      return `<section class="panel rblock"><div class="split"><h2 style="margin:0">${esc(g.id)} · ${esc(g.title)}</h2>${badge(status.label)}</div><p class="small muted">${esc(g.level)} · ${esc(g.owner)} · Rev ${g.revision || 1} · ${esc(g.year)} · ${badge(g.approval)}</p>
      <div class="grid2"><div><h3>Linked ISO Requirements</h3>${(g.isoRefs || []).map((id: string) => `<div class="minirow">${esc(isoName(id))}<div class="xs muted">Requirement ID: ${esc(id)}</div></div>`).join('') || '<span class="isoem bad">No ISO clause linked</span>'}<h3 style="margin-top:14px">Objective Planning</h3>${p.checks.map(x => `<div class="minirow">${x.ok ? '✓' : '⚠'} ${esc(x.label)}</div>`).join('')}</div>
      <div><h3>Linked evidence & process context</h3><div class="minirow"><b>Risk / opportunity IDs:</b> ${esc(g.riskRefs || 'Not linked')}</div><div class="minirow"><b>Process references:</b> ${esc(g.processRefs || 'Not linked')}</div><div class="minirow"><b>Document / evidence IDs:</b> ${esc(g.evidenceRefs || 'Not linked')}</div><div class="minirow"><b>What:</b> ${esc(g.planWhat || 'Not provided')}</div><div class="minirow"><b>Resources:</b> ${esc(g.resources || 'Not provided')}</div><div class="minirow"><b>Deadline:</b> ${esc(g.planDue || 'Not provided')}</div><div class="minirow"><b>Evaluation:</b> ${esc(g.evaluation || 'Not provided')}</div></div></div>
      <h3 style="margin-top:13px">Measured results</h3><p class="small">${esc(k?.name || 'No KPI')} · ${esc(k?.source || 'No source')} · Latest actual <b>${status.actual ?? '—'}</b> · planned ${status.target ?? '—'} · ${badge(status.label)} · Direction: ${esc(k?.direction || 'Unknown')}</p>
      <h3>Approvals & review trace</h3><p class="small">${apprvs.length ? apprvs.map((a: any) => `${esc(a.status)} by ${esc(a.approvedBy || a.approver)} on ${esc(a.resolvedAt || a.date)}: ${esc(a.comment || '')}`).join(' · '): 'No approval records in demo'}</p>
      <div class="actions no-print">${btn('Open goal', `go('goal','${g.id}')`)}${btn('Open KPI', "go('kpis')")}</div></section>`;
    }).join('')}
    ${panel('Management review decisions', table(['Decision', 'Owner', 'Due', 'Status'], scopedReviews.flatMap((r: any) => r.decisions.map((d: any) => `<tr><td>${esc(d.text)}</td><td>${esc(d.owner)}</td><td>${esc(d.due)}</td><td>${badge(d.status)}</td></tr>`))))}
    <p class="small muted">Audit evidence preparation does not guarantee conformity. Linked ISO requirement IDs and supporting documents must resolve against authenticated SafeQMS records in production.</p>`;
  }

  function managementSummary() {
    let gs = roleVisibleGoals();
    const blockers = (S.blockers || []).filter((b: any) => b.status !== 'Resolved' && blockerAllowedByRole(b) && blockerMatchesScope(b.scope, S.scope));
    const atRiskInits = S.initiatives.filter((i: any) => i.status === 'At risk' && visibleInitiative(i));
    const scopedReviews = (S.reviews || []).filter((r: any) =>
      (!limitedRole() || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(r.scope, S.scope)
    );
    return {
      complete: gs.filter((g: any) => goalPlanCheck(g).ready),
      gaps: gs.filter((g: any) => !goalPlanCheck(g).ready),
      off: gs.filter((g: any) => g.performance === 'Off track'),
      risk: gs.filter((g: any) => g.performance === 'At risk'),
      on: gs.filter((g: any) => g.performance === 'On track'),
      notMeasured: gs.filter((g: any) => g.performance === 'Not measured'),
      open: scopedReviews.flatMap((r: any) => r.decisions.filter((d: any) => d.status === 'Open')),
      pending: S.approvals.filter((a: any) => a.status === 'Pending' && visibleToRole(goal(a.goal))),
      blockers,
      atRiskInits,
      goals: gs
    };
  }

  function managementPage() {
    let m = managementSummary();
    return head('Management Review · Goal Inputs', 'Automatically prepared objective performance, blockers and governance inputs', btn('Create PDCA Review', 'window.prepareManagementReview()', 'primary') + btn('Audit Evidence Pack', "go('evidence')")) +
      roleScopebar() + `<div class="report-cover"><b>Integration target: SafeQMS Management Review.</b> This page aggregates live Goal Management performance, ISO planning completeness, escalated blockers and open PDCA actions.</div>
      <div class="cards">${[
        ['Goals on track', m.on.length, 'Measured progress'],
        ['At risk / Off track', m.risk.length + m.off.length, 'Requires attention'],
        ['Escalated Blockers', m.blockers.length, `${m.atRiskInits.length} initiatives at risk`],
        ['Open review actions', m.open.length, `${m.gaps.length} ISO planning gaps`]
      ].map(c => `<div class="card"><div class="label">${c[0]}</div><div class="num">${c[1]}</div><div class="xs muted">${c[2]}</div></div>`).join('')}</div>
      <div class="grid2">${panel('Goals requiring attention', m.off.concat(m.risk).map((g: any) => `<div class="minirow"><button class="link" onclick="go('goal','${g.id}')">${esc(g.title)}</button> ${badge(g.performance)}<div class="xs muted">${esc(g.owner)} · ${esc(isoShort(g))}</div></div>`).join('') || '<p>All measured goals on track.</p>')}
      ${panel('Governance and planning gaps', `<p><b>${m.pending.length}</b> pending approvals · <b>${m.notMeasured.length}</b> goals not measured</p>${m.gaps.map((g: any) => `<div class="minirow"><button class="link" onclick="go('goal','${g.id}')">${esc(g.title)}</button><div class="xs muted">Missing: ${goalPlanCheck(g).checks.filter(c => !c.ok).map(c => esc(c.label)).join(', ')}</div></div>`).join('') || '<p>No planning gaps.</p>'}`)}</div>
      ${panel(`Escalated Implementation Blockers (${m.blockers.length})`, m.blockers.length ? m.blockers.map((b: any) => blockerBoxHtml(b, true)).join('') : '<p class="small muted">No open escalated blockers in this scope.</p>')}
      ${panel('Performance snapshot for management review', table(['Goal', 'ISO requirement', 'Latest KPI actual', 'Monthly target', 'Status'], m.goals.map((g: any) => {
        let st = computeKpiStatus(kpi(g.kpi));
        return `<tr><td><b>${esc(g.title)}</b></td><td>${esc(isoShort(g))}</td><td>${st.actual ?? '—'} ${esc(kpi(g.kpi)?.unit || '')}</td><td>${st.target ?? '—'}</td><td>${badge(st.label)}</td></tr>`;
      })))}
      ${panel('Proposed management decisions / actions', `<p class="small">Agenda topics generated from measured KPI gaps, escalated blockers and ISO planning data:</p>${[...m.blockers.map((b: any) => `Resolve escalated blocker ${b.id} (${b.category}): ${b.neededAction}`), ...m.off.map((g: any) => `Investigate adverse KPI performance: ${g.title}`), ...m.risk.map((g: any) => `Review gap and countermeasures: ${g.title}`), ...m.gaps.map((g: any) => `Complete ISO-linked objective plan: ${g.title}`)].map(x => `<div class="minirow">• ${esc(x)}</div>`).join('') || '<p>No critical data-driven topics identified from Goal Management.</p>'}<p class="xs muted">Recommendations are for discussion; clicking Create PDCA Review prepares a live review workspace with these exceptions queued.</p><div class="actions">${btn('Create PDCA review with this input', 'window.prepareManagementReview()', 'primary')}${btn('Open PDCA Reviews', "go('reviews')")}</div>`)}
      ${panel('Other required management-review inputs', `<div class="readygrid"><div class="readyitem">Audit results — <b>connect Internal Audits module</b></div><div class="readyitem">Nonconformities and actions — <b>connect Deviations</b></div><div class="readyitem">Risks and opportunities — <b>connect Risk Management</b></div><div class="readyitem">Resources and stakeholder feedback — <b>connect related sources</b></div></div><p class="xs muted">These external inputs are not invented or simulated as verified data in this prototype.</p>`)}`;
  }

  function goalForm(g: any, preset?: any) {
    let fresh = !g, level = g?.level || (preset === 'Organization' ? 'Organization' : S.scope), parents = permittedParents(level, g?.id), parent = g?.parent || '', d = g || { isoRefs: [], planWhat: '', resources: '', planDue: '2027-12-31', evaluation: '', riskRefs: '', processRefs: '', evidenceRefs: '' };
    const escBtn = !fresh && g?.id ? btn('⚑ Escalate blocker', `window.escalateBlocker('goal','${g.id}')`) : '';
    return head(fresh ? (preset === 'Organization' ? 'Add Main Strategic Goal' : 'Create New Goal') : 'Edit Goal · ' + esc(g.title), fresh ? 'Define → Measure → Plan → ISO → Approve' : `${g.id} · ${g.level} · Revision ${g.revision || 1}`, escBtn + btn('Back to Goal Cascade', "go('cascade')") + btn('ISO Compliance', "go('iso')")) +
      `<div class="banner"><b>ISO-native workflow:</b> select requirements from SafeQMS ISO Standards references, complete planning information, then request formal approval. A requirement reference alone is not proof of compliance.</div>
      <form id="goalEditor" onsubmit="window.saveGoal(event,'${g?.id || ''}')"><input type="hidden" id="goalID" value="${g?.id || ''}">
      ${panel('1 · Define strategic goal', `<div class="formgrid">${field('Goal title *', 'title', g?.title, 'text', 'required')}<div class="field"><label>Organizational level</label><select name="level" id="goalLevelSelect" onchange="window.goalLevelChanged(this)">${['Organization', 'Site: Uppsala', 'Site: Falkenberg', 'Department: Production', 'Department: Maintenance', 'Department: Quality'].map(x => `<option value="${esc(x)}" ${x === level ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label>Primary Parent Goal ${level === 'Organization' ? '(top-level)' : '*'}</label><select id="parentSelect" name="parent" ${level === 'Organization' ? 'disabled' : ''}><option value="">${level === 'Organization' ? 'No parent' : 'Select parent'}</option>${parents.map((x: any) => `<option value="${x.id}" ${parent === x.id ? 'selected' : ''}>${esc(x.id + ' · ' + x.title + ' (' + x.level + ')')}</option>`).join('')}</select><div class="xs muted" id="parentHint">${level === 'Organization' ? 'Main strategic pillars have no parent.' : 'Changing the parent updates Goal Cascade and Strategy A3.'}</div></div>
      ${field('Accountable owner *', 'owner', g?.owner || 'Site Manager', 'text', 'required')}${field('Planning period', 'year', g?.year || (level === 'Organization' ? '2027–2029' : S.year))}${select('Lifecycle status', 'status', ['Planned', 'Active', 'Completed', 'Cancelled'], g?.status || 'Planned')}</div><div class="field"><label>Goal description / expected outcome</label><textarea name="description">${esc(g?.description || '')}</textarea></div>`)}
      ${panel('2 · Measure performance (computed automatically)', `<div class="formgrid">${select('Linked KPI', 'kpi', S.kpis.map((x: any) => [x.id, `${x.id} · ${x.name} (${x.direction === 'lower' ? 'lower is better' : 'higher is better'})`]), g?.kpi || 'K-001')}${field('Baseline', 'baseline', g?.baseline ?? 0, 'number', 'step="any"')}${field('Long-term / annual target', 'target', g?.target ?? 0, 'number', 'step="any"')}${field('Unit', 'unit', g?.unit || '%')}</div><div class="controlled">${g ? `<b>Calculated result:</b> ${badge(computeKpiStatus(kpi(g.kpi)).label)} · ${esc(kpi(g.kpi)?.name)} · ${esc(kpi(g.kpi)?.source || 'Manual')}` : 'Status is calculated once KPI actuals are recorded.'}<p class="xs muted">Manual performance-status control removed. Direction, planned monthly target and tolerance drive status.</p></div>`)}
      ${panel('3 · ISO Standards & Requirements', newISORefs(d))}
      ${panel('4 · Implementation planning · objective planning fields', `<div class="formgrid">${field('What will be done *', 'planWhat', d.planWhat, 'text')}${field('Required resources *', 'resources', d.resources, 'text')}${field('When completed *', 'planDue', d.planDue || '2027-12-31', 'date')}${field('How results will be evaluated *', 'evaluation', d.evaluation, 'text')}${field('Risk & opportunity references (6.1)', 'riskRefs', d.riskRefs)}${field('Related processes', 'processRefs', d.processRefs)}${field('Existing evidence / document IDs', 'evidenceRefs', d.evidenceRefs)}</div><p class="xs muted">Risk and evidence references are tracked separately from the minimum planning completeness check. Enter SafeQMS record IDs when connected.</p>`)}
      ${panel('5 · Alignment & governance', `<div class="grid2"><div>${g ? planningUI(g) : '<p class="small">Save the goal to see the live ISO planning checklist.</p>'}</div><div><h3>Approval flow</h3><div class="flow"><span class="step active">Draft</span>→<span class="step">Catchball</span>→<span class="step">Approval</span>→<span class="step">Active</span></div><p class="small">Changing an approved goal creates a draft revision. Submission and approval are blocked until required planning fields are complete.</p>${g ? `<p>Approval: ${badge(g.approval)} · v${g.revision || 1}</p>` : ''}</div></div>`)}
      <div class="actions no-print" style="margin-bottom:22px"><button class="btn primary" type="submit">Save ${fresh ? 'new draft goal' : 'changes'}</button>${!fresh ? btn('Submit for formal approval', `window.submitGoal('${g.id}')`, 'teal') : ''}${btn('Open ISO Compliance', "go('iso')")}</div></form>` +
      (!fresh && g?.id ? blockerSectionHtml('goal', g.id, 'Escalated Goal Blockers & PDCA Exceptions') : '');
  }

  // Catchball components
  const cbStatusBadge = (status: string) => `<span class="pill ${status === 'Approved' ? 'green' : status === 'Aligned' ? 'teal' : status === 'Changes requested' ? 'red' : status === 'Pending approval' ? 'purple' : 'amber'}">${esc(status)}</span>`;
  const cbGoalReadable = (c: any) => goal(c.goal)?.title || 'Missing goal';
  const cbMine = (c: any) => !!goal(c.goal) && visibleToRole(goal(c.goal));
  const cbCanRead = (c: any) => !isBasic() && cbMine(c);
  const cbCanWrite = (c: any) => {
    const g = goal(c?.goal);
    if (!c || !g || !cbCanRead(c)) return false;
    if (isLeadership()) return true;
    if (isDirector()) return c.recipientScope === ASSIGNED_DEPARTMENT && (leadershipRole(c.origin) || g.level === ASSIGNED_DEPARTMENT);
    return false;
  };
  const cbMessages = (c: any) => Array.isArray(c.messages) ? c.messages : [];
  const cbTurn = (c: any) => c.turn || (c.status === 'Awaiting department' ? 'Department director' : c.status === 'Awaiting director' ? 'General director' : c.status === 'Changes requested' ? (leadershipRole(c.origin) ? c.origin : 'Department director') : null);

  function cbCanAct(c: any, action: string) {
    if (!cbCanWrite(c)) return false;
    const st = c.status, me = role(), turn = cbTurn(c), myTurn = turn === me || (isLeadership() && leadershipRole(turn));
    if (action === 'send') return (st === 'Draft' && c.origin === me) || (st === 'Changes requested' && myTurn);
    if (action === 'comment') return !['Approved', 'Rejected', 'Cancelled'].includes(st);
    if (['counter', 'align', 'changes'].includes(action)) return (st === 'Awaiting director' || st === 'Awaiting department') && myTurn;
    if (action === 'approval') return st === 'Aligned' && (isLeadership() || (isDirector() && roleCan('goalEdit', goal(c.goal))));
    return false;
  }

  function cbNextID(arr: any[], prefix: string) {
    return prefix + '-' + String(Math.max(0, ...arr.map((x: any) => Number(String(x.id).split('-')[1]) || 0)) + 1).padStart(3, '0');
  }

  function cbNotify(who: string, c: any, txt: string) {
    S.catchballNotifications.push({ id: cbNextID(S.catchballNotifications, 'N'), recipient: who, catchballId: c.id, text: txt, read: false, at: today });
  }

  function cbNotifyLeadership(c: any, text: string) {
    cbNotify('General director', c, text);
    cbNotify('QMS auditor', c, text);
  }

  function recordDirectorDecision(a: any, approverRole: string) {
    if (!Array.isArray(S.directorDecisionLog)) S.directorDecisionLog = [];
    if (!Array.isArray(S.directorDecisionNotifications)) S.directorDecisionNotifications = [];
    if (S.directorDecisionLog.some((x: any) => x.approvalId === a.id)) return;
    const g = goal(a.goal), id = cbNextID(S.directorDecisionLog, 'DL');
    const event = {
      id, approvalId: a.id, goalId: a.goal, goalTitle: g?.title || a.goal,
      isoLinks: g ? isoShort(g) : '', approvedBy: approverRole, at: today,
      revision: g?.revision || 1, catchballId: a.catchballId || '', kind: 'Goal approved'
    };
    S.directorDecisionLog.unshift(event);
    if (approverRole !== 'General director') {
      S.directorDecisionNotifications.unshift({
        id: cbNextID(S.directorDecisionNotifications, 'DN'),
        eventId: id, recipient: 'General director', read: false, at: today
      });
    }
    S.history.unshift({ time: today, text: `Director informed: ${event.goalId} approved by ${approverRole} (decision ${a.id})` });
  }

  function directorDecisionNoticeStrip() {
    if (!isGeneral()) return '';
    const pending = (S.directorDecisionNotifications || []).filter((n: any) => !n.read).length;
    return pending ? `<div class="cb-alert no-print"><span>🔔 <b>${pending} approved goal${pending !== 1 ? 's' : ''}</b> reported to General director (including QMS decisions).</span>${btn('Review decisions', "go('approvals')")}</div>` : '';
  }

  function directorDecisionFeed() {
    if (!isGeneral()) return '';
    let records = S.directorDecisionLog || [], notes = S.directorDecisionNotifications || [];
    return panel('General director · All approved goals / ISO decisions',
      `<p class="small muted">Every formal goal approval is logged here. When QMS auditor approves, General director receives a separate information notification. This does not require another approval.</p>` +
      (records.length ? table(['Goal / approval', 'Approved by', 'ISO links', 'Decision date', 'Information'], records.map((x: any) => {
        const n = notes.find((z: any) => z.eventId === x.id);
        return `<tr><td><button class="link" onclick="go('goal','${x.goalId}')"><b>${esc(x.goalTitle)}</b></button><div class="xs muted">${esc(x.goalId)} · ${esc(x.approvalId)}</div></td><td>${esc(x.approvedBy)}</td><td>${esc(x.isoLinks)}</td><td>${esc(x.at)}</td><td>${n && !n.read ? btn('Mark informed', `window.markDirectorNotice('${n.id}')`, 'teal') : n ? 'Read' : 'Recorded'}</td></tr>`;
      })) : '<p class="muted small">No new formal approvals have been completed during this demo session. Approve a pending goal as QMS auditor to see the notification.</p>'));
  }

  function cbRecord(c: any, kind: string, text: string, target?: any, resources?: any) {
    c.messages.push({ id: cbNextID(c.messages, 'M'), at: today, by: role(), kind, text, target: target ?? null, resources: resources ?? '' });
    c.updatedAt = today;
    S.catchballEvents.unshift({ when: today, actor: role(), catchballId: c.id, action: kind, goal: c.goal });
    S.history.unshift({ time: today, text: `${c.id} · ${kind} by ${role()}: ${text.slice(0, 100)}` });
  }

  function cbList() {
    let items = S.catchballs.filter(cbCanRead), pending = S.catchballNotifications.filter((n: any) => n.recipient === role() && !n.read && items.some((c: any) => c.id === n.catchballId));
    let actionable = items.filter((c: any) => ['align', 'send', 'counter', 'changes'].some(a => cbCanAct(c, a))).length;
    let creates = (isLeadership() || isDirector()) ? btn('+ Start Catchball', "go('catchballnew')", 'primary') : '';
    return head('Catchball & Goal Alignment', 'Negotiate strategic goals and resources before formal approval', creates) +
      `<div class="banner"><b>Bidirectional Catchball:</b> Department director ↔ General director / QMS auditor. Either director may initiate; the invited recipient can respond to a higher-level goal without editing it. Alignment precedes the separate formal ISO/approval checks. No backend connection or real notifications are made in this mockup.</div>` +
      `<div class="cards cb-cards"><div class="card"><div class="label">Open discussions</div><div class="num">${items.filter((x: any) => !['Approved', 'Rejected'].includes(x.status)).length}</div><div class="xs muted">Within your demo role and scope</div></div><div class="card"><div class="label">Needs my response</div><div class="num">${actionable}</div><div class="xs muted">Proposal, counter or revision</div></div><div class="card"><div class="label">Aligned</div><div class="num">${items.filter((x: any) => x.status === 'Aligned').length}</div><div class="xs muted">Ready for ISO gate</div></div><div class="card"><div class="label">Unread notifications</div><div class="num">${pending.length}</div><div class="xs muted">In-app demo queue</div></div></div>` +
      panel('Goal alignment conversations', table(['Goal / thread', 'Organizational level', 'Proposed target', 'Status', 'Last activity', 'Open'], items.map((c: any) => {
        let g = goal(c.goal);
        return `<tr><td><b>${esc(g?.title)}</b><div class="xs muted">${c.id} · From ${esc(c.origin)} → ${esc(c.recipientRole || 'counterpart')} (${esc(c.recipientScope || 'assigned scope')})</div></td><td>${esc(g?.level)}</td><td>${esc(c.proposal.target)} ${esc(g?.unit)}</td><td>${cbStatusBadge(c.status)}</td><td>${esc(c.updatedAt)}</td><td>${btn('Open discussion', `go('catchballitem','${c.id}')`)}</td></tr>`;
      }))) +
      panel('Demo notifications', pending.length ? pending.map((n: any) => `<div class="cb-notification"><div><b>${esc(n.text)}</b><div class="xs muted">${n.id} · ${esc(n.at)}</div></div>${btn('Read', `window.cbOpenNotification('${n.id}')`)}</div>`).join('') : '<p class="muted small">No unread notifications for this role. Switch roles at the top to see the other side of a conversation.</p>') +
      panel('Try both directions (demo)', `<p><b>Bottom-up:</b> switch to General director → open CB-001 (Production proposes changeover target) → counter / agree.</p><p><b>Top-down:</b> switch to Department director → open CB-002 (General director proposes site OEE target) → counter / request changes / agree. An invited department can negotiate without goal edit rights.</p><p><b>QMS substitution:</b> choose QMS auditor → align CB-001 → complete the goal's ISO planning if needed → submit and approve. Then switch to General director → Formal Approvals or Overview to see who approved and acknowledge the information notice.</p>`) +
      panel('Catchball process', `<div class="flow">${['Draft proposal', 'Negotiation', 'Alignment', 'ISO completeness', 'Formal approval', 'Published goal'].map((x, i) => `<span class="step ${i < 3 ? 'active' : ''}">${x}</span>${i < 5 ? '→' : ''}`).join('')}</div><p class="small muted" style="margin-top:11px">Alignment is not approval. Proposed target and resources are kept separate from the approved goal until an authorized director completes formal approval.</p>`);
  }

  function cbCreatePage() {
    if (!(isLeadership() || isDirector())) return restrictedMessage('Only General director, QMS auditor or an authorized Department director may start Catchball.');
    let candidates = S.goals.filter((g: any) => roleCan('goalEdit', g)).filter((g: any) => !S.catchballs.some((c: any) => c.goal === g.id && !['Approved', 'Cancelled'].includes(c.status)));
    return head('Start Catchball', 'Negotiate one strategic objective with an accountable director', btn('Back to Catchball', "go('catchball')")) +
      panel('Select the objective', `<form onsubmit="window.cbCreate(event)"><div class="formgrid">
      ${select('Goal *', 'goal', candidates.map((g: any) => [g.id, g.id + ' · ' + g.title]), candidates[0]?.id || '')}
      ${field('Proposed target *', 'target', '', 'number', 'required step="any"')}
      ${field('Resources to discuss', 'resources', '')}
      ${field('Proposed completion date', 'due', '2027-12-31', 'date')}
      ${isLeadership() ? select('Invite department to respond', 'recipientScope', [['Department: Production', 'Uppsala / Production (demo)']], ASSIGNED_DEPARTMENT) : '<input name="recipientScope" type="hidden" value="Department: Production">'}
      </div><div class="field"><label>Rationale / current gap *</label><textarea name="reason" required placeholder="Why is this target feasible? What support is needed?"></textarea></div><button class="btn primary" type="submit" ${!candidates.length ? 'disabled' : ''}>Create discussion draft</button></form>`) +
      (!candidates.length ? '<p class="small muted">No eligible goals without an existing active discussion. Try updating or closing an existing Catchball item.</p>' : '');
  }

  function cbDetail(id: string) {
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!c || !cbCanRead(c)) return restrictedMessage('This negotiation is not available in your assigned scope.');
    let g = goal(c.goal), ap = S.approvals.find((a: any) => a.catchballId === id);
    let currentTarget = g?.target, changedTarget = c.proposal.target !== Number(currentTarget);
    let notes = cbMessages(c).map((m: any) => `<div class="cb-message"><div class="cb-avatar">${esc(m.by === 'General director' ? 'GD' : m.by === 'Department director' ? 'DD' : 'QM')}</div><div class="cb-bubble"><div class="split"><b>${esc(m.by)}</b><span class="xs muted">${esc(m.at)} · ${esc(m.kind)}</span></div><p>${esc(m.text)}</p>${m.target !== null && m.target !== undefined ? `<div class="cb-mini">Proposed target: <b>${esc(m.target)} ${esc(g.unit)}</b></div>` : ''}${m.resources ? `<div class="cb-mini">Resources: ${esc(m.resources)}</div>` : ''}</div></div>`).join('');
    let can = (action: string) => cbCanAct(c, action), controls = [];
    if (can('send')) controls.push(btn('Send proposal', `window.cbSend('${id}')`, 'primary'));
    if (can('counter')) controls.push(btn('Send counterproposal', `window.cbCounter('${id}')`, 'primary'));
    if (can('align')) controls.push(btn('Agree & align', `window.cbAlign('${id}')`, 'teal'));
    if (can('changes')) controls.push(btn('Request changes', `window.cbChanges('${id}')`));
    if (can('approval')) controls.push(btn('Submit for formal approval', `window.cbSubmit('${id}')`, 'primary'));
    if (c.status === 'Pending approval' && isLeadership() && ap?.status === 'Pending') {
      controls.push(btn('Approve goal', `window.cbFinalDecision('${ap.id}','Approved')`, 'teal'));
      controls.push(btn('Request changes', `window.cbFinalDecision('${ap.id}','Changes requested')`));
    }
    return head('Catchball · ' + esc(g.title), `${id} · ${esc(g.level)}`, btn('Back to discussions', "go('catchball')")) +
      `<div class="cb-state"><div><div class="xs muted">Alignment status</div>${cbStatusBadge(c.status)}<div class="xs muted" style="margin-top:6px">${esc(c.origin)} → ${esc(c.recipientRole || 'counterpart')}</div></div><div><div class="xs muted">Current approved / recorded target</div><b>${esc(currentTarget)} ${esc(g.unit)}</b></div><div><div class="xs muted">Proposed target</div><b>${esc(c.proposal.target)} ${esc(g.unit)}</b> ${changedTarget ? '<span class="pill amber">Pending change</span>' : ''}</div><div><div class="xs muted">Required decision</div><b>${esc(cbTurn(c) || (c.status === 'Aligned' ? 'Goal owner / director submits' : c.status === 'Pending approval' ? 'General director / QMS auditor (formal approval)' : c.status))}</b></div></div>` +
      panel('Negotiated proposal', `<div class="grid2"><div><h3>Outcome and deadline</h3><p><b>Proposed target:</b> ${esc(c.proposal.target)} ${esc(g.unit)}<br><b>Due date:</b> ${esc(c.proposal.due || 'Not defined')}<br><b>Primary parent:</b> ${esc(goal(g.parent)?.title || 'Organization-level')}</p></div><div><h3>Resource discussion</h3><p>${esc(c.proposal.resources || 'No resources proposed yet.')}</p><p class="xs muted">Agreement changes do not overwrite the approved goal before formal approval.</p></div></div><p><b>Reason:</b> ${esc(c.proposal.reason || '—')}</p><p class="small muted"><b>Invited recipient scope:</b> ${esc(c.recipientScope)} · Replying to a proposal does not grant permission to edit or approve this goal.</p>`) +
      panel('Catchball conversation', `${notes || '<p class="muted small">No messages yet.</p>'}<div class="cb-compose no-print"><form onsubmit="window.cbComment(event,'${id}')"><div class="field"><label>Add a comment, question or supporting evidence note</label><textarea name="message" required placeholder="Discuss feasibility, target, resources, KPI evidence or responsibilities..." ${can('comment') ? '' : 'disabled'}></textarea></div><button class="btn" ${can('comment') ? '' : 'disabled'} type="submit">Add comment</button></form></div>`) +
      panel('Decision & action', `${c.status === 'Aligned' ? `<div class="banner">Both sides have aligned. The ISO plan completeness check still applies before the formal approval step.</div>` : ''}<div class="actions">${controls.join('') || '<span class="small muted">No decision action available for your current role and thread status.</span>'}</div>${c.status === 'Aligned' && !goalPlanCheck(g).ready ? `<p class="small" style="color:var(--amber);margin-top:10px">ISO plan incomplete: ${goalPlanCheck(g).checks.filter(x => !x.ok).map(x => esc(x.label)).join(', ')}. <button class="link" onclick="go('goal','${g.id}')">Open goal planning</button></p>` : ''}`) +
      panel('Approval trail & integration', `<div class="minirow"><b>Goal:</b> ${g.id} · Approval status: ${badge(g.approval)} · ${esc(g.iso || '')}</div><div class="minirow"><b>Formal approval:</b> ${ap ? `${esc(ap.id)} · ${badge(ap.status)}` : 'Not submitted yet'}</div><div class="minirow"><b>Audit trail:</b> ${cbMessages(c).length} dated Catchball entries, plus approval history.</div><p class="xs muted">Backend integration: store every message as an immutable event with actor user ID, tenant/company ID, target version and timestamps. Do not use localStorage for real approvals or evidence.</p>`);
  }

  function cbNotificationStrip() {
    if (isBasic()) return '';
    let count = S.catchballNotifications.filter((n: any) => n.recipient === role() && !n.read && S.catchballs.some((c: any) => c.id === n.catchballId && cbCanRead(c))).length;
    return count ? `<div class="cb-alert no-print"><span>✉ <b>${count} Catchball message${count !== 1 ? 's' : ''}</b> need attention for <b>${esc(role())}</b>.</span>${btn('Open inbox', "go('catchball')")}</div>` : '';
  }

  function cbGoalPanel(id: string) {
    let g = goal(id), c = S.catchballs.find((x: any) => x.goal === id && !['Rejected', 'Cancelled'].includes(x.status));
    if (!g || !visibleToRole(g) || isBasic()) return '';
    return panel('Catchball & Strategic Alignment', `<div class="split"><div><b>${c ? 'Open discussion: ' + c.id : 'Not yet in alignment'}</b><div class="small muted">${c ? 'Current stage: ' + esc(c.status) : 'Discuss feasibility, resources and target before formal approval.'}</div></div>${btn(c ? 'Open discussion' : 'Start Catchball', c ? `go('catchballitem','${c.id}')` : `window.cbStartForGoal('${g.id}')`, 'teal')}</div>`);
  }

  function cbIntegrationBlueprint() {
    if (!isAdmin()) return restrictedMessage('Developer documentation is available to administrators in the prototype.');
    const api = table(['Workflow', 'Proposed API contract (illustrative, NOT existing)', 'Expected Django responsibility'], [
      ['Read goals / permissions', 'GET /api/goal-management/goals/', 'Filter by company, role, site and department; return actions allowed'],
      ['Start Catchball', 'POST /api/goal-management/catchballs/', 'Validate goal scope; create immutable thread and initial revision'],
      ['List / read discussion', 'GET /api/goal-management/catchballs/{id}/', 'Check membership / scope; return events and proposed snapshot'],
      ['Send or counter', 'POST /api/goal-management/catchballs/{id}/messages/', 'Validate state transition and actor; persist event and notification'],
      ['Mark aligned', 'POST /api/goal-management/catchballs/{id}/align/', 'Validate authorized responder and proposal revision'],
      ['Submit for approval', 'POST /api/goal-management/catchballs/{id}/submit/', 'Apply ISO 6.2 field validation; create approval request'],
      ['Approve / request changes', 'POST /api/goal-management/approvals/{id}/decision/', 'Authorized director only; transactional revision and audit trail'],
      ['Notifications', 'GET /api/notifications/', 'Reuse existing SafeQMS notifications + email transport if configured']
    ].map(a => `<tr><td><b>${a[0]}</b></td><td><code>${esc(a[1])}</code></td><td>${esc(a[2])}</td></tr>`));
    return head('Developer Integration Blueprint', 'Architecture proposal · NO backend or external data source implemented', btn('Return to Catchball', "go('catchball')")) +
      `<div class="banner"><b>Important:</b> these paths are recommended interface examples, not claims about SafeQMS existing Django routes. Developers must inspect the actual models, permissions, ISO APIs and naming conventions before creating endpoints.</div>` +
      panel('1 · Reuse existing SafeQMS services', `<div class="grid2"><div><h3>Reference / read</h3><div class="minirow">Authentication · existing JWT / session</div><div class="minirow">Users · six existing SafeQMS roles</div><div class="minirow">Company → Site → Department scope</div><div class="minirow">ISO Standards · existing clause IDs for 9001 / 14001 / 45001</div><div class="minirow">Risk, Process, Document and Task IDs</div></div><div><h3>Goal Management owns</h3><div class="minirow">Goals, strategy plans and hierarchy</div><div class="minirow">KPI definitions, targets and observations</div><div class="minirow">Catchball threads, proposals, immutable events</div><div class="minirow">Formal decisions and approved snapshots</div><div class="minirow">A3 / X-Matrix projections over shared data</div></div></div>`) +
      panel('2 · Suggested API contracts', api) +
      panel('3 · Domain events and lifecycle', `<div class="flow">${['Draft', 'Awaiting director', 'Awaiting department', 'Aligned', 'Pending approval', 'Approved'].map((x, i) => `<span class="step ${i < 4 ? 'active' : ''}">${x}</span>${i < 5 ? '→' : ''}`).join('')}</div><p class="small" style="margin-top:11px"><b>Both directions:</b> General director → Department director and Department director → General director. Store recipient user/department assignment separately from goal owner, and validate explicit Catchball participation. Every state change should record actor user ID, tenant/company ID, scope, previous state, proposed target/resources, timestamp and optional reason. Changes requested must preserve full prior history. Use transactions and optimistic concurrency/version checks to prevent stale approvals.</p>`) +
      panel('4 · Access control & ISO rules', `<div class="minirow"><b>Administratör</b> configures permissions; not automatically the business approver.</div><div class="minirow"><b>General director / QMS auditor</b> each can create, negotiate and formally approve strategies and annual goals in authorized company scope. The actual approver is recorded; QMS auditor can substitute for General director.</div><div class="minirow"><b>Department director</b> initiates department goals AND responds to explicitly invited top-down proposals for site or group goals. Reply scope does not confer goal-edit or formal approval permission.</div><div class="minirow"><b>Auditor</b> has audit read access only; cannot negotiate or approve.</div><div class="minirow"><b>General director information</b> is an obligatory, non-blocking notification for every QMS-approved goal, including ISO-linked proposals. No second approval is required.</div><div class="minirow"><b>Basic user</b> sees only authorized published goals and own tasks.</div><p class="small muted">Use actual SafeQMS company/user assignment tables and server-side DRF permissions. JavaScript controls are UI only. Reuse existing ISO requirement primary keys; requirements coverage and objective planning completeness are not certificates of conformity. Add ISO 27001 only when deployed in the Standards module.</p>`) +
      panel('5 · Boundaries and integrations', `<div class="minirow"><b>Never:</b> invent ISO compliance evidence, autopopulate missing requirements, or trust client-supplied role, company or approver.</div><div class="minirow"><b>Notifications:</b> use existing SafeQMS notification service and configurable templates; demo currently stores in-browser notification examples only.</div><div class="minirow"><b>KPI:</b> support CSV import today; potential MES/ERP/BI connectors later, outside this mockup.</div><div class="minirow"><b>Management Review:</b> supply Goal Management inputs to the shared management review process, not a second authoritative review system.</div><div class="minirow"><b>Evidence:</b> link records by stable IDs and verify their existence and access server-side.</div>`);
  }

  function settings() {
    return head('Demo & Architecture', 'Self-contained HTML concept · not connected to SafeQMS backend') +
      panel('Demo tools', `<p>All edits in this mockup are stored in your browser localStorage. No real notifications, permissions, document engine or backend integration are implemented.</p><div class="actions">${btn('Export demo data JSON', 'window.exportData()')}${btn('Reset demo', 'window.resetDemo()')}${btn('Load Synchronized Goals', 'window.loadSyncDemo()', 'teal')}</div>`) +
      panel('Production architecture', `<p><b>Shared records:</b> Strategy Plan, Goal, Goal Relationship, KPI Definition, KPI Target/Actual, Initiative, Project, Task, PDCA Review, Approval and immutable Revision/Audit Trail.</p><p><b>Integrations:</b> ISO Standards, Risk Management, Tasks, Document Engine, Management Review, Notifications and organization/role permissions.</p><p><b>Critical controls:</b> tenant isolation, server-side authorization, approval separation of duties, historical snapshots, controlled revisions, KPI source validation and consistent roll-up calculations.</p><p><b>Prototype limitation:</b> X-Matrix relationship editor is a functional simplified grid; production should additionally render the four-quadrant X-Matrix as a scalable interactive chart.</p>`);
  }

  function downloadObject(obj: any, name: string) {
    let a = document.createElement('a'), u = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }

  function restrictedMessage(info: string) {
    return head('Access restricted', 'SafeQMS role-based access demo') + `<div class="readonly-notice">${esc(info)} The backend must enforce this on the data and API level.</div>` + btn('Back to Overview', "go('overview')");
  }

  function showAssignedTasks(id: string) {
    let tasks = S.tasks.filter((t: any) => t.project === id && roleCan('taskOwn', t));
    if (!tasks.length) return;
    let html = panel('My assigned activities', tasks.map((t: any) => `<div class="minirow"><b>${esc(t.title)}</b><span class="xs muted"> · ${esc(t.owner)} · ${esc(t.due)}</span> ${badge(t.status)} ${btn('Mark done', `window.markOwnTask('${t.id}')`, 'teal')}</div>`).join(''));
    document.getElementById('app')?.insertAdjacentHTML('beforeend', html);
  }

  function rolePostRender(r: string, id?: string) {
    const selects = document.querySelectorAll('#roleSelectorTop,#roleSelectorSide') as NodeListOf<HTMLSelectElement>;
    for (const x of selects) {
      x.innerHTML = SAFEQMS_ROLES.map(v => `<option ${role() === v ? 'selected' : ''}>${v}</option>`).join('');
    }
    document.querySelectorAll('aside .nav').forEach((n: any) => {
      if (n.dataset.route === 'compliance' || n.dataset.route === 'alignment') n.style.display = isBasic() ? 'none' : '';
    });
    let adminSettings = document.getElementById('adminSettings');
    if (adminSettings) adminSettings.style.display = isAdmin() ? '' : 'none';
    let sg = document.getElementById('adminSettingsGroup');
    if (sg) sg.style.display = isAdmin() ? '' : 'none';

    const appElem = document.getElementById('app');
    if (!appElem) return;

    if (['project'].includes(r) && !visibleProject(S.projects.find((p: any) => p.id === id) || { initiative: '' })) {
      appElem.innerHTML = restrictedMessage('This project is outside the assigned organizational scope.');
      return;
    }
    if (r === 'initiative' && !visibleInitiative(initiative(id || '') || { goal: '' })) {
      appElem.innerHTML = restrictedMessage('This initiative is outside the assigned organizational scope.');
      return;
    }
    if (r === 'goal' && !visibleToRole(goal(id || ''))) {
      appElem.innerHTML = restrictedMessage('This goal is not published or is outside your assigned unit.');
      return;
    }
    if (r === 'goal' || r === 'newgoal') {
      let permitted = r === 'goal' ? roleCan('goalEdit', goal(id || '')) : roleCan('goalCreate');
      let form = document.getElementById('goalEditor');
      if (form) {
        if (!permitted) {
          form.querySelectorAll('input,select,textarea,button').forEach((e: any) => e.disabled = true);
          form.insertAdjacentHTML('afterbegin', '<div class="readonly-notice">Read-only: your SafeQMS role does not have permission to edit or submit this objective.</div>');
        } else if (isDirector()) {
          let sl = document.getElementById('goalLevelSelect') as HTMLSelectElement | null;
          if (sl) {
            for (const opt of sl.options) if (opt.value !== ASSIGNED_DEPARTMENT) opt.disabled = true;
            sl.value = ASSIGNED_DEPARTMENT;
            (window as any).goalLevelChanged(sl);
          }
        }
      }
    }
    if (r === 'initiative' && !roleCan('initiativeWrite', initiative(id || ''))) {
      let form = document.getElementById('initiativeFocusForm');
      if (form) {
        form.querySelectorAll('input,select,textarea,button').forEach((e: any) => e.disabled = true);
        form.insertAdjacentHTML('afterbegin', '<div class="readonly-notice">Read-only: your SafeQMS role does not have permission to edit this initiative.</div>');
      }
    }
    if (['project'].includes(r) && !roleCan('projectWrite', S.projects.find((p: any) => p.id === id))) {
      document.querySelectorAll('.a3 textarea').forEach((e: any) => { e.disabled = true; });
    }
    if (r === 'review' && !roleCan('reviewWrite')) {
      document.querySelectorAll('form').forEach(form => form.querySelectorAll('input,select,textarea,button').forEach((e: any) => e.disabled = true));
      document.querySelectorAll('button[onclick*="toggleDecision"]').forEach((e: any) => e.disabled = true);
    }
    if (r === 'import' && isDirector()) {
      let b = document.getElementById('csvInput');
      if (b) b.insertAdjacentHTML('beforebegin', '<div class="readonly-notice">Your preview assignment allows CSV updates for K-002 (Production changeover KPI) only.</div>');
    }
    if (!roleCan('goalCreate', { level: 'Organization' })) {
      document.querySelectorAll('.pillar .actions button').forEach(b => { if (b.textContent?.includes('Edit Goal')) b.textContent = 'View goal'; });
      document.querySelectorAll('.cascadetable button').forEach(b => { if (b.textContent === 'Edit') b.textContent = 'View'; });
    }
    if (r === 'iso' && !isAdmin()) {
      document.querySelectorAll('input[type=file][onchange*="importISOFile"]').forEach(e => {
        let label = e.closest('label');
        if (label) label.style.display = 'none';
      });
    }
    if (r === 'newinitiative' && isDirector()) {
      let sl = document.querySelector('select[name=goal]') as HTMLSelectElement | null;
      if (sl) {
        for (const o of sl.options) if (goal(o.value)?.level !== ASSIGNED_DEPARTMENT) o.disabled = true;
        sl.value = S.goals.find((g: any) => g.level === ASSIGNED_DEPARTMENT)?.id || '';
      }
    }
    if (r === 'newreview' && isDirector()) {
      let sl = document.querySelector('select[name=scope]') as HTMLSelectElement | null;
      if (sl) sl.innerHTML = `<option>${ASSIGNED_DEPARTMENT}</option>`;
    }
    if (r === 'approvals' && !roleCan('approve')) {
      let el = document.querySelector('#app .banner');
      if (el) el.insertAdjacentHTML('afterend', '<div class="readonly-notice">Formal approval is available to General director and QMS auditor within their company. Other roles can review only.</div>');
    }
    if (isBasic() && r === 'project') showAssignedTasks(id || '');
  }

  function render() {
    syncGoalPerformance();
    syncBlockerLifecycle();
    let [r, id] = (location.hash.slice(1) || 'overview').split('/');
    let aliases: Record<string, string> = { strategy: 'pillars', execution: 'projects', performance: 'kpis', alignment: 'reviews', compliance: 'iso' };
    let contentRoute = aliases[r] || r, group = ROUTE_GROUP[r] || 'overview';

    document.querySelectorAll('aside .nav').forEach((n: any) => n.classList.toggle('active', n.dataset.route === group || (r === 'settings' && n.dataset.route === 'settings')));

    const pages: Record<string, () => string> = {
      overview,
      daily: dailyBoard,
      myfocus: myFocus,
      pillars,
      cascade,
      iso: isoPage,
      evidence: evidencePage,
      management: managementPage,
      import: csvImportPage,
      goal: () => goalForm(goal(id)),
      newgoal: () => goalForm(null, id === 'main' ? 'Organization' : null),
      matrix,
      projects,
      initiative: () => initiativeDetail(id),
      newinitiative: newInitiative,
      project: () => projectDetail(id),
      kpis,
      reviews,
      newreview: newReview,
      review: () => reviewDetail(id),
      catchball: cbList,
      catchballnew: cbCreatePage,
      catchballitem: () => cbDetail(id),
      integration: cbIntegrationBlueprint,
      a3,
      approvals,
      settings
    };

    let page = '';
    if (!allowedRoute(contentRoute)) page = restrictedMessage('Your active role does not have access to this workspace.');
    else page = (pages[contentRoute] || overview)();

    if (contentRoute === 'settings' && isAdmin()) {
      page += panel('Developer handoff · QMS co-approval v5.4', `<p>Backend code has not been built. The implementation blueprint explains recommended API contracts, reuse of SafeQMS ISO modules, role/scope checks, events and approval transactions.</p>${btn('Open Integration Blueprint', "go('integration')", 'primary')}`);
    }

    let nav = group === 'overview' || group === 'settings' ? '' : workspaceTabs(group, contentRoute);
    const appElem = document.getElementById('app');
    if (appElem) {
      appElem.innerHTML = roleBanner() + cbNotificationStrip() + directorDecisionNoticeStrip() + nav + page + `<div class="footer no-print">SafeQMS Goal Management v5.4 · Full-scope X-Matrix + QMS co-approval + Director notifications + Bidirectional Catchball demo · localStorage only · Proposed backend contracts are illustrative; Django/DRF must enforce permissions.</div>`;

      if (allowedRoute(contentRoute) && contentRoute === 'kpis') {
        let allowedKpis = limitedRole() ? S.kpis.filter((k: any) => S.goals.some((g: any) => visibleToRole(g) && g.kpi === k.id)) : S.kpis;
        if (isDirector()) allowedKpis = S.kpis.filter((k: any) => k.id === 'K-002' || k.id === 'K-001');
        let sel = document.getElementById('kpiSelect') as HTMLSelectElement | null;
        if (sel) {
          sel.innerHTML = allowedKpis.map((k: any) => `<option value="${k.id}">${esc(k.name)}</option>`).join('');
          if (allowedKpis.length) kpiDetail(allowedKpis[0].id);
        }
      }

      rolePostRender(contentRoute, id);

      if (['overview', 'approvals'].includes(contentRoute) && isGeneral()) {
        appElem.insertAdjacentHTML('beforeend', directorDecisionFeed());
      }
      if (contentRoute === 'overview' && !isBasic()) {
        appElem.insertAdjacentHTML('beforeend', panel('Strategy Alignment · Catchball', `<div class="split"><div><b>Negotiate goals before approval</b><p class="small muted">Shared dialogue, proposed targets, resources, formal decisions and audit history.</p></div>${btn('Open Catchball', "go('catchball')", 'primary')}</div>`));
      }
      if (contentRoute === 'goal' && goal(id) && visibleToRole(goal(id)) && !isBasic()) {
        appElem.insertAdjacentHTML('beforeend', cbGoalPanel(id));
      }
    }
    window.scrollTo(0, 0);
  }

  // Window-level handler assignments for inline HTML onclick/onchange/onsubmit
  (window as any).go = go;
  (window as any).setRole = setRole;
  (window as any).setScope = (scope: string) => { S.scope = scope; save(); render(); };
  (window as any).setYear = (year: string) => { S.year = year; save(); render(); };
  (window as any).setMatrixView = (v: string) => { S.matrixView = v; save(); render(); };
  (window as any).setCascadeView = (v: string) => { S.cascadeView = v; save(); render(); };
  (window as any).setCollapsed = (v: boolean) => { S.collapsed = v ? S.goals.map((g: any) => g.id) : []; save(); render(); };
  (window as any).toggleCollapse = (id: string) => { S.collapsed = S.collapsed.includes(id) ? S.collapsed.filter((x: any) => x !== id) : [...S.collapsed, id]; save(); render(); };
  (window as any).focusParent = (id: string) => {
    go('goal', id);
    setTimeout(() => {
      let p = document.getElementById('parentSelect');
      if (p) {
        p.focus();
        p.classList.add('focusindicator');
        p.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => p?.classList.remove('focusindicator'), 1700);
      }
    }, 80);
  };
  (window as any).goalLevelChanged = (el: HTMLSelectElement) => {
    let p = document.getElementById('parentSelect') as HTMLSelectElement | null;
    let idInput = document.getElementById('goalID') as HTMLInputElement | null;
    if (!p) return;
    let ps = permittedParents(el.value, idInput?.value || '');
    let current = p.value;
    p.innerHTML = '<option value="">' + (el.value === 'Organization' ? 'Top-level organization goal (no parent)' : 'Select parent goal') + '</option>' + ps.map((g: any) => `<option value="${g.id}">${esc(g.id + ' · ' + g.title + ' (' + g.level + ')')}</option>`).join('');
    if (ps.some((g: any) => g.id === current)) p.value = current;
    p.disabled = el.value === 'Organization';
    let hint = document.getElementById('parentHint');
    if (hint) {
      hint.textContent = el.value === 'Organization' ? 'Organization pillars have no parent.' : el.value.startsWith('Site:') ? 'Site objectives are linked to Organization strategic pillars.' : 'Department objectives are linked to a Site annual goal.';
    }
  };
  (window as any).saveGoal = (ev: any, id: string) => {
    ev.preventDefault();
    let f = new FormData(ev.target), d: any = Object.fromEntries(f);
    if (id ? !roleCan('goalEdit', goal(id)) : !roleCan('goalCreate', { level: d.level })) {
      toast('Your role cannot save or create a goal at this level');
      return;
    }
    d.isoRefs = f.getAll('isoRefs');
    d.parent = d.parent || '';
    if (d.level === 'Organization') d.parent = '';
    if (d.level !== 'Organization' && !d.parent) { toast('Select a Primary Parent Goal'); return; }
    if (d.parent && !permittedParents(d.level, id).some((x: any) => x.id === d.parent)) { toast('Parent goal is not valid for this organizational level'); return; }
    if (id) {
      let kids = S.goals.filter((x: any) => x.parent === id);
      if (kids.some((x: any) => !((x.level.startsWith('Site:') && d.level === 'Organization') || (x.level.startsWith('Department:') && d.level.startsWith('Site:'))))) {
        toast('Reassign child goals before changing this level');
        return;
      }
    }
    d.baseline = Number(d.baseline);
    d.target = Number(d.target);
    d.iso = d.isoRefs.map((r: any) => isoName(r)).join(' | ');

    let targetOrKpiChanged = false;
    if (id) {
      let g = goal(id);
      let changed = Object.keys(d).some(k => JSON.stringify(g[k] ?? '') !== JSON.stringify(d[k] ?? ''));
      if (!changed) { toast('No changes to save'); return; }
      targetOrKpiChanged = g.target !== d.target || g.kpi !== d.kpi;
      if (g.approval === 'Approved') {
        S.goalRevisions.push({ goalId: id, at: today, approvedSnapshot: JSON.parse(JSON.stringify(g)), revision: g.revision || 1 });
        g.revision = (g.revision || 1) + 1;
        g.approval = 'Draft';
        S.history.unshift({ time: today, text: `${id}: approved v${g.revision - 1} archived; new v${g.revision} draft created` });
      } else if (g.approval === 'Pending') {
        g.approval = 'Draft';
        for (const a of S.approvals.filter((a: any) => a.goal === id && a.status === 'Pending')) a.status = 'Superseded';
      }
      if (g.parent !== d.parent) S.history.unshift({ time: today, text: `${id}: primary parent changed from ${g.parent || 'none'} to ${d.parent || 'none'}` });
      Object.assign(g, d);
      if (targetOrKpiChanged) syncKpiTargetsFromGoal(g);
    } else {
      let n = Math.max(0, ...S.goals.map((x: any) => Number(x.id.split('-')[1]) || 0)) + 1;
      id = 'G-' + String(n).padStart(3, '0');
      const newGoal = { id, ...d, approval: 'Draft', revision: 1 };
      S.goals.push(newGoal);
      S.history.unshift({ time: today, text: `New goal ${id} saved as draft` });
      syncKpiTargetsFromGoal(newGoal);
    }
    syncGoalPerformance();
    save();
    toast('Goal saved — ISO references, KPI target and hierarchy updated');
    go('goal', id);
  };
  (window as any).submitGoal = async (id: string) => {
    let g = goal(id), v = goalPlanCheck(g);
    if (g && g.level !== 'Organization') {
      let c = S.catchballs?.find((x: any) => x.goal === id && !['Approved', 'Cancelled'].includes(x.status));
      if (!c) { toast('Catchball alignment required before submitting this objective'); go('catchball'); return; }
      if (c.status !== 'Aligned') { toast('Complete Catchball alignment before formal approval'); go('catchballitem', c.id); return; }
      return (window as any).cbSubmit(c.id);
    }
    if (!v.ready) {
      await (window as any).__showAppAlert(
        'Goal Plan Incomplete',
        'Goal not ready for approval. Please complete the following required items before submitting:',
        v.checks.filter(x => !x.ok).map(x => x.label)
      );
      return;
    }
    if (g.approval === 'Pending') { toast('This goal already has a pending approval'); return; }
    g.approval = 'Pending';
    let n = Math.max(0, ...S.approvals.map((a: any) => Number(a.id.split('-')[1]) || 0)) + 1;
    S.approvals.push({ id: 'AP-' + String(n).padStart(3, '0'), goal: id, requester: g.owner, approver: 'General director / QMS auditor', status: 'Pending', comment: 'Please review planned activities, resources, ISO requirements and alignment.', date: today });
    S.history.unshift({ time: today, text: `${id} submitted for formal approval` });
    save();
    go('approvals');
  };
  (window as any).xm3Select = xm3Select;
  (window as any).xm3OnlyStrong = xm3OnlyStrong;
  (window as any).xm3Clear = xm3Clear;
  (window as any).xm3Cycle = xm3Cycle;
  (window as any).xm3Rationale = xm3Rationale;
  (window as any).xm3OwnerCycle = xm3OwnerCycle;
  (window as any).xm3OwnerNote = xm3OwnerNote;
  (window as any).xm3OpenRecord = xm3OpenRecord;
  (window as any).cycleLink = (a: string, b: string) => xm3Cycle(a, b);
  (window as any).setSqdcFilter = (f: string) => { S.sqdcFilter = f; save(); render(); };
  (window as any).updateInitiativeFocus = (ev: any, id: string) => {
    ev.preventDefault();
    const i = initiative(id);
    if (!i || !roleCan('initiativeWrite', i)) return toast('Your role cannot update this initiative');
    const d = Object.fromEntries(new FormData(ev.target)) as any;
    if (d.progress !== undefined && d.progress !== '' && Number.isFinite(Number(d.progress))) {
      i.progress = Math.max(0, Math.min(100, Math.round(Number(d.progress))));
    }
    if (d.status) i.status = d.status;
    i.valueStream = d.valueStream || '';
    i.isBottleneck = d.isBottleneck === 'true';
    i.sqdc = { S: Number(d.sqdcS || 0), Q: Number(d.sqdcQ || 0), D: Number(d.sqdcD || 0), C: Number(d.sqdcC || 0) };
    save();
    render();
    toast('Initiative execution, SQDC focus & Value Stream updated');
  };
  (window as any).saveInitiative = (ev: any) => {
    ev.preventDefault();
    let d = Object.fromEntries(new FormData(ev.target)) as any;
    if (!roleCan('initiativeWrite', { goal: d.goal })) return toast('Your role cannot create an initiative for this goal');
    let n = Math.max(0, ...S.initiatives.map((i: any) => Number(i.id.split('-')[1]) || 0)) + 1;
    let id = 'I-' + String(n).padStart(3, '0');
    S.initiatives.push({
      id,
      title: d.title,
      owner: d.owner,
      goal: d.goal,
      budget: d.budget,
      progress: Number(d.progress),
      status: d.status,
      description: d.description,
      valueStream: d.valueStream || 'Operational Value Stream',
      isBottleneck: d.isBottleneck === 'true',
      sqdc: { S: Number(d.sqdcS || 0), Q: Number(d.sqdcQ || 0), D: Number(d.sqdcD || 0), C: Number(d.sqdcC || 0) }
    });
    S.relations.push({ from: d.goal, to: id, strength: 2 });
    save();
    go('initiative', id);
  };
  (window as any).saveProjectA3 = (id: string) => {
    let p = S.projects.find((x: any) => x.id === id);
    if (!p || !roleCan('projectWrite', p)) return toast('Your role cannot edit this Project A3');
    ['problem', 'current', 'target', 'root', 'counter', 'learning'].forEach(k => {
      let el = document.getElementById(k) as HTMLTextAreaElement | null;
      if (el) p[k] = el.value;
    });
    save();
    toast('Project A3 saved');
  };
  (window as any).addTask = async (id: string) => {
    let p = S.projects.find((x: any) => x.id === id);
    if (!p || !roleCan('projectWrite', p)) return toast('Your role cannot add activities to this project');
    let title = await (window as any).__showAppPrompt('New Activity', 'Activity title:', '', true);
    if (!title) return;
    let owner = await (window as any).__showAppPrompt('Responsible Person', 'Responsible person:', 'Project Leader') || 'Project Leader';
    let n = Math.max(0, ...S.tasks.map((t: any) => Number(t.id.split('-')[1]) || 0)) + 1;
    S.tasks.push({ id: 'T-' + String(n).padStart(3, '0'), project: id, title, owner, due: today, status: 'Open' });
    syncExecutionProgress(id);
    save();
    render();
    toast('Activity added and project/initiative progress updated');
  };
  (window as any).toggleTaskStatus = (taskId: string) => {
    const t = (S.tasks || []).find((x: any) => x.id === taskId);
    const p = t ? S.projects.find((x: any) => x.id === t.project) : null;
    if (!t || !p || !roleCan('projectWrite', p)) return toast('Your role cannot update tasks on this project');
    t.status = t.status === 'Open' ? 'In progress' : t.status === 'In progress' ? 'Done' : 'Open';
    syncExecutionProgress(p.id);
    save();
    render();
    toast(`Activity ${t.id} marked ${t.status}; project & initiative progress synced`);
  };
  (window as any).kpiDetail = kpiDetail;
  (window as any).recordKPI = async (id: string) => {
    let k = kpi(id), n = k.values.length;
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (n >= 12) { toast('All 12 months have been entered'); return; }
    let v = await (window as any).__showAppPrompt('Record KPI Actual', `Enter ${months[n]} actual (${k.unit}):`, '', true, true);
    if (v === null) return;
    if (v.trim() === '' || !Number.isFinite(Number(v))) { toast('Enter a valid number'); return; }
    k.values.push(Number(v));
    k.source = 'Manual entry (browser demo)';
    k.sourceUpdated = today;
    syncGoalPerformance();
    save();
    kpiDetail(id);
    toast('KPI saved and goal performance updated');
  };
  (window as any).setBlockerFilter = (f: string) => { S.blockerFilter = f; save(); render(); };
  (window as any).escalateBlocker = async (targetType: string, targetId: string) => {
    if (!canEscalateTarget(targetType, targetId)) return toast('Your active role or scope cannot escalate a blocker for this item');
    const info = blockerTargetInfo(targetType, targetId);
    const res = await (window as any).__showAppEscalate({
      itemLabel: `${info.typeLabel} ${info.code} · ${info.title} (${info.scope})`,
      defaultCategory: targetType === 'kpi' ? 'Technical' : 'Resource',
      defaultSeverity: info.status === 'Off track' || info.status === 'At risk' ? 'High' : 'Medium'
    });
    if (!res) return;
    if (!Array.isArray(S.blockers)) S.blockers = [];
    const n = Math.max(0, ...S.blockers.map((b: any) => Number(String(b.id).split('-')[1]) || 0)) + 1;
    const id = 'BL-' + String(n).padStart(3, '0');
    S.blockers.unshift({
      id, targetType, targetId, scope: info.scope,
      category: res.category, severity: res.severity,
      summary: res.summary, neededAction: res.neededAction,
      owner: info.owner, raisedBy: role(), raisedAt: today,
      status: 'Open', source: 'Manual'
    });
    S.history.unshift({ time: today, text: `${id} escalated on ${info.code} (${info.title}): ${res.summary}` });
    save();
    render();
    toast(`${id} escalated to PDCA Review queue`);
  };
  (window as any).resolveBlocker = async (blockerId: string) => {
    if (!roleCan('reviewWrite')) return toast('Review write access required to resolve blockers');
    const b = (S.blockers || []).find((x: any) => x.id === blockerId);
    if (!b) return;
    const note = await (window as any).__showAppPrompt('Resolve Escalated Blocker', `Resolution note for ${b.id}:`, b.resolutionNote || 'Root cause addressed and resources confirmed.', true);
    if (!note) return;
    b.status = 'Resolved';
    b.resolvedAt = today;
    b.resolutionNote = note.trim();
    if (b.reviewId && typeof b.decisionIndex === 'number') {
      const dec = S.reviews.find((r: any) => r.id === b.reviewId)?.decisions?.[b.decisionIndex];
      if (dec) dec.status = 'Done';
    }
    S.history.unshift({ time: today, text: `${b.id} resolved: ${b.resolutionNote}` });
    save();
    render();
    toast(`${b.id} marked resolved`);
  };
  (window as any).reopenBlocker = (blockerId: string) => {
    if (!roleCan('reviewWrite')) return toast('Review write access required');
    const b = (S.blockers || []).find((x: any) => x.id === blockerId);
    if (!b) return;
    b.status = b.reviewId ? 'In review' : 'Open';
    delete b.resolvedAt;
    if (b.reviewId && typeof b.decisionIndex === 'number') {
      const dec = S.reviews.find((r: any) => r.id === b.reviewId)?.decisions?.[b.decisionIndex];
      if (dec) dec.status = 'Open';
    }
    save();
    render();
    toast(`${b.id} reopened`);
  };
  function linkExceptionToReview(reviewId: string, blockerId: string, targetType: string, targetId: string, text: string, owner: string, due: string) {
    let r = S.reviews.find((x: any) => x.id === reviewId);
    if (!r) {
      const n = Math.max(0, ...S.reviews.map((x: any) => Number(String(x.id).split('-')[1]) || 0)) + 1;
      const newId = 'R-' + String(n).padStart(3, '0');
      const info = blockerTargetInfo(targetType, targetId);
      r = { id: newId, title: `PDCA Review · ${S.scope}`, date: today, scope: info.scope || S.scope, notes: 'Created from Escalated Blocker & Exception Queue.', decisions: [] };
      S.reviews.push(r);
    }
    const idx = r.decisions.length;
    r.decisions.push({ text, owner, due, status: 'Open', blockerId: blockerId || undefined, linkedType: targetType, linkedId: targetId });
    if (blockerId) {
      const b = (S.blockers || []).find((x: any) => x.id === blockerId);
      if (b) {
        b.status = 'In review';
        b.reviewId = r.id;
        b.decisionIndex = idx;
      }
    }
    S.history.unshift({ time: today, text: `PDCA decision added in ${r.id} for ${blockerId || targetId}: ${text}` });
    save();
    return r;
  }
  (window as any).setDailyTier = (t: string) => { S.dailyTier = t; save(); render(); };
  (window as any).focusUnitDaily = (unit: string) => {
    const allowedScopes = limitedRole() ? ['Organization', ASSIGNED_SITE, ASSIGNED_DEPARTMENT] : ['Organization', 'Site: Uppsala', 'Site: Falkenberg', 'Department: Production', 'Department: Maintenance', 'Department: Quality'];
    if (allowedScopes.includes(unit)) S.scope = unit;
    S.dailyTier = 'tier1';
    save();
    render();
  };
  (window as any).setMyFocusOwner = (o: string) => { S.myFocusOwner = o; save(); render(); };
  (window as any).toggleSafetyDay = (scopeKey: string, day: number) => {
    if (isAuditor()) return toast('Read-only role cannot update Safety Cross');
    if (!S.safetyCross) S.safetyCross = {};
    if (!S.safetyCross[scopeKey]) S.safetyCross[scopeKey] = {};
    const cur = S.safetyCross[scopeKey][String(day)] || '';
    const next = cur === '' ? 'green' : cur === 'green' ? 'amber' : cur === 'amber' ? 'red' : '';
    if (next) S.safetyCross[scopeKey][String(day)] = next;
    else delete S.safetyCross[scopeKey][String(day)];
    save();
    render();
  };
  (window as any).createPulseCard = (ev: any) => {
    ev.preventDefault();
    if (isAuditor()) return toast('Read-only role cannot add pulse cards');
    const d = Object.fromEntries(new FormData(ev.target)) as any;
    if (!String(d.title || '').trim()) return;
    if (!Array.isArray(S.pulseCards)) S.pulseCards = [];
    const n = Math.max(0, ...S.pulseCards.map((c: any) => Number(String(c.id).split('-')[1]) || 0)) + 1;
    const id = 'PC-' + String(n).padStart(3, '0');
    const linkedKpiId = d.kpi || '';
    const matchedGoal = linkedKpiId ? S.goals.find((g: any) => g.kpi === linkedKpiId && visibleToRole(g)) : null;
    const matchedInit = matchedGoal ? S.initiatives.find((i: any) => initiativeLinkedToGoal(i, matchedGoal.id)) : null;
    const matchedProj = matchedInit ? S.projects.find((p: any) => p.initiative === matchedInit.id) : null;
    let blockerId = '';
    let status = 'Team action';
    if (d.routeType === 'Escalate' && !isAuditor()) {
      if (!Array.isArray(S.blockers)) S.blockers = [];
      const bn = Math.max(0, ...S.blockers.map((b: any) => Number(String(b.id).split('-')[1]) || 0)) + 1;
      blockerId = 'BL-' + String(bn).padStart(3, '0');
      const targetType = matchedInit ? 'initiative' : linkedKpiId ? 'kpi' : 'goal';
      const targetId = matchedInit?.id || linkedKpiId || matchedGoal?.id || 'G-002';
      S.blockers.unshift({
        id: blockerId, targetType, targetId, scope: S.scope,
        category: 'Technical', severity: 'High',
        summary: String(d.title).trim(),
        neededAction: 'Review escalated Tier 1 daily board issue in Tier 2 / PDCA meeting.',
        owner: d.owner || role(), raisedBy: role(), raisedAt: today,
        status: 'Open', source: 'Daily Board'
      });
      status = 'Escalated';
    }
    S.pulseCards.unshift({
      id, title: String(d.title).trim(), details: '', due: '', scope: S.scope, routeType: d.routeType || 'Direct fix',
      owner: d.owner || role(), kpi: linkedKpiId, initiative: matchedInit?.id || '', project: matchedProj?.id || '',
      blockerId, status, createdAt: today, comments: []
    });
    save();
    render();
    toast(blockerId ? `Added ${id} and escalated ${blockerId} to PDCA queue` : `Added ${id} to Daily Board`);
  };
  (window as any).openPulseCard = (pcId: string, ev?: any) => {
    if (ev && (ev.target as HTMLElement)?.closest('button,form,input,select,textarea,a')) return;
    pulseOpenCardId = pcId;
    render();
  };
  (window as any).openPulseCardFromFocus = (pcId: string) => {
    go('daily');
    pulseOpenCardId = pcId;
    render();
  };
  (window as any).closePulseCard = () => {
    pulseOpenCardId = null;
    render();
  };
  (window as any).savePulseCardDetails = (ev: any, pcId: string) => {
    ev.preventDefault();
    if (isAuditor()) return toast('Read-only role cannot edit pulse cards');
    const c = (S.pulseCards || []).find((x: any) => x.id === pcId);
    if (!c) return;
    const d = Object.fromEntries(new FormData(ev.target)) as any;
    if (String(d.title || '').trim()) c.title = String(d.title).trim();
    c.details = String(d.details || '').trim();
    c.due = String(d.due || '').trim();
    if (d.routeType) c.routeType = d.routeType;
    const linkedKpiId = d.kpi || '';
    c.kpi = linkedKpiId;
    const matchedGoal = linkedKpiId ? S.goals.find((g: any) => g.kpi === linkedKpiId && visibleToRole(g)) : null;
    const matchedInit = matchedGoal ? S.initiatives.find((i: any) => initiativeLinkedToGoal(i, matchedGoal.id)) : null;
    const matchedProj = matchedInit ? S.projects.find((p: any) => p.initiative === matchedInit.id) : null;
    if (matchedInit) c.initiative = matchedInit.id;
    else if (!linkedKpiId) c.initiative = '';
    if (matchedProj) c.project = matchedProj.id;
    else if (!linkedKpiId) c.project = '';
    if (c.blockerId) {
      const b = (S.blockers || []).find((x: any) => x.id === c.blockerId);
      if (b) {
        b.summary = c.title;
        b.targetType = c.initiative ? 'initiative' : c.kpi ? 'kpi' : 'goal';
        b.targetId = c.initiative || c.kpi || matchedGoal?.id || b.targetId;
      }
    }
    save();
    render();
    toast(`Saved ${c.id} details`);
  };
  (window as any).addPulseCardComment = (ev: any, pcId: string) => {
    ev.preventDefault();
    if (isAuditor()) return toast('Read-only role cannot post comments');
    const c = (S.pulseCards || []).find((x: any) => x.id === pcId);
    if (!c) return;
    const d = Object.fromEntries(new FormData(ev.target)) as any;
    const text = String(d.text || '').trim();
    if (!text) return;
    if (!Array.isArray(c.comments)) c.comments = [];
    c.comments.push({ by: role(), at: today, text });
    save();
    render();
    toast('Added note to card');
  };
  (window as any).openPulseDelegate = (pcId: string) => {
    if (isAuditor()) return toast('Read-only role cannot delegate pulse cards');
    pulseDelegateCardId = pulseDelegateCardId === pcId ? null : pcId;
    render();
  };
  (window as any).closePulseDelegate = () => {
    pulseDelegateCardId = null;
    render();
  };
  (window as any).delegatePulseCard = (ev: any, pcId: string) => {
    ev.preventDefault();
    if (isAuditor()) return toast('Read-only role cannot delegate pulse cards');
    const c = (S.pulseCards || []).find((x: any) => x.id === pcId);
    if (!c) return;
    const d = Object.fromEntries(new FormData(ev.target)) as any;
    const targetScope = d.scope || c.scope;
    const targetOwner = String(d.owner || c.owner || role()).trim();
    const note = String(d.note || '').trim();
    c.scope = targetScope;
    c.owner = targetOwner;
    c.status = 'Team action';
    c.delegatedBy = role();
    c.delegatedAt = today;
    if (note) c.delegationNote = note;
    else delete c.delegationNote;
    if (!Array.isArray(c.comments)) c.comments = [];
    c.comments.push({ by: role(), at: today, text: `↳ Delegated to ${targetOwner} (${targetScope})${note ? ': ' + note : ''}` });
    if (c.blockerId) {
      const b = (S.blockers || []).find((x: any) => x.id === c.blockerId);
      if (b) {
        b.scope = targetScope;
        b.owner = targetOwner;
        b.status = 'In review';
        delete b.resolvedAt;
        b.neededAction = note ? `Delegated by ${role()} to ${targetOwner} (${targetScope}): ${note}` : `Delegated by ${role()} to ${targetOwner} (${targetScope})`;
        if (b.reviewId && typeof b.decisionIndex === 'number') {
          const dec = S.reviews.find((r: any) => r.id === b.reviewId)?.decisions?.[b.decisionIndex];
          if (dec) dec.status = 'Open';
        }
      }
    }
    pulseDelegateCardId = null;
    S.history.unshift({ time: today, text: `${c.id} delegated by ${role()} to ${targetOwner} (${targetScope}): ${c.title}` });
    save();
    render();
    toast(`Delegated ${c.id} to ${targetOwner} (${targetScope})`);
  };
  (window as any).escalatePulseCard = (pcId: string) => {
    if (isAuditor()) return toast('Read-only role cannot escalate pulse cards');
    const c = (S.pulseCards || []).find((x: any) => x.id === pcId);
    if (!c) return;
    c.status = 'Escalated';
    c.routeType = 'Escalate';
    if (!Array.isArray(c.comments)) c.comments = [];
    if (!c.blockerId) {
      if (!Array.isArray(S.blockers)) S.blockers = [];
      const bn = Math.max(0, ...S.blockers.map((b: any) => Number(String(b.id).split('-')[1]) || 0)) + 1;
      const blockerId = 'BL-' + String(bn).padStart(3, '0');
      const targetType = c.initiative ? 'initiative' : c.kpi ? 'kpi' : 'goal';
      const targetId = c.initiative || c.kpi || S.goals.find((g: any) => g.level === c.scope)?.id || 'G-002';
      S.blockers.unshift({
        id: blockerId, targetType, targetId, scope: c.scope,
        category: 'Cross-functional', severity: 'High',
        summary: c.title,
        neededAction: 'Escalated from Daily Tier 1 Pulse Board for Tier 2/3 leadership support.',
        owner: c.owner || role(), raisedBy: role(), raisedAt: today,
        status: 'Open', source: 'Daily Board'
      });
      c.blockerId = blockerId;
      c.comments.push({ by: role(), at: today, text: `↑ Escalated to Tier 2/3 & PDCA Queue as ${blockerId}` });
      S.history.unshift({ time: today, text: `${blockerId} escalated from Daily Board (${c.id}): ${c.title}` });
    } else {
      const b = (S.blockers || []).find((x: any) => x.id === c.blockerId);
      if (b) {
        b.status = b.reviewId ? 'In review' : 'Open';
        b.raisedBy = role();
        b.raisedAt = today;
        delete b.resolvedAt;
        if (b.reviewId && typeof b.decisionIndex === 'number') {
          const dec = S.reviews.find((r: any) => r.id === b.reviewId)?.decisions?.[b.decisionIndex];
          if (dec) dec.status = 'Open';
        }
      }
      c.comments.push({ by: role(), at: today, text: `↑ Re-escalated to Tier 2/3 (${c.blockerId})` });
      S.history.unshift({ time: today, text: `${c.blockerId} re-escalated from Daily Board (${c.id}): ${c.title}` });
    }
    pulseDelegateCardId = null;
    save();
    render();
    toast(`Escalated ${c.id} as ${c.blockerId} to Tier 2/3 & PDCA queue`);
  };
  (window as any).togglePulseCardDone = (pcId: string) => {
    if (isAuditor()) return toast('Read-only role cannot update pulse cards');
    const c = (S.pulseCards || []).find((x: any) => x.id === pcId);
    if (!c) return;
    const nextDone = c.status !== 'Done';
    c.status = nextDone ? 'Done' : (c.blockerId ? (c.delegatedBy ? 'Team action' : 'Escalated') : 'Team action');
    if (!Array.isArray(c.comments)) c.comments = [];
    c.comments.push({ by: role(), at: today, text: nextDone ? '✓ Marked Done' : 'Reopened card' });
    if (c.blockerId) {
      const b = (S.blockers || []).find((x: any) => x.id === c.blockerId);
      if (b) {
        if (nextDone) {
          b.status = 'Resolved';
          b.resolvedAt = today;
          b.resolutionNote = b.resolutionNote || `Closed via Daily Board (${c.id})`;
          if (b.reviewId && typeof b.decisionIndex === 'number') {
            const dec = S.reviews.find((r: any) => r.id === b.reviewId)?.decisions?.[b.decisionIndex];
            if (dec) dec.status = 'Done';
          }
        } else {
          b.status = b.reviewId ? 'In review' : 'Open';
          delete b.resolvedAt;
          if (b.reviewId && typeof b.decisionIndex === 'number') {
            const dec = S.reviews.find((r: any) => r.id === b.reviewId)?.decisions?.[b.decisionIndex];
            if (dec) dec.status = 'Open';
          }
        }
      }
    }
    save();
    render();
    toast(nextDone ? `${c.id} completed` : `${c.id} reopened`);
  };
  (window as any).toggleDailyTask = (taskId: string) => {
    const t = (S.tasks || []).find((x: any) => x.id === taskId);
    const p = t ? S.projects.find((x: any) => x.id === t.project) : null;
    if (!t || !p || isAuditor()) return toast('Cannot update task in read-only role');
    if (isBasic() && !roleCan('taskOwn', t)) return toast('Basic user can only update tasks assigned to Team Leader');
    if (!isBasic() && !roleCan('projectWrite', p)) return toast('Your role cannot update tasks on this project');
    t.status = t.status === 'Open' ? 'In progress' : t.status === 'In progress' ? 'Done' : 'Open';
    syncExecutionProgress(p.id);
    save();
    render();
    toast(`Task ${t.id} marked ${t.status}; project & initiative progress synced`);
  };
  (window as any).convertToPdcaDecision = async (blockerId: string, targetType: string, targetId: string) => {
    if (!roleCan('reviewWrite')) return toast('Only management or department directors can log PDCA decisions');
    const b = blockerId ? (S.blockers || []).find((x: any) => x.id === blockerId) : null;
    const info = blockerTargetInfo(targetType, targetId);
    const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const defaultText = b ? b.neededAction : `Address ${info.typeLabel} ${info.code} (${info.title}) gap and verify countermeasures`;
    const reviewsList = (S.reviews || []).slice().reverse().map((r: any) => ({ id: r.id, label: `${r.id} · ${r.title} (${r.scope})` }));
    const scopedMatch = (S.reviews || []).find((r: any) => r.scope === info.scope) || S.reviews?.[0];
    const res = await (window as any).__showAppPdcaDecision({
      itemLabel: b ? `${b.id} · ${info.code} (${info.title}) — ${b.summary}` : `${info.typeLabel} ${info.code} · ${info.title}`,
      reviewsList,
      defaultReviewId: scopedMatch?.id || '__new__',
      defaultText,
      defaultOwner: b?.owner || info.owner,
      defaultDue
    });
    if (!res) return;
    const rev = linkExceptionToReview(res.reviewId, blockerId, targetType, targetId, res.text, res.owner, res.due);
    go('review', rev.id);
    toast(`Decision added to ${rev.id}`);
  };
  (window as any).quickAddReviewDecision = async (reviewId: string, blockerId: string, targetType: string, targetId: string) => {
    if (!roleCan('reviewWrite')) return toast('Review write access required');
    const b = blockerId ? (S.blockers || []).find((x: any) => x.id === blockerId) : null;
    const info = blockerTargetInfo(targetType, targetId);
    const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const defaultText = b ? b.neededAction : `Address ${info.typeLabel} ${info.code} (${info.title}) gap`;
    const res = await (window as any).__showAppPdcaDecision({
      itemLabel: b ? `${b.id} · ${info.code} (${info.title})` : `${info.typeLabel} ${info.code} · ${info.title}`,
      reviewsList: (S.reviews || []).filter((r: any) => r.id === reviewId).map((r: any) => ({ id: r.id, label: `${r.id} · ${r.title}` })),
      defaultReviewId: reviewId,
      defaultText,
      defaultOwner: b?.owner || info.owner,
      defaultDue
    });
    if (!res) return;
    linkExceptionToReview(res.reviewId, blockerId, targetType, targetId, res.text, res.owner, res.due);
    render();
    toast('Exception converted to linked PDCA decision');
  };
  (window as any).createReview = (ev: any) => {
    ev.preventDefault();
    if (!roleCan('reviewWrite')) return toast('Your role cannot create PDCA reviews');
    let d = Object.fromEntries(new FormData(ev.target)), n = Math.max(0, ...S.reviews.map((r: any) => Number(r.id.split('-')[1]) || 0)) + 1, id = 'R-' + String(n).padStart(3, '0');
    S.reviews.push({ id, ...d, decisions: [] });
    save();
    go('review', id);
  };
  (window as any).toggleDecision = (id: string, i: number) => {
    if (!roleCan('reviewWrite')) return toast('Your role cannot update PDCA decisions');
    const rev = S.reviews.find((r: any) => r.id === id);
    let d = rev?.decisions?.[i];
    if (!d) return;
    d.status = d.status === 'Open' ? 'Done' : 'Open';
    if (d.blockerId) {
      const b = (S.blockers || []).find((x: any) => x.id === d.blockerId);
      if (b) {
        if (d.status === 'Done') {
          b.status = 'Resolved';
          b.resolvedAt = today;
          b.resolutionNote = b.resolutionNote || `Closed via PDCA decision in ${rev.id}`;
          S.history.unshift({ time: today, text: `${b.id} auto-resolved upon completing decision in ${rev.id}` });
          toast(`Decision done — linked blocker ${b.id} auto-resolved`);
        } else {
          b.status = 'In review';
          delete b.resolvedAt;
          toast(`Decision reopened — blocker ${b.id} back in review`);
        }
      }
    }
    save();
    render();
  };
  (window as any).addDecision = (ev: any, id: string) => {
    ev.preventDefault();
    if (!roleCan('reviewWrite')) return toast('Your role cannot add PDCA decisions');
    let r = S.reviews.find((x: any) => x.id === id);
    r.decisions.push({ ...Object.fromEntries(new FormData(ev.target)), status: 'Open' });
    save();
    render();
  };
  (window as any).decide = async (id: string, status: string) => {
    let a = S.approvals.find((x: any) => x.id === id), g = goal(a?.goal);
    if (a?.catchballId) return (window as any).cbFinalDecision(id, status);
    if (!roleCan('approve')) return toast('Formal approval requires General director or QMS auditor authority');
    if (!a || !g || a.status !== 'Pending') { toast('Approval request is no longer pending'); return; }
    if (status === 'Approved') {
      let v = goalPlanCheck(g);
      if (!v.ready) {
        await (window as any).__showAppAlert('Approval Blocked', `Approval blocked for ${g.id}. Missing required fields:`, v.checks.filter(c => !c.ok).map(c => c.label));
        return;
      }
    }
    let comment = await (window as any).__showAppPrompt(
      status === 'Approved' ? 'Approve Goal' : 'Request Changes',
      status === 'Approved' ? 'Approval comment (optional):' : 'Reason / changes requested (required):',
      '',
      status !== 'Approved'
    );
    if (comment === null) return;
    if (status !== 'Approved' && !comment.trim()) { toast('A reason is required'); return; }
    a.status = status;
    a.comment = comment;
    a.resolvedAt = today;
    a.approvedBy = role();
    g.approval = status === 'Approved' ? 'Approved' : 'Draft';
    S.history.unshift({ time: today, text: `${g.id} ${status} by ${role()}; ${comment || 'no comment'}` });
    if (status === 'Approved') recordDirectorDecision(a, role());
    save();
    render();
  };
  (window as any).revisePlan = async (id: string) => {
    if (!roleCan('config') && !roleCan('approve')) return toast('Your role cannot create strategy plan revisions');
    let p = S.plans.find((x: any) => x.id === id);
    let ok = await (window as any).__showAppConfirm('Create Revision', `Create a draft revision of ${p.name}?`);
    if (!ok) return;
    p.revision++;
    p.status = 'Draft';
    S.history.unshift({ time: today, text: `${p.name} revision ${p.revision} created as draft` });
    save();
    render();
  };
  (window as any).exportData = () => {
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = 'SafeQMS_Goal_Management_Demo.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  (window as any).resetDemo = async () => {
    let ok = await (window as any).__showAppConfirm('Reset Demo Data', 'Reset all local demo changes to original seed state?');
    if (!ok) return;
    S = seed();
    migrateDemo();
    migrateAdvanced();
    cleanFalseCompleteness();
    catchballMigrate();
    syncGoalPerformance();
    save();
    go('overview');
    toast('Demo reset');
  };
  (window as any).loadSyncDemo = async () => {
    let ok = await (window as any).__showAppConfirm('Load Synchronized Strategy Demo', 'This will populate the demo with a fully synchronized Hoshin Kanri / X-Matrix strategy dataset across Organization, Site (Uppsala & Falkenberg) and Departments (Production, Maintenance, Quality). Continue?');
    if (!ok) return;
    S = seed();
    migrateDemo();
    migrateAdvanced();
    cleanFalseCompleteness();
    catchballMigrate();
    syncGoalPerformance();
    save();
    go('overview');
    toast('Synchronized strategy demo loaded successfully!');
  };
  (window as any).restoreDemoISO = async () => {
    let ok = await (window as any).__showAppConfirm('Restore ISO Catalog', 'Restore the demo ISO chapter references? Previously imported ID links may become unresolved.');
    if (!ok) return;
    S.isoStandards = JSON.parse(JSON.stringify(ISO_EXAMPLE_CATALOG));
    S.isoCatalogSource = 'Bundled demonstration adapter — no live SafeQMS API connection';
    save();
    render();
  };
  (window as any).downloadISOSample = () => {
    downloadObject({ standards: ISO_EXAMPLE_CATALOG }, 'SafeQMS_ISO_Standards_Example_API_Payload.json');
  };
  (window as any).importISOFile = (ev: any) => {
    let file = ev.target.files[0];
    if (!file) return;
    if (file.size > 3000000) { toast('ISO JSON must be smaller than 3 MB for this demo'); return; }
    let reader = new FileReader();
    reader.onload = async () => {
      try {
        let catalog = (window as any).normalizeCatalog(JSON.parse(reader.result as string));
        S.isoStandards = catalog;
        S.isoCatalogSource = `Imported browser-side JSON: ${file.name} (not live API)`;
        save();
        render();
        toast('ISO requirement references imported');
      } catch (e: any) {
        await (window as any).__showAppAlert('Import Failed', 'ISO catalog import failed: ' + e.message);
      }
    };
    reader.readAsText(file);
  };
  (window as any).normalizeCatalog = (v: any) => {
    let items = Array.isArray(v) ? v : v?.standards;
    if (!Array.isArray(items) || !items.length) throw new Error('Expected a non-empty standards array');
    let seen = new Set();
    return items.map((s: any) => {
      if (!s || typeof s.id !== 'string' || !/^[\w.:-]{2,90}$/.test(s.id) || !/^ISO\s*\d{4,5}$/i.test(s.code || '')) throw new Error('Invalid standard: id and ISO code are required');
      if (!Array.isArray(s.requirements) || !s.requirements.length) throw new Error('Standard ' + s.code + ' has no requirement chapters');
      let reqs = s.requirements.map((r: any) => {
        if (!r || typeof r.id !== 'string' || !/^[\w.:-]{2,100}$/.test(r.id) || !String(r.number || '').trim() || !String(r.title || '').trim()) throw new Error('Invalid requirement in ' + s.code);
        if (seen.has(r.id)) throw new Error('Duplicate requirement id ' + r.id);
        seen.add(r.id);
        return { id: r.id, number: String(r.number), title: String(r.title) };
      });
      return { id: s.id, code: s.code, edition: String(s.edition || 'Version managed in SafeQMS'), requirements: reqs };
    });
  };
  (window as any).uploadCsv = (ev: any) => {
    let f = ev.target.files[0];
    if (!f) return;
    if (f.size > 500000) { toast('Use a CSV smaller than 500 KB in this demo'); return; }
    let fr = new FileReader();
    fr.onload = () => {
      let inp = document.getElementById('csvInput') as HTMLTextAreaElement | null;
      if (inp) { inp.value = fr.result as string; (window as any).validateCsvUI(); }
    };
    fr.readAsText(f);
  };
  (window as any).validateCsvUI = () => {
    let inp = document.getElementById('csvInput') as HTMLTextAreaElement | null;
    let p = csvRead(inp?.value || '');
    let res = document.getElementById('csvImportResult');
    if (res) {
      res.innerHTML = p.errors.length ? `<div class="loadingnotice"><b>${p.errors.length} validation error(s)</b>${p.errors.map(e => `<div class="xs">${esc(e)}</div>`).join('')}</div>` : `<div class="isooutline"><b>Ready: ${p.records.length} row(s)</b><div class="xs">${p.records.map((x: any) => `${esc(x.key)} · month ${x.index + 1} · actual ${x.actual}${x.target !== null ? ' · target ' + x.target : ''}`).join('<br>')}</div></div>`;
    }
    return p;
  };
  (window as any).commitCsv = () => {
    let parsed = (window as any).validateCsvUI();
    if (parsed.errors.length || !parsed.records.length) { toast('Fix CSV issues before importing'); return; }
    if (isDirector()) {
      if (parsed.records.some((r: any) => !roleCan('kpiWrite', kpi(r.key)))) {
        toast('Import blocked: only KPIs assigned to your department may be updated');
        return;
      }
    }
    for (const r of parsed.records) {
      let k = kpi(r.key);
      while (k.values.length <= r.index) k.values.push(null);
      k.values[r.index] = r.actual;
      while (k.targets.length <= r.index) k.targets.push(null);
      if (r.target !== null) k.targets[r.index] = r.target;
      k.source = 'CSV import (browser demo)';
      k.sourceUpdated = today;
    }
    S.csvImports.push({ date: today, count: parsed.records.length, source: 'CSV paste/upload' });
    S.history.unshift({ time: today, text: `KPI import: ${parsed.records.length} CSV rows` });
    syncGoalPerformance();
    save();
    go('kpis');
    toast('KPI values imported; goal performance recalculated');
  };
  (window as any).refreshEvidenceSelection = () => {
    let el = document.getElementById('evidenceContent');
    if (el) el.innerHTML = evidenceBody(chosenEvidenceGoals());
  };
  (window as any).exportEvidence = () => {
    downloadObject(auditPacket(chosenEvidenceGoals()), 'SafeQMS_Goal_Audit_Evidence_Pack.json');
  };
  (window as any).prepareManagementReview = () => {
    if (!roleCan('reviewPrepare')) return toast('Your role cannot create Management Review drafts');
    let m = managementSummary(), n = Math.max(0, ...S.reviews.map((r: any) => Number(r.id.split('-')[1]) || 0)) + 1, id = 'R-' + String(n).padStart(3, '0');
    const blockerLines = m.blockers.map((b: any) => `- ${b.id} [${b.severity}/${b.category}]: ${b.summary} (Need: ${b.neededAction})`).join('\n');
    let notes = `SafeQMS Goal Management automated input (${today}):\nGoals on track: ${m.on.length}; at risk: ${m.risk.length}; off track: ${m.off.length}; not measured: ${m.notMeasured.length}.\nEscalated blockers (${m.blockers.length}):\n${blockerLines || 'none'}\nGoals with incomplete plans: ${m.gaps.map((g: any) => g.id).join(', ') || 'none'}.\nOpen actions: ${m.open.length}.`;
    S.reviews.push({ id, title: 'Strategy and Management Review — Auto Draft', date: today, scope: S.scope, notes, decisions: [], source: 'Goal Management preview' });
    save();
    go('review', id);
    toast('Draft review created with live KPI & blocker queue');
  };
  (window as any).filterISORequirements = () => {
    let t = (document.getElementById('standardFilter') as HTMLSelectElement)?.value || '';
    document.querySelectorAll('#isoReqList [data-standard]').forEach((e: any) => e.classList.toggle('hidden', !!t && e.dataset.standard !== t));
  };
  (window as any).markOwnTask = (id: string) => {
    let t = S.tasks.find((t: any) => t.id === id);
    if (!roleCan('taskOwn', t)) return toast('Only your own assigned activity may be updated');
    t.status = 'Done';
    syncExecutionProgress(t.project);
    save();
    render();
    toast('Own task updated and project progress synced');
  };
  (window as any).markDirectorNotice = (id: string) => {
    if (!isGeneral()) return toast('Only General director can acknowledge these updates');
    const n = (S.directorDecisionNotifications || []).find((x: any) => x.id === id);
    if (n) { n.read = true; save(); render(); toast('Decision information acknowledged'); }
  };
  (window as any).cbOpenNotification = (id: string) => {
    let n = S.catchballNotifications.find((x: any) => x.id === id);
    if (!n || n.recipient !== role()) return toast('Notification not assigned to this role');
    n.read = true;
    save();
    go('catchballitem', n.catchballId);
  };
  (window as any).cbCreate = (ev: any) => {
    ev.preventDefault();
    let d = Object.fromEntries(new FormData(ev.target)), g = goal(d.goal as string);
    if (!g || !roleCan('goalEdit', g)) return toast('Your role or scope cannot negotiate this goal');
    if (!Number.isFinite(Number(d.target))) return toast('Enter a valid target');
    if (S.catchballs.some((c: any) => c.goal === g.id && !['Approved', 'Cancelled'].includes(c.status))) return toast('An active Catchball thread already exists for this goal');
    let id = cbNextID(S.catchballs, 'CB'), c = {
      id, goal: g.id, status: 'Draft', createdAt: today, updatedAt: today, origin: role(),
      recipientRole: isLeadership() ? 'Department director' : 'General director',
      recipientScope: d.recipientScope || ASSIGNED_DEPARTMENT,
      turn: role(),
      proposal: { target: Number(d.target), resources: d.resources, due: d.due, reason: d.reason },
      messages: []
    };
    cbRecord(c, 'Draft', d.reason as string, c.proposal.target, d.resources);
    S.catchballs.push(c);
    save();
    go('catchballitem', id);
  };
  (window as any).cbComment = (ev: any, id: string) => {
    ev.preventDefault();
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!cbCanAct(c, 'comment')) return toast('Comment not permitted');
    let x = (new FormData(ev.target).get('message') as string)?.trim();
    if (!x) return toast('Write a comment');
    cbRecord(c, 'Comment', x);
    if (isLeadership()) cbNotify('Department director', c, 'New Catchball comment on ' + cbGoalReadable(c));
    else cbNotifyLeadership(c, 'New Catchball comment on ' + cbGoalReadable(c));
    save();
    render();
  };
  (window as any).cbSend = (id: string) => {
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!cbCanAct(c, 'send')) return toast('You cannot send this proposal');
    c.status = isDirector() ? 'Awaiting director' : 'Awaiting department';
    c.turn = isDirector() ? 'General director' : 'Department director';
    cbRecord(c, 'Proposal submitted', 'Submitted goal and resource proposal for alignment.', c.proposal.target, c.proposal.resources);
    if (isDirector()) cbNotifyLeadership(c, 'Catchball proposal: ' + cbGoalReadable(c));
    else cbNotify('Department director', c, 'Catchball proposal: ' + cbGoalReadable(c));
    save();
    render();
  };
  (window as any).cbCounter = async (id: string) => {
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!cbCanAct(c, 'counter')) return toast('Cannot make a counterproposal in this state');
    let res = await (window as any).__showAppCounter(c.proposal.target, c.proposal.resources || '');
    if (!res) return;
    c.proposal.target = res.target;
    c.proposal.resources = res.resources;
    c.status = isLeadership() ? 'Awaiting department' : 'Awaiting director';
    c.turn = isLeadership() ? 'Department director' : 'General director';
    cbRecord(c, 'Counterproposal', res.reason, res.target, res.resources);
    if (isLeadership()) cbNotify('Department director', c, 'Counterproposal to review: ' + cbGoalReadable(c));
    else cbNotifyLeadership(c, 'Counterproposal to review: ' + cbGoalReadable(c));
    save();
    render();
  };
  (window as any).cbAlign = async (id: string) => {
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!cbCanAct(c, 'align')) return toast('Your role cannot align this thread now');
    let note = await (window as any).__showAppPrompt('Agree & Align', 'Alignment note:', 'Target and resources agreed for formal approval.', true);
    if (note === null) return;
    if (!note.trim()) return toast('Add an alignment note');
    c.status = 'Aligned';
    c.turn = null;
    cbRecord(c, 'Alignment', note, c.proposal.target, c.proposal.resources);
    if (isLeadership()) cbNotify('Department director', c, 'Goal aligned, pending formal submission: ' + cbGoalReadable(c));
    else cbNotifyLeadership(c, 'Goal aligned, pending formal submission: ' + cbGoalReadable(c));
    save();
    render();
  };
  (window as any).cbChanges = async (id: string) => {
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!cbCanAct(c, 'changes')) return toast('Cannot request changes now');
    let reason = await (window as any).__showAppPrompt('Request Changes', 'What must be changed? (required):', '', true);
    if (reason === null) return;
    if (!reason.trim()) return toast('Reason is required');
    c.status = 'Changes requested';
    c.turn = isLeadership() ? 'Department director' : 'General director';
    cbRecord(c, 'Changes requested', reason);
    if (isLeadership()) cbNotify('Department director', c, 'Changes requested: ' + cbGoalReadable(c));
    else cbNotifyLeadership(c, 'Changes requested: ' + cbGoalReadable(c));
    save();
    render();
  };
  (window as any).cbSubmit = async (id: string) => {
    let c = S.catchballs.find((x: any) => x.id === id);
    if (!cbCanAct(c, 'approval')) return toast('Alignment is required before formal approval');
    let g = goal(c.goal), x = goalPlanCheck(g);
    if (!x.ready) {
      await (window as any).__showAppAlert('Formal Submission Blocked', 'Complete ISO goal planning first before submitting:', x.checks.filter((a: any) => !a.ok).map((a: any) => a.label));
      return;
    }
    if (S.approvals.some((a: any) => a.goal === g.id && a.status === 'Pending')) return toast('An approval request already exists');
    let aid = cbNextID(S.approvals, 'AP');
    let request = {
      id: aid, goal: g.id, catchballId: id, requester: role(), approver: 'General director / QMS auditor', status: 'Pending',
      comment: 'Catchball aligned. ISO planning complete. Proposed target ' + c.proposal.target, at: today,
      previousTarget: g.target, previousSnapshot: JSON.parse(JSON.stringify(g)),
      proposedTarget: c.proposal.target, proposedResources: c.proposal.resources
    };
    S.approvals.push(request);
    g.approval = 'Pending';
    c.status = 'Pending approval';
    cbRecord(c, 'Approval submitted', `Aligned target ${c.proposal.target} ${g.unit} submitted for formal approval; recorded target unchanged until approval.`);
    cbNotifyLeadership(c, 'Formal approval requested: ' + cbGoalReadable(c));
    save();
    go('catchballitem', id);
  };
  (window as any).cbFinalDecision = async (approvalId: string, decision: string) => {
    let a = S.approvals.find((x: any) => x.id === approvalId), c = S.catchballs.find((x: any) => x.id === a?.catchballId), g = goal(a?.goal);
    if (!isLeadership() || !a || !c || !g || a.status !== 'Pending' || c.status !== 'Pending approval') return toast('Formal decision unavailable to this role');
    if (decision === 'Approved') {
      let x = goalPlanCheck(g);
      if (!x.ready) {
        await (window as any).__showAppAlert('Approval Blocked', 'Goal plan is missing required fields:', x.checks.filter((a: any) => !a.ok).map((a: any) => a.label));
        return;
      }
    }
    let note = await (window as any).__showAppPrompt(
      decision === 'Approved' ? 'Formal Goal Approval' : 'Request Changes',
      decision === 'Approved' ? 'Approval rationale / note:' : 'Why are changes requested? (required):',
      decision === 'Approved' ? 'Approved based on aligned Catchball negotiation and complete ISO planning.' : '',
      decision !== 'Approved'
    );
    if (note === null) return;
    if (decision !== 'Approved' && !note.trim()) return toast('A reason is required');

    if (decision === 'Approved') {
      if (!Array.isArray(S.goalRevisions)) S.goalRevisions = [];
      S.goalRevisions.push({ goalId: g.id, at: today, approvedSnapshot: a.previousSnapshot || JSON.parse(JSON.stringify(g)), revision: g.revision || 1, reason: 'Catchball alignment ' + c.id });
      g.target = Number(c.proposal.target);
      g.resources = c.proposal.resources;
      g.approval = 'Approved';
      g.revision = (g.revision || 1) + 1;
      syncKpiTargetsFromGoal(g);
      c.status = 'Approved';
      a.status = 'Approved';
      cbRecord(c, 'Approved', note || 'Formal approval recorded', g.target, g.resources);
    } else {
      c.status = 'Changes requested';
      a.status = 'Changes requested';
      g.approval = 'Draft';
      cbRecord(c, 'Approval changes requested', note);
    }
    a.comment = note;
    a.resolvedAt = today;
    a.approvedBy = role();
    if (decision === 'Approved') recordDirectorDecision(a, role());
    cbNotify('Department director', c, decision === 'Approved' ? 'Goal approved: ' + cbGoalReadable(c) : 'Formal changes requested: ' + cbGoalReadable(c));
    syncGoalPerformance();
    save();
    go('catchballitem', c.id);
  };
  (window as any).cbStartForGoal = (id: string) => {
    if (!roleCan('goalEdit', goal(id))) return toast('Only the goal owner may start a thread; invited participants may reply within it.');
    go('catchballnew');
    setTimeout(() => {
      let e = document.querySelector('[name="goal"]') as HTMLSelectElement | null;
      if (e && [...e.options].some(o => o.value === id)) e.value = id;
    }, 30);
  };

  // Nav click listeners
  // Run data migrations and setup
  migrateDemo();
  migrateAdvanced();
  cleanFalseCompleteness();
  catchballMigrate();
  syncGoalPerformance();
  syncBlockerLifecycle();

  document.querySelectorAll('aside .nav').forEach((n: any) => {
    n.onclick = () => go(n.dataset.route);
  });

  window.addEventListener('hashchange', render);
  render();
}
