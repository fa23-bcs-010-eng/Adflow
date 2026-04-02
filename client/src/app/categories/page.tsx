'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <h1 className="section-title text-4xl">Browse by Category</h1>
        <p className="section-sub text-lg !mb-0">Find exactly what you're looking for</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/explore?category=${c.slug}`}
              className="card p-6 flex flex-col items-center justify-center text-center hover:border-violet-500 transition-all hover:-translate-y-1">
              <span className="text-4xl mb-3">{c.icon}</span>
              <h2 className="text-white font-medium">{c.name}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
