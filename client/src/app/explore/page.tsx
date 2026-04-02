'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { Search, SlidersHorizontal, MapPin, Layers, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import AdCard from '@/components/AdCard';

function ExploreInner() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selCat, setSelCat] = useState('');
  const [selCity, setSelCity] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/cities')]).then(([c, ci]) => {
      setCategories(c.data);
      setCities(ci.data);
    });
  }, []);

  const fetchAds = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selCat) params.set('category', selCat);
    if (selCity) params.set('city', selCity);
    params.set('page', String(page));
    api
      .get(`/ads?${params}`)
      .then((r) => setAds(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, selCat, selCity, page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return (
    <div className="panel-wrap">
      <div className="panel-surface p-4 md:p-6">
        <div className="mb-6 md:mb-7">
          <h1 className="section-title !mb-2">Explore Ads Marketplace</h1>
          <p className="section-sub !mb-0">Find verified listings with smart category and location filters.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <aside className="xl:col-span-3 card p-4">
            <p className="text-sm uppercase tracking-wider text-slate-300/70 mb-3">Filter By Category</p>
            <button
              onClick={() => {
                setSelCat('');
                setPage(1);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition ${
                !selCat ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              All Categories
            </button>
            <div className="space-y-1 max-h-[320px] overflow-auto pr-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelCat(c.slug);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selCat === c.slug
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Layers size={14} /> {c.name}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="xl:col-span-9">
            <div className="card p-3 md:p-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="explore-search"
                    className="input pl-9"
                    placeholder="Search ads (MacBook, Apartment, Civic)"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="md:col-span-3 relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="explore-city"
                    className="input pl-9"
                    value={selCity}
                    onChange={(e) => {
                      setSelCity(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Cities</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="md:col-span-3 btn-primary h-[42px]">
                  Search Ads
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton h-64" />
                ))}
              </div>
            ) : ads.length === 0 ? (
              <div className="card p-12 text-center text-slate-300/70">
                <SlidersHorizontal size={40} className="mx-auto mb-3 opacity-40" />
                <p>No ads found. Try a different search or city.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-300/70 inline-flex items-center gap-2">
                    <Sparkles size={14} className="text-cyan-300" /> {ads.length} results found
                  </p>
                  <div className="pill text-xs">Page {page}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>
                <div className="flex justify-center gap-3 mt-8">
                  {page > 1 && (
                    <button onClick={() => setPage((p) => p - 1)} className="btn-secondary">
                      Previous
                    </button>
                  )}
                  {ads.length >= 20 && (
                    <button onClick={() => setPage((p) => p + 1)} className="btn-secondary">
                      Next
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="panel-wrap">
          <div className="skeleton h-10 w-60 mb-3" />
          <div className="skeleton h-5 w-80 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-64" />
            ))}
          </div>
        </div>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}
