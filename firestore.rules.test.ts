/**
 * Adversarial "Dirty Dozen" Firestore Security Rules Test Suite
 * Verifies SafeQMS Goal Management invariants against unauthorized reads/writes.
 */

import fs from 'fs';

// Note: Designed for @firebase/rules-unit-testing against local Firestore emulator.
export const dirtyDozenPayloads = [
  {
    name: '1. Unverified Admin Email Spoof',
    auth: { uid: 'spoof-uid', email: 'ibrahim.qallaki@gmail.com', email_verified: false },
    op: 'GET',
    path: '/users/victim-uid',
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '2. Shadow Field Injection on Goal Create',
    auth: { uid: 'director-uid', email: 'dir@safeqms.test', email_verified: true },
    op: 'CREATE',
    path: '/workspaces/ws-1/goals/G-999',
    data: {
      id: 'G-999',
      workspaceId: 'ws-1',
      ownerUid: 'director-uid',
      memberUids: ['director-uid'],
      title: 'Shadow Test',
      level: 'Department: Production',
      owner: 'Production Manager',
      year: '2027',
      status: 'Planned',
      approval: 'Draft',
      performance: 'Not measured',
      revision: 1,
      isVerifiedBySystem: true
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '3. Self-Role Escalation on Member Create',
    auth: { uid: 'new-user-uid', email: 'new@safeqms.test', email_verified: true },
    op: 'CREATE',
    path: '/workspaces/ws-1/members/new-user-uid',
    data: {
      uid: 'new-user-uid',
      workspaceId: 'ws-1',
      ownerUid: 'ws-owner-uid',
      memberUids: ['ws-owner-uid', 'new-user-uid'],
      displayName: 'New User',
      safeqmsRole: 'General director'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '4. Self-Role Promotion on Member Update',
    auth: { uid: 'basic-uid', email: 'basic@safeqms.test', email_verified: true },
    op: 'UPDATE',
    path: '/workspaces/ws-1/members/basic-uid',
    data: { safeqmsRole: 'Administratör' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '5. Auditor Write Bypass on Pulse Card',
    auth: { uid: 'auditor-uid', email: 'auditor@safeqms.test', email_verified: true },
    op: 'CREATE',
    path: '/workspaces/ws-1/pulseCards/PC-999',
    data: {
      id: 'PC-999',
      workspaceId: 'ws-1',
      ownerUid: 'auditor-uid',
      memberUids: ['auditor-uid'],
      title: 'Unauthorized edit',
      scope: 'Department: Production',
      routeType: 'Direct fix',
      owner: 'Auditor',
      status: 'Team action',
      comments: []
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '6. Basic User Formal Approval Tampering',
    auth: { uid: 'basic-uid', email: 'basic@safeqms.test', email_verified: true },
    op: 'UPDATE',
    path: '/workspaces/ws-1/approvals/AP-001',
    data: { status: 'Approved', approvedBy: 'Basic user' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '7. ID Poisoning / Invalid Key Pattern',
    auth: { uid: 'director-uid', email: 'dir@safeqms.test', email_verified: true },
    op: 'CREATE',
    path: `/workspaces/ws-1/goals/${'X'.repeat(160)}!@#`,
    data: { id: 'invalid' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '8. Forged Client Timestamp on Pulse Card Create',
    auth: { uid: 'basic-uid', email: 'basic@safeqms.test', email_verified: true },
    op: 'CREATE',
    path: '/workspaces/ws-1/pulseCards/PC-998',
    data: {
      id: 'PC-998',
      workspaceId: 'ws-1',
      ownerUid: 'basic-uid',
      memberUids: ['basic-uid'],
      title: 'Backdated card',
      scope: 'Department: Production',
      routeType: 'Direct fix',
      owner: 'Team Leader',
      status: 'Team action',
      comments: [],
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z'
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '9. Immutable OwnerUid Tampering',
    auth: { uid: 'director-uid', email: 'dir@safeqms.test', email_verified: true },
    op: 'UPDATE',
    path: '/workspaces/ws-1/goals/G-003',
    data: { ownerUid: 'hijack-uid' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '10. Blanket PII Read on /users/{victimUid}',
    auth: { uid: 'other-uid', email: 'other@safeqms.test', email_verified: true },
    op: 'GET',
    path: '/users/victim-uid',
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '11. Non-Member List Query Scrape',
    auth: { uid: 'outsider-uid', email: 'outsider@safeqms.test', email_verified: true },
    op: 'LIST',
    path: '/workspaces/ws-1/goals',
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '12. Terminal Approved Status Mutation',
    auth: { uid: 'director-uid', email: 'dir@safeqms.test', email_verified: true },
    op: 'UPDATE',
    path: '/workspaces/ws-1/approvals/AP-002',
    data: { status: 'Pending' },
    expected: 'PERMISSION_DENIED'
  }
];

export function verifyRulesFileExists(): boolean {
  return fs.existsSync('firestore.rules');
}
