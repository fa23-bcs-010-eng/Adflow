'use client';

import { use, useEffect, useState } from 'react';
import { MapPin, Tag, Eye, PhoneCall, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get(`/ads/${slug}`).then(r => setAd(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="skeleton h-96 mb-6" />
      <div className="skeleton h-8 w-2/3 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
    </div>
  );

  if (!ad) return (
    <div className="text-center py-24 text-gray-500">
      <p className="text-xl">Ad not found or has expired.</p>
      <Link href="/explore" className="text-violet-400 mt-4 inline-block">← Back to Explore</Link>
    </div>
  );

  const media = ad.media || [];
  const current = media[activeImg]?.media_url;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/explore" className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 mb-6 transition">
        <ArrowLeft size={14} /> Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Media */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden mb-3">
            {current ? (
              <img src={current} alt={ad.title} className="w-full h-80 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-80 bg-gray-800 flex items-center justify-center text-gray-600">No Media</div>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((m: any, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${i === activeImg ? 'border-violet-500' : 'border-gray-700'}`}>
                  <img src={m.media_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            {ad.is_featured && <span className="badge-featured mb-2">⭐ Featured</span>}
            <h1 className="text-2xl font-bold text-white mt-1">{ad.title}</h1>
            {ad.price && (
              <p className="text-2xl font-black text-violet-400 mt-1">PKR {ad.price.toLocaleString()}</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {ad.category && <span className="badge-draft flex items-center gap-1"><Tag size={10}/>{ad.category.name}</span>}
            {ad.city && <span className="badge-draft flex items-center gap-1"><MapPin size={10}/>{ad.city.name}</span>}
            {ad.package && <span className="badge-featured">{ad.package.name}</span>}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Eye size={12} /> {ad.view_count} views
            {ad.published_at && <> · {new Date(ad.published_at).toLocaleDateString()}</>}
          </div>

          {/* Contact Card */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Contact Seller</p>
            {ad.seller?.full_name && <p className="text-white font-medium">{ad.seller.full_name}</p>}
            <div className="space-y-2">
              {ad.contact_phone && (
                <a href={`tel:${ad.contact_phone}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                  <PhoneCall size={14} /> {ad.contact_phone}
                </a>
              )}
              {ad.contact_email && (
                <a href={`mailto:${ad.contact_email}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                  <Mail size={14} /> {ad.contact_email}
                </a>
              )}
              {ad.contact_whatsapp && (
                <a href={`https://wa.me/${ad.contact_whatsapp}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {ad.description && (
        <div className="card p-6 mt-8">
          <h2 className="font-semibold text-white mb-3">Description</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
        </div>
      )}
    </div>
  );
}
