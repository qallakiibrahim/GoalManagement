# SafeQMS Goal Management — Firestore Security Specification

## 1. Data Invariants
1. **Authentication & Email Verification**: Every read and write requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation**: `/users/{userId}` contains `email` and is readable/writable ONLY by the owning user (`request.auth.uid == userId`) or a verified bootstrapped admin. Shared workspace member rosters under `/workspaces/{workspaceId}/members/{memberId}` NEVER store `email` or personal contact info.
3. **No Self-Assigned Privileges**: A user registering `/workspaces/{workspaceId}/members/{memberId}` cannot set their `safeqmsRole` to anything other than `'Basic user'` unless they are a verified bootstrapped admin or workspace owner. Modifying another user's role or promoting oneself via `update` is strictly forbidden unless `isAdmin()` or workspace owner.
4. **Role-Enforced Operations**:
   - `Auditor` has read-only access across all workspace collections; all `create`/`update`/`delete` writes are denied.
   - Formal `GoalApproval` final decisions (`Approved` / `Changes requested`) and strategy `Approved` locking require `General director`, `QMS auditor`, or `Administratör` workspace membership (never `Basic user` or `Department director`).
   - Terminal approval records (`status == 'Approved'`) are locked against further non-admin mutations.
5. **Query Enforcer (Cost-Safe List Queries)**: Every `allow list` rule evaluates `request.auth.uid in resource.data.memberUids` or `resource.data.ownerUid == request.auth.uid` (no `get()` or `exists()` lookups inside `allow list`).
6. **Parent Existence & Relational Integrity**: Subcollection writes verify parent `/workspaces/{workspaceId}` exists (`exists(...)`) and validate that `incoming().workspaceId == workspaceId` and `isValidId()` passes on every path segment.
7. **Temporal Integrity**: `createdAt == request.time` on create; `createdAt == existing().createdAt` and `updatedAt == request.time` on update.
8. **Shadow-Field & Payload Bounds**: Every `create` enforces `keys().hasAll(...) && keys().hasOnly(...)` and every `update` enforces `affectedKeys().hasOnly(...)` plus strict string length checks and bounded arrays (`<= 50` / `<= 12`).

---

## 2. The "Dirty Dozen" Payloads (Adversarial Rejection Cases)

1. **Unverified Admin Email Spoof**: Signed-in user with `email: "ibrahim.qallaki@gmail.com"` and `email_verified: false` attempts to read `/users/other-uid` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Goal Create**: Authorized director creates a goal with extra ghost field `isVerifiedBySystem: true` -> `PERMISSION_DENIED` (`hasOnly` check rejects).
3. **Self-Role Escalation on Member Create**: Normal user creates `/workspaces/ws-1/members/{myUid}` with `safeqmsRole: "General director"` -> `PERMISSION_DENIED`.
4. **Self-Role Promotion on Member Update**: Normal `Basic user` updates their own `/workspaces/ws-1/members/{myUid}` document changing `safeqmsRole` to `"Administratör"` -> `PERMISSION_DENIED`.
5. **Auditor Write Bypass**: User with `safeqmsRole: "Auditor"` attempts to create or toggle a `PulseCard` or `SafetyCrossMonth` -> `PERMISSION_DENIED`.
6. **Basic User Formal Approval Tampering**: `Basic user` attempts to update `/workspaces/ws-1/approvals/AP-001` to `status: "Approved"` -> `PERMISSION_DENIED`.
7. **ID Poisoning / 1MB Junk Key**: Attacker attempts to `create` `/workspaces/ws-1/goals/{150-char-invalid-id!@#}` -> `PERMISSION_DENIED` (`isValidId` regex & size limit).
8. **Forged Client Timestamp**: User creates a `PulseCard` with backdated `createdAt: Timestamp(2020-01-01)` instead of server `request.time` -> `PERMISSION_DENIED`.
9. **Immutable Owner Tampering**: Non-admin member updates a `StrategicGoal` changing `ownerUid` or `createdAt` -> `PERMISSION_DENIED`.
10. **Blanket PII Scrape**: Authenticated non-owner user attempts `get` or `list` on `/users/{victimUid}` -> `PERMISSION_DENIED`.
11. **Non-Member List Scrape**: Signed-in user NOT present in `memberUids` attempts `list` on `/workspaces/ws-1/goals` -> `PERMISSION_DENIED`.
12. **Terminal Approval Mutation**: Non-admin user attempts to overwrite an already `Approved` `GoalApproval` back to `Pending` -> `PERMISSION_DENIED`.
