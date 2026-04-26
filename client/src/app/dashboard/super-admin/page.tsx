'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Crown,
  Users,
  Bell,
  BarChart3,
  Database,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  BadgeDollarSign,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
} from 'lucide-react';
import Link from 'next/link';
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
  const [tab, setTab] = useState<'overview' | 'system' | 'governance'>('overview');

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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div className="pill inline-flex items-center gap-2 mb-3"><Crown size={14} className="text-amber-300" /> Super Admin</div>
            <h1 className="text-2xl font-bold text-slate-100">System Command Center</h1>
            <p className="text-slate-300/70 text-sm">Global platform oversight, governance, and emergency controls.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/admin" className="btn-secondary text-xs inline-flex items-center gap-1">
              <ArrowRight size={12} /> Admin Panel
            </Link>
            <Link href="/dashboard/moderator" className="btn-secondary text-xs inline-flex items-center gap-1">
              <MessagesSquare size={12} /> Moderator Queue
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            ['overview', 'Overview', LayoutDashboard],
            ['system', 'System', Database],
            ['governance', 'Governance', SlidersHorizontal],
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
          </div>
        )}

        {tab === 'system' && (
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
                  <h2 className="panel-title text-lg">Role Access</h2>
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
                  <h2 className="panel-title text-lg">Cross-Team Links</h2>
                </div>
                <div className="space-y-3">
                  <Link href="/dashboard/admin" className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                    <BadgeDollarSign size={14} /> Open Admin
                  </Link>
                  <Link href="/dashboard/moderator" className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Open Moderator
                  </Link>
                  <Link href="/dashboard/client?tab=orders" className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                    <Users size={14} /> Review Buyer/Seller Flow
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'governance' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-cyan-300" />
                <h2 className="panel-title text-lg">Governance Controls</h2>
              </div>
              <p className="text-sm text-slate-300/80 leading-6">
                This screen is intentionally different from admin and moderator. Use it for platform-wide decisions, policy review, and route-level oversight rather than day-to-day queue work.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Notifications" value={analytics.total_notifications || 0} />
              <StatCard label="Seller Reviews" value={analytics.total_reviews || 0} />
              <StatCard label="Open Reports" value={fraud.summary?.open_reports || 0} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
