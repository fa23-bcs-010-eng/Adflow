'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { ShieldCheck, Crown, BadgeDollarSign, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'client', account_type: 'seller' as 'buyer' | 'seller' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to AdFlow Pro.');
      router.push(
        form.role === 'client'
          ? '/dashboard/client'
          : `/dashboard/${form.role === 'super_admin' ? 'super-admin' : form.role}`
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Registration failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/40">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join as a buyer or seller and unlock the right marketplace tools</p>
        </div>
        <div className="card p-8">
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-white">Public registration</p>
                <p className="text-xs text-slate-400 mt-1">Only buyer and seller accounts can be created here.</p>
              </div>
              <Link href="/auth/login" className="text-xs text-cyan-300 hover:text-cyan-200">
                Staff login
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-cyan-100">Buyer: browse and purchase</div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-emerald-100">Seller: post and sell</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'buyer', title: 'Buyer', description: 'Purchase, save, offer, and chat' },
                  { value: 'seller', title: 'Seller', description: 'Post, promote, sell, and manage ads' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: 'client', account_type: option.value as 'buyer' | 'seller' })}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      form.account_type === option.value
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <p className="font-semibold">{option.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Full Name</label>
              <input id="reg-name" type="text" className="input" placeholder="Ahmed Khan"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input id="reg-email" type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input id="reg-password" type="password" className="input" placeholder="Min 8 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <button id="reg-submit" type="submit" disabled={loading} className="btn-primary w-full flex justify-center mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Staff roles are login-only</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: 'Moderator', icon: ShieldCheck, href: '/auth/login', tone: 'text-cyan-300' },
                { label: 'Admin', icon: BadgeDollarSign, href: '/auth/login', tone: 'text-amber-300' },
                { label: 'Super Admin', icon: Crown, href: '/auth/login', tone: 'text-violet-300' },
              ].map(({ label, icon: Icon, href, tone }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-xl border border-gray-700 bg-gray-900/60 p-3 text-sm hover:border-cyan-500 transition"
                >
                  <div className={`inline-flex items-center gap-2 font-semibold ${tone}`}>
                    <Icon size={14} />
                    {label}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Use demo or assigned staff credentials.</p>
                </Link>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
