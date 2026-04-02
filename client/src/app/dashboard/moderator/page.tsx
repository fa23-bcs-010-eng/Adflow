'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, Clock3, LayoutGrid, Files, ShieldCheck, AlertTriangle, Flag, MessageSquare, BarChart3, Settings, Users } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

export default function ModeratorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const [section, setSection] = useState<'pending' | 'flagged' | 'appeals' | 'performance' | 'history' | 'reports' | 'team' | 'settings'>('pending');
  const [ruleSettings, setRuleSettings] = useState({
    autoEscalate: true,
    reviewNotesRequired: true,
    notifyClients: true,
    twoStepApproval: false,
  });

  useEffect(() => {
    if (!authLoading && user && !['moderator', 'admin', 'super_admin'].includes(user.role)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !['moderator', 'admin', 'super_admin'].includes(user.role)) return;
    api
      .get('/moderator/review-queue')
      .then((r) => {
        setQueue(r.data);
        if (r.data.length > 0) setSelected(r.data[0]);
      })
      .catch(() => {
        setQueue([]);
        setSelected(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setActing(true);
    try {
      await api.patch(`/moderator/ads/${selected.id}/review`, { action, note });
      const next = queue.filter((a) => a.id !== selected.id);
      setQueue(next);
      setSelected(next[0] || null);
      setNote('');
      toast.success(action === 'approve' ? 'Ad approved' : 'Ad rejected and returned');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Action failed'));
    } finally {
      setActing(false);
    }
  };

  const reviewStats = {
    pending: queue.length,
    flagged: queue.filter((ad) => ad.moderator_note || ad.status === 'under_review').length,
    approved: queue.filter((ad) => ad.status === 'payment_pending').length,
    needsChanges: queue.filter((ad) => ad.status === 'submitted').length,
  };

  const sidebarItems = [
    { key: 'pending', label: 'Pending Ads', icon: Files, count: queue.length },
    { key: 'flagged', label: 'Flagged Ads', icon: Flag, count: reviewStats.flagged },
    { key: 'appeals', label: 'Appeals', icon: MessageSquare, count: 0 },
    { key: 'performance', label: 'Performance', icon: BarChart3 },
    { key: 'history', label: 'History', icon: Clock3 },
    { key: 'reports', label: 'Reports', icon: Eye },
    { key: 'team', label: 'Team Members', icon: Users },
    { key: 'settings', label: 'Rules & Settings', icon: Settings },
  ] as const;

  if (authLoading || loading) return <div className="flex items-center justify-center h-64 text-slate-300">Loading...</div>;

  return (
    <div className="panel-wrap">
      <div className="panel-surface p-0 overflow-hidden rounded-[1.6rem]">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] min-h-[76vh]">
          <aside className="dashboard-sidebar p-5 text-slate-100 border-r border-white/10">
            <div className="mb-8">
              <div className="pill inline-flex items-center gap-2 mb-3"><ShieldCheck size={14} className="text-cyan-300" /> Moderation</div>
              <h2 className="text-xl font-black">Review Queue</h2>
              <p className="text-sm text-slate-400 mt-2">Approve, reject, and annotate submitted ads.</p>
            </div>

            <div className="space-y-2 text-sm">
              <button type="button" onClick={() => setSection('pending')} className={`w-full rounded-xl px-3 py-3 flex items-center justify-between text-left transition ${section === 'pending' ? 'bg-white/8 border border-white/10' : 'border border-white/10 hover:bg-white/5'}`}>
                <span className="inline-flex items-center gap-2"><LayoutGrid size={14} /> Dashboard</span>
                <span className="text-cyan-300">Live</span>
              </button>
              <button type="button" onClick={() => setSection('pending')} className={`w-full rounded-xl px-3 py-3 flex items-center justify-between text-left transition ${section === 'pending' ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-100' : 'border border-white/10 text-slate-300 hover:bg-white/5'}`}>
                <span className="inline-flex items-center gap-2"><Files size={14} /> Pending Ads</span>
                <span>{queue.length}</span>
              </button>
              {sidebarItems.slice(1).map((item) => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSection(item.key)}
                    className={`w-full rounded-xl px-3 py-3 flex items-center justify-between text-left transition ${active ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-100' : 'border border-white/10 text-slate-300 hover:bg-white/5'}`}
                  >
                    <span className="inline-flex items-center gap-2"><Icon size={14} /> {item.label}</span>
                    {'count' in item && <span>{item.count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4 text-sm text-slate-300">
              <div className="inline-flex items-center gap-2 text-amber-200 mb-2"><AlertTriangle size={14} /> Review notes matter</div>
              Keep decisions short and actionable so advertisers can fix issues quickly.
            </div>
          </aside>

          <section className="p-5 md:p-6 bg-[#edf1f7] text-slate-900">
            {section === 'pending' && (
              <>
                <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900">Moderation Queue: Pending Ads</h1>
                    <p className="text-sm text-slate-600 mt-1">Total {queue.length} ads pending review</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600">1 - {queue.length} of {queue.length}</div>
                    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600">Sort rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
                  <div className="kpi-card bg-white border border-slate-200 text-slate-900 p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-3xl font-black mt-1">{reviewStats.pending}</p></div>
                  <div className="kpi-card bg-white border border-slate-200 text-slate-900 p-4"><p className="text-sm text-slate-500">Flagged</p><p className="text-3xl font-black mt-1">{reviewStats.flagged}</p></div>
                  <div className="kpi-card bg-white border border-slate-200 text-slate-900 p-4"><p className="text-sm text-slate-500">Approved</p><p className="text-3xl font-black mt-1">{reviewStats.approved}</p></div>
                  <div className="kpi-card bg-white border border-slate-200 text-slate-900 p-4"><p className="text-sm text-slate-500">Needs changes</p><p className="text-3xl font-black mt-1">{reviewStats.needsChanges}</p></div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5 items-start">
                  <div className="space-y-3">
                    {queue.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500"><CheckCircle className="mx-auto mb-2 text-emerald-500" />Queue is clear.</div>
                    ) : (
                      queue.map((ad) => (
                        <div key={ad.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${selected?.id === ad.id ? 'border-cyan-400 ring-2 ring-cyan-200' : 'border-slate-200'}`}>
                          <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
                            <button onClick={() => setSelected(ad)} className="text-left flex-1">
                              <div className="text-sm font-bold text-slate-900">#{ad.id?.slice?.(0, 6) || ad.id}</div>
                              <div className="mt-1 font-semibold text-slate-800">{ad.title}</div>
                              <div className="text-xs text-slate-500 mt-2 inline-flex items-center gap-2 flex-wrap"><StatusBadge status={ad.status} /><span>{ad.user?.full_name}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} /> {new Date(ad.created_at).toLocaleString()}</span></div>
                            </button>
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => setSelected(ad)} className="btn-secondary text-xs inline-flex items-center gap-1"><Eye size={12} /> Review</button>
                              <button onClick={() => { setSelected(ad); handleReview('approve'); }} disabled={acting} className="btn-primary text-xs inline-flex items-center gap-1"><CheckCircle size={12} /> Approve</button>
                              <button onClick={() => { setSelected(ad); handleReview('reject'); }} disabled={acting} className="btn-danger text-xs inline-flex items-center gap-1"><XCircle size={12} /> Reject</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-[1.35rem] bg-white border border-slate-200 p-5 shadow-sm sticky top-24">
                    {!selected ? (
                      <div className="py-14 text-center text-slate-500"><Eye size={40} className="mx-auto mb-3 text-slate-300" />Select an ad from the queue to review.</div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Needs Review</p>
                          <h2 className="text-2xl font-black text-slate-900">{selected.title}</h2>
                          <div className="flex gap-2 mt-2 flex-wrap"><StatusBadge status={selected.status} />{selected.category && <span className="text-xs text-slate-500">{selected.category.name}</span>}{selected.city && <span className="text-xs text-slate-500">{selected.city.name}</span>}{selected.package && <span className="text-xs text-slate-500">{selected.package.name}</span>}</div>
                        </div>

                        {selected.media?.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {selected.media.slice(0, 3).map((m: any, i: number) => (
                              <a key={i} href={m.media_url} target="_blank" rel="noreferrer" className="h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 block"><img src={m.media_url} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /></a>
                            ))}
                          </div>
                        )}

                        {selected.description && <p className="text-slate-600 text-sm leading-6 whitespace-pre-wrap">{selected.description}</p>}

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                          <p className="text-slate-500">Seller: <span className="text-slate-900">{selected.user?.full_name}</span> ({selected.user?.email})</p>
                          {selected.contact_phone && <p className="text-slate-500">Phone: <span className="text-slate-900">{selected.contact_phone}</span></p>}
                          <p className="text-slate-500">Submitted: <span className="text-slate-900">{new Date(selected.created_at).toLocaleString()}</span></p>
                        </div>

                        <div>
                          <label className="label !text-slate-600">Review Note</label>
                          <textarea className="input h-24 resize-none bg-white text-slate-900 border-slate-300" placeholder="Reason for rejection or feedback..." value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleReview('approve')} disabled={acting} className="btn-primary justify-center"><CheckCircle size={16} /> Approve</button>
                          <button onClick={() => handleReview('reject')} disabled={acting} className="btn-danger justify-center"><XCircle size={16} /> Reject</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {section === 'flagged' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Flagged Ads</h1>
                  <p className="text-sm text-slate-600 mt-1">Ads with notes, warnings, or manual attention required.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[['Manual review', reviewStats.flagged], ['Hidden issues', queue.filter((ad) => ad.moderator_note).length], ['Escalations', Math.max(reviewStats.flagged - queue.filter((ad) => ad.moderator_note).length, 0)]].map(([label, value]) => (
                    <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-slate-900 mt-2">{value as number}</p></div>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  {queue.length === 0 ? <p className="text-slate-500">No flagged ads right now.</p> : queue.filter((ad) => ad.moderator_note || ad.status === 'under_review').map((ad) => (<div key={ad.id} className="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{ad.title}</p><p className="text-sm text-slate-500 mt-1">{ad.moderator_note || 'Awaiting moderator action'}</p></div><StatusBadge status={ad.status} /></div>))}
                </div>
              </div>
            )}

            {section === 'appeals' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Appeals</h1>
                  <p className="text-sm text-slate-600 mt-1">Track advertiser requests for second review.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold text-slate-900 mb-3">Appeal workflow</h2><ul className="space-y-3 text-sm text-slate-600"><li>1. Advertiser submits appeal with context and evidence.</li><li>2. Moderator reviews the case and original note.</li><li>3. Decision is marked accepted or rejected.</li></ul></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold text-slate-900 mb-3">Current status</h2><p className="text-slate-600 text-sm">No live appeal queue is connected yet. When the backend endpoint is added, this section can pull live cases automatically.</p></div>
                </div>
              </div>
            )}

            {section === 'performance' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Performance</h1>
                  <p className="text-sm text-slate-600 mt-1">Review throughput and moderation workload.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[['Reviewed today', Math.max(queue.length, 1)], ['Average note length', 'Short'], ['Escalation rate', 'Low'], ['Team SLA', 'On track']].map(([label, value]) => (<div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-black text-slate-900 mt-2">{value}</p></div>))}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  {[['Approval rate', 78], ['Rejection rate', 22], ['Escalated cases', 12]].map(([label, percent]) => (<div key={label as string}><div className="flex items-center justify-between text-sm mb-2"><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{percent}%</span></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${percent}%` }} /></div></div>))}
                </div>
              </div>
            )}

            {section === 'history' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">History</h1>
                  <p className="text-sm text-slate-600 mt-1">Recent moderation activity and decision logs.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">{queue.slice(0, 3).map((ad) => (<div key={ad.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"><div><p className="font-semibold text-slate-900">{ad.title}</p><p className="text-sm text-slate-500">{new Date(ad.created_at).toLocaleString()}</p></div><StatusBadge status={ad.status} /></div>))}</div>
              </div>
            )}

            {section === 'reports' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Reports</h1>
                  <p className="text-sm text-slate-600 mt-1">Generate moderation summaries for leadership.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold text-slate-900 mb-3">Weekly summary</h2><p className="text-sm text-slate-600">Pending reviews, approvals, and rejections can be exported once a reporting endpoint is connected.</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold text-slate-900 mb-3">Export format</h2><p className="text-sm text-slate-600">CSV, PDF, and email digests can be enabled here later without changing the layout.</p></div>
                </div>
              </div>
            )}

            {section === 'team' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Team Members</h1>
                  <p className="text-sm text-slate-600 mt-1">Moderator roles and access levels.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[['Senior Moderator', 'Approves escalations and final decisions.'], ['Content Moderator', 'Handles daily queue reviews.'], ['Quality Lead', 'Audits notes and moderation consistency.']].map(([role, body]) => (<div key={role as string} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-bold text-slate-900">{role}</p><p className="text-sm text-slate-600 mt-2 leading-6">{body}</p></div>))}</div>
              </div>
            )}

            {section === 'settings' && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Rules & Settings</h1>
                  <p className="text-sm text-slate-600 mt-1">Control moderation behavior and notification preferences.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                    {[
                      ['Auto escalate risky ads', 'autoEscalate'],
                      ['Require review notes', 'reviewNotesRequired'],
                      ['Notify clients on decisions', 'notifyClients'],
                      ['Two-step approval for premium ads', 'twoStepApproval'],
                    ].map(([label, key]) => (
                      <label key={key as string} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                        <span className="text-sm font-medium text-slate-800">{label}</span>
                        <input
                          type="checkbox"
                          checked={ruleSettings[key as keyof typeof ruleSettings]}
                          onChange={(e) => setRuleSettings((current) => ({ ...current, [key]: e.target.checked }))}
                          className="h-4 w-4 accent-cyan-500"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Current policy</h2>
                    <p className="text-sm text-slate-600 leading-6">{ruleSettings.reviewNotesRequired ? 'Review notes are mandatory before rejection.' : 'Review notes are optional.'} {ruleSettings.autoEscalate ? 'High-risk ads are escalated automatically.' : 'High-risk ads stay in the normal queue.'}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
