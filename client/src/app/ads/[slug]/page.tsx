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
} from 'lucide-react';
import Link from 'next/link';

type AdDetails = {
  id: string;
  slug: string;
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
  } | null;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
};

export default function AdDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [ad, setAd] = useState<AdDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        const detailRes = await fetch(`/api/ads/${slug}`, { cache: 'no-store' });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setAd(detailData);
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
                PKR {ad.price.toLocaleString()}
              </p>
            )}

            <div className="flex gap-2 flex-wrap mt-3">
              {ad.category && (
                <span className="badge-draft flex items-center gap-1">
                  <Tag size={10} />
                  {ad.category.name}
                </span>
              )}
              {ad.city && (
                <span className="badge-draft flex items-center gap-1">
                  <MapPin size={10} />
                  {ad.city.name}
                </span>
              )}
              {ad.package?.name && <span className="badge-featured">{ad.package.name}</span>}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
              <Eye size={12} /> {ad.view_count || 0} views
              {ad.published_at && <>· {new Date(ad.published_at).toLocaleDateString()}</>}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Owner Details</p>
            <p className="text-white font-medium">{ad.seller?.full_name || 'Adflow Verified Seller'}</p>
            {ad.seller?.member_since && (
              <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                <CalendarClock size={12} /> Member since{' '}
                {new Date(ad.seller.member_since).toLocaleDateString()}
              </p>
            )}
            <div className="space-y-2">
              {(ad.contact_phone || ad.contact_whatsapp) && (
                <a
                  href={`tel:${ad.contact_phone || ad.contact_whatsapp}`}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition"
                >
                  <PhoneCall size={14} /> {ad.contact_phone || ad.contact_whatsapp}
                </a>
              )}
              {(ad.contact_email || ad.seller?.email) && (
                <a
                  href={`mailto:${ad.contact_email || ad.seller?.email}`}
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
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition"
                >
                  <MessageCircle size={14} /> WhatsApp Chat
                </a>
              )}
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
        </div>
      </div>

      {ad.description && (
        <div className="card p-6 mt-8">
          <h2 className="font-semibold text-white mb-3">Description</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
        </div>
      )}
    </div>
  );
}
