import Link from 'next/link';
import { MapPin, Tag, Clock, Star, Eye } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface Ad {
  id: string;
  title: string;
  slug: string;
  price?: number;
  description?: string;
  is_featured?: boolean;
  status?: string;
  view_count?: number;
  published_at?: string;
  category?: { name: string; slug: string };
  city?: { name: string; slug: string };
  package?: { name: string; featured_scope?: string };
  media?: { media_url: string; is_primary: boolean }[];
}

const MediaThumb = ({ media, title }: { media: Ad['media']; title: string }) => {
  const primary = media?.find(m => m.is_primary) || media?.[0];
  if (!primary?.media_url) {
    return (
      <div className="w-full h-44 bg-gray-800 flex items-center justify-center">
        <Tag size={32} className="text-gray-600" />
      </div>
    );
  }
  // Validate and render external URL
  return (
    <div className="w-full h-44 overflow-hidden bg-gray-800">
      <img
        src={primary.media_url}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE3NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNGI1NTYzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        }}
      />
    </div>
  );
};

export default function AdCard({ ad, showStatus = false }: { ad: Ad; showStatus?: boolean }) {
  return (
    <Link href={`/ads/${ad.slug}`} className="group card card-hover block animate-fade-in-up">
      <div className="relative">
        <MediaThumb media={ad.media} title={ad.title} />
        {ad.is_featured && (
          <div className="absolute top-2 left-2 badge-featured gap-1">
            <Star size={10} fill="currentColor" /> Featured
          </div>
        )}
        {ad.package?.name && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-cyan-300 backdrop-blur">
            {ad.package.name}
          </div>
        )}
      </div>

      <div className="p-4">
        {showStatus && ad.status && (
          <div className="mb-2">
            <StatusBadge status={ad.status} />
          </div>
        )}

        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2 group-hover:text-cyan-300 transition-colors">
          {ad.title}
        </h3>

        {ad.price !== undefined && (
          <p className="text-cyan-300 font-bold text-base mb-2">
            PKR {ad.price.toLocaleString()}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {ad.category && (
            <span className="flex items-center gap-1">
              <Tag size={10} /> {ad.category.name}
            </span>
          )}
          {ad.city && (
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {ad.city.name}
            </span>
          )}
          {ad.view_count !== undefined && (
            <span className="flex items-center gap-1 ml-auto">
              <Eye size={10} /> {ad.view_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
