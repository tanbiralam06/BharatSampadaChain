import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  listOfficers, createOfficer, setOfficerStatus,
  Card, RoleBadge, PageSpinner, ErrorBanner, EmptyState,
} from '@bsc/shared';
import type { OfficerRole, CreateOfficerInput } from '@bsc/shared';

const OFFICER_ROLES: OfficerRole[] = ['IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK'];

const EMPTY_FORM: CreateOfficerInput = { name: '', login_id: '', role: 'IT_DEPT', password: '' };

export default function OfficerManagement() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateOfficerInput>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['officers'],
    queryFn: listOfficers,
  });

  const createMut = useMutation({
    mutationFn: createOfficer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['officers'] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err.response?.data?.error ?? 'Failed to create officer');
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ hash, is_active }: { hash: string; is_active: boolean }) =>
      setOfficerStatus(hash, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['officers'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    createMut.mutate(form);
  };

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Officer Management</h1>
          <p className="text-sm text-slate-400 mt-1">Create and manage officer accounts across all agencies</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Create Officer
        </button>
      </div>

      {isLoading && <PageSpinner />}
      {isError   && <ErrorBanner message="Could not load officers." onRetry={refetch} />}

      {data && data.length === 0 && (
        <EmptyState title="No officers yet" description="Create the first officer account using the button above." />
      )}

      {data && data.length > 0 && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Agency</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Last Login</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((officer) => (
                <tr key={officer.subject_hash} className="group">
                  <td className="py-3 pr-4 font-medium text-white">{officer.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-400">{officer.login_id}</td>
                  <td className="py-3 pr-4"><RoleBadge role={officer.role} /></td>
                  <td className="py-3 pr-4 text-slate-400">{new Date(officer.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 pr-4 text-slate-400">
                    {officer.last_login ? new Date(officer.last_login).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => statusMut.mutate({ hash: officer.subject_hash, is_active: !officer.is_active })}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      title={officer.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {officer.is_active
                        ? <><ToggleRight className="h-4 w-4 text-green-400" /><span className="text-green-400">Active</span></>
                        : <><ToggleLeft  className="h-4 w-4 text-slate-500" /><span className="text-slate-500">Inactive</span></>
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Officer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-[#0a1628] border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Create Officer Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Amit Sharma"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Government Email</label>
                <input
                  required
                  type="email"
                  value={form.login_id}
                  onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                  placeholder="e.g. amit.sharma@itdept.bsc.gov"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Agency / Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as OfficerRole })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {OFFICER_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#0a1628]">{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Temporary Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); }}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  {createMut.isPending ? 'Creating…' : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
