'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, ShoppingCart, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeItem, clearCart, totalPrice, itemCount } = useCart();

  const handleConfirmPurchase = () => {
    if (!user) {
      toast.error('Please login first to complete purchase.');
      router.push('/auth/login?next=%2Fcheckout');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    toast.success('Purchase request submitted successfully.');
    clearCart();
    router.push('/explore');
  };

  return (
    <div className="panel-wrap max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title !mb-1 flex items-center gap-2">
            <ShoppingCart size={22} className="text-cyan-300" /> Checkout
          </h1>
          <p className="text-slate-300/70 text-sm">Professional buying flow for marketplace ads.</p>
        </div>
        <Link href="/explore" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Continue browsing
        </Link>
      </div>

      {!user && (
        <div className="card p-4 mb-4 border-cyan-400/30">
          <p className="text-cyan-200 text-sm">
            Please login first to complete purchase and contact seller.
          </p>
          <Link href="/auth/login?next=%2Fcheckout" className="btn-primary mt-3 inline-flex">
            Login to Continue
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="card p-4">
          <h2 className="panel-title text-lg mb-4">Cart Items ({itemCount})</h2>
          {items.length === 0 ? (
            <div className="text-slate-300/70 py-10 text-center">No items in cart yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/ads/${item.slug}`} className="text-white font-semibold hover:text-cyan-300 line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-cyan-300 font-bold mt-1">PKR {item.price.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Qty: {item.qty}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-300 hover:text-red-200"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="card p-4 h-fit">
          <h2 className="panel-title text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-slate-300/80">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>PKR {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>PKR 0</span>
            </div>
          </div>
          <div className="my-4 h-px bg-white/10" />
          <div className="flex justify-between text-xl font-black text-cyan-300 mb-4">
            <span>Total</span>
            <span>PKR {totalPrice.toLocaleString()}</span>
          </div>

          <button
            type="button"
            onClick={handleConfirmPurchase}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
            disabled={items.length === 0}
          >
            <CreditCard size={15} /> Confirm Purchase
          </button>

          <div className="mt-3 text-xs text-slate-400 inline-flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-300" /> Secure checkout and verified contact flow.
          </div>
        </aside>
      </div>
    </div>
  );
}
