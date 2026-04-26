import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Save, AlertCircle, Loader2 } from 'lucide-react';
import { listPermissions, updatePermission } from '@bsc/shared/endpoints';
import type { PermissionRule } from '@bsc/shared/types';

const ALL_DATA_TYPES = [
  'ALL',
  'INCOME_SUMMARY',
  'ASSET_SUMMARY',
  'ANOMALY_STATUS',
  'PROPERTY_LIST',
  'BUSINESS_HOLDINGS',
  'CREDIT_SCORE',
  'SYSTEM_METADATA',
  'OFFICIAL_WEALTH_SUMMARY',
] as const;

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: 'Citizen (self)',
  IT_DEPT: 'IT Department',
  ED:      'Enforcement Directorate',
  CBI:     'CBI',
  COURT:   'Court',
  BANK:    'Bank',
  ADMIN:   'Admin',
  PUBLIC:  'Public',
};

// ── Row state keyed by role ───────────────────────────────────────────────────

type RowState = { dataTypes: Set<string>; requiresRef: boolean; dirty: boolean };

function rulesToState(rules: PermissionRule[]): Record<string, RowState> {
  return Object.fromEntries(
    rules.map((r) => [
      r.accessorRole,
      { dataTypes: new Set(r.allowedDataTypes), requiresRef: r.requiresAuthorizationRef, dirty: false },
    ])
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PermissionMatrix() {
  const qc = useQueryClient();

  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['permissions'],
    queryFn: listPermissions,
  });

  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rules && rules.length > 0) {
      setRows(rulesToState(rules));
    }
  }, [rules]);

  const saveMutation = useMutation({
    mutationFn: ({ role, state }: { role: string; state: RowState }) =>
      updatePermission(role, { dataTypes: Array.from(state.dataTypes), requiresRef: state.requiresRef }),
    onSuccess: (_, { role }) => {
      setRows((prev) => ({ ...prev, [role]: { ...prev[role], dirty: false } }));
      setSaveError((prev) => { const n = { ...prev }; delete n[role]; return n; });
      qc.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (err, { role }) => {
      setSaveError((prev) => ({ ...prev, [role]: (err as Error).message }));
    },
  });

  function toggleDataType(role: string, dt: string) {
    setRows((prev) => {
      const row = { ...prev[role] };
      const next = new Set(row.dataTypes);
      if (next.has(dt)) next.delete(dt); else next.add(dt);
      return { ...prev, [role]: { ...row, dataTypes: next, dirty: true } };
    });
  }

  function toggleRequiresRef(role: string) {
    setRows((prev) => {
      const row = prev[role];
      return { ...prev, [role]: { ...row, requiresRef: !row.requiresRef, dirty: true } };
    });
  }

  function handleSave(role: string) {
    saveMutation.mutate({ role, state: rows[role] });
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Failed to load permissions: {(error as Error).message}</span>
        </div>
      </div>
    );
  }

  const roleOrder = ['CITIZEN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK', 'ADMIN', 'PUBLIC'];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold text-white">Permission Matrix</h1>
          <p className="text-sm text-slate-400">
            Control which data types each agency role may access. Changes are written to the blockchain and mirrored to PostgreSQL.
          </p>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a1628]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-44">Role</th>
              {ALL_DATA_TYPES.map((dt) => (
                <th key={dt} className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  {dt.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Requires Auth Ref
              </th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {roleOrder.map((role) => {
              const row = rows[role];
              if (!row) return null;
              const isSaving = saveMutation.isPending && saveMutation.variables?.role === role;

              return (
                <tr key={role} className={`transition-colors ${row.dirty ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{ROLE_LABELS[role] ?? role}</span>
                    {row.dirty && (
                      <span className="ml-2 text-[10px] text-amber-400 font-semibold">unsaved</span>
                    )}
                  </td>
                  {ALL_DATA_TYPES.map((dt) => (
                    <td key={dt} className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.dataTypes.has(dt)}
                        onChange={() => toggleDataType(role, dt)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500 accent-amber-500 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.requiresRef}
                      onChange={() => toggleRequiresRef(role)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500 accent-amber-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSave(role)}
                      disabled={!row.dirty || isSaving}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </button>
                    {saveError[role] && (
                      <p className="mt-1 text-[10px] text-red-400">{saveError[role]}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600">
        "ALL" grants access to every data type. "Requires Auth Ref" means the accessor must supply a court order, warrant, or formal authorization reference with each request.
      </p>
    </div>
  );
}
