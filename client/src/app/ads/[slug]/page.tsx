'use client';

import { use, useEffect, useState } from 'react';
import {
  MapPin,
  Tag,
  Eye,
  PhoneCall,
  Mail,
  MessageCircle,
  ArrowLeft,
  CalendarClock,
  ShieldCheck,
  ShoppingCart,
  CreditCard,
  Star,
  Flag,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

type AdDetails = {
  id: string;
  slug: string;
  user_id?: string;
  title: string;
  description?: string;
  price?: number;
  is_featured?: boolean;
  view_count?: number;
  published_at?: string;
  category?: { name: string; slug: string };
  city?: { name: string; slug: string };
  package?: { name: string };
  media?: { media_url: string; is_primary?: boolean }[];
  seller?: {
    full_name?: string;
    email?: string;
    member_since?: string;
    business_name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    is_verified?: boolean;
    published_ads_count?: number;
  } | null;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
};

export default function AdDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [ad, setAd] = useState<AdDetails | null>(null);
  const [reviewsData, setReviewsData] = useState<{ average_rating: number; total_reviews: number; reviews: any[] }>({
    average_rating: 0,
    total_reviews: 0,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [myOffer, setMyOffer] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const requireLoginBeforeContact = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (user) return;
    event.preventDefault();
    toast.error('Please login first, then you can contact the owner.');
    const redirect = encodeURIComponent(`/ads/${slug}`);
    router.push(`/auth/login?next=${redirect}&contact=${encodeURIComponent(href)}`);
  };

  const ensureLoggedInForPurchase = () => {
    if (user) return true;
    toast.error('Please login first to continue purchase.');
    router.push(`/auth/login?next=${encodeURIComponent(`/ads/${slug}`)}`);
    return false;
  };

  useEffect(() => {
    const run = async () => {
      try {
        const detailRes = await fetch(`/api/ads/${slug}`, { cache: 'no-store' });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setAd(detailData);
          try {
            const reviewsRes = await fetch(`/api/reviews?ad_id=${detailData.id}`, { cache: 'no-store' });
            if (reviewsRes.ok) {
              setReviewsData(await reviewsRes.json());
            }
          } catch {
            // Keep page working even if reviews fail.
          }
          setLoading(false);
          return;
        }
      } catch {
        // Try list fallback below.
      }

      try {
        // Fallback: if detail endpoint is unavailable, resolve ad from listing feed.
        const listRes = await fetch('/api/ads?limit=100', { cache: 'no-store' });
        if (!listRes.ok) {
          setAd(null);
          return;
        }
        const listData = (await listRes.json()) as AdDetails[];
        const found = listData.find((item) => item.slug === slug) || null;
        setAd(found);
      } catch {
        setAd(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  useEffect(() => {
    const loadNegotiation = async () => {
      if (!ad?.id || !user || user.id === ad.user_id || String(ad.id).startsWith('demo-')) return;
      setChatLoading(true);
      try {
        const [chatRes, sentOffersRes] = await Promise.allSettled([
          api.get(`/client/chat?ad_id=${ad.id}`),
          api.get('/client/offers?mode=sent'),
        ]);

        if (chatRes.status === 'fulfilled') {
          setChatMessages(chatRes.value.data?.messages || []);
        }
        if (sentOffersRes.status === 'fulfilled') {
          const offers = Array.isArray(sentOffersRes.value.data) ? sentOffersRes.value.data : [];
          const latest = offers.find((item: any) => item.ad_id === ad.id) || null;
          setMyOffer(latest);
        }
      } catch {
        // Keep page responsive even if negotiation API fails.
      } finally {
        setChatLoading(false);
      }
    };

    loadNegotiation();
  }, [ad?.id, ad?.user_id, user?.id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="skeleton h-96 mb-6" />
        <div className="skeleton h-8 w-2/3 mb-4" />
        <div className="skeleton h-4 w-full mb-2" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p className="text-xl">Ad not found or has expired.</p>
        <Link href="/explore" className="text-violet-400 mt-4 inline-block">
          Back to Explore
        </Link>
      </div>
    );
  }

  const media = ad.media || [];
  const current = media[activeImg]?.media_url;
  const primaryImage = media.find((m) => m.is_primary)?.media_url || media[0]?.media_url;
  const isOwnAd = Boolean(user?.id && ad?.user_id && user.id === ad.user_id);
  const isDemoAd = String(ad?.id || '').startsWith('demo-');

  const handleAddToCart = () => {
    if (!ensureLoggedInForPurchase()) return;
    addItem({
      id: ad.id,
      slug: ad.slug,
      title: ad.title,
      price: Number(ad.price || 0),
      image: primaryImage,
    });
    api.post(`/client/ads/${ad.id}/track`, { event_type: 'cart_add', meta: { source: 'ad-detail' } }).catch(() => {});
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    if (!ensureLoggedInForPurchase()) return;
    addItem({
      id: ad.id,
      slug: ad.slug,
      title: ad.title,
      price: Number(ad.price || 0),
      image: primaryImage,
    });
    api.post(`/client/ads/${ad.id}/track`, { event_type: 'cart_add', meta: { source: 'buy-now' } }).catch(() => {});
    router.push('/checkout');
  };

  const handleReportAd = async () => {
    if (!user) {
      toast.error('Please login first to report this ad.');
      router.push(`/auth/login?next=${encodeURIComponent(`/ads/${slug}`)}`);
      return;
    }
    if (!reportReason.trim()) {
      toast.error('Please enter a report reason.');
      return;
    }
    setSubmittingReport(true);
    try {
      await api.post('/client/reports', {
        ad_id: ad.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportReason('');
      setReportDetails('');
      toast.success('Report submitted to moderation');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to submit report'));
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!user) {
      toast.error('Please login first to make an offer.');
      router.push(`/auth/login?next=${encodeURIComponent(`/ads/${slug}`)}`);
      return;
    }
    if (!ad?.id || String(ad.id).startsWith('demo-')) {
      toast.error('Offers are available on live published listings.');
      return;
    }
    const offered = Number(offerPrice);
    if (!offered || offered <= 0) {
      toast.error('Please enter a valid offer price.');
      return;
    }

    setSubmittingOffer(true);
    try {
      const { data } = await api.post('/client/offers', {
        ad_id: ad.id,
        offered_price: offered,
        note: offerNote,
      });
      setMyOffer(data);
      toast.success('Offer submitted to seller');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to submit offer'));
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleSendChat = async () => {
    if (!user) {
      toast.error('Please login first to send a message.');
      router.push(`/auth/login?next=${encodeURIComponent(`/ads/${slug}`)}`);
      return;
    }
    if (!ad?.id || String(ad.id).startsWith('demo-')) {
      toast.error('Chat is available on live published listings.');
      return;
    }
    const message = chatInput.trim();
    if (!message) return;

    setSendingChat(true);
    try {
      await api.post('/client/chat', { ad_id: ad.id, message });
      const { data } = await api.get(`/client/chat?ad_id=${ad.id}`);
      setChatMessages(data?.messages || []);
      setChatInput('');
      toast.success('Message sent');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send message'));
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link
        href="/explore"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 mb-6 transition"
      >
        <ArrowLeft size={14} /> Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="card overflow-hidden mb-3">
            {current ? (
              <img
                src={current}
                alt={ad.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-96 bg-gray-800 flex items-center justify-center text-gray-600">
                No Media
              </div>
            )}
          </div>

          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((m, i) => (
                <button
                  key={`${m.media_url}-${i}`}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                    i === activeImg ? 'border-cyan-500' : 'border-gray-700'
                  }`}
                >
                  <img src={m.media_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            {ad.is_featured && <span className="badge-featured mb-2">Featured</span>}
            <h1 className="text-2xl font-bold text-white mt-1">{ad.title}</h1>
            {ad.price !== undefined && (
              <p className="text-2xl font-black text-cyan-300 mt-1">
                ${ad.price.toLocaleString()}
              </p>
            )}

            <div className="flex gap-2 flex-wrap mt-3">
              {ad.category && (
                <Link href={`/marketplace/${ad.city?.slug || 'all'}/${ad.category.slug}`} className="badge-draft flex items-center gap-1">
                  <Tag size={10} />
                  {ad.category.name}
                </Link>
              )}
              {ad.city && (
                <Link href={`/marketplace/${ad.city.slug}/${ad.category?.slug || 'all'}`} className="badge-draft flex items-center gap-1">
                  <MapPin size={10} />
                  {ad.city.name}
                </Link>
              )}
              {ad.package?.name && <span className="badge-featured">{ad.package.name}</span>}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
              <Eye size={12} /> {ad.view_count || 0} views
              {ad.published_at && <>· {new Date(ad.published_at).toLocaleDateString()}</>}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                <CreditCard size={14} /> Buy Now
              </button>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Owner Details</p>
            <div>
              <p className="text-white font-medium">{ad.seller?.business_name || ad.seller?.full_name || 'Adflow Verified Seller'}</p>
              {ad.seller?.full_name && ad.seller?.business_name && (
                <p className="text-xs text-gray-400 mt-1">{ad.seller.full_name}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ad.seller?.is_verified && (
                <span className="badge-featured inline-flex items-center gap-1">
                  <BadgeCheck size={10} /> Verified Seller
                </span>
              )}
              <span className="badge-draft inline-flex items-center gap-1">
                <Star size={10} /> {reviewsData.average_rating || 0} / 5
              </span>
              <span className="badge-draft">{reviewsData.total_reviews || 0} reviews</span>
            </div>
            {ad.seller?.member_since && (
              <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                <CalendarClock size={12} /> Member since{' '}
                {new Date(ad.seller.member_since).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Published ads: {ad.seller?.published_ads_count || 0}
            </p>
            <div className="space-y-2">
              {(ad.contact_phone || ad.contact_whatsapp) && (
                <a
                  href={`tel:${ad.contact_phone || ad.contact_whatsapp}`}
                  onClick={(e) =>
                    requireLoginBeforeContact(
                      e,
                      `tel:${ad.contact_phone || ad.contact_whatsapp}`
                    )
                  }
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition"
                >
                  <PhoneCall size={14} /> {ad.contact_phone || ad.contact_whatsapp}
                </a>
              )}
              {(ad.contact_email || ad.seller?.email) && (
                <a
                  href={`mailto:${ad.contact_email || ad.seller?.email}`}
                  onClick={(e) =>
                    requireLoginBeforeContact(
                      e,
                      `mailto:${ad.contact_email || ad.seller?.email}`
                    )
                  }
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition"
                >
                  <Mail size={14} /> {ad.contact_email || ad.seller?.email}
                </a>
              )}
              {ad.contact_whatsapp && (
                <a
                  href={`https://wa.me/${ad.contact_whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) =>
                    requireLoginBeforeContact(e, `https://wa.me/${ad.contact_whatsapp}`)
                  }
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition"
                >
                  <MessageCircle size={14} /> WhatsApp Chat
                </a>
              )}
            </div>
            <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 space-y-2">
              <p className="text-xs font-semibold text-red-200 inline-flex items-center gap-1">
                <Flag size={12} /> Report this ad
              </p>
              <input
                className="input"
                placeholder="Reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <textarea
                className="input h-20 resize-none"
                placeholder="Extra details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
              <button onClick={handleReportAd} disabled={submittingReport} className="btn-danger text-xs w-full">
                {submittingReport ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Complete Product Details</p>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                <span className="text-gray-500">Ad ID:</span> {ad.id}
              </p>
              <p>
                <span className="text-gray-500">Category:</span> {ad.category?.name || 'N/A'}
              </p>
              <p>
                <span className="text-gray-500">Location:</span> {ad.city?.name || 'N/A'}
              </p>
              <p>
                <span className="text-gray-500">Package:</span> {ad.package?.name || 'N/A'}
              </p>
              <p>
                <span className="text-gray-500">Posted Date:</span>{' '}
                {ad.published_at ? new Date(ad.published_at).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                <span className="text-gray-500">Listing Status:</span>{' '}
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <ShieldCheck size={13} /> Published & Verified
                </span>
              </p>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Negotiation & Chat</p>
            {!user ? (
              <p className="text-sm text-slate-400">Login first to make offers and chat with owner.</p>
            ) : isOwnAd ? (
              <p className="text-sm text-slate-400">This is your own ad. Buyer negotiation tools are hidden.</p>
            ) : isDemoAd ? (
              <p className="text-sm text-slate-400">Demo listing: offer/chat actions are disabled.</p>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <p className="text-xs text-slate-400">Make Offer</p>
                  <input
                    className="input"
                    type="number"
                    placeholder="Offer amount ($)"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                  <textarea
                    className="input h-20 resize-none"
                    placeholder="Optional note for seller"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                  />
                  <button onClick={handleMakeOffer} disabled={submittingOffer} className="btn-primary text-xs w-full">
                    {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                  </button>
                  {myOffer && (
                    <p className="text-xs text-cyan-300 capitalize">
                      Latest offer status: {myOffer.status}
                      {myOffer.counter_price ? ` | Counter: $${Number(myOffer.counter_price).toLocaleString()}` : ''}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <p className="text-xs text-slate-400">In-app Chat</p>
                  <div className="max-h-44 overflow-auto space-y-2 pr-1">
                    {chatLoading ? (
                      <p className="text-xs text-slate-400">Loading chat...</p>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-xs text-slate-400">No messages yet. Start conversation with seller.</p>
                    ) : (
                      chatMessages.slice(-20).map((msg) => (
                        <div key={msg.id} className="rounded-lg border border-white/10 bg-slate-900/40 p-2">
                          <p className="text-xs text-slate-200">{msg.body}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {msg.sender?.full_name || msg.sender?.email || 'User'} | {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <textarea
                    className="input h-20 resize-none"
                    placeholder="Write your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button onClick={handleSendChat} disabled={sendingChat} className="btn-secondary text-xs w-full">
                    {sendingChat ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {ad.description && (
        <div className="card p-6 mt-8">
          <h2 className="font-semibold text-white mb-3">Description</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
        </div>
      )}

      <div className="card p-6 mt-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-white">Seller Reviews</h2>
          <div className="text-sm text-cyan-300 inline-flex items-center gap-2">
            <Star size={14} className="text-amber-300" />
            {reviewsData.average_rating || 0} / 5 from {reviewsData.total_reviews || 0} buyers
          </div>
        </div>
        {reviewsData.reviews.length === 0 ? (
          <p className="text-gray-400">No buyer reviews yet for this seller on this product.</p>
        ) : (
          <div className="space-y-3">
            {reviewsData.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-white font-medium">{review.title || 'Buyer review'}</p>
                  <span className="text-amber-300 text-sm">{review.rating} / 5</span>
                </div>
                <p className="text-sm text-slate-300/80 mb-2">{review.body || 'Verified buyer shared a rating.'}</p>
                <p className="text-xs text-slate-500">
                  {review.reviewer?.full_name || 'Verified buyer'} | {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
