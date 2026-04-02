'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Send, LineChart, UserPlus, BadgeDollarSign, Megaphone } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

const Sparkline = ({ color = '#22d3ee' }: { color?: string }) => (
  <svg viewBox="0 0 180 48" className="w-full h-12" fill="none">
    <path d="M2 34 C 20 8, 42 44, 60 20 C 76 6, 92 36, 110 16 C 128 8, 146 34, 178 12" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'analytics' | 'payments' | 'publish'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && !['admin', 'super_admin'].includes(user.role)) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(user.role)) return;
    Promise.all([api.get('/admin/analytics'), api.get('/admin/payment-queue')])
      .then(([a, p]) => {
        setAnalytics(a.data);
        setPayments(p.data);
      })
      .catch(() => {
        setAnalytics(null);
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleVerifyPayment = async (paymentId: string, action: 'verify' | 'reject') => {
    setActing(paymentId);
    try {
      await api.patch(`/admin/payments/${paymentId}/verify`, { action });
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success(action === 'verify' ? 'Payment verified' : 'Payment rejected');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Action failed'));
    } finally {
      setActing(null);
    }
  };

  const handleCron = async (job: string) => {
    try {
      const { data } = await api.post(`/cron/${job}`);
      toast.success(`${job}: ${JSON.stringify(data)}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Cron failed'));
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center h-64 text-slate-300">Loading...</div>;

  return (
    <div className="panel-wrap">
      <div className="panel-surface p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Admin Control Panel</h1>
            <p className="text-slate-300/70 text-sm">Revenue, submissions, approvals, and publishing controls.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleCron('publish-scheduled')} className="btn-secondary text-xs inline-flex items-center gap-1">
              <Send size={12} /> Run Publish
            </button>
            <button onClick={() => handleCron('expire-ads')} className="btn-secondary text-xs">
              Run Expire
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            ['analytics', 'Analytics'],
            ['payments', `Payments (${payments.length})`],
            ['publish', 'Publish'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k as any)}
              className={`px-4 py-2 rounded-lg text-sm ${tab === k ? 'bg-cyan-500 text-slate-900 font-bold' : 'bg-slate-800/70 text-slate-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'analytics' && analytics && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">Revenue Growth</p>
                <p className="text-4xl font-black text-white">${(analytics.total_revenue || 0).toLocaleString()}</p>
                <span className="status-up">+18.2%</span>
                <Sparkline color="#22d3ee" />
              </div>
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">User Signups</p>
                <p className="text-4xl font-black text-white">{analytics.total_users || 0}</p>
                <span className="status-up">+12.4%</span>
                <Sparkline color="#60a5fa" />
              </div>
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">Ad Submissions</p>
                <p className="text-4xl font-black text-white">{analytics.total_ads || 0}</p>
                <span className="status-up">+24.6%</span>
                <Sparkline color="#fb923c" />
              </div>
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">Active Campaigns</p>
                <p className="text-4xl font-black text-white">{analytics.published_ads || 0}</p>
                <span className="status-up">+9.1%</span>
                <Sparkline color="#a78bfa" />
              </div>
            </div>

            <div className="chart-box p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="panel-title">Revenue Growth (USD)</p>
                <span className="pill text-xs">Last 30 Days</span>
              </div>
              <svg viewBox="0 0 820 220" className="w-full h-[220px]" fill="none">
                <path d="M0 190 L820 190" stroke="#2d3f63" />
                <path d="M20 170 C 70 150, 110 95, 150 160 C 190 205, 230 80, 270 120 C 310 155, 350 90, 390 40 C 430 20, 470 125, 510 110 C 550 95, 590 170, 630 125 C 670 90, 710 95, 750 140 C 770 160, 790 130, 810 100" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-xs text-slate-300/65 mb-2">Performance Overview</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><LineChart size={14} /> Recent activity</span><span className="status-up">Status</span></p>
                  <p className="text-slate-300/65">Adflow Pro active since 4 months ago</p>
                </div>
              </div>
              <div className="card p-4">
                <p className="text-xs text-slate-300/65 mb-2">Platform Usage</p>
                {[['Campaigns', 40], ['Performance', 30], ['Monetization', 20]].map(([name, val]) => (
                  <div key={String(name)} className="mb-2">
                    <div className="flex justify-between text-xs mb-1"><span>{name}</span><span>{val}%</span></div>
                    <div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-cyan-400" style={{ width: `${val}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="card p-4">
                <p className="text-xs text-slate-300/65 mb-2">Top Advertisers</p>
                {['First Corps', 'Company Stars', 'Retail Nova'].map((n, i) => (
                  <p key={n} className="text-sm text-slate-200 py-1">{i + 1}. {n}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="card p-8 text-center text-slate-300/70">No pending payments.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="card p-4 flex flex-col md:flex-row gap-3 md:items-center">
                  <div className="flex-1">
                    <p className="text-slate-100 font-semibold">{p.ad?.title}</p>
                    <p className="text-xs text-slate-300/65 mt-1">
                      {p.user?.full_name} | ${p.amount} | {p.package?.name} | {p.payment_method}
                    </p>
                  </div>
                  {p.proof_url && (
                    <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-cyan-300 text-xs hover:underline">
                      View proof
                    </a>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyPayment(p.id, 'verify')}
                      disabled={acting === p.id}
                      className="btn-primary text-xs inline-flex items-center gap-1"
                    >
                      <CheckCircle size={12} /> Verify
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(p.id, 'reject')}
                      disabled={acting === p.id}
                      className="btn-danger text-xs inline-flex items-center gap-1"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'publish' && (
          <div className="card p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-2 text-cyan-300">
              <Megaphone size={16} />
              Publish Pipeline
            </div>
            <p className="text-slate-300/75">Verify payment entries first. Payment-verified ads move into publishing queue automatically.</p>
            <p className="text-xs text-slate-300/55 mt-2">Endpoint available: /api/admin/ads/:id/publish</p>
          </div>
        )}
      </div>
    </div>
  );
}
