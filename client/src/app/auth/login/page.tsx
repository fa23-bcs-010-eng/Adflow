'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push('/dashboard/client');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/40">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to AdFlow Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back — let's get you listed</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input id="login-email" type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input id="login-password" type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-violet-400 hover:text-violet-300">Register</Link>
          </p>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500 mb-4 uppercase tracking-wider font-semibold">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {['client', 'moderator', 'admin', 'super_admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      // @ts-ignore
                      await useAuth().demoLogin?.(role);
                      toast.success(`Logged in as ${role.toUpperCase()}`);
                      router.push(role === 'client' ? '/dashboard/client' : `/dashboard/${role === 'super_admin' ? 'admin' : role}`);
                    } catch (e: any) {
                      toast.error('Demo login failed');
                    } finally { setLoading(false); }
                  }}
                  disabled={loading}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg transition border border-gray-700 hover:border-violet-500"
                >
                  {role.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
