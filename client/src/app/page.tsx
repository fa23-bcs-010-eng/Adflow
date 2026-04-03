'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, TrendingUp, Shield, Zap, Code, Bot, BrainCircuit } from 'lucide-react';
import api from '@/lib/api';
import AdCard from '@/components/AdCard';

const HERO_FEATURES = [
  { icon: Shield, label: 'Verified Listings' },
  { icon: Star, label: 'Featured Spots' },
  { icon: TrendingUp, label: 'Smart Ranking' },
  { icon: Zap, label: 'Instant Exposure' },
];

const FEATURED_FALLBACK_ADS = [
  {
    id: 'fallback-featured-1',
    slug: 'premium-smart-watch-ad',
    title: 'Premium Smart Watch 48mm - AMOLED Display',
    price: 54999,
    is_featured: true,
    view_count: 124,
    category: { name: 'Wearables', slug: 'wearables' },
    city: { name: 'Karachi', slug: 'karachi' },
    package: { name: 'Premium', featured_scope: 'homepage' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
  {
    id: 'fallback-featured-2',
    slug: 'iphone-15-pro-max-ad',
    title: 'iPhone 15 Pro Max 256GB Deep Blue',
    price: 329999,
    is_featured: true,
    view_count: 207,
    category: { name: 'Mobiles', slug: 'mobiles' },
    city: { name: 'Lahore', slug: 'lahore' },
    package: { name: 'Standard', featured_scope: 'homepage' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
  {
    id: 'fallback-featured-3',
    slug: 'sony-camera-alpha-ad',
    title: 'Sony Mirrorless Camera Alpha Series',
    price: 184999,
    is_featured: true,
    view_count: 91,
    category: { name: 'Electronics', slug: 'electronics' },
    city: { name: 'Islamabad', slug: 'islamabad' },
    package: { name: 'Premium', featured_scope: 'homepage' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
  {
    id: 'fallback-featured-4',
    slug: 'macbook-pro-m3-ad',
    title: 'MacBook Pro M3 16-inch 18GB RAM',
    price: 489999,
    is_featured: true,
    view_count: 142,
    category: { name: 'Laptops', slug: 'laptops' },
    city: { name: 'Rawalpindi', slug: 'rawalpindi' },
    package: { name: 'Premium', featured_scope: 'homepage' },
    media: [{ media_url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200', is_primary: true }],
  },
];

const RECENT_FALLBACK_ADS = [
  ...FEATURED_FALLBACK_ADS,
  {
    id: 'fallback-recent-5',
    slug: 'yamaha-ybr-125-ad',
    title: 'Yamaha YBR 125 2022 Model - Excellent Condition',
    price: 419000,
    is_featured: false,
    view_count: 76,
    category: { name: 'Vehicles', slug: 'vehicles' },
    city: { name: 'Peshawar', slug: 'peshawar' },
    package: { name: 'Standard' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
  {
    id: 'fallback-recent-6',
    slug: 'airpods-max-original-ad',
    title: 'AirPods Max Original - Noise Canceling',
    price: 139999,
    is_featured: false,
    view_count: 58,
    category: { name: 'Accessories', slug: 'accessories' },
    city: { name: 'Faisalabad', slug: 'faisalabad' },
    package: { name: 'Basic' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
  {
    id: 'fallback-recent-7',
    slug: 'iphone-15-pro-max-ad-recent',
    title: 'iPhone 15 Pro Max PTA Approved - Slightly Used',
    price: 314999,
    is_featured: false,
    view_count: 86,
    category: { name: 'Mobiles', slug: 'mobiles' },
    city: { name: 'Multan', slug: 'multan' },
    package: { name: 'Standard' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
  {
    id: 'fallback-recent-8',
    slug: 'smart-watch-48mm-ad-recent',
    title: 'Smart Watch 48mm GPS Edition - Brand New',
    price: 47999,
    is_featured: false,
    view_count: 39,
    category: { name: 'Wearables', slug: 'wearables' },
    city: { name: 'Hyderabad', slug: 'hyderabad' },
    package: { name: 'Basic' },
    media: [{ media_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80', is_primary: true }],
  },
];

const PACKAGE_FALLBACKS = [
  { id: 'pkg-basic', name: 'Basic', price: 0, description: 'Start with essential visibility for a single ad.' },
  { id: 'pkg-standard', name: 'Standard', price: 49, description: 'Get longer visibility and stronger placement.' },
  { id: 'pkg-premium', name: 'Premium', price: 99, description: 'Feature your listing with premium promotion slots.' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/featured'),
      api.get('/ads?limit=8'),
      api.get('/packages'),
    ]).then(([f, r, p]) => {
      setFeatured(f.data);
      setRecent(r.data);
      setPackages(p.data);
    }).catch(() => {
      setFeatured(FEATURED_FALLBACK_ADS);
      setRecent(RECENT_FALLBACK_ADS);
      setPackages(PACKAGE_FALLBACKS);
    }).finally(() => setLoading(false));
  }, []);

  const displayFeatured = featured.length > 0 ? featured : FEATURED_FALLBACK_ADS;
  const displayRecent = recent.length > 0 ? recent : RECENT_FALLBACK_ADS;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32 px-4">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero_background.png" 
            alt="Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-lighten"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/80 to-gray-950" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs md:text-sm text-cyan-200 font-semibold mb-8 animate-fade-in-up">
            <Zap size={14} className="fill-current" /> Next-Gen Ad Optimization Platform
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[1.1] tracking-tight mb-8 animate-fade-in-up [animation-delay:200ms]">
            Scale Your Business<br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">with Pro Ads</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-fade-in-up [animation-delay:400ms]">
            Unlock explosive growth with advanced AI-powered ad optimization, real-time analytics, and data-driven scaling tools. Launch high-performing campaigns and maximize ROI effortlessly.
          </p>
          
          <div className="flex flex-col items-center gap-6 animate-fade-in-up [animation-delay:600ms]">
            <Link href="/auth/register" 
              className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-2xl shadow-cyan-500/25 hover:scale-105 transition-all duration-300 overflow-hidden">
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            
            <p className="text-gray-500 text-sm md:text-base font-medium flex items-center gap-2">
              Start 14-Day Trial <span className="w-1.5 h-1.5 rounded-full bg-gray-700" /> No Credit Card Required
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-cyan-300 uppercase tracking-[0.22em] text-xs mb-3">Features</p>
            <h2 className="section-title text-3xl md:text-4xl">Built for discovery, publishing, and scale.</h2>
            <p className="section-sub !mb-0 max-w-2xl">Everything in the product is tuned for high-intent ad workflows, from publishing to analytics and secure payment handling.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {HERO_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.label} className="kpi-card p-5">
                <div className="w-11 h-11 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center mb-4 text-cyan-300">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.label}</h3>
                <p className="text-sm text-slate-300/70 leading-6">
                  {feature.label === 'Verified Listings' && 'Only approved ads surface in the marketplace, keeping the experience trustworthy.'}
                  {feature.label === 'Featured Spots' && 'Promote high-value listings in premium placements across the homepage and explore grid.'}
                  {feature.label === 'Smart Ranking' && 'Surface better matches using recency, package level, and performance signals.'}
                  {feature.label === 'Instant Exposure' && 'Move from draft to published with a workflow designed for rapid distribution.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-cyan-300 uppercase tracking-[0.22em] text-xs mb-3">Pricing</p>
            <h2 className="section-title text-3xl md:text-4xl">Choose the package that fits your growth stage.</h2>
            <p className="section-sub !mb-0 max-w-2xl">Transparent plans for first-time posters, serious sellers, and enterprise advertisers.</p>
          </div>
          <Link href="/packages" className="btn-secondary inline-flex items-center gap-2">
            View all plans <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-[1.35rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg, idx) => {
              const isStandard = idx === 1;
              const isPremium = idx === packages.length - 1;
              const accentMap = ['from-white/10 to-cyan-400/10', 'from-blue-500/20 to-cyan-400/10', 'from-cyan-400/20 to-fuchsia-500/10'];
              
              return (
                <div key={pkg.id} className={`card p-6 relative overflow-hidden border ${isStandard || isPremium ? 'border-cyan-400/40' : 'border-white/10'}`}>
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isPremium ? 'from-cyan-400 via-fuchsia-500 to-orange-400' : 'from-cyan-400 to-blue-500'}`} />
                  {isStandard && <div className="absolute top-5 right-5 pill text-xs">Most Popular</div>}
                  {isPremium && <div className="absolute top-5 right-5 pill text-xs">Best Value</div>}
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400 mb-3">{pkg.name}</p>
                  <div className={`rounded-2xl bg-gradient-to-br ${accentMap[idx] || accentMap[0]} border border-white/10 p-4 mb-4`}>
                    <p className="text-4xl font-black text-white">${pkg.price}</p>
                    <p className="text-sm text-slate-300/70">per month</p>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-300/80 mb-6">
                    {pkg.description && (
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                        <span>{pkg.description}</span>
                      </li>
                    )}
                  </ul>
                  <Link href="/packages" className={isPremium ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                    Choose {pkg.name}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Resources */}
      <section id="resources" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-cyan-300 uppercase tracking-[0.22em] text-xs mb-3">Resources</p>
            <h2 className="section-title text-3xl md:text-4xl">Everything you need to launch faster.</h2>
            <p className="section-sub !mb-0 max-w-2xl">A compact set of support links, how-tos, and discovery tools for sellers and buyers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: 'FAQ', href: '/faq', body: 'Quick answers for posting, payments, and verification.' },
            { title: 'Explore Ads', href: '/explore', body: 'Browse the marketplace and refine by category or city.' },
            { title: 'Categories', href: '/categories', body: 'Find the right listing bucket for your next campaign.' },
            { title: 'Cities', href: '/cities', body: 'Target local demand with location-aware browsing.' },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="card card-hover p-5 block">
              <p className="text-lg font-bold text-white mb-2">{item.title}</p>
              <p className="text-sm text-slate-300/70 leading-6 mb-4">{item.body}</p>
              <span className="inline-flex items-center gap-2 text-cyan-300 text-sm font-medium">Open <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section id="enterprise" className="max-w-7xl mx-auto px-4 py-12">
        <div className="panel-surface hero-panel rounded-[1.75rem] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/hero_background.png"
              alt="Enterprise background"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020818]/85 via-[#020b1d]/70 to-[#020818]/85" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <p className="text-cyan-300 uppercase tracking-[0.22em] text-xs mb-3">Enterprise</p>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Scale campaigns with custom workflows and priority support.</h2>
              <p className="mt-4 text-slate-300/80 max-w-2xl leading-7">Enterprise teams get multi-seat access, tailored review flows, and private support for bulk listings and account management.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2">
                  Get Started Free <ArrowRight size={14} />
                </Link>
                <Link href="/faq" className="btn-secondary inline-flex items-center gap-2">
                  Read FAQ <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Dedicated support', '24/7 priority response for your team.'],
                ['Custom publishing', 'Tailored review flows and approvals.'],
                ['Bulk listings', 'Manage campaigns at scale with less friction.'],
                ['Team visibility', 'Track performance across seats and packages.'],
                ['API access', 'Full REST API for custom integrations and automation.'],
                ['Advanced analytics', 'Deep insights into campaign performance and ROI.'],
                ['Priority onboarding', 'Fast setup with dedicated implementation specialist.'],
                ['Custom workflows', 'Build approval processes tailored to your team.'],
              ].map(([title, body]) => (
                <div key={title} className="metric-card p-4">
                  <p className="text-white font-semibold mb-2">{title}</p>
                  <p className="text-sm text-slate-300/70 leading-6">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ads */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Star size={22} className="text-amber-400" fill="currentColor" /> Featured Ads
            </h2>
            <p className="section-sub !mb-0">Premium listings with top visibility</p>
          </div>
          <Link href="/explore?featured=true" className="text-sm text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-64" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayFeatured.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}
      </section>

      {/* Recent Ads */}
      <section className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp size={22} className="text-cyan-300" /> Recent Listings
            </h2>
            <p className="section-sub !mb-0">Freshly posted and verified ads</p>
          </div>
          <Link href="/explore" className="text-sm text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
            Explore all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-64" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayRecent.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}
      </section>

      {/* Team / Creator */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="section-title text-3xl font-bold flex items-center justify-center gap-2">
            Meet the Creator
          </h2>
          <p className="text-gray-400 mt-2">The mastermind behind AdFlow Pro</p>
        </div>

        <div className="card max-w-4xl mx-auto border-gray-800 p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group hover:border-violet-500/50 transition duration-500">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition duration-700" />

          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full flex-shrink-0 bg-gradient-to-br from-violet-600 to-pink-600 p-1.5 shadow-2xl shadow-violet-900/40 transform group-hover:scale-105 transition duration-500 z-10">
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden relative">
              <img src="/dp.png" alt="Hammad Raheel Sarwar" className="w-full h-full object-cover shadow-inner" />
            </div>
          </div>

          <div className="text-center md:text-left relative z-10 w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-medium mb-4">
              <BrainCircuit size={12} /> AI Architect & Engineer
            </div>
            <h3 className="text-3xl font-black text-white mb-2">Hammad Raheel Sarwar</h3>
            <p className="text-lg text-cyan-300 font-medium mb-4">Founder & Lead Developer</p>
            <p className="text-gray-300 md:text-lg mb-6 leading-relaxed">
              Hammad Raheel Sarwar is a Full-Stack Developer and AI Solutions Engineer who engineered AdFlow from the ground up, combining modern Next.js architecture with optimized relational database design to deliver a high-performance sponsored listing platform.
              <br />
              <br />
              He integrates advanced AI workflows for ad copy generation, customer support automation, and intelligent dashboard systems—helping businesses streamline operations and scale efficiently through smart, data-driven solutions.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 text-sm text-gray-200 shadow-inner">
                <Code size={16} className="text-pink-400" /> Full-Stack Development
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 text-sm text-gray-200 shadow-inner">
                <Star size={16} className="text-amber-400" /> System Architecture
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 text-sm text-gray-200 shadow-inner">
                <Zap size={16} className="text-violet-400" /> UI/UX Design
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 text-sm text-gray-200 shadow-inner">
                <Bot size={16} className="text-cyan-400" /> AI Agent Integration
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative rounded-3xl overflow-hidden p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #0e7490 0%, #0284c7 50%, #1d4ed8 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative">Ready to get noticed?</h2>
          <p className="text-cyan-100 mb-8 relative text-lg">Join thousands of sellers reaching buyers across Pakistan.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-cyan-700 font-bold px-8 py-3 rounded-xl hover:bg-cyan-50 transition shadow-xl relative">
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
