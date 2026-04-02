'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cities')
      .then(r => setCities(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <h1 className="section-title text-4xl">Browse by City</h1>
        <p className="section-sub text-lg !mb-0">Find listings in your local area</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cities.map((c) => (
            <Link key={c.id} href={`/explore?city=${c.slug}`}
              className="card p-6 flex items-center justify-center gap-2 hover:border-violet-500 transition-all hover:-translate-y-1">
              <MapPin className="text-violet-400" size={20} />
              <h2 className="text-white font-medium">{c.name}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
