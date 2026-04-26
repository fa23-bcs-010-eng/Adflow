'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Crown,
  Users,
  BarChart3,
  Database,
  SlidersHorizontal,
  ShieldAlert,
  BadgeDollarSign,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Gauge,
  Lock,
  Workflow,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

const StatCard = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) => (
  <div className="kpi-card">
    <p className="text-xs text-slate-300/60 mb-1">{label}</p>
    <p className="text-3xl font-black text-white">{value}</p>
    {note && <p className="text-xs text-slate-400 mt-2">{note}</p>}
  </div>
);

export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({});
  const [adsSummary, setAdsSummary] = useState<any>({
    total_ads: 0,
    live_ads: 0,
    not_live_ads: 0,
    featured_live_ads: 0,
    draft_ads: 0,
    pending_review_ads: 0,
    expired_ads: 0,
  });
  const [fraud, setFraud] = useState<any>({ summary: {}, risks: [], escrow: [], reports: [] });
  const [tab, setTab] = useState<'overview' | 'policy' | 'systems' | 'emergency'>('overview');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    Promise.allSettled([
      api.get('/admin/analytics'),
      api.get('/admin/ads-summary'),
      api.get('/admin/fraud-dashboard'),
    ]).then(([analyticsRes, summaryRes, fraudRes]) => {
      setAnalytics(analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : {});
      setAdsSummary(summaryRes.status === 'fulfilled' ? summaryRes.value.data : adsSummary);
      setFraud(fraudRes.status === 'fulfilled' ? fraudRes.value.data : { summary: {}, risks: [], escrow: [], reports: [] });
      setLoading(false);
    });
  }, [user]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-64 text-slate-300">Loading...</div>;
  }

  return (
    <div className="panel-wrap">
      <div className="panel-surface p-5 md:p-6">
        <div className="rounded-[1.5rem] border border-amber-400/15 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1a1230] p-5 md:p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="pill inline-flex items-center gap-2 mb-3"><Crown size={14} className="text-amber-300" /> Super Admin</div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-50">Governance Command Center</h1>
              <p className="text-slate-300/75 text-sm mt-2 max-w-2xl">
                Platform-wide policy, identity, system health, and escalation controls. This view is intentionally separate from day-to-day admin operations and moderation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 inline-flex items-center gap-2"><Gauge size={12} className="text-cyan-300" /> System health</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 inline-flex items-center gap-2"><Lock size={12} className="text-amber-300" /> Policy locks</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 inline-flex items-center gap-2"><Workflow size={12} className="text-emerald-300" /> Cross-role flow</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 inline-flex items-center gap-2"><AlertTriangle size={12} className="text-red-300" /> Escalations</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            ['overview', 'Overview', LayoutDashboard],
            ['policy', 'Policy', SlidersHorizontal],
            ['systems', 'Systems', Database],
            ['emergency', 'Emergency', ShieldAlert],
          ].map(([key, label, Icon]) => (
            <button
              key={String(key)}
              onClick={() => setTab(key as any)}
              className={`px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${tab === key ? 'bg-cyan-500 text-slate-900 font-bold' : 'bg-slate-800/70 text-slate-300'}`}
            >
              <Icon size={14} />
              {label as string}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={`$${Number(analytics.total_revenue || 0).toLocaleString()}`} note="Platform-wide" />
              <StatCard label="Active Ads" value={adsSummary.live_ads || 0} note="Currently live" />
              <StatCard label="Pending Review" value={adsSummary.pending_review_ads || 0} note="Needs moderation" />
              <StatCard label="Open Risks" value={fraud.summary?.open_reports || 0} note="Fraud and complaints" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4 text-slate-100">
                  <BarChart3 size={16} className="text-cyan-300" />
                  <h2 className="panel-title text-lg">Platform Health</h2>
                </div>
                <div className="space-y-4">
                  {[
                    ['Live Ads', adsSummary.live_ads || 0],
                    ['Not Live Ads', adsSummary.not_live_ads || 0],
                    ['Featured Live', adsSummary.featured_live_ads || 0],
                    ['Expired Ads', adsSummary.expired_ads || 0],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-200">{label}</span>
                        <span className="text-slate-400">{value as number}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.min(Number(value) * 8, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4 text-slate-100">
                  <ShieldAlert size={16} className="text-red-300" />
                  <h2 className="panel-title text-lg">Risk Overview</h2>
                </div>
                <div className="space-y-3">
                  {(fraud.risks || []).slice(0, 5).map((risk: any) => (
                    <div key={risk.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-sm text-white font-semibold">Ad #{String(risk.ad_id).slice(0, 8)}</p>
                      <p className="text-xs text-slate-400 mt-1">Risk {risk.risk_score}/100 | Quality {risk.quality_score}/100</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5">
                <p className="text-xs text-slate-300/60 mb-1">Policy State</p>
                <p className="text-2xl font-black text-white">Locked</p>
                <p className="text-sm text-slate-400 mt-2">Super admin only. Change platform-wide rules from the policy tab.</p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-slate-300/60 mb-1">Identity Surface</p>
                <p className="text-2xl font-black text-white">4 roles</p>
                <p className="text-sm text-slate-400 mt-2">Buyer, seller, moderator, and admin operate under separated permission sets.</p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-slate-300/60 mb-1">Emergency Status</p>
                <p className="text-2xl font-black text-amber-300">Standby</p>
                <p className="text-sm text-slate-400 mt-2">Use only for fraud spikes, publish freezes, or account-wide intervention.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'policy' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Users" value={analytics.total_users || 0} />
              <StatCard label="Ads Submitted" value={adsSummary.total_ads || 0} />
              <StatCard label="Disputed Escrow" value={fraud.summary?.disputed_escrow || 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-cyan-300" />
                  <h2 className="panel-title text-lg">Role Access Policy</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>Buyer: browse, chat, make offers, save searches, purchase.</p>
                  <p>Seller: create ads, boost listings, manage orders, view analytics.</p>
                  <p>Moderator: review queue, complaint handling, content approval.</p>
                  <p>Admin: payments, fraud, publishing, platform monitoring.</p>
                  <p>Super Admin: cross-role governance and emergency overrides.</p>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone size={16} className="text-amber-300" />
                  <h2 className="panel-title text-lg">Governance Notes</h2>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                    Admin handles daily operations. Super admin only steps in when policy or platform integrity needs a global decision.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                    If a team needs to be reviewed, use the respective dashboard through route-level access instead of mixing controls here.
                  </div>
                  <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-3 text-sm text-slate-200 inline-flex items-center gap-2">
                    <ShieldAlert size={14} className="text-amber-300" />
                    Separate dashboards are intentional, not duplicate views.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'systems' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database size={16} className="text-cyan-300" />
                <h2 className="panel-title text-lg">System Surface</h2>
              </div>
              <p className="text-sm text-slate-300/80 leading-6">
                This screen is intentionally different from admin and moderator. Use it for platform health, platform-wide metrics, and operational sanity checks rather than queue work.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Notifications" value={analytics.total_notifications || 0} />
              <StatCard label="Seller Reviews" value={analytics.total_reviews || 0} />
              <StatCard label="Open Reports" value={fraud.summary?.open_reports || 0} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BadgeDollarSign size={16} className="text-cyan-300" />
                  <h2 className="panel-title text-lg">System Revenue Snapshot</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>Total ads: {adsSummary.total_ads || 0}</p>
                  <p>Live ads: {adsSummary.live_ads || 0}</p>
                  <p>Pending review: {adsSummary.pending_review_ads || 0}</p>
                  <p>Expired ads: {adsSummary.expired_ads || 0}</p>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <h2 className="panel-title text-lg">Control Boundary</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>Admin handles payments and publishing.</p>
                  <p>Moderator handles content review and reports.</p>
                  <p>Super admin handles identity, policy, and emergency controls.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'emergency' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-300" />
                <h2 className="panel-title text-lg">Emergency Controls</h2>
              </div>
              <p className="text-sm text-slate-300/80 leading-6">
                This area is only for platform-wide lockdown, temporary publish freezes, or fraud containment. It does not duplicate moderation or payment operations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5"><p className="text-xs text-slate-400 mb-1">Publish state</p><p className="text-2xl font-black text-white">Normal</p></div>
              <div className="card p-5"><p className="text-xs text-slate-400 mb-1">Escalation queue</p><p className="text-2xl font-black text-amber-300">{fraud.summary?.open_reports || 0}</p></div>
              <div className="card p-5"><p className="text-xs text-slate-400 mb-1">Lockdown readiness</p><p className="text-2xl font-black text-emerald-300">Ready</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
