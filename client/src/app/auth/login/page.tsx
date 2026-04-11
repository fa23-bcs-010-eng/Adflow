'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';

type DemoRole = 'client' | 'moderator' | 'admin' | 'super_admin';

const DEMO_ROLES: DemoRole[] = ['client', 'moderator', 'admin', 'super_admin'];

const roleDashboard: Record<DemoRole, string> = {
  client: '/dashboard/client',
  moderator: '/dashboard/moderator',
  admin: '/dashboard/admin',
  super_admin: '/dashboard/admin',
};

const roleDemoEmail: Record<DemoRole, string> = {
  client: 'client_demo@adflow.com',
  moderator: 'moderator_demo@adflow.com',
  admin: 'admin_demo@adflow.com',
  super_admin: 'super_admin_demo@adflow.com',
};

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const DEMO_PASSWORD = 'demo123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push('/dashboard/client');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: DemoRole) => {
    const email = roleDemoEmail[role];
    setLoading(true);
    try {
      // First try normal login with shared demo credentials.
      await login(email, DEMO_PASSWORD);
      toast.success(`Logged in as ${role.replace('_', ' ')}`);
      router.push(roleDashboard[role]);
    } catch {
      // If demo user does not exist yet, create/login via demo endpoint for the selected role.
      try {
        await demoLogin(role);
        toast.success(`Demo ${role.replace('_', ' ')} account ready`);
        router.push(roleDashboard[role]);
      } catch {
        toast.error('Demo login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/40">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to AdFlow Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back - let&apos;s get you listed</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-violet-400 hover:text-violet-300">
              Register
            </Link>
          </p>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500 mb-4 uppercase tracking-wider font-semibold">
              Demo Login Enabled
            </p>
            <div className="space-y-2">
              {DEMO_ROLES.map((role) => (
                <div
                  key={role}
                  className="rounded-xl border border-gray-700 bg-gray-900/60 p-3 text-sm"
                >
                  <p className="text-gray-300 font-semibold uppercase tracking-wide mb-1">
                    {role.replace('_', ' ')} Demo
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Gmail:</span> {roleDemoEmail[role]}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Password:</span> {DEMO_PASSWORD}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setForm({ email: roleDemoEmail[role], password: DEMO_PASSWORD })
                      }
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg transition border border-gray-700 hover:border-cyan-500"
                    >
                      Fill
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin(role)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-2 rounded-lg transition border border-cyan-500"
                    >
                      {loading ? 'Please wait...' : 'Login'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
