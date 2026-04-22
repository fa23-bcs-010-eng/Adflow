import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Tag, Search } from 'lucide-react';
import AdCard from '@/components/AdCard';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { DEMO_ADS } from '@/lib/demo-ads';

type Params = { city: string; category: string };

function titleize(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { city, category } = await params;
  const cityLabel = city === 'all' ? 'All Cities' : titleize(city);
  const categoryLabel = category === 'all' ? 'All Categories' : titleize(category);
  return {
    title: `${categoryLabel} in ${cityLabel} | Adflow Marketplace`,
    description: `Browse ${categoryLabel.toLowerCase()} listings in ${cityLabel.toLowerCase()} on Adflow.`,
  };
}

export default async function MarketplaceSeoPage({ params }: { params: Promise<Params> }) {
  const { city, category } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  let categoryId: string | null = null;
  let cityId: string | null = null;

  if (category !== 'all') {
    const { data } = await supabaseAdmin.from('categories').select('id,name,slug').eq('slug', category).maybeSingle();
    if (!data) return notFound();
    categoryId = data.id as string;
  }

  if (city !== 'all') {
    const { data } = await supabaseAdmin.from('cities').select('id,name,slug').eq('slug', city).maybeSingle();
    if (!data) return notFound();
    cityId = data.id as string;
  }

  let query = supabaseAdmin
    .from('ads')
    .select('*, category:categories(name,slug), city:cities(name,slug), package:packages(name,featured_scope), media:ad_media(*)')
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .order('rank_score', { ascending: false })
    .limit(24);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (cityId) query = query.eq('city_id', cityId);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load SEO marketplace page');
  }

  const fallback = DEMO_ADS.filter((ad) => {
    if (city !== 'all' && ad.city.slug !== city) return false;
    if (category !== 'all' && ad.category.slug !== category) return false;
    return true;
  });

  const listings = (data && data.length > 0 ? data : fallback).slice(0, 24);
  const cityLabel = city === 'all' ? 'all cities' : titleize(city);
  const categoryLabel = category === 'all' ? 'all categories' : titleize(category);

  return (
    <div className="panel-wrap">
      <div className="panel-surface p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <p className="text-cyan-300 uppercase tracking-[0.22em] text-xs mb-3">Marketplace SEO</p>
            <h1 className="section-title !mb-2">{categoryLabel} in {cityLabel}</h1>
            <p className="section-sub !mb-0 max-w-3xl">
              Discover live listings for {categoryLabel.toLowerCase()} across {cityLabel}. Built for fast browsing, comparison, and real purchase intent.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/explore" className="btn-secondary inline-flex items-center gap-2">
              <Search size={14} /> Full Explore
            </Link>
            <Link href="/dashboard/client?tab=create" className="btn-primary inline-flex items-center gap-2">
              Post Listing
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="badge-draft inline-flex items-center gap-1"><MapPin size={10} /> {cityLabel}</span>
          <span className="badge-draft inline-flex items-center gap-1"><Tag size={10} /> {categoryLabel}</span>
          <span className="badge-featured">{listings.length} active results</span>
        </div>

        {listings.length === 0 ? (
          <div className="card p-10 text-center text-slate-300/70">No listings found for this marketplace page yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
