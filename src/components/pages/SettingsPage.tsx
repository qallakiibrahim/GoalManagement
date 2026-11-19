import React, { useState } from 'react';
import { Copy, Download, Plus, RefreshCw, Rocket, Shield, Trash2, Users } from 'lucide-react';
import { ALL_SCOPES, ASSIGNED_DEPARTMENT, ASSIGNED_SITE, SAFEQMS_ROLES, SafeQmsRole, formatRoleLabel } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';

export const SettingsPage: React.FC = () => {
  const {
    user,
    activeWorkspace,
    workspaces,
    members,
    isActualAdmin,
    goals,
    kpis,
    initiatives,
    projects,
    tasks,
    pulseCards,
    blockers,
    reviews,
    catchballs,
    approvals,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    createWorkspace,
    createBlankWorkspace,
    switchWorkspace,
    seedOrResetWorkspace,
    toast,
  } = useWorkspace();

  const [newUid, setNewUid] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<SafeQmsRole>('Department director');
  const [newSite, setNewSite] = useState(ASSIGNED_SITE);
  const [newDept, setNewDept] = useState(ASSIGNED_DEPARTMENT);
  const [newWsName, setNewWsName] = useState('');

  if (!isActualAdmin) {
    return (
      <Card className="p-6 text-xs text-[var(--muted)]">
        Workspace administration and team role management require the <strong>Administrator</strong> role.
      </Card>
    );
  }

  const copyMyUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      toast('Copied your Firebase UID to clipboard', 'success');
    } catch {
      toast('Could not copy UID automatically', 'error');
    }
  };

  const exportFullWorkspace = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      workspace: activeWorkspace,
      members,
      goals,
      kpis,
      initiatives,
      projects,
      tasks,
      pulseCards,
      blockers,
      reviews,
      catchballs,
      approvals,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeqms-workspace-${activeWorkspace?.id || 'backup'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team Access &amp; Workspace Administration"
        subtitle="Manage shared Firebase team members, SafeQMS role permissions, multi-workspace switching, and full dataset snapshots."
      />

      {/* Current User Identity Card */}
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Your Firebase Identity (Share UID with another Admin to join their workspace)</span>
          </div>
          <div className="text-xs text-[var(--muted)] font-mono">
            UID: <strong className="text-[var(--ink)]">{user?.uid}</strong> · {user?.email}
          </div>
        </div>
        <button
          type="button"
          onClick={copyMyUid}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy My UID
        </button>
      </Card>

      {/* Team Members & Roles Manager */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-[var(--ink)]">
              Shared Workspace Team ({members.length}/50)
            </h2>
          </div>
          <span className="text-xs text-[var(--muted)]">Changes propagate atomically to all 16 Firestore collections</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Member</th>
                <th className="px-3 py-2 font-semibold">SafeQMS Role</th>
                <th className="px-3 py-2 font-semibold">Assigned Site</th>
                <th className="px-3 py-2 font-semibold">Assigned Department</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {members.map((m) => {
                const isOwner = m.uid === activeWorkspace?.ownerUid;
                return (
                  <tr key={m.uid}>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-[var(--ink)]">
                        {m.displayName} {isOwner && <StatusBadge label="Owner" tone="teal" className="ml-1" />}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--muted)]">{m.uid}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        disabled={isOwner}
                        value={m.safeqmsRole}
                        onChange={(e) =>
                          updateTeamMember(m.uid, {
                            displayName: m.displayName,
                            safeqmsRole: e.target.value as SafeQmsRole,
                            assignedSite: m.assignedSite || ASSIGNED_SITE,
                            assignedDepartment: m.assignedDepartment || ASSIGNED_DEPARTMENT,
                          })
                        }
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-xs"
                      >
                        {SAFEQMS_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {formatRoleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={m.assignedSite || ASSIGNED_SITE}
                        onChange={(e) =>
                          updateTeamMember(m.uid, {
                            displayName: m.displayName,
                            safeqmsRole: m.safeqmsRole,
                            assignedSite: e.target.value,
                            assignedDepartment: m.assignedDepartment || ASSIGNED_DEPARTMENT,
                          })
                        }
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-xs"
                      >
                        {ALL_SCOPES.filter((s) => s.startsWith('Site:') || s === 'Organization').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={m.assignedDepartment || ASSIGNED_DEPARTMENT}
                        onChange={(e) =>
                          updateTeamMember(m.uid, {
                            displayName: m.displayName,
                            safeqmsRole: m.safeqmsRole,
                            assignedSite: m.assignedSite || ASSIGNED_SITE,
                            assignedDepartment: e.target.value,
                          })
                        }
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-xs"
                      >
                        {ALL_SCOPES.filter((s) => s.startsWith('Department:')).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(m.uid)}
                          className="inline-flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Member Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newUid.trim() || !newName.trim()) return;
            await addTeamMember(newUid, newName, newRole, newSite, newDept);
            setNewUid('');
            setNewName('');
          }}
          className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-3 border-t border-[var(--border)] text-xs"
        >
          <input
            type="text"
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            placeholder="Colleague Firebase UID..."
            className="md:col-span-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Display Name"
            className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as SafeQmsRole)}
            className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-2"
          >
            {SAFEQMS_ROLES.map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)}
              </option>
            ))}
          </select>
          <select
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-2"
          >
            {ALL_SCOPES.filter((s) => s.startsWith('Site:') || s === 'Organization').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-2"
          >
            {ALL_SCOPES.filter((s) => s.startsWith('Department:')).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="md:col-span-1 inline-flex items-center justify-center gap-1 rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
      </Card>

      {/* Workspaces Switcher & Creator + Data Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--ink)]">Workspaces ({workspaces.length})</h2>
          <div className="space-y-2">
            {workspaces.map((w) => (
              <div
                key={w.id}
                className={`rounded-lg border p-3 flex items-center justify-between gap-2 text-xs ${
                  w.id === activeWorkspace?.id ? 'border-teal-600/35 bg-teal-600/8 dark:border-teal-400/30 dark:bg-teal-400/10' : 'border-[var(--border)]'
                }`}
              >
                <div>
                  <div className="font-bold text-[var(--ink)]">{w.name}</div>
                  <div className="text-[11px] font-mono text-[var(--muted)]">
                    {w.id} · {w.memberUids.length} members
                  </div>
                </div>
                {w.id === activeWorkspace?.id ? (
                  <StatusBadge label="Active" tone="teal" />
                ) : (
                  <button
                    type="button"
                    onClick={() => switchWorkspace(w.id)}
                    className="rounded-lg border border-[var(--border-strong)] px-3 py-1 font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    Switch
                  </button>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newWsName.trim()) return;
              await createWorkspace(newWsName);
              setNewWsName('');
            }}
            className="space-y-2.5 pt-2 border-t border-[var(--border)] text-xs"
          >
            <input
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="New workspace name (e.g. Nordiska Verkstad AB 2027)..."
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const targetName = newWsName.trim() || 'Ny kund · Arbetsyta 2027';
                  await createBlankWorkspace(targetName);
                  setNewWsName('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" />
                Skapa tom (Från noll)
              </button>
              <button
                type="submit"
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                Create Demo Workspace
              </button>
            </div>
          </form>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--ink)]">Dataset &amp; Backup Tools</h2>
          <p className="text-xs text-[var(--muted)]">
            Export a complete JSON snapshot of the live Firestore workspace or restore the synchronized SafeQMS baseline dataset.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportFullWorkspace}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full JSON Backup
            </button>
            <button
              type="button"
              onClick={seedOrResetWorkspace}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/25 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-500/15 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset &amp; Load Synced SafeQMS Data
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
