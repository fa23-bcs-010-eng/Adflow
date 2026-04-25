'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  MessageSquare,
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
  ShoppingBag,
  Store,
  Star,
  Rocket,
  Siren,
  SearchCheck,
  ShieldAlert,
  Truck,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

type ClientTab = 'ads' | 'create' | 'notifications' | 'analytics' | 'settings' | 'billing' | 'orders' | 'offers';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [buyingOrders, setBuyingOrders] = useState<any[]>([]);
  const [sellingOrders, setSellingOrders] = useState<any[]>([]);
  const [sentOffers, setSentOffers] = useState<any[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>({});
  const [sellerAnalytics, setSellerAnalytics] = useState<any>({ summary: {}, listings: [] });
  const [promotions, setPromotions] = useState<any[]>([]);
  const [listingInsight, setListingInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [escrowByOrder, setEscrowByOrder] = useState<Record<string, any>>({});
  const [shipmentByOrder, setShipmentByOrder] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<ClientTab>('ads');
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; title: string; body: string }>>({});

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
    if (typeof window === 'undefined') return;
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (!tabParam) return;
    if (['ads', 'create', 'notifications', 'analytics', 'settings', 'billing', 'orders', 'offers'].includes(tabParam)) {
      setTab(tabParam as ClientTab);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      api.get('/client/ads'),
      api.get('/client/notifications'),
      api.get('/client/saved-searches'),
      api.get('/client/orders?mode=buying'),
      api.get('/client/orders?mode=selling'),
      api.get('/client/offers?mode=sent'),
      api.get('/client/offers?mode=received'),
      api.get('/client/analytics'),
      api.get('/client/promotions'),
    ])
      .then(([a, n, saved, buying, selling, sent, received, analyticsRes, promotionsRes]) => {
        setAds(a.status === 'fulfilled' ? a.value.data : []);
        setNotifications(n.status === 'fulfilled' ? n.value.data : []);
        setSavedSearches(saved.status === 'fulfilled' ? saved.value.data : []);
        setBuyingOrders(buying.status === 'fulfilled' ? buying.value.data : []);
        setSellingOrders(selling.status === 'fulfilled' ? selling.value.data : []);
        setSentOffers(sent.status === 'fulfilled' ? sent.value.data : []);
        setReceivedOffers(received.status === 'fulfilled' ? received.value.data : []);
        setSellerAnalytics(analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : { summary: {}, listings: [] });
        setPromotions(promotionsRes.status === 'fulfilled' ? promotionsRes.value.data : []);
        setOrdersLoading(false);
        setSettings((prev) => ({
          ...prev,
          full_name: user?.full_name || prev.full_name,
          email: user?.email || prev.email,
        }));
      })
      .catch(() => {
        setAds([]);
        setNotifications([]);
        setSavedSearches([]);
        setBuyingOrders([]);
        setSellingOrders([]);
        setSentOffers([]);
        setReceivedOffers([]);
        setSellerAnalytics({ summary: {}, listings: [] });
        setPromotions([]);
        setOrdersLoading(false);
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

  const isBuyerAccount = user?.role === 'client' && user?.account_type === 'buyer';
  const isSellerAccount = user?.role !== 'client' || user?.account_type !== 'buyer';

  useEffect(() => {
    if (!isBuyerAccount) return;
    if (['create', 'analytics', 'billing'].includes(tab)) {
      setTab('ads');
    }
  }, [isBuyerAccount, tab]);

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
      const { data } = await api.post(`/client/ads/${adId}/submit`);
      setAds((prev) =>
        prev.map((a) =>
          a.id === adId
            ? {
                ...a,
                status: data.status,
                is_featured: data.is_featured,
                published_at: data.published_at,
                moderator_note: data.moderator_note,
              }
            : a
        )
      );
      if (data.ai_assessment?.moderation_decision === 'approve') {
        toast.success('Ad passed AI checks and is now live');
      } else {
        toast.success(`Ad routed to ${data.status.replace('_', ' ')} after AI review`);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit'));
    }
  };

  const handlePromotion = async (adId: string, promotionType: 'boost' | 'urgent' | 'top_search') => {
    try {
      const { data } = await api.post('/client/promotions', { ad_id: adId, promotion_type: promotionType });
      setPromotions((prev) => [data, ...prev]);
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === adId
            ? {
                ...ad,
                is_featured: promotionType === 'top_search' ? true : ad.is_featured,
              }
            : ad
        )
      );
      toast.success(`${promotionType.replace('_', ' ')} enabled`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to activate promotion'));
    }
  };

  const handleSellerOrderStatus = async (orderId: string, status: 'confirmed' | 'processing' | 'shipped' | 'delivered') => {
    try {
      await api.patch(`/client/orders/${orderId}/status`, { status });
      setSellingOrders((prev) =>
        prev.map((item) =>
          item.order_id === orderId
            ? { ...item, orders: { ...item.orders, status } }
            : item
        )
      );
      toast.success(`Order marked ${status}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update order status'));
    }
  };

  const handleSubmitReview = async (orderId: string, item: any) => {
    const draft = reviewDrafts[orderId];
    if (!draft || !draft.rating) {
      toast.error('Please select rating first.');
      return;
    }
    try {
      await api.post('/reviews', {
        order_id: orderId,
        ad_id: item.ad_id,
        seller_id: item.seller_id,
        rating: draft.rating,
        title: draft.title,
        body: draft.body,
      });
      toast.success('Review submitted');
      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit review'));
    }
  };

  const handleGenerateInsights = async () => {
    setLoadingInsight(true);
    try {
      const { data } = await api.post('/ai/listing-insights', {
        title: form.title,
        description: form.description,
        price: form.price ? parseFloat(form.price) : undefined,
        mediaCount: form.media.filter((m) => m.media_url).length,
      });
      setListingInsight(data);
      if (!form.price && data?.suggested_price) {
        setForm((prev) => ({ ...prev, price: String(data.suggested_price) }));
      }
      toast.success('AI suggestions ready');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to generate AI suggestions'));
    } finally {
      setLoadingInsight(false);
    }
  };

  const loadEscrow = async (orderId: string) => {
    try {
      const { data } = await api.get(`/client/orders/${orderId}/escrow`);
      setEscrowByOrder((prev) => ({ ...prev, [orderId]: data }));
    } catch {
      // Keep UI usable if escrow is missing.
    }
  };

  const loadShipment = async (orderId: string) => {
    try {
      const { data } = await api.get(`/client/orders/${orderId}/logistics`);
      setShipmentByOrder((prev) => ({ ...prev, [orderId]: data }));
    } catch {
      // Keep UI usable if shipment is missing.
    }
  };

  const handleReleaseEscrow = async (orderId: string) => {
    try {
      const { data } = await api.patch(`/client/orders/${orderId}/escrow`, { action: 'release' });
      setEscrowByOrder((prev) => ({ ...prev, [orderId]: data }));
      toast.success('Escrow released to seller');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to release escrow'));
    }
  };

  const handleCreateShipment = async (orderId: string) => {
    try {
      const { data } = await api.post(`/client/orders/${orderId}/logistics`, { action: 'create', destination_city: 'Buyer destination' });
      setShipmentByOrder((prev) => ({ ...prev, [orderId]: data }));
      toast.success('Shipment created');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create shipment'));
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject' | 'counter' | 'withdraw') => {
    try {
      const payload: Record<string, any> = { action };
      if (action === 'counter') {
        const counterRaw = counterDrafts[offerId];
        const counterPrice = Number(counterRaw);
        if (!counterPrice || counterPrice <= 0) {
          toast.error('Enter a valid counter amount first.');
          return;
        }
        payload.counter_price = counterPrice;
      }

      const { data } = await api.patch(`/client/offers/${offerId}`, payload);
      setSentOffers((prev) => prev.map((item) => (item.id === offerId ? { ...item, ...data } : item)));
      setReceivedOffers((prev) => prev.map((item) => (item.id === offerId ? { ...item, ...data } : item)));
      toast.success(`Offer ${action}ed`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update offer'));
    }
  };

  useEffect(() => {
    const deliveredOrders = buyingOrders.filter((order) => String(order.status) === 'delivered');
    deliveredOrders.forEach((order) => {
      if (!escrowByOrder[order.id]) {
        loadEscrow(order.id);
      }
      if (!shipmentByOrder[order.id]) {
        loadShipment(order.id);
      }
    });
  }, [buyingOrders]);

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
                { key: 'ads', icon: LayoutDashboard, label: isBuyerAccount ? 'Buyer Home' : 'Dashboard', visible: true },
                { key: 'create', icon: Megaphone, label: 'Campaigns', visible: isSellerAccount },
                { key: 'notifications', icon: Users, label: isBuyerAccount ? 'Alerts' : 'Audience', visible: true },
                { key: 'orders', icon: ShoppingBag, label: 'Orders', visible: true },
                { key: 'offers', icon: MessageSquare, label: 'Offers', visible: true },
                { key: 'ads-analytics', icon: ChartColumn, label: 'Analytics', visible: isSellerAccount },
                { key: 'ads-settings', icon: Settings, label: 'Settings', visible: true },
                { key: 'ads-billing', icon: CreditCard, label: 'Billing', visible: isSellerAccount },
              ].filter((item) => item.visible).map((item) => {
                const Icon = item.icon;
                const mappedTab: Record<string, ClientTab> = {
                  ads: 'ads',
                  create: 'create',
                  notifications: 'notifications',
                  orders: 'orders',
                  offers: 'offers',
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
                <h1 className="text-2xl font-bold text-slate-100">{isBuyerAccount ? 'Buyer Workspace' : 'Dashboard Overview'}</h1>
                <p className="text-sm text-slate-300/70">
                  Welcome, {user?.full_name}{user?.role === 'client' ? ` | ${isBuyerAccount ? 'Buyer' : 'Seller'} account` : ''}
                </p>
              </div>
              {isSellerAccount ? (
                <button onClick={() => setTab('create')} className="btn-primary text-sm inline-flex items-center gap-2">
                  <Plus size={14} /> New Ad
                </button>
              ) : (
                <Link href="/explore" className="btn-primary text-sm inline-flex items-center gap-2">
                  <ShoppingBag size={14} /> Start Buying
                </Link>
              )}
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
                    <p className="text-3xl font-black text-white">{sellerAnalytics.summary?.published_ads || stats.published}</p>
                    <p className="status-up mt-3 inline-flex">+12.4%</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Chats</p>
                    <p className="text-3xl font-black text-amber-300">{sellerAnalytics.summary?.total_chats || 0}</p>
                    <p className="status-warn mt-3 inline-flex">Buyer interest</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Cart Adds</p>
                    <p className="text-3xl font-black text-white">{sellerAnalytics.summary?.total_cart_adds || 0}</p>
                    <p className="status-up mt-3 inline-flex">Intent signal</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Purchases</p>
                    <p className="text-3xl font-black text-cyan-300">{sellerAnalytics.summary?.total_purchases || 0}</p>
                    <p className="status-up mt-3 inline-flex">Revenue events</p>
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
                        <p className="panel-title">Marketplace Performance</p>
                        <p className="text-sm text-slate-400">Views, reviews, and revenue quality</p>
                      </div>
                      <ChartColumn size={16} className="text-cyan-300" />
                    </div>
                    <div className="space-y-4">
                      {[
                        ['Views', Math.min(Math.max(Number(sellerAnalytics.summary?.total_views || 0), 8), 100)],
                        ['Purchases', Math.min(Math.max(Number(sellerAnalytics.summary?.total_purchases || 0) * 10, 6), 100)],
                        ['Reviews', Math.min(Math.max(Number(sellerAnalytics.summary?.average_rating || 0) * 18, 6), 100)],
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Revenue</p>
                    <p className="text-3xl font-black text-emerald-300">PKR {Number(sellerAnalytics.summary?.total_revenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Average Rating</p>
                    <p className="text-3xl font-black text-white">{Number(sellerAnalytics.summary?.average_rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Reviews</p>
                    <p className="text-3xl font-black text-white">{sellerAnalytics.summary?.total_reviews || 0}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Active Promotions</p>
                    <p className="text-3xl font-black text-cyan-300">{promotions.filter((item) => item.status === 'active').length}</p>
                  </div>
                </div>

                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="panel-title text-lg">Top Listing Performance</h2>
                    <span className="text-xs text-slate-400">Views, chats, carts, purchases</span>
                  </div>
                  <div className="space-y-3">
                    {(sellerAnalytics.listings || []).slice(0, 6).map((listing: any) => (
                      <div key={listing.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-semibold text-white">{listing.title}</p>
                          <StatusBadge status={listing.status} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-300/75">
                          <span>Views: {listing.analytics?.views || 0}</span>
                          <span>Chats: {listing.analytics?.chats || 0}</span>
                          <span>Cart Adds: {listing.analytics?.cart_adds || 0}</span>
                          <span>Purchases: {listing.analytics?.purchases || 0}</span>
                          <span>Revenue: PKR {Number(listing.analytics?.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ads' && (
              isBuyerAccount ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="kpi-card">
                      <p className="text-xs text-slate-300/60 mb-1">Saved Alerts</p>
                      <p className="text-3xl font-black text-white">{savedSearches.length}</p>
                    </div>
                    <div className="kpi-card">
                      <p className="text-xs text-slate-300/60 mb-1">My Purchases</p>
                      <p className="text-3xl font-black text-cyan-300">{buyingOrders.length}</p>
                    </div>
                    <div className="kpi-card">
                      <p className="text-xs text-slate-300/60 mb-1">Offers Sent</p>
                      <p className="text-3xl font-black text-amber-300">{sentOffers.length}</p>
                    </div>
                  </div>

                  <div className="card p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="panel-title text-lg">Buyer Quick Actions</h2>
                      <Link href="/explore" className="text-cyan-300 hover:underline text-sm">Explore listings</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-white mb-2">Saved Search Alerts</p>
                        {savedSearches.length === 0 ? (
                          <p className="text-sm text-slate-400">No saved alerts yet. Save a search from Explore to get instant matching updates.</p>
                        ) : (
                          <div className="space-y-2">
                            {savedSearches.slice(0, 4).map((item) => (
                              <div key={item.id} className="text-sm text-slate-200">
                                {(item.query || 'Any')} | {item.category_slug || 'all-categories'} | {item.city_slug || 'all-cities'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-white mb-2">Recent Buyer Activity</p>
                        <div className="space-y-2 text-sm text-slate-300">
                          <p>Purchases placed: {buyingOrders.length}</p>
                          <p>Offers in negotiation: {sentOffers.filter((item) => ['pending', 'countered'].includes(String(item.status))).length}</p>
                          <p>Unread alerts: {notifications.filter((item) => !item.is_read).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
                                      <Send size={11} /> Publish
                                    </button>
                                  )}
                                  {['draft', 'submitted', 'payment_pending'].includes(ad.status) && (
                                    <Link href={`/dashboard/client/pay?ad=${ad.id}`} className="btn-secondary text-xs !py-1.5 !px-2.5">
                                      Buy Package
                                    </Link>
                                  )}
                                  {ad.status === 'published' && ad.slug && (
                                    <>
                                      <Link href={`/ads/${ad.slug}`} className="text-cyan-300 hover:underline text-xs">
                                        View
                                      </Link>
                                      <button onClick={() => handlePromotion(ad.id, 'boost')} className="btn-secondary text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1">
                                        <Rocket size={11} /> Boost
                                      </button>
                                      <button onClick={() => handlePromotion(ad.id, 'urgent')} className="btn-secondary text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1">
                                        <Siren size={11} /> Urgent
                                      </button>
                                      <button onClick={() => handlePromotion(ad.id, 'top_search')} className="btn-secondary text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1">
                                        <SearchCheck size={11} /> Top Search
                                      </button>
                                    </>
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
              )
            )}

            {tab === 'create' && isSellerAccount && (
              <div className="card p-5">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <h2 className="panel-title text-lg">Create New Ad</h2>
                  <button type="button" onClick={handleGenerateInsights} disabled={loadingInsight} className="btn-secondary text-sm inline-flex items-center gap-2">
                    <Sparkles size={14} /> {loadingInsight ? 'Analyzing...' : 'AI Suggest Price'}
                  </button>
                </div>
                {listingInsight && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Suggested Price</p>
                        <p className="text-lg font-bold text-cyan-300">PKR {Number(listingInsight.suggested_price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Range</p>
                        <p className="text-sm text-slate-200">
                          PKR {Number(listingInsight.suggested_price_min || 0).toLocaleString()} - {Number(listingInsight.suggested_price_max || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Quality Score</p>
                        <p className="text-lg font-bold text-white">{listingInsight.quality_score || 0}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Risk Score</p>
                        <p className={`text-lg font-bold ${Number(listingInsight.risk_score || 0) >= 70 ? 'text-red-300' : Number(listingInsight.risk_score || 0) >= 35 ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {listingInsight.risk_score || 0}/100
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300/80 mt-3">{listingInsight.reasoning}</p>
                  </div>
                )}
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

            {tab === 'orders' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Buying Orders</p>
                    <p className="text-3xl font-black text-white">{buyingOrders.length}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Selling Orders</p>
                    <p className="text-3xl font-black text-cyan-300">{sellingOrders.length}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Pending Orders</p>
                    <p className="text-3xl font-black text-amber-300">
                      {buyingOrders.filter((order) => order.status === 'placed').length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <h2 className="panel-title text-lg mb-4 inline-flex items-center gap-2">
                      <ShoppingBag size={16} /> My Purchases
                    </h2>
                    {ordersLoading ? (
                      <p className="text-slate-400 text-sm">Loading buying orders...</p>
                    ) : buyingOrders.length === 0 ? (
                      <p className="text-slate-400 text-sm">No purchases yet. Buy from Explore Ads marketplace.</p>
                    ) : (
                      <div className="space-y-3">
                        {buyingOrders.slice(0, 8).map((order) => (
                          <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <p className="text-sm font-semibold text-white">Order #{String(order.id).slice(0, 8)}</p>
                              <span className="text-xs text-cyan-300 capitalize">{order.status}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Total: PKR {Number(order.total_amount || 0).toLocaleString()} | Items: {(order.items || []).length}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="inline-flex items-center gap-2 text-xs text-slate-400 mb-1"><Landmark size={12} /> Escrow</div>
                                <p className="text-sm text-white capitalize">{escrowByOrder[order.id]?.status || 'Loading...'}</p>
                                {escrowByOrder[order.id]?.risk_score !== undefined && (
                                  <p className="text-xs text-slate-400 mt-1">Risk: {escrowByOrder[order.id].risk_score}/100</p>
                                )}
                                {String(order.status) === 'delivered' && String(escrowByOrder[order.id]?.status || '') === 'held' && (
                                  <button onClick={() => handleReleaseEscrow(order.id)} className="btn-primary text-xs mt-2">
                                    Release Escrow
                                  </button>
                                )}
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="inline-flex items-center gap-2 text-xs text-slate-400 mb-1"><Truck size={12} /> Logistics</div>
                                <p className="text-sm text-white capitalize">{shipmentByOrder[order.id]?.status || 'Loading...'}</p>
                                {shipmentByOrder[order.id]?.tracking_number && (
                                  <p className="text-xs text-slate-400 mt-1">Tracking: {shipmentByOrder[order.id].tracking_number}</p>
                                )}
                              </div>
                            </div>
                            {String(order.status) === 'delivered' && (order.items || []).slice(0, 1).map((item: any) => (
                              <div key={item.id} className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="flex items-center gap-2 mb-2 text-sm text-white">
                                  <Star size={14} className="text-amber-300" /> Leave seller review
                                </div>
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => setReviewDrafts((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { title: '', body: '', rating: 0 }), rating } }))}
                                      className={`rounded-lg border px-2 py-1 text-xs ${reviewDrafts[order.id]?.rating === rating ? 'border-amber-300 text-amber-200 bg-amber-400/10' : 'border-white/10 text-slate-300'}`}
                                    >
                                      {rating} Star
                                    </button>
                                  ))}
                                </div>
                                <input
                                  className="input mb-2"
                                  placeholder="Review title"
                                  value={reviewDrafts[order.id]?.title || ''}
                                  onChange={(e) => setReviewDrafts((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { body: '', rating: 0, title: '' }), title: e.target.value } }))}
                                />
                                <textarea
                                  className="input h-20 resize-none"
                                  placeholder="Share your experience with the seller"
                                  value={reviewDrafts[order.id]?.body || ''}
                                  onChange={(e) => setReviewDrafts((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { title: '', rating: 0, body: '' }), body: e.target.value } }))}
                                />
                                <button onClick={() => handleSubmitReview(order.id, item)} className="btn-primary mt-2 text-xs">
                                  Submit Review
                                </button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card p-5">
                    <h2 className="panel-title text-lg mb-4 inline-flex items-center gap-2">
                      <Store size={16} /> Orders On My Ads
                    </h2>
                    {ordersLoading ? (
                      <p className="text-slate-400 text-sm">Loading selling orders...</p>
                    ) : sellingOrders.length === 0 ? (
                      <p className="text-slate-400 text-sm">No buyer orders on your ads yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {sellingOrders.slice(0, 8).map((item) => (
                          <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <p className="text-sm font-semibold text-white line-clamp-1">{item.ad_title}</p>
                              <span className="text-xs text-cyan-300">x{item.quantity}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Buyer: {item.buyer?.full_name || item.buyer?.email || 'Unknown'} | PKR {Number(item.total_price || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-cyan-300 mt-1 capitalize">Status: {item.orders?.status || 'placed'}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3 mt-3">
                              <div className="inline-flex items-center gap-2 text-xs text-slate-400 mb-1"><Truck size={12} /> Shipment</div>
                              <p className="text-sm text-white capitalize">{shipmentByOrder[item.order_id]?.status || 'Quote only'}</p>
                              {shipmentByOrder[item.order_id]?.tracking_number ? (
                                <p className="text-xs text-slate-400 mt-1">Tracking: {shipmentByOrder[item.order_id].tracking_number}</p>
                              ) : (
                                <button onClick={() => handleCreateShipment(item.order_id)} className="btn-secondary text-xs mt-2">
                                  Create Shipment
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {String(item.orders?.status || 'placed') === 'placed' && (
                                <button onClick={() => handleSellerOrderStatus(item.order_id, 'confirmed')} className="btn-secondary text-xs">
                                  Confirm
                                </button>
                              )}
                              {String(item.orders?.status || 'placed') === 'confirmed' && (
                                <button onClick={() => handleSellerOrderStatus(item.order_id, 'processing')} className="btn-secondary text-xs">
                                  Mark Processing
                                </button>
                              )}
                              {['confirmed', 'processing'].includes(String(item.orders?.status || 'placed')) && (
                                <button onClick={() => handleSellerOrderStatus(item.order_id, 'shipped')} className="btn-secondary text-xs">
                                  Mark Shipped
                                </button>
                              )}
                              {String(item.orders?.status || 'placed') === 'shipped' && (
                                <button onClick={() => handleSellerOrderStatus(item.order_id, 'delivered')} className="btn-primary text-xs">
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'offers' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Sent Offers</p>
                    <p className="text-3xl font-black text-white">{sentOffers.length}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Received Offers</p>
                    <p className="text-3xl font-black text-cyan-300">{receivedOffers.length}</p>
                  </div>
                  <div className="kpi-card">
                    <p className="text-xs text-slate-300/60 mb-1">Pending</p>
                    <p className="text-3xl font-black text-amber-300">
                      {receivedOffers.filter((item) => String(item.status) === 'pending').length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <h2 className="panel-title text-lg mb-4">Offers I Sent</h2>
                    {sentOffers.length === 0 ? (
                      <p className="text-slate-400 text-sm">No offers sent yet. Open any ad and use Make Offer.</p>
                    ) : (
                      <div className="space-y-3">
                        {sentOffers.slice(0, 10).map((offer) => (
                          <div key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-sm font-semibold text-white">{offer.ad?.title || 'Listing'}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Offered: PKR {Number(offer.offered_price || 0).toLocaleString()}
                              {offer.counter_price ? ` | Counter: PKR ${Number(offer.counter_price).toLocaleString()}` : ''}
                            </p>
                            <p className="text-xs text-cyan-300 mt-1 capitalize">Status: {offer.status}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(offer.created_at).toLocaleString()}</p>
                            {String(offer.status) === 'pending' && (
                              <button
                                onClick={() => handleOfferAction(offer.id, 'withdraw')}
                                className="btn-secondary text-xs mt-2"
                              >
                                Withdraw
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card p-5">
                    <h2 className="panel-title text-lg mb-4">Offers On My Ads</h2>
                    {receivedOffers.length === 0 ? (
                      <p className="text-slate-400 text-sm">No incoming offers yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {receivedOffers.slice(0, 10).map((offer) => (
                          <div key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-sm font-semibold text-white">{offer.ad?.title || 'Listing'}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Buyer offered PKR {Number(offer.offered_price || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-cyan-300 mt-1 capitalize">Status: {offer.status}</p>
                            {String(offer.status) === 'pending' && (
                              <div className="mt-3 space-y-2">
                                <div className="flex gap-2">
                                  <button onClick={() => handleOfferAction(offer.id, 'accept')} className="btn-primary text-xs">
                                    Accept
                                  </button>
                                  <button onClick={() => handleOfferAction(offer.id, 'reject')} className="btn-secondary text-xs">
                                    Reject
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    className="input text-xs"
                                    placeholder="Counter price"
                                    type="number"
                                    value={counterDrafts[offer.id] || ''}
                                    onChange={(e) =>
                                      setCounterDrafts((prev) => ({ ...prev, [offer.id]: e.target.value }))
                                    }
                                  />
                                  <button onClick={() => handleOfferAction(offer.id, 'counter')} className="btn-secondary text-xs">
                                    Counter
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'billing' && isSellerAccount && (
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
