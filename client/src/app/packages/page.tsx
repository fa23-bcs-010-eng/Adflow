'use client';

import { useEffect, useState } from 'react';
import { Check, Sparkles, Gem, Rocket, Crown, Users, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

const PACKAGE_FALLBACKS = [
  { id: 'pkg-basic', name: 'Basic', price: 0 },
  { id: 'pkg-standard', name: 'Standard', price: 49 },
  { id: 'pkg-premium', name: 'Premium', price: 99 },
  { id: 'pkg-enterprise', name: 'Enterprise', price: 299 },
];

const PACKAGE_DETAILS: Record<string, { duration: string; support: string; listings: string; features: string[] }> = {
  Basic: {
    duration: '7 days per listing',
    support: 'Basic email support',
    listings: 'Up to 5 listings',
    features: [
      'Up to 5 active listings',
      '7 days validity per listing',
      'Basic HTML listing format',
      'Email support',
      'Standard search display',
      'Single category per ad',
    ],
  },
  Standard: {
    duration: '30 days per listing',
    support: 'Email support (24-48h)',
    listings: 'Unlimited listings',
    features: [
      'Unlimited listings',
      '30 days validity per listing',
      'Enhanced listing format',
      'Basic analytics dashboard',
      'Priority listing placement',
      'Email & chat support',
      'Featured badge on listings',
      '5 category tags per ad',
    ],
  },
  Premium: {
    duration: '90 days per listing',
    support: 'Priority 24/7 support',
    listings: 'Unlimited listings',
    features: [
      'Unlimited listings',
      '90 days validity per listing',
      'Advanced analytics & insights',
      'Featured badge on all listings',
      'Priority email & chat support',
      'Bulk upload (up to 50 ads)',
      'Enhanced visibility in search',
      'Unlimited category tags',
      'Custom listing templates',
      'Performance metrics',
    ],
  },
  Enterprise: {
    duration: '365 days per listing',
    support: '24/7 Dedicated Account Manager',
    listings: 'Unlimited everything',
    features: [
      'Unlimited listings & features',
      '365 days validity per listing',
      'Custom analytics & reporting',
      'API access for integrations',
      'Team management (10 members)',
      'Custom workflows & automation',
      'White-label options',
      'Dedicated account manager',
      'Priority onboarding & training',
      'Custom featured placement',
      'Advanced scheduling tools',
      'Multi-language support',
    ],
  },
};

export default function PackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/packages')
      .then((r) => setPackages(r.data))
      .catch(() => setPackages(PACKAGE_FALLBACKS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel-wrap">
      <section className="panel-surface hero-panel p-6 md:p-10 relative overflow-hidden rounded-[1.75rem] mb-6">
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 pill mb-4">
            <Sparkles size={14} className="text-cyan-300" /> Adflow Pro Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight">Pricing Plans</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">Pick a package and start scaling your ad reach with the same premium panel style used across the app.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-[28rem] rounded-[1.4rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch relative">
            {packages.map((pkg) => {
              const name = String(pkg.name || 'Basic');
              const isBasic = name === 'Basic';
              const isStandard = name === 'Standard';
              const isPremium = name === 'Premium';
              const isEnterprise = name === 'Enterprise';
              
              let icon = Sparkles;
              let gradient = 'from-cyan-400 to-emerald-400';
              let borderColor = 'border-cyan-200/30';
              let bgColor = 'bg-white/5';
              let textColor = 'text-slate-200';
              let badge = '';
              
              if (isEnterprise) {
                icon = Crown;
                gradient = 'from-purple-500 via-pink-500 to-orange-500';
                borderColor = 'border-purple-300/60';
                bgColor = 'bg-purple-400/10';
                textColor = 'text-purple-300';
                badge = 'Best for Teams';
              } else if (isPremium) {
                icon = Gem;
                gradient = 'from-cyan-400 via-fuchsia-500 to-orange-400';
                borderColor = 'border-cyan-300/60';
                bgColor = 'bg-cyan-400/10';
                textColor = 'text-cyan-300';
                badge = 'Most Popular';
              } else if (isStandard) {
                icon = Rocket;
                gradient = 'from-blue-500 to-cyan-400';
                borderColor = 'border-blue-300/40';
                bgColor = 'bg-blue-500/10';
                textColor = 'text-blue-300';
                badge = 'Recommended';
              }
              
              const Icon = icon;
              const details = PACKAGE_DETAILS[name] || PACKAGE_DETAILS.Basic;

              return (
                <article
                  key={pkg.id}
                  className={`panel-surface rounded-[1.4rem] border-2 p-6 flex flex-col relative overflow-hidden transition hover:shadow-lg ${
                    (isPremium || isEnterprise) ? 'scale-100 md:scale-105 z-10' : ''
                  } ${borderColor}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                  {badge && (
                    <div className={`absolute right-5 top-5 pill text-xs font-semibold ${bgColor} ${textColor} border-current/30 border`}>
                      {badge}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
                    <span className={`w-10 h-10 rounded-2xl border border-white/10 grid place-items-center ${bgColor}`}>
                      <Icon size={18} className={textColor} />
                    </span>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </div>

                  <div className="mb-4 space-y-2">
                    <p className="text-white text-4xl md:text-5xl font-black leading-none">
                      {pkg.price === 0 ? 'Free' : `PKR ${pkg.price}`}
                    </p>
                    <p className="text-slate-400 text-sm font-medium">{details.duration}</p>
                  </div>

                  <div className="mb-4 space-y-1 pb-4 border-b border-white/10">
                    <p className="text-slate-300 text-sm"><span className="text-slate-500">📊 Listings:</span> {details.listings}</p>
                    <p className="text-slate-300 text-sm"><span className="text-slate-500">💬 Support:</span> {details.support}</p>
                  </div>

                  <Link
                    href={user ? '/dashboard/client?tab=create' : `/auth/register?package=${pkg.id}`}
                    className={`py-2.5 px-4 rounded-xl text-center font-bold transition mb-5 ${
                      isEnterprise
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 hover:shadow-lg'
                        : isPremium
                        ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white hover:brightness-105 hover:shadow-lg'
                        : isStandard
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {isEnterprise ? 'Contact Sales' : isPremium ? 'Go Premium' : isStandard ? 'Choose Standard' : 'Get Started Free'}
                  </Link>

                  <div className="space-y-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features Included</p>
                    <ul className="space-y-2.5">
                      {details.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-100">
                          <Check size={16} className={`${textColor} mt-0.5 flex-shrink-0`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <div className="panel-surface rounded-[1.35rem] p-5">
            <h2 className="panel-title text-lg mb-3">Bank Transfer</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Bank</span><span className="text-white">Habib Bank Limited</span></p>
              <p className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Account</span><span className="text-white">AdFlow Pro (Pvt) Ltd</span></p>
              <p className="flex justify-between"><span className="text-slate-400">IBAN</span><span className="text-cyan-300 font-semibold">PK00HABB012345678901</span></p>
            </div>
          </div>
          <div className="panel-surface rounded-[1.35rem] p-5">
            <h2 className="panel-title text-lg mb-3">Wallets</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Provider</span><span className="text-white">EasyPaisa / JazzCash</span></p>
              <p className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Account</span><span className="text-white">AdFlow Pro Solutions</span></p>
              <p className="flex justify-between"><span className="text-slate-400">Mobile</span><span className="text-cyan-300 font-semibold">0300-1234567</span></p>
            </div>
          </div>
        </div>

        <div className="panel-surface mt-10 p-5 text-center rounded-[1.35rem]">
          <p className="text-slate-300 text-sm leading-7">Bank transfer and mobile wallet are accepted. You can submit your payment proof during checkout for verification.</p>
        </div>
      </section>
    </div>
  );
}
