# SafeQMS Goal Management v5.4 — X-Matrix integration handoff

## What changed

This is a **frontend-only, self-contained interactive HTML demonstration** based directly on the user-supplied v5.2 and the v5.3 X-Matrix prototype. **No Django models, APIs, automated sources, or additional roles were built.** All other Goal Management workflows, including bidirectional Catchball, ISO requirements, formal approvals, the QMS auditor substitution policy, General director notices, A3 and KPI Performance remain in the same HTML.

### The X-Matrix is a view over existing records

- **Corporate Goals:** authoritative `Goal` records with `level=Organization` and no primary parent.
- **Annual / Site / Department Goals:** all viewable non-organization `Goal` records matching the selected scope, without the old hard-coded `slice(0,7)` cap.
- **Initiatives:** existing initiative records linked to a goal through `initiative.goal`, or via an explicitly rated `GoalRelationship`.
- **KPIs:** existing KPI definitions linked to visible goals (`goal.kpi`) and/or initiative relationships. The full Organization view for organization-wide roles shows all accessible KPI definitions even if no relation is rated yet.
- **Relationship rating:** existing `S.relations` (demo), with Strong (2), Medium (1), Weak (0.5) and None (no rated record). Unrated initiative primary assignments display a small ↗ marker **without fabricating an impact score**.
- **Parent hierarchy:** always obtained by following `goal.parent`. Department → Site → Corporate is shown as an **indirect hierarchical link**, not stored as a second parent or fabricated impact rating. In the lower-left quadrant, solid blue circle means direct corporate parent, half blue circle means inherited through a site goal.

## Scope and existing six roles — use exactly these

| Existing role | Goal Management X-Matrix behaviour |
|---|---|
| Administratör | Organization-wide demo visibility and permitted relationship configuration; **not automatically formal business approver** |
| General director | Organization-wide strategy visibility, create/edit goals, rated relationships and formal approval |
| QMS auditor | **Same strategic goal creation, relationship editing and formal approval as General director**; QMS approval is logged and informs General director |
| Department director | Assigned-unit visibility; can edit relationships only for own department’s goals; can reply to invited top-down Catchball for higher-level goals, without higher-level edit/approval rights |
| Auditor | Read-only authorized audit-scope view; no relationship changes or business approval |
| Basic user | Read-only published goals within assigned scope; can update only own assigned activities elsewhere in the module |

**Do not invent new roles** like Strategy Manager, Goal Approver or Site Director. Any future additional approval responsibilities should be configured through existing permissions and assignments, not a new role name.

## Filtering and visibility

- **Organization**: every goal accessible to that role, not silently truncated; broad management roles see all organization/site/department goals.
- **Site**: site goal plus its descendant department goals, based on actual parent links, not fixed names.
- **Department**: the department goal and its containing site goal; no sibling departments outside authorized scope.
- `visibleToRole`, `roleCan('matrixEdit', ...)`, `cbCanAct`, and existing `SAFEQMS_ROLES` remain the *demo’s* single authority for client UI. Backend must separately and authoritatively enforce company, site, department and record-level permissions.

## Behavior

1. Select a scope at **Strategy & Goals → X-Matrix**.
2. Click a goal, initiative or KPI to highlight its relation chain.
3. For corporate goal selection, show all descendant site and department goals and linked initiatives/KPIs. For a department goal, show its containing corporate goal even when linked via a site goal.
4. Click a circle to **inspect** its rated relationship; clicking never updates data.
5. When role permits, use **Change relationship strength** to cycle through None → Weak → Medium → Strong → None, and optionally supply a rationale.
6. Filter **Show only Strong** hides lower-rated symbols but does not delete links.
7. Site/Department filters operate on the hierarchy; Organization is the comprehensive organization-wide view, still constrained by that role’s access rights.
8. There are **no hidden max-item caps**. Dense matrices scroll horizontally and grow vertically.

## Production integration — for SafeQMS programmers, not implemented here

- Reuse existing authenticated SafeQMS users, six roles, company-site-department hierarchy and permissions.
- Fetch Goals, Initiatives, KPIs and GoalRelationships with consistent tenant-scope filters; do not create duplicate records for the X-Matrix or duplicate the ISO Standards catalogue.
- Return goal IDs, parent IDs, initiative.primary_goal IDs, KPI IDs and rated relationship records. Derive indirect hierarchy relationships client-side or server-side; do not persist synthetic links.
- Record relation edits as attributable, authorized change events with tenant/user identifiers and timestamps. Concurrency/version checks matter for collaborative edits.
- The goal’s measured status continues to be determined by KPI direction, monthly actual/target and tolerance **in Performance**; relationship strength is not a KPI measurement.
- QMS auditor and General director remain equivalent strategic approvers; every QMS approval must inform General director, without requiring a second approval.
- API paths and model names must be adapted to the **real codebase** after inspection; this HTML is not connected to any backend or notification service.

## Tested in browser

Chromium using Playwright `set_content` (direct `file://` navigation was blocked by this test environment):
- All six existing role choices render the matrix without JavaScript runtime errors.
- Organization with sample records: 4 corporate, 5 annual/site/department, 4 initiatives, 6 KPIs.
- Adding 11 more demo department goals: all 16 appear in matrix data (no silent cap).
- A corporate goal shows both the related site objective and descendant department objectives; traced KPIs remain reachable.
- QMS auditor has formal approval and relationship editing; General director likewise, Administratör lacks strategic approval by default.
- Department director can respond to top-down CB-002, cannot edit a site-goal relationship, but may edit assigned department relationships.
- Auditor and Basic user have no matrix relationship-edit permission.
- Clicking/selecting relationships is separate from changing them.

**Prototype caveat:** Demo data in localStorage, simulated permissions, no real Django/API, email or external KPI source.
