import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-sky-500/20 bg-[#060b19]/90 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-black text-lg text-white mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            Adflow<span className="text-cyan-300">_pro</span>
          </div>
          <p className="text-sm text-slate-300/65 leading-relaxed">
            Pakistan's premium sponsored listing marketplace. Post, discover, and grow.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Marketplace</h4>
          <ul className="space-y-2 text-sm text-slate-300/65">
            {[['Explore Ads', '/explore'], ['Featured', '/'], ['Packages', '/packages'], ['Categories', '/categories']].map(([l, h]) => (
              <li key={h}><Link href={h} className="hover:text-cyan-300 transition">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-slate-300/65">
            {[['FAQ', '/faq'], ['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([l, h]) => (
              <li key={l}><Link href={h} className="hover:text-cyan-300 transition">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
          <ul className="space-y-2 text-sm text-slate-300/65">
            {[['Register', '/auth/register'], ['Login', '/auth/login'], ['Dashboard', '/dashboard/client']].map(([l, h]) => (
              <li key={l}><Link href={h} className="hover:text-cyan-300 transition">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-sky-500/20 py-4 text-center text-xs text-slate-300/50">
        © {new Date().getFullYear()} AdFlow Pro. All rights reserved.
      </div>
    </footer>
  );
}
