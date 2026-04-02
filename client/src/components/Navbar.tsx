'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Zap, Bell, ChevronDown, LogOut, LayoutDashboard, SunMedium, MoonStar } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const NAV = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Resources', href: '/#resources' },
  { label: 'Enterprise', href: '/#enterprise' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const router = useRouter();

  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('ag_theme') : null;
    const nextTheme = storedTheme === 'light' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem('ag_theme', nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  };

  const dashPath =
    user?.role === 'client' ? '/dashboard/client'
    : user?.role === 'moderator' ? '/dashboard/moderator'
    : '/dashboard/admin';

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#070d1d]/85 backdrop-blur-xl border-b border-sky-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-2xl tracking-tighter text-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Zap size={20} className="text-white fill-current" />
            </div>
            Adflow<span className="text-cyan-300"> Pro</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV.map(n => (
              <div key={n.label} className="group relative">
                <Link href={n.href}
                  className="text-[15px] font-medium text-slate-300/80 hover:text-white transition-colors duration-300 flex items-center gap-1">
                  {n.label} {n.label === 'Resources' && <ChevronDown size={14} className="opacity-50 group-hover:rotate-180 transition-transform" />}
                </Link>
              </div>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={handleThemeToggle}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:bg-white/10"
              aria-label="Toggle bright and dark mode"
            >
              {theme === 'dark' ? <SunMedium size={15} className="text-amber-300" /> : <MoonStar size={15} className="text-cyan-300" />}
              {theme === 'dark' ? 'Bright' : 'Dark'}
            </button>
            {user ? (
              <div className="relative">
                <button onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-xl shadow-blue-900/20">
                    {user.full_name[0].toUpperCase()}
                  </div>
                  <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-4 w-56 bg-[#0f1a33]/95 backdrop-blur-xl border border-sky-400/20 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                      <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                    </div>
                    <Link href={dashPath} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
                      <LayoutDashboard size={16} className="text-cyan-300" /> Dashboard
                    </Link>
                    <Link href="/dashboard/client/notifications" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
                      <Bell size={16} className="text-cyan-300" /> Notifications
                    </Link>
                    <hr className="border-white/5 my-1" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-[15px] font-medium text-slate-300/80 hover:text-white transition-colors">Login</Link>
                <Link href="/auth/register" className="relative group px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400 transition-all duration-300">
                  <span className="relative z-10 text-[15px] font-semibold text-white">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-400 hover:text-white">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#070d1d] px-4 py-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="mb-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200"
          >
            {theme === 'dark' ? <SunMedium size={15} className="text-amber-300" /> : <MoonStar size={15} className="text-cyan-300" />}
            {theme === 'dark' ? 'Bright mode' : 'Dark mode'}
          </button>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition">
              {n.label}
            </Link>
          ))}
          <hr className="border-gray-800 my-1" />
          {user ? (
            <>
              <Link href={dashPath} onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-gray-300 hover:text-white">Dashboard</Link>
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-red-400 text-left">Logout</button>
            </>
          ) : (
            <div className="flex gap-2 mt-1">
              <Link href="/auth/login" className="btn-secondary text-sm flex-1 text-center !py-2">Login</Link>
              <Link href="/auth/register" className="btn-primary text-sm flex-1 text-center !py-2">Post Ad</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
