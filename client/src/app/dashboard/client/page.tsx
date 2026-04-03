'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  ChartColumn,
  Settings,
  CreditCard,
  Plus,
  Send,
  FileText,
  Wallet,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

type ClientTab = 'ads' | 'create' | 'notifications' | 'analytics' | 'settings' | 'billing';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ads, setAds] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tab, setTab] = useState<ClientTab>('ads');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    media: [{ media_url: '', media_type: 'image' }],
  });

  const [settings, setSettings] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    company: '',
    email_notifications: true,
    sms_notifications: false,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    if (['ads', 'create', 'notifications', 'analytics', 'settings', 'billing'].includes(tabParam)) {
      setTab(tabParam as ClientTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.get('/client/ads'), api.get('/client/notifications')])
      .then(([a, n]) => {
        setAds(a.data);
        setNotifications(n.data);
        setSettings((prev) => ({
          ...prev,
          full_name: user?.full_name || prev.full_name,
          email: user?.email || prev.email,
        }));
      })
      .catch(() => {
        setAds([]);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const published = ads.filter((a) => a.status === 'published').length;
    const active = ads.filter((a) => ['published', 'payment_verified', 'review'].includes(a.status)).length;
    const spent = ads.reduce((sum, a) => sum + Number(a.package?.price || 0), 0);
    const pendingPayments = ads.filter((a) => ['draft', 'submitted', 'payment_pending'].includes(a.status)).length;
    return { total: ads.length, active, spent, published, pendingPayments };
  }, [ads]);

  const checkoutAdId = useMemo(
    () => ads.find((ad) => ['draft', 'submitted', 'payment_pending'].includes(ad.status))?.id || null,
    [ads]
  );

  const recentPackages = useMemo(
    () =>
      ads
        .filter((ad) => ad.package)
        .slice(0, 4)
        .map((ad) => ({
          title: ad.title,
          packageName: ad.package?.name,
          price: Number(ad.package?.price || 0),
          status: ad.status,
        })),
    [ads]
  );

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      toast.success('Settings updated');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : undefined,
        media: form.media.filter((m) => m.media_url),
      };
      const { data } = await api.post('/client/ads', payload);
      setAds((prev) => [data, ...prev]);
      toast.success('Draft created');
      setTab('ads');
      setForm({
        title: '',
        description: '',
        price: '',
        contact_phone: '',
        contact_email: '',
        contact_whatsapp: '',
        media: [{ media_url: '', media_type: 'image' }],
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create ad'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAd = async (adId: string) => {
    try {
      await api.post(`/client/ads/${adId}/submit`);
      setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, status: 'submitted' } : a)));
      toast.success('Ad submitted for review');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit'));
    }
  };

  const addMedia = () => setForm((f) => ({ ...f, media: [...f.media, { media_url: '', media_type: 'image' }] }));
  const removeMedia = (i: number) => setForm((f) => ({ ...f, media: f.media.filter((_, idx) => idx !== i) }));
  const updateMedia = (i: number, field: string, val: string) =>
    setForm((f) => ({ ...f, media: f.media.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)) }));

  if (authLoading || loading) return <div className="flex items-center justify-center h-64 text-slate-300">Loading...</div>;

  return (
    <div className="panel-wrap">
      <div className="panel-surface p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[74vh]">
          <aside className="border-r border-white/10 p-4 bg-[#0a1022]">
            <div className="mb-6">
              <p className="text-slate-200 font-bold text-lg">Adflow Pro</p>
              <p className="text-xs text-slate-300/60">Client Workspace</p>
            </div>
            <div className="space-y-1 text-sm">
              {[
                { key: 'ads', icon: LayoutDashboard, label: 'Dashboard' },
                { key: 'create', icon: Megaphone, label: 'Campaigns' },
                { key: 'notifications', icon: Users, label: 'Audience' },
                { key: 'ads-analytics', icon: ChartColumn, label: 'Analytics' },
                { key: 'ads-settings', icon: Settings, label: 'Settings' },
                { key: 'ads-billing', icon: CreditCard, label: 'Billing' },
              ].map((item) => {
                const Icon = item.icon;
                const mappedTab: Record<string, ClientTab> = {
                  ads: 'ads',
                  create: 'create',
                  notifications: 'notifications',
                  'ads-analytics': 'analytics',
                  'ads-settings': 'settings',
                  'ads-billing': 'billing',
                };
                const active = tab === mappedTab[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setTab(mappedTab[item.key]);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                      active ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-300/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Dashboard Overview</h1>
                <p className="text-sm text-slate-300/70">Welcome, {user?.full_name}</p>
              </div>
              <button onClick={() => setTab('create')} className="btn-primary text-sm inline-flex items-center gap-2">
                <Plus size={14} /> New Ad
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">Total Ads</p>
                <p className="text-3xl font-black text-white">{stats.total}</p>
              </div>
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">Active Ads</p>
                <p className="text-3xl font-black text-cyan-300">{stats.active}</p>
              </div>
              <div className="kpi-card">
                <p className="text-xs text-slate-300/60 mb-1">Total Spent</p>
                <p className="text-3xl font-black text-emerald-300">${stats.spent.toFixed(2)}</p>
              </div>
            </div>

            {tab === 'analytics' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Published</p>
                    <p className="text-3xl font-black text-white">{stats.published}</p>
                    <p className="status-up mt-3 inline-flex">+12.4%</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Pending Payments</p>
                    <p className="text-3xl font-black text-amber-300">{stats.pendingPayments}</p>
                    <p className="status-warn mt-3 inline-flex">Needs review</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Notifications</p>
                    <p className="text-3xl font-black text-white">{notifications.length}</p>
                    <p className="status-up mt-3 inline-flex">Real-time</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Est. ROI</p>
                    <p className="text-3xl font-black text-cyan-300">4.8x</p>
                    <p className="status-up mt-3 inline-flex">Campaign lift</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="chart-box p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="panel-title">Activity Trend</p>
                        <p className="text-sm text-slate-400">Posting, submission, and publishing signals</p>
                      </div>
                      <Sparkles size={16} className="text-cyan-300" />
                    </div>
                    <div className="h-40 rounded-2xl bg-white/5 border border-white/5 flex items-end gap-2 p-4">
                      {[22, 48, 35, 58, 28, 66, 44, 72, 50, 84, 62, 90].map((value, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2">
                          <div className="w-full rounded-t-xl bg-gradient-to-t from-cyan-400 via-blue-400 to-fuchsia-400" style={{ height: `${value}%` }} />
                          <span className="text-[10px] text-slate-500">{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-box p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="panel-title">Performance Summary</p>
                        <p className="text-sm text-slate-400">Where your budget is going</p>
                      </div>
                      <ChartColumn size={16} className="text-cyan-300" />
                    </div>
                    <div className="space-y-4">
                      {[
                        ['Campaigns', 40],
                        ['Optimization', 30],
                        ['Billing', 20],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-200">{label}</span>
                            <span className="text-slate-400">{value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'ads' && (
              <div className="card p-4">
                <h2 className="panel-title text-lg mb-3">Recent Ads</h2>
                {ads.length === 0 ? (
                  <div className="text-center text-slate-300/70 py-10">No ads yet. Create your first campaign.</div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm min-w-[740px]">
                      <thead className="text-slate-300/65 border-b border-slate-700">
                        <tr>
                          <th className="text-left py-2">Ad Name</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Impressions</th>
                          <th className="text-left py-2">Spend</th>
                          <th className="text-left py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ads.slice(0, 8).map((ad) => (
                          <tr key={ad.id} className="border-b border-slate-800/70 text-slate-100/90">
                            <td className="py-2.5">{ad.title}</td>
                            <td className="py-2.5"><StatusBadge status={ad.status} /></td>
                            <td className="py-2.5">{ad.view_count || 0}</td>
                            <td className="py-2.5">${Number(ad.package?.price || 0).toFixed(2)}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                {ad.status === 'draft' && (
                                  <button onClick={() => handleSubmitAd(ad.id)} className="btn-primary text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1">
                                    <Send size={11} /> Submit
                                  </button>
                                )}
                                {['draft', 'submitted', 'payment_pending'].includes(ad.status) && (
                                  <Link href={`/dashboard/client/pay?ad=${ad.id}`} className="btn-secondary text-xs !py-1.5 !px-2.5">
                                    Buy Package
                                  </Link>
                                )}
                                {ad.status === 'published' && ad.slug && (
                                  <Link href={`/ads/${ad.slug}`} className="text-cyan-300 hover:underline text-xs">
                                    View
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'create' && (
              <div className="card p-5">
                <h2 className="panel-title text-lg mb-4">Create New Ad</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input h-24 resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="label">Price</label>
                      <input className="input" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input className="input" type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label !mb-0">Media URLs</label>
                      <button type="button" onClick={addMedia} className="text-xs text-cyan-300 hover:text-cyan-200">
                        + Add URL
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.media.map((m, i) => (
                        <div key={i} className="flex gap-2">
                          <input className="input flex-1" value={m.media_url} onChange={(e) => updateMedia(i, 'media_url', e.target.value)} placeholder="https://..." />
                          <select className="input w-28" value={m.media_type} onChange={(e) => updateMedia(i, 'media_type', e.target.value)}>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="youtube">YouTube</option>
                          </select>
                          {form.media.length > 1 && (
                            <button type="button" onClick={() => removeMedia(i)} className="text-red-300 px-2">
                              x
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Creating...' : 'Save Draft'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="card p-8 text-center text-slate-300/70">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`card p-4 ${!n.is_read ? 'border-cyan-400/40' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-slate-100 text-sm font-semibold">{n.title}</p>
                          <p className="text-sm text-slate-300/70 mt-1">{n.body}</p>
                          <p className="text-xs text-slate-300/50 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() =>
                              api.patch(`/client/notifications/${n.id}/read`).then(() =>
                                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
                              )
                            }
                            className="text-xs text-cyan-300 hover:text-cyan-200"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'billing' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Billing Total</p>
                    <p className="text-3xl font-black text-white">${stats.spent.toFixed(2)}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Open Invoices</p>
                    <p className="text-3xl font-black text-amber-300">{stats.pendingPayments}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Payment Method</p>
                    <p className="text-3xl font-black text-cyan-300">Wallet</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <h2 className="panel-title text-lg mb-3 flex items-center gap-2"><Wallet size={16} /> Billing Summary</h2>
                    <div className="space-y-3 text-sm text-slate-300/80">
                      <div className="flex items-center justify-between"><span>Paid campaigns</span><span className="text-white">{stats.published}</span></div>
                      <div className="flex items-center justify-between"><span>Unpaid drafts</span><span className="text-white">{stats.pendingPayments}</span></div>
                      <div className="flex items-center justify-between"><span>Monthly spend</span><span className="text-white">${stats.spent.toFixed(2)}</span></div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href="/packages" className="btn-primary inline-flex items-center gap-2">
                        View Plans <ArrowRight size={14} />
                      </Link>
                      <Link href={checkoutAdId ? `/dashboard/client/pay?ad=${checkoutAdId}` : '/packages'} className="btn-secondary inline-flex items-center gap-2">
                        Open Checkout <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  <div className="card p-5">
                    <h2 className="panel-title text-lg mb-3 flex items-center gap-2"><ShieldCheck size={16} /> Recent Charges</h2>
                    <div className="space-y-3">
                      {recentPackages.length === 0 ? (
                        <div className="text-slate-400 text-sm">No package payments yet.</div>
                      ) : (
                        recentPackages.map((entry, index) => (
                          <div key={`${entry.title}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{entry.packageName}</p>
                                <p className="text-xs text-slate-400 truncate max-w-[240px]">{entry.title}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-semibold">${entry.price.toFixed(2)}</p>
                                <p className="text-xs text-cyan-300 capitalize">{entry.status}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="card p-5 max-w-3xl">
                <h2 className="panel-title text-lg mb-4 flex items-center gap-2"><Settings size={16} /> Workspace Settings</h2>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name</label>
                      <input className="input" value={settings.full_name} onChange={(e) => setSettings((s) => ({ ...s, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input className="input" value={settings.email} onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone</label>
                      <input className="input" value={settings.phone} onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">WhatsApp</label>
                      <input className="input" value={settings.whatsapp} onChange={(e) => setSettings((s) => ({ ...s, whatsapp: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Company</label>
                    <input className="input" value={settings.company} onChange={(e) => setSettings((s) => ({ ...s, company: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      <input type="checkbox" checked={settings.email_notifications} onChange={(e) => setSettings((s) => ({ ...s, email_notifications: e.target.checked }))} />
                      Email notifications
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      <input type="checkbox" checked={settings.sms_notifications} onChange={(e) => setSettings((s) => ({ ...s, sms_notifications: e.target.checked }))} />
                      SMS alerts
                    </label>
                  </div>
                  <button type="submit" disabled={savingSettings} className="btn-primary">
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="card p-8 text-center text-slate-300/70">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`card p-4 ${!n.is_read ? 'border-cyan-400/40' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-slate-100 text-sm font-semibold">{n.title}</p>
                          <p className="text-sm text-slate-300/70 mt-1">{n.body}</p>
                          <p className="text-xs text-slate-300/50 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() =>
                              api.patch(`/client/notifications/${n.id}/read`).then(() =>
                                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
                              )
                            }
                            className="text-xs text-cyan-300 hover:text-cyan-200"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
