'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { Zap } from 'lucide-react';
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
      router.push(form.role === 'client' ? '/dashboard/client' : `/dashboard/${form.role === 'super_admin' ? 'admin' : form.role}`);
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
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
