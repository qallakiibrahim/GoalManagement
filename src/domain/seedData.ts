import { toValidDocId } from '../lib/firebase';
import {
  CatchballThread,
  EscalatedBlocker,
  GoalApproval,
  Initiative,
  IsoStandard,
  KpiMetric,
  KpiOwnerLink,
  MatrixRelation,
  PdcaReview,
  ProjectA3,
  ProjectTask,
  PulseCard,
  SafetyCrossMonth,
  StrategicGoal,
  StrategyPlan,
  WorkspaceActivity,
  WorkspaceDoc,
  WorkspaceMember,
} from '../types/safeqms';

export const ISO_EXAMPLE_CATALOG: IsoStandard[] = [
  {
    id: 'safeqms-9001',
    code: 'ISO 9001',
    edition: 'Use edition configured in SafeQMS',
    requirements: [
      { id: 'req-9001-6.1', number: '6.1', title: 'Actions to address risks and opportunities' },
      { id: 'req-9001-6.2', number: '6.2', title: 'Quality objectives and planning to achieve them' },
      { id: 'req-9001-8.5', number: '8.5', title: 'Production and service provision' },
      { id: 'req-9001-9.1', number: '9.1', title: 'Monitoring, measurement, analysis and evaluation' },
      { id: 'req-9001-9.3', number: '9.3', title: 'Management review' },
    ],
  },
  {
    id: 'safeqms-14001',
    code: 'ISO 14001',
    edition: 'Use edition configured in SafeQMS',
    requirements: [
      { id: 'req-14001-6.1', number: '6.1', title: 'Actions to address risks and opportunities' },
      { id: 'req-14001-6.2', number: '6.2', title: 'Environmental objectives and planning to achieve them' },
      { id: 'req-14001-9.1', number: '9.1', title: 'Monitoring, measurement, analysis and evaluation' },
      { id: 'req-14001-9.3', number: '9.3', title: 'Management review' },
    ],
  },
  {
    id: 'safeqms-45001',
    code: 'ISO 45001',
    edition: 'Use edition configured in SafeQMS',
    requirements: [
      { id: 'req-45001-6.1', number: '6.1', title: 'Actions to address risks and opportunities' },
      { id: 'req-45001-6.2', number: '6.2', title: 'OH&S objectives and planning to achieve them' },
      { id: 'req-45001-9.1', number: '9.1', title: 'Monitoring, measurement, analysis and performance evaluation' },
      { id: 'req-45001-9.3', number: '9.3', title: 'Management review' },
    ],
  },
];

export interface SeedDataset {
  workspace: Omit<WorkspaceDoc, 'createdAt' | 'updatedAt'>;
  ownerMember: Omit<WorkspaceMember, 'createdAt' | 'updatedAt'>;
  plans: Array<Omit<StrategyPlan, 'createdAt' | 'updatedAt'>>;
  goals: Array<Omit<StrategicGoal, 'createdAt' | 'updatedAt'>>;
  kpis: Array<Omit<KpiMetric, 'createdAt' | 'updatedAt'>>;
  initiatives: Array<Omit<Initiative, 'createdAt' | 'updatedAt'>>;
  projects: Array<Omit<ProjectA3, 'createdAt' | 'updatedAt'>>;
  tasks: Array<Omit<ProjectTask, 'createdAt' | 'updatedAt'>>;
  relations: Array<Omit<MatrixRelation, 'createdAt' | 'updatedAt'>>;
  kpiOwners: Array<Omit<KpiOwnerLink, 'createdAt' | 'updatedAt'>>;
  pulseCards: Array<Omit<PulseCard, 'createdAt' | 'updatedAt'>>;
  safetyCross: Array<Omit<SafetyCrossMonth, 'createdAt' | 'updatedAt'>>;
  blockers: Array<Omit<EscalatedBlocker, 'createdAt' | 'updatedAt'>>;
  reviews: Array<Omit<PdcaReview, 'createdAt' | 'updatedAt'>>;
  catchballs: Array<Omit<CatchballThread, 'createdAt' | 'updatedAt'>>;
  approvals: Array<Omit<GoalApproval, 'createdAt' | 'updatedAt'>>;
  activities: Array<Omit<WorkspaceActivity, 'createdAt' | 'updatedAt'>>;
}

export function createSeedDataset(
  workspaceId: string,
  ownerUid: string,
  ownerDisplayName: string,
  workspaceName = 'SafeQMS · Nordic Operations',
  existingMemberUids?: string[]
): SeedDataset {
  const memberUids = existingMemberUids?.length ? [...new Set([ownerUid, ...existingMemberUids])] : [ownerUid];
  const base = { workspaceId, ownerUid, memberUids };
  const today = new Date().toISOString().slice(0, 10);

  const plans: SeedDataset['plans'] = [
    { ...base, id: 'PL-001', scope: 'Organization', period: '2027–2029', name: 'Group Strategy · Quality, Environment, Safety & Operational Excellence', status: 'Approved', revision: 1, owner: 'Executive Management' },
    { ...base, id: 'PL-002', scope: 'Site: Uppsala', period: '2027', name: 'Uppsala Site Annual Strategy', status: 'Approved', revision: 2, owner: 'Site Manager' },
    { ...base, id: 'PL-003', scope: 'Site: Falkenberg', period: '2027', name: 'Falkenberg Site Annual Strategy', status: 'Approved', revision: 1, owner: 'Site Manager' },
  ];

  const goals: SeedDataset['goals'] = [
    {
      ...base, id: 'G-001', title: 'Operational Excellence', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
      kpi: 'K-001', baseline: 68, target: 80, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 9001 · 6.2', description: 'Drive end-to-end manufacturing and operational excellence through standardized work, flow and total productive maintenance.',
      planWhat: 'Deploy group-wide operational excellence system across manufacturing sites.', resources: 'Executive leadership team, site managers, central OpEx steering group',
      planDue: '2029-12-31', evaluation: 'Quarterly management review and aggregated multi-site OEE tracking', isoRefs: ['req-9001-6.2'],
      riskRefs: 'RISK-OPS-01', processRefs: 'PR-MANUF-01', evidenceRefs: 'DOC-OPEX-2027', revision: 1,
    },
    {
      ...base, id: 'G-002', title: 'Increase OEE to 75%', level: 'Site: Uppsala', parent: 'G-001', owner: 'Site Manager', year: '2027',
      kpi: 'K-001', baseline: 68, target: 75, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 9001 · 6.2', description: 'Improve production availability, performance and quality on primary packaging and assembly lines.',
      planWhat: 'Deliver SMED changeover reduction pilot and TPM routines on packaging line 3.', resources: 'Production and Maintenance cross-functional improvement teams',
      planDue: '2027-12-31', evaluation: 'Monthly OEE review against agreed line targets in Bowling Chart', isoRefs: ['req-9001-6.2'],
      riskRefs: 'RISK-CAP-02', processRefs: 'PR-PROD-03', evidenceRefs: 'DOC-OEE-UPP', revision: 1,
    },
    {
      ...base, id: 'G-003', title: 'Reduce changeover losses by 30%', level: 'Department: Production', parent: 'G-002', owner: 'Production Manager', year: '2027',
      kpi: 'K-002', baseline: 60, target: 42, unit: 'min', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 9001 · 8.5', description: 'Reduce average changeover duration on Line 3 from 60 minutes to 42 minutes.',
      planWhat: 'Standardize tool carts, externalize pre-heating, and implement SMED checklist.', resources: 'Production operators, shift supervisors and process engineer (2h/wk)',
      planDue: '2027-10-31', evaluation: 'Shift handover changeover logs and weekly line pace tracking', isoRefs: ['req-9001-8.5'],
      riskRefs: 'RISK-CHG-01', processRefs: 'PR-PROD-02', evidenceRefs: 'DOC-SMED-01', revision: 1,
    },
    {
      ...base, id: 'G-004', title: 'Reduce unplanned downtime by 20%', level: 'Department: Maintenance', parent: 'G-002', owner: 'Maintenance Manager', year: '2027',
      kpi: 'K-003', baseline: 100, target: 80, unit: 'h', status: 'Active', approval: 'Approved', performance: 'On track',
      iso: 'ISO 9001 · 8.5', description: 'Improve asset reliability and prevent breakdown-induced stoppages.',
      planWhat: 'Deploy Autonomous Maintenance Step 1-3 and predictive vibration diagnostics.', resources: 'Maintenance technicians and line operator training hours',
      planDue: '2027-11-30', evaluation: 'CMMS work order analysis and monthly stop hour tracking', isoRefs: ['req-9001-8.5'],
      riskRefs: 'RISK-EQUIP-04', processRefs: 'PR-MAINT-01', evidenceRefs: 'DOC-TPM-04', revision: 1,
    },
    {
      ...base, id: 'G-005', title: 'Quality Excellence & Customer Trust', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
      kpi: 'K-004', baseline: 100, target: 70, unit: 'index', status: 'Active', approval: 'Approved', performance: 'On track',
      iso: 'ISO 9001 · 6.2', description: 'Achieve zero critical defects and reduce customer complaint index through robust quality gates.',
      planWhat: 'Implement group-wide Zero Defect culture, standardized Poka-Yoke and audit trails.', resources: 'Global Quality Director, site quality managers and validation engineers',
      planDue: '2029-12-31', evaluation: 'Monthly complaint trends, cost of poor quality and external audit findings', isoRefs: ['req-9001-6.2'],
      riskRefs: 'RISK-QUAL-01', processRefs: 'PR-QMS-01', evidenceRefs: 'DOC-QEX-2027', revision: 1,
    },
    {
      ...base, id: 'G-006', title: 'Reduce energy intensity by 15%', level: 'Site: Falkenberg', parent: 'G-009', owner: 'Site Manager', year: '2027',
      kpi: 'K-005', baseline: 100, target: 85, unit: 'kWh/unit index', status: 'Active', approval: 'Approved', performance: 'On track',
      iso: 'ISO 14001 · 6.2', description: 'Lower energy consumption per unit of production across all utility systems.',
      planWhat: 'Ultrasonic air leak detection, heat recovery integration and LED retrofitting.', resources: 'Falkenberg facility engineer and external energy audit consultants',
      planDue: '2027-12-31', evaluation: 'Sub-metered energy management system and quarterly utility bills', isoRefs: ['req-14001-6.2'],
      riskRefs: 'RISK-ENV-02', processRefs: 'PR-FAC-01', evidenceRefs: 'DOC-ENERGY-FAL', revision: 1,
    },
    {
      ...base, id: 'G-007', title: 'Improve safety action closure', level: 'Site: Uppsala', parent: 'G-008', owner: 'EHS Manager', year: '2027',
      kpi: 'K-006', baseline: 82, target: 95, unit: '%', status: 'Active', approval: 'Pending', performance: 'At risk',
      iso: 'ISO 45001 · 6.2', description: 'Close safety audit and near-miss corrective actions on time.',
      planWhat: 'Implement digital Gemba safety walks and daily visual safety huddles.', resources: 'EHS team and department safety representatives',
      planDue: '2027-12-31', evaluation: 'Weekly safety action tracker and monthly EHS committee review', isoRefs: ['req-45001-6.2'],
      riskRefs: 'RISK-OHS-03', processRefs: 'PR-EHS-01', evidenceRefs: 'DOC-SAF-UPP', revision: 1,
    },
    {
      ...base, id: 'G-008', title: 'Safety & Wellbeing First', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
      kpi: 'K-006', baseline: 82, target: 95, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 45001 · 6.2', description: 'Prevent work-related injury and ill health through measurable OH&S objectives and proactive culture.',
      planWhat: 'Deploy global proactive hazard identification and ergonomic standard work.', resources: 'Executive safety committee, site EHS directors and ergonomics consultants',
      planDue: '2029-12-31', evaluation: 'Lost time injury frequency rate and safety action closure percentage', isoRefs: ['req-45001-6.2'],
      riskRefs: 'RISK-OHS-01', processRefs: 'PR-EHS-01', evidenceRefs: 'DOC-OHS-GRP', revision: 1,
    },
    {
      ...base, id: 'G-009', title: 'Environmental Sustainability', level: 'Organization', parent: '', owner: 'Executive Management', year: '2027–2029',
      kpi: 'K-005', baseline: 100, target: 85, unit: 'index', status: 'Active', approval: 'Approved', performance: 'On track',
      iso: 'ISO 14001 · 6.2', description: 'Reduce environmental impact, greenhouse gas emissions and resource consumption.',
      planWhat: 'Transition group operations toward renewable power and zero waste-to-landfill.', resources: 'Sustainability steering group and site environmental officers',
      planDue: '2029-12-31', evaluation: 'Annual ESG audit and monthly resource consumption metrics', isoRefs: ['req-14001-6.2'],
      riskRefs: 'RISK-ENV-01', processRefs: 'PR-ENV-01', evidenceRefs: 'DOC-ESG-2027', revision: 1,
    },
    {
      ...base, id: 'G-010', title: 'First-Time-Right Yield >96%', level: 'Site: Uppsala', parent: 'G-005', owner: 'Quality Manager', year: '2027',
      kpi: 'K-007', baseline: 89, target: 96, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 9001 · 6.2', description: 'Increase direct production yield to 96% by preventing manufacturing defects and packaging misalignments.',
      planWhat: 'Integrate automated in-line inspection and workstation error-proofing.', resources: 'Site quality team, manufacturing engineers and vision system supplier',
      planDue: '2027-12-31', evaluation: 'Daily scrap reporting and weekly Statistical Process Control (SPC) runs', isoRefs: ['req-9001-6.2'],
      riskRefs: 'RISK-QUAL-02', processRefs: 'PR-QA-02', evidenceRefs: 'DOC-YIELD-UPP', revision: 1,
    },
    {
      ...base, id: 'G-011', title: 'Packaging Throughput & Reliability', level: 'Site: Falkenberg', parent: 'G-001', owner: 'Site Manager', year: '2027',
      kpi: 'K-001', baseline: 65, target: 74, unit: '%', status: 'Active', approval: 'Approved', performance: 'On track',
      iso: 'ISO 9001 · 6.2', description: 'Stabilize high-speed carton packing line output and reduce bottle-filler jams.',
      planWhat: 'Adopt autonomous maintenance checklists and standardized conveyor speeds.', resources: 'Falkenberg line leads and maintenance team',
      planDue: '2027-12-31', evaluation: 'Monthly site OEE calculation and throughput reports', isoRefs: ['req-9001-6.2'],
      riskRefs: 'RISK-OPS-03', processRefs: 'PR-PROD-FAL', evidenceRefs: 'DOC-FAL-TPM', revision: 1,
    },
    {
      ...base, id: 'G-012', title: 'Eliminate Line 2 Micro-stops', level: 'Department: Production', parent: 'G-002', owner: 'Production Manager', year: '2027',
      kpi: 'K-003', baseline: 45, target: 18, unit: 'stops/wk', status: 'Active', approval: 'Approved', performance: 'On track',
      iso: 'ISO 9001 · 8.5', description: 'Eliminate short recurring sensor trips and packaging feeder jams under 5 minutes.',
      planWhat: 'Implement sensor cleaning standard work and guide rail centerlining.', resources: 'Line 2 production shift teams and tooling specialists',
      planDue: '2027-11-30', evaluation: 'SCADA micro-stop frequency logs and daily production huddle review', isoRefs: ['req-9001-8.5'],
      riskRefs: 'RISK-STOP-01', processRefs: 'PR-PROD-02', evidenceRefs: 'DOC-MSTOP-01', revision: 1,
    },
    {
      ...base, id: 'G-013', title: 'In-Line Quality Gates & Verification', level: 'Department: Quality', parent: 'G-010', owner: 'Quality Manager', year: '2027',
      kpi: 'K-007', baseline: 91, target: 97, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 9001 · 8.5', description: 'Prevent defective product escapes by deploying standardized optical verification at critical stations.',
      planWhat: 'Install vision camera verification for barcode, cap torque and seal integrity.', resources: 'Quality engineers and automation technicians',
      planDue: '2027-12-15', evaluation: 'Verification test records and zero customer escape audit results', isoRefs: ['req-9001-8.5'],
      riskRefs: 'RISK-DEF-02', processRefs: 'PR-QA-03', evidenceRefs: 'DOC-QGATE-01', revision: 1,
    },
    {
      ...base, id: 'G-014', title: 'Proactive Hazard & Near-Miss Resolution', level: 'Department: Maintenance', parent: 'G-007', owner: 'Safety Coordinator', year: '2027',
      kpi: 'K-008', baseline: 75, target: 95, unit: '%', status: 'Active', approval: 'Approved', performance: 'At risk',
      iso: 'ISO 45001 · 6.2', description: 'Ensure all recorded near-misses and safety concerns are addressed within 7 days.',
      planWhat: 'Deploy QR-code hazard reporting on machinery and conduct weekly safety audits.', resources: 'Maintenance safety representative and shopfloor technicians',
      planDue: '2027-12-31', evaluation: 'Weekly ticket closure reports and safety representative minutes', isoRefs: ['req-45001-6.2'],
      riskRefs: 'RISK-HAZ-01', processRefs: 'PR-EHS-02', evidenceRefs: 'DOC-HAZ-01', revision: 1,
    },
  ];

  const kpis: SeedDataset['kpis'] = [
    { ...base, id: 'K-001', name: 'Overall Equipment Effectiveness', unit: '%', direction: 'higher', tolerance: 2, values: [68, 69, 70, 71, 70, 72, 73], targets: [69, 70, 71, 72, 73, 74, 75, 75, 75, 75, 75, 75], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-002', name: 'Average changeover time', unit: 'min', direction: 'lower', tolerance: 3, values: [60, 58, 55, 54, 53, 51, 49], targets: [58, 56, 53, 50, 48, 45, 42, 42, 42, 42, 42, 42], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-003', name: 'Unplanned downtime', unit: 'h', direction: 'lower', tolerance: 5, values: [100, 95, 93, 91, 89, 85, 82], targets: [98, 95, 92, 89, 86, 83, 80, 80, 80, 80, 80, 80], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-004', name: 'Customer complaint index', unit: 'index', direction: 'lower', tolerance: 5, values: [100, 96, 93, 90, 85, 80, 76], targets: [98, 95, 90, 85, 80, 75, 70, 70, 70, 70, 70, 70], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-005', name: 'Energy intensity index', unit: 'index', direction: 'lower', tolerance: 4, values: [100, 98, 96, 94, 93, 90, 88], targets: [98, 96, 94, 92, 90, 87, 85, 85, 85, 85, 85, 85], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-006', name: 'Safety action closure on time', unit: '%', direction: 'higher', tolerance: 3, values: [82, 84, 85, 86, 88, 90, 91], targets: [85, 87, 89, 91, 92, 94, 95, 95, 95, 95, 95, 95], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-007', name: 'First-Time-Right Yield', unit: '%', direction: 'higher', tolerance: 2, values: [89, 90, 91, 92, 93, 94, 95], targets: [90, 91, 92, 93, 94, 95, 96, 96, 96, 96, 96, 96], source: 'Demo / manually entered', sourceUpdated: '' },
    { ...base, id: 'K-008', name: 'Near-miss closure within 7 days', unit: '%', direction: 'higher', tolerance: 3, values: [75, 78, 82, 85, 87, 91, 92], targets: [80, 83, 86, 89, 91, 93, 95, 95, 95, 95, 95, 95], source: 'Demo / manually entered', sourceUpdated: '' },
  ];

  const initiatives: SeedDataset['initiatives'] = [
    { ...base, id: 'I-001', title: 'SMED Programme & Setup Reduction', owner: 'Production Manager', goal: 'G-003', status: 'At risk', progress: 65, budget: '€25,000', description: 'Standardize tooling carts, externalize setup tasks and implement single-minute exchange of dies.', sqdc: { S: 1, Q: 1, D: 2, C: 2 }, valueStream: 'Line 3 Packaging Stream · TOC Bottleneck #1 (Capacity)', isBottleneck: true },
    { ...base, id: 'I-002', title: 'TPM Autonomous Maintenance Rollout', owner: 'Maintenance Manager', goal: 'G-004', status: 'On track', progress: 78, budget: '€40,000', description: 'Operator care routines, predictive vibration sensors, and planned maintenance cycles.', sqdc: { S: 1, Q: 1, D: 2, C: 2 }, valueStream: 'Uppsala Packing & Assembly · Uptime Bottleneck', isBottleneck: true },
    { ...base, id: 'I-003', title: 'Energy & Compressed Air Optimization', owner: 'Site Manager', goal: 'G-006', status: 'Planned', progress: 20, budget: '€15,000', description: 'Ultrasonic air leak surveys, compressor heat recovery and sub-metering.', sqdc: { S: 0, Q: 0, D: 0, C: 2 }, valueStream: 'Falkenberg Utilities · Non-Bottleneck ESG/Cost', isBottleneck: false },
    { ...base, id: 'I-004', title: 'Quality Gate Standardization & Poka-Yoke', owner: 'Quality Manager', goal: 'G-010', status: 'On track', progress: 55, budget: '€18,000', description: 'Mistake-proofing fixtures, digital defect capture and standardized verification gates.', sqdc: { S: 0, Q: 2, D: 1, C: 2 }, valueStream: 'Uppsala Final Pack · Rework & Scrap Gate', isBottleneck: true },
    { ...base, id: 'I-005', title: 'Digital Standard Work & Line Balancing', owner: 'Production Manager', goal: 'G-012', status: 'Planned', progress: 30, budget: '€12,000', description: 'Visual standard work tablet guides, cycle time harmonization and micro-stop logging.', sqdc: { S: 1, Q: 1, D: 2, C: 1 }, valueStream: 'Line 2 Packaging · Cycle-Time Pacing', isBottleneck: false },
    { ...base, id: 'I-006', title: 'Safety Leadership & Daily Gemba Walks', owner: 'EHS Manager', goal: 'G-014', status: 'On track', progress: 70, budget: '€8,000', description: 'Management Gemba walks, instant hazard flagging via QR codes and quick corrective action.', sqdc: { S: 2, Q: 0, D: 0, C: 1 }, valueStream: 'Site-wide Shopfloor · Mandatory Safety Priority', isBottleneck: false },
    { ...base, id: 'I-007', title: 'Automated Vision Inspection System Pilot', owner: 'Quality Manager', goal: 'G-013', status: 'At risk', progress: 40, budget: '€35,000', description: 'High-speed camera inspection for label alignment, seal integrity and packaging defect rejection.', sqdc: { S: 0, Q: 2, D: 1, C: 2 }, valueStream: 'Line 1 Exit Gate · Customer Escape Constraint', isBottleneck: true },
  ];

  const projects: SeedDataset['projects'] = [
    {
      ...base, id: 'P-001', title: 'Line 3 Changeover Reduction', initiative: 'I-001', owner: 'Project Leader', status: 'At risk', progress: 72,
      escalationTier: 'Full A3',
      problem: 'Average changeover takes 60 minutes and varies significantly between shifts.',
      current: '60 minutes', target: '42 minutes',
      root: 'Tools are not pre-staged; internal and external steps are mixed; heating elements wait for line stop.',
      fiveWhys: [
        { level: 1, question: 'Why does changeover average 60 min instead of 42 min?', answer: 'Operators leave Line 3 to search for tooling and wait for sealing jaws to heat up.' },
        { level: 2, question: 'Why do operators search for tooling during line stop?', answer: 'Changeover tools are shared across Lines 2 and 3 without dedicated point-of-use kitting.' },
        { level: 3, question: 'Why are internal & external pre-heating tasks mixed?', answer: 'No pre-staging standard work or mobile pre-heating cradle exists prior to batch end.' },
      ],
      counter: 'Externalize preparation, standardize tool carts, trial pre-heated nozzles and new sequence.',
      learning: 'Standard work to be verified after pilot and rolled out to shift B and C.',
    },
    {
      ...base, id: 'P-002', title: 'Autonomous Maintenance Pilot', initiative: 'I-002', owner: 'Maintenance Engineer', status: 'On track', progress: 78,
      escalationTier: '5-Why',
      problem: 'Minor stops and recurring conveyor jams reduce line availability.',
      current: '100 h downtime / month', target: '80 h downtime / month',
      root: 'Insufficient basic equipment care and irregular lubrication cycles.',
      fiveWhys: [
        { level: 1, question: 'Why do recurring conveyor jams stop packaging flow?', answer: 'Guide rail bearings seize from missed lubrication intervals.' },
        { level: 2, question: 'Why are lubrication intervals missed on Shift B/C?', answer: 'Visual lubrication checkpoints and 10-minute operator clean-to-inspect routines are not standardized.' },
      ],
      counter: 'Train operators on visual standards, introduce 10-minute shift start inspection routines.',
      learning: 'Operators detected two bearing failures before line stoppage during week 24.',
    },
    {
      ...base, id: 'P-003', title: 'Automated Vision Inspection Pilot', initiative: 'I-007', owner: 'Vision Specialist', status: 'At risk', progress: 40,
      escalationTier: 'Full A3',
      problem: 'Manual inspection misses 1 in 2,000 label skew defects, triggering customer sorting requests.',
      current: '95% first-time-right yield on line 1 packaging', target: '97% first-time-right yield with zero escapes',
      root: 'High conveyor velocity and operator visual fatigue during extended packaging batches.',
      fiveWhys: [
        { level: 1, question: 'Why do skewed labels reach finished carton cases?', answer: 'Manual visual sampling catches only major runs at 180 packs/min.' },
        { level: 2, question: 'Why did the optical prototype flag false rejects on glossy film?', answer: 'Overhead LED glare reflects directly into camera optics without polarizing filters.' },
      ],
      counter: 'Install high-speed strobe cameras with optical character verification (OCV) at exit gate.',
      learning: 'Lighting reflection requires polarizing filter to prevent false rejection of glossy packaging.',
    },
    {
      ...base, id: 'P-004', title: 'Safety Hazard Elimination & Ergonomics', initiative: 'I-006', owner: 'Safety Coordinator', status: 'On track', progress: 70,
      escalationTier: 'Direct Fix',
      problem: 'Repetitive lifting of heavy dye plates creates ergonomic strain and near-miss hazard.',
      current: '75% near-miss closure within 7 days', target: '95% near-miss closure within 7 days',
      root: 'Manual tool staging requires awkward bending and lifting.',
      fiveWhys: [],
      counter: 'Install pneumatic spring balancer lift assist and rolling scissor cart.',
      learning: 'Ergonomic score improved by 40%; operator satisfaction high.',
    },
  ];

  const tasks: SeedDataset['tasks'] = [
    { ...base, id: 'T-001', project: 'P-001', title: 'Film current changeover on Line 3', owner: 'Process Engineer', due: '2027-02-10', status: 'Done' },
    { ...base, id: 'T-002', project: 'P-001', title: 'Separate internal and external tasks', owner: 'Production Engineer', due: '2027-03-15', status: 'Done' },
    { ...base, id: 'T-003', project: 'P-001', title: 'Pilot new standardized tool cart', owner: 'Team Leader', due: '2027-07-20', status: 'In progress' },
    { ...base, id: 'T-004', project: 'P-001', title: 'Verify sustained OEE improvement', owner: 'OpEx Manager', due: '2027-09-15', status: 'Open' },
    { ...base, id: 'T-005', project: 'P-002', title: 'Clean to inspect routine definitions', owner: 'Maintenance Engineer', due: '2027-03-01', status: 'Done' },
    { ...base, id: 'T-006', project: 'P-002', title: 'Operator lubrication training', owner: 'Maintenance Technician', due: '2027-05-10', status: 'Done' },
    { ...base, id: 'T-007', project: 'P-002', title: 'Install visual pressure and vibration tags', owner: 'Maintenance Engineer', due: '2027-08-15', status: 'In progress' },
    { ...base, id: 'T-008', project: 'P-002', title: 'Evaluate downtime reduction vs baseline', owner: 'Maintenance Manager', due: '2027-11-01', status: 'Open' },
    { ...base, id: 'T-009', project: 'P-003', title: 'Camera mounting bracket installation', owner: 'Automation Tech', due: '2027-06-15', status: 'Done' },
    { ...base, id: 'T-010', project: 'P-003', title: 'Configure optical verification thresholds', owner: 'Vision Specialist', due: '2027-08-30', status: 'In progress' },
    { ...base, id: 'T-011', project: 'P-003', title: 'Integrate automated reject diverter arm', owner: 'Automation Tech', due: '2027-10-15', status: 'Open' },
    { ...base, id: 'T-012', project: 'P-003', title: 'Statistical validation run (100k units)', owner: 'Quality Engineer', due: '2027-11-30', status: 'Open' },
    { ...base, id: 'T-013', project: 'P-004', title: 'Procure pneumatic lift assist arm', owner: 'Safety Coordinator', due: '2027-04-10', status: 'Done' },
    { ...base, id: 'T-014', project: 'P-004', title: 'Install scissor cart at die change area', owner: 'Maintenance Tech', due: '2027-05-20', status: 'Done' },
    { ...base, id: 'T-015', project: 'P-004', title: 'Conduct weekly gemba safety walk', owner: 'EHS Manager', due: '2027-07-25', status: 'In progress' },
    { ...base, id: 'T-016', project: 'P-004', title: 'Audit 7-day near-miss ticket resolution', owner: 'Safety Coordinator', due: '2027-09-30', status: 'Open' },
  ];

  const rawRelations: Array<[string, string, number, string]> = [
    ['G-002', 'I-001', 2, 'SMED directly drives Uppsala site OEE increase'],
    ['G-002', 'I-002', 2, 'TPM downtime reduction elevates line availability'],
    ['G-002', 'I-005', 1, 'Standard work stabilizes line rate'],
    ['G-003', 'I-001', 2, 'Primary initiative for 30% changeover reduction'],
    ['G-004', 'I-002', 2, 'Preventive maintenance reduces downtime'],
    ['G-006', 'I-003', 2, 'Energy efficiency project at Falkenberg'],
    ['G-007', 'I-006', 2, 'Gemba safety walks accelerate closure'],
    ['G-010', 'I-004', 2, 'Poka-yoke directly improves first-time-right yield'],
    ['G-010', 'I-007', 2, 'Vision inspection detects defects early'],
    ['G-011', 'I-002', 1, 'Cross-site TPM knowledge sharing'],
    ['G-012', 'I-005', 2, 'Standard work eliminates micro-stops'],
    ['G-012', 'I-001', 0.5, 'Tool changes occasionally introduce micro-stops'],
    ['G-013', 'I-007', 2, 'Automated gates prevent escapes'],
    ['G-014', 'I-006', 2, 'Gemba walks resolve near misses'],
    ['I-001', 'K-001', 2, 'Changeover reduction frees line capacity'],
    ['I-001', 'K-002', 2, 'Primary metric for changeover speed'],
    ['I-002', 'K-001', 2, 'Increased uptime lifts OEE'],
    ['I-002', 'K-003', 2, 'Direct reduction of unplanned stop hours'],
    ['I-003', 'K-005', 2, 'Energy savings reduce intensity index'],
    ['I-004', 'K-004', 2, 'Defect reduction lowers customer complaints'],
    ['I-004', 'K-007', 2, 'Mistake proofing increases first time yield'],
    ['I-005', 'K-001', 1, 'Standard work improves line rate'],
    ['I-005', 'K-003', 1, 'Micro-stop reduction saves operating hours'],
    ['I-006', 'K-006', 2, 'Management presence accelerates safety actions'],
    ['I-006', 'K-008', 2, 'Directly tracks 7-day near-miss closure'],
    ['I-007', 'K-004', 2, 'Vision inspection halts defective batches'],
    ['I-007', 'K-007', 2, 'Instant defect detection boosts yield'],
  ];

  const relations: SeedDataset['relations'] = rawRelations.map(([from, to, strength, note]) => ({
    ...base,
    id: toValidDocId(`${from}__${to}`),
    from,
    to,
    strength,
    note,
  }));

  const rawKpiOwners: Array<[string, string, number, string]> = [
    ['K-001', 'Site Manager', 2, 'Primary accountable owner for overall Uppsala & Falkenberg OEE delivery'],
    ['K-001', 'Production Manager', 1, 'Cross-functional support via changeover speed and shift pacing'],
    ['K-001', 'Maintenance Manager', 1, 'Cross-functional support via equipment availability & TPM'],
    ['K-001', 'Executive Management', 1, 'Executive sponsor for group-wide OEE benchmark'],
    ['K-002', 'Production Manager', 2, 'Primary owner for SMED setup standardization'],
    ['K-002', 'Maintenance Manager', 1, 'Supports quick-release tooling and pre-heating readiness'],
    ['K-002', 'Quality Manager', 1, 'Supports fast first-piece release verification'],
    ['K-003', 'Maintenance Manager', 2, 'Primary owner for breakdown reduction & predictive maintenance'],
    ['K-003', 'Production Manager', 1, 'Autonomous operator clean-to-inspect routines'],
    ['K-004', 'Quality Manager', 2, 'Primary owner for customer complaint prevention'],
    ['K-004', 'Production Manager', 1, 'In-station Poka-Yoke execution'],
    ['K-004', 'Executive Management', 1, 'Strategic sponsor for Customer Trust pillar'],
    ['K-005', 'Site Manager', 2, 'Primary owner for site energy intensity target'],
    ['K-005', 'Maintenance Manager', 1, 'Air leak repair and utility heat recovery execution'],
    ['K-006', 'EHS Manager', 2, 'Primary owner for safety closure cadence'],
    ['K-006', 'Site Manager', 1, 'Weekly Gemba walk accountability across departments'],
    ['K-006', 'Maintenance Manager', 1, 'Technical hazard safeguarding engineering'],
    ['K-007', 'Quality Manager', 2, 'Primary owner for First-Time-Right yield & vision gates'],
    ['K-007', 'Production Manager', 1, 'Standard work adherence on packaging lines'],
    ['K-008', 'EHS Manager', 2, 'Primary owner for 7-day near-miss resolution'],
    ['K-008', 'Maintenance Manager', 1, 'Supports mechanical/ergonomic hazard remediation'],
    ['K-008', 'Safety Coordinator', 1, 'Shopfloor hazard & 7-day near-miss follow-up coordinator'],
  ];

  const kpiOwners: SeedDataset['kpiOwners'] = rawKpiOwners.map(([kpi, owner, strength, note]) => ({
    ...base,
    id: toValidDocId(`${kpi}__${owner}`),
    kpi,
    owner,
    strength,
    note,
  }));

  const pulseCards: SeedDataset['pulseCards'] = [
    { ...base, id: 'PC-001', title: 'Line 3 pre-heating electrical delay on Shift B changeover', details: 'Pre-heater zone 2 trips thermal relay during rapid format switchovers, adding ~14 min downtime per batch.', due: '2027-07-18', scope: 'Department: Production', routeType: 'Escalate', owner: 'Team Leader', kpi: 'K-002', initiative: 'I-001', project: 'P-001', blockerId: 'BL-001', status: 'Escalated', createdDate: '2027-07-02', comments: [{ by: 'Team Leader', at: '2027-07-02', text: 'Occurred twice on Shift B. Needs electrical maintenance support & relay spare review.' }] },
    { ...base, id: 'PC-002', title: 'Set up 5S shadow board for changeover wrenches at Line 3', details: 'Operators lose 4-6 min searching for torque wrench #14 during die swaps. Shadow board next to HMI solves this directly.', due: '2027-07-20', scope: 'Department: Production', routeType: 'Direct fix', owner: 'Team Leader', kpi: 'K-002', initiative: 'I-001', project: 'P-001', blockerId: '', status: 'Team action', createdDate: '2027-07-10', comments: [{ by: 'Team Leader', at: '2027-07-10', text: 'Foam insert ordered; mounting planned at Friday 5S slot.' }] },
    { ...base, id: 'PC-003', title: 'Recurring glossy label glare causing false vision rejects', details: 'Overhead LED reflection on batch film triggers false camera reject alarms (~3.2% micro-stops on Line 1).', due: '2027-07-25', scope: 'Department: Quality', routeType: 'A3', owner: 'Quality Manager', kpi: 'K-007', initiative: 'I-007', project: 'P-003', blockerId: 'BL-002', status: 'Escalated', createdDate: '2027-07-05', comments: [{ by: 'Quality Manager', at: '2027-07-06', text: 'Linked to Vision Pilot P-003; awaiting polarizing lens quote.' }] },
    { ...base, id: 'PC-004', title: 'Install QR hazard placard on hydraulic press guard', details: 'Quick-scan QR code linking straight to LOTO lockout checklist at press station.', due: '2027-06-30', scope: 'Department: Maintenance', routeType: 'Direct fix', owner: 'Safety Coordinator', kpi: 'K-008', initiative: 'I-006', project: 'P-004', blockerId: '', status: 'Done', createdDate: '2027-06-22', comments: [{ by: 'Safety Coordinator', at: '2027-06-28', text: 'Placard laminated, mounted, and verified during morning Gemba walk.' }] },
  ];

  const defaultDaysJuly = { '1': 'green', '2': 'green', '3': 'green', '4': 'amber', '5': 'green', '6': 'green', '7': 'green', '8': 'green', '9': 'red', '10': 'green', '11': 'green', '12': 'amber', '13': 'green', '14': 'green', '15': 'green' } as const;
  const defaultDaysJune = { '1': 'green', '2': 'green', '3': 'green', '4': 'green', '5': 'green', '6': 'amber', '7': 'green', '8': 'green', '9': 'green', '10': 'green', '11': 'green', '12': 'green', '13': 'green', '14': 'green', '15': 'green', '16': 'green', '17': 'amber', '18': 'green', '19': 'green', '20': 'green', '21': 'green', '22': 'green', '23': 'green', '24': 'green', '25': 'green', '26': 'green', '27': 'green', '28': 'green', '29': 'green', '30': 'green' } as const;

  const safetyCross: SeedDataset['safetyCross'] = [
    { ...base, id: toValidDocId('Department: Production__2027-07'), scope: 'Department: Production', month: '2027-07', days: { ...defaultDaysJuly } },
    { ...base, id: toValidDocId('Site: Uppsala__2027-07'), scope: 'Site: Uppsala', month: '2027-07', days: { ...defaultDaysJuly } },
    { ...base, id: toValidDocId('Organization__2027-07'), scope: 'Organization', month: '2027-07', days: { ...defaultDaysJuly } },
    { ...base, id: toValidDocId('Department: Production__2027-06'), scope: 'Department: Production', month: '2027-06', days: { ...defaultDaysJune } },
    { ...base, id: toValidDocId('Site: Uppsala__2027-06'), scope: 'Site: Uppsala', month: '2027-06', days: { ...defaultDaysJune } },
  ];

  const blockers: SeedDataset['blockers'] = [
    { ...base, id: 'BL-001', targetType: 'initiative', targetId: 'I-001', scope: 'Department: Production', category: 'Resource', severity: 'High', summary: 'Lack of dedicated 2nd-shift electrical technician delays SMED pre-heating pilot on Line 3.', neededAction: 'Authorize 4 hrs/week cross-shift maintenance support or external contractor coverage.', owner: 'Production Manager', raisedBy: 'Department director', raisedAt: '2027-07-02', status: 'Open', source: 'Manual' },
    { ...base, id: 'BL-002', targetType: 'initiative', targetId: 'I-007', scope: 'Department: Quality', category: 'Budget', severity: 'Critical', summary: 'Polarizing strobe filter kit requires €4,200 capex variance due to glossy packaging glare.', neededAction: 'Approve €4,200 pilot budget delta so optical validation run can complete on schedule.', owner: 'Quality Manager', raisedBy: 'Quality Manager', raisedAt: '2027-07-05', status: 'Open', source: 'Manual' },
    { ...base, id: 'BL-003', targetType: 'kpi', targetId: 'K-001', scope: 'Site: Uppsala', category: 'Cross-functional', severity: 'Medium', summary: 'Conveyor centerline speed drift between Shift A and Shift B causes recurring OEE micro-stops.', neededAction: 'Enforce joint Production + Maintenance standard centerline sign-off at shift handover.', owner: 'Site Manager', raisedBy: 'Site Manager', raisedAt: '2027-06-28', status: 'In review', reviewId: 'R-001', decisionIndex: 2, source: 'Manual' },
  ];

  const reviews: SeedDataset['reviews'] = [
    {
      ...base, id: 'R-001', title: 'Site Strategy Review – June', date: '2027-06-30', scope: 'Site: Uppsala',
      notes: 'OEE remains below target. Prioritize changeover pilot and vision inspection.',
      decisions: [
        { text: 'Accelerate SMED pilot on Line 3', owner: 'Production Manager', due: '2027-07-20', status: 'Open', linkedType: 'initiative', linkedId: 'I-001' },
        { text: 'Complete camera calibration for packaging', owner: 'Quality Manager', due: '2027-08-15', status: 'Open', linkedType: 'initiative', linkedId: 'I-007' },
        { text: 'Enforce joint Production & Maintenance centerline audit across shifts A/B/C', owner: 'Site Manager', due: '2027-07-25', status: 'Open', blockerId: 'BL-003', linkedType: 'kpi', linkedId: 'K-001' },
      ],
    },
    {
      ...base, id: 'R-002', title: 'Q2 Group Operations Review', date: '2027-07-15', scope: 'Organization',
      notes: 'Quality customer index improving ahead of pace. Energy intensity on track.',
      decisions: [{ text: 'Standardize autonomous maintenance across Falkenberg', owner: 'Maintenance Manager', due: '2027-09-30', status: 'Open', linkedType: 'initiative', linkedId: 'I-002' }],
    },
  ];

  const catchballs: SeedDataset['catchballs'] = [
    {
      ...base, id: 'CB-001', goal: 'G-003', status: 'Awaiting director', recipientScope: 'Department: Production', recipientRole: 'General director',
      createdDate: '2027-01-15', updatedDate: '2027-01-17', origin: 'Department director', turn: 'General director',
      proposal: { target: 42, resources: 'Production engineering support · 2 hours/week per team', due: '2027-12-31', reason: 'Reduce average changeover duration from 60 to 42 minutes using SMED.' },
      messages: [
        { id: 'M-001', at: '2027-01-15', by: 'Department director', kind: 'Proposal', text: 'Propose a 30% reduction in changeover time. We need production engineering support and time for trials.', target: 42, resources: 'Production engineering support · 2 hours/week per team' },
        { id: 'M-002', at: '2027-01-17', by: 'Department director', kind: 'Comment', text: 'Current method analysis and baseline evidence will be attached before final approval.' },
      ],
    },
    {
      ...base, id: 'CB-002', goal: 'G-002', status: 'Awaiting department', recipientScope: 'Department: Production', recipientRole: 'Department director',
      createdDate: '2027-01-08', updatedDate: '2027-01-11', origin: 'General director', turn: 'Department director',
      proposal: { target: 75, resources: 'Site OpEx coordination and monthly performance review', due: '2027-12-31', reason: 'Annual site ambition linked to the group Operational Excellence strategy.' },
      messages: [
        { id: 'M-003', at: '2027-01-08', by: 'General director', kind: 'Proposal', text: 'Annual target proposed for Uppsala site, subject to confirmed resources.', target: 75, resources: 'Site OpEx coordination and monthly performance review' },
        { id: 'M-004', at: '2027-01-11', by: 'General director', kind: 'Comment', text: 'Please review this site-level OEE objective and respond with departmental resources or a counterproposal.' },
      ],
    },
    {
      ...base, id: 'CB-003', goal: 'G-010', status: 'Aligned', recipientScope: 'Department: Quality', recipientRole: 'General director',
      createdDate: '2027-01-20', updatedDate: '2027-02-04', origin: 'Department director',
      proposal: { target: 96, resources: 'Quality inspection engineering + in-line vision pilot funding', due: '2027-12-31', reason: 'Raise first-time-right yield to 96% and eliminate customer complaints.' },
      messages: [
        { id: 'M-005', at: '2027-01-20', by: 'Department director', kind: 'Proposal', text: 'Target 96% First-Time-Right yield proposed for Uppsala with vision pilot.', target: 96, resources: 'Quality inspection engineering + in-line vision pilot funding' },
        { id: 'M-006', at: '2027-02-04', by: 'General director', kind: 'Agreement', text: 'Strategic alignment agreed. Poka-yoke and vision resources endorsed.' },
      ],
    },
  ];

  const approvals: SeedDataset['approvals'] = [
    { ...base, id: 'AP-001', goal: 'G-007', requester: 'EHS Manager', approver: 'General director / QMS auditor', status: 'Pending', comment: 'Review proposed target and resource allocation.', date: '2027-01-12' },
    { ...base, id: 'AP-002', goal: 'G-010', requester: 'Quality Manager', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Target aligns with ISO 9001 customer quality strategy.', date: '2027-02-05' },
    { ...base, id: 'AP-003', goal: 'G-002', requester: 'Site Manager', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Uppsala site OEE plan approved with SMED and TPM resources.', date: '2027-01-18' },
    { ...base, id: 'AP-004', goal: 'G-001', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Group Operational Excellence strategy approved.', date: '2027-01-10' },
    { ...base, id: 'AP-005', goal: 'G-005', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Customer Trust & Quality pillar approved.', date: '2027-01-10' },
    { ...base, id: 'AP-006', goal: 'G-008', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Safety & Wellbeing pillar approved.', date: '2027-01-10' },
    { ...base, id: 'AP-007', goal: 'G-009', requester: 'Executive Management', approver: 'General director', approvedBy: 'General director', status: 'Approved', comment: 'Sustainability pillar approved.', date: '2027-01-10' },
  ];

  const activities: SeedDataset['activities'] = [
    { ...base, id: 'ACT-HIST-001', kind: 'history', payload: { time: '2027-01-10', text: 'Organization strategy approved (rev 1)' } },
    { ...base, id: 'ACT-HIST-002', kind: 'history', payload: { time: '2027-01-18', text: 'Uppsala site annual goals approved' } },
    { ...base, id: 'ACT-HIST-003', kind: 'history', payload: { time: '2027-02-05', text: 'First-Time-Right Yield goal approved' } },
    { ...base, id: 'ACT-HIST-004', kind: 'history', payload: { time: '2027-06-30', text: 'Mid-year strategy review recorded' } },
    { ...base, id: 'ACT-CBN-001', kind: 'cbNotification', read: false, payload: { id: 'N-001', recipient: 'General director', catchballId: 'CB-001', text: 'Production changeover proposal needs your response', at: '2027-01-17' } },
    { ...base, id: 'ACT-CBN-002', kind: 'cbNotification', read: false, payload: { id: 'N-002', recipient: 'Department director', catchballId: 'CB-002', text: 'General director requests your response on Increase OEE to 75%', at: today } },
  ];

  return {
    workspace: {
      id: workspaceId,
      name: workspaceName,
      ownerUid,
      memberUids,
      scope: 'Site: Uppsala',
      year: '2027',
      isoCatalogSource: 'SafeQMS ISO Standards Registry (Synced)',
      isoStandards: ISO_EXAMPLE_CATALOG,
    },
    ownerMember: {
      ...base,
      uid: ownerUid,
      displayName: ownerDisplayName || 'Administrator',
      safeqmsRole: 'Administratör',
      assignedSite: 'Site: Uppsala',
      assignedDepartment: 'Department: Production',
    },
    plans,
    goals,
    kpis,
    initiatives,
    projects,
    tasks,
    relations,
    kpiOwners,
    pulseCards,
    safetyCross,
    blockers,
    reviews,
    catchballs,
    approvals,
    activities,
  };
}
