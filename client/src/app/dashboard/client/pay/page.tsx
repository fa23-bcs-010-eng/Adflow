'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import toast from 'react-hot-toast';
import { CreditCard, Landmark, Smartphone, Shield, CheckCircle, Lock, Upload } from 'lucide-react';

function PayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adId = searchParams.get('ad');

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentTab, setPaymentTab] = useState('Credit Card');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [manual, setManual] = useState({
    reference_no: '',
    sender_name: '',
    sender_bank_name: '',
    sender_account_number: '',
    sender_iban: '',
    proof_url: '',
  });

  useEffect(() => {
    if (!adId) {
      toast.error('No Ad selected');
      router.push('/dashboard/client');
      return;
    }

    api
      .get('/packages')
      .then((res) => {
        setPackages(res.data);
        if (res.data.length > 0) setSelectedPackage(res.data[0]);
      })
      .catch(() => {
        toast.error('Packages are unavailable right now');
        setPackages([]);
      })
      .finally(() => setLoading(false));
  }, [adId, router]);

  const isManual = paymentTab === 'Bank Transfer' || paymentTab === 'EasyPaisa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return toast.error('Please select a package');

    if (!isManual) {
      if (!card.number || !card.expiry || !card.cvv || !card.name) {
        return toast.error('Please fill all card details');
      }
    } else {
      if (
        !manual.reference_no ||
        !manual.sender_name ||
        !manual.sender_bank_name ||
        !manual.sender_account_number ||
        !manual.sender_iban ||
        !manual.proof_url
      ) {
        return toast.error('Please fill all manual payment fields');
      }
    }

    const payload = {
      ad_id: adId,
      package_id: selectedPackage.id,
      amount: selectedPackage.price,
      payment_method: paymentTab,
      reference_no: isManual ? manual.reference_no : `CARD-${Math.floor(Math.random() * 1000000)}`,
      proof_url: isManual ? manual.proof_url : 'https://imgur.com/card-success.png',
      sender_name: isManual ? manual.sender_name : undefined,
      sender_bank_name: isManual ? manual.sender_bank_name : undefined,
      sender_account_number: isManual ? manual.sender_account_number : undefined,
      sender_iban: isManual ? manual.sender_iban : undefined,
    };

    setSubmitting(true);
    try {
      await api.post('/client/payments', payload);
      toast.success('Payment submitted for verification');
      router.push('/dashboard/client');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit payment'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-300">Loading checkout...</div>;
  }

  return (
    <div className="panel-wrap max-w-7xl">
      <div className="hero-panel panel-surface rounded-[1.8rem] p-6 md:p-8 mb-6 relative overflow-hidden text-slate-900 bg-white">
        <div className="panel-glow -left-8 -top-10 h-52 w-52 bg-cyan-300/40" />
        <div className="panel-glow -right-10 -bottom-10 h-60 w-60 bg-blue-300/40" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm mb-4">
              <Shield size={14} className="text-cyan-500" /> Secure Checkout
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Complete your purchase</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Select a package, choose a payment method, and submit proof in a clean secure checkout flow.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm min-w-[220px]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current Package</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{selectedPackage?.name || '--'}</p>
            <p className="text-cyan-600 font-black text-2xl">${selectedPackage?.price ?? '0.00'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.72fr] gap-6 items-start">
        <div className="space-y-6">
          <div className="panel-surface rounded-[1.5rem] bg-white text-slate-900 p-5 md:p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Select a Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedPackage?.id === pkg.id ? 'border-cyan-500 ring-2 ring-cyan-200 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input type="radio" name="pkg" className="hidden" checked={selectedPackage?.id === pkg.id} onChange={() => setSelectedPackage(pkg)} />
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                    {selectedPackage?.id === pkg.id && <CheckCircle size={16} className="text-cyan-500" />}
                  </div>
                  <p className="mt-2 text-2xl font-black text-cyan-600">${pkg.price}</p>
                  <p className="text-sm text-slate-500">{pkg.duration_days} days</p>
                </label>
              ))}
            </div>
          </div>

          <div className="panel-surface rounded-[1.5rem] bg-white text-slate-900 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{paymentTab} Details</h2>
                <p className="text-sm text-slate-500">Enter the details that match your selected payment method.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Lock size={12} /> Protected
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { name: 'Credit Card', icon: CreditCard },
                { name: 'Bank Transfer', icon: Landmark },
                { name: 'EasyPaisa', icon: Smartphone },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentTab === method.name;
                return (
                  <button
                    key={method.name}
                    type="button"
                    onClick={() => setPaymentTab(method.name)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                  >
                    <Icon size={14} /> {method.name}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isManual ? (
                <>
                  <div>
                    <label className="label !text-slate-600">Card Number</label>
                    <input className="input bg-white text-slate-900 border-slate-300" placeholder="#### #### #### ####" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label !text-slate-600">Expiry Date</label>
                      <input className="input bg-white text-slate-900 border-slate-300" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                    </div>
                    <div>
                      <label className="label !text-slate-600">CVV</label>
                      <input className="input bg-white text-slate-900 border-slate-300" placeholder="***" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label !text-slate-600">Name on Card</label>
                    <input className="input bg-white text-slate-900 border-slate-300" placeholder="John Doe" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-2">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Transfer instructions</p>
                    <p className="text-sm text-slate-600">Send <strong className="text-slate-900">${selectedPackage?.price ?? 0}</strong> and upload the proof screenshot below.</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p><span className="inline-block w-32 text-slate-400">Bank Name</span> Habib Bank Limited</p>
                      <p><span className="inline-block w-32 text-slate-400">Account Title</span> AdFlow Pro (Pvt) Ltd</p>
                      <p><span className="inline-block w-32 text-slate-400">IBAN</span> PK00HABB012345678901</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label !text-slate-600">Reference No</label>
                      <input className="input bg-white text-slate-900 border-slate-300" value={manual.reference_no} onChange={(e) => setManual({ ...manual, reference_no: e.target.value })} />
                    </div>
                    <div>
                      <label className="label !text-slate-600">Sender Name</label>
                      <input className="input bg-white text-slate-900 border-slate-300" value={manual.sender_name} onChange={(e) => setManual({ ...manual, sender_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label !text-slate-600">Sender Bank</label>
                      <input className="input bg-white text-slate-900 border-slate-300" value={manual.sender_bank_name} onChange={(e) => setManual({ ...manual, sender_bank_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label !text-slate-600">Sender Account #</label>
                      <input className="input bg-white text-slate-900 border-slate-300" value={manual.sender_account_number} onChange={(e) => setManual({ ...manual, sender_account_number: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label !text-slate-600">Sender IBAN</label>
                    <input className="input bg-white text-slate-900 border-slate-300" value={manual.sender_iban} onChange={(e) => setManual({ ...manual, sender_iban: e.target.value })} />
                  </div>
                  <div>
                    <label className="label !text-slate-600">Proof URL</label>
                    <div className="relative">
                      <input className="input bg-white text-slate-900 border-slate-300 pl-10" value={manual.proof_url} onChange={(e) => setManual({ ...manual, proof_url: e.target.value })} placeholder="https://..." />
                      <Upload size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={submitting || !selectedPackage} className="btn-primary w-full mt-2">
                {submitting ? 'Processing...' : `Complete Payment for $${selectedPackage?.price ?? 0}`}
              </button>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Shield size={12} /> Payments are verified before ad publishing.
              </p>
            </form>
          </div>
        </div>

        <aside className="panel-surface rounded-[1.5rem] bg-white text-slate-900 p-5 md:p-6 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div>
                <p className="font-semibold text-slate-900">{selectedPackage?.name || '--'} Package</p>
                <p className="text-sm text-slate-500">{selectedPackage?.duration_days || '--'} days of visibility</p>
              </div>
              <p className="font-bold text-slate-900">${selectedPackage?.price ?? '0.00'}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>${selectedPackage?.price ?? '0.00'}</span></div>
              <div className="flex justify-between"><span>Tax (0%)</span><span>$0.00</span></div>
            </div>
            <div className="my-4 h-px bg-slate-200" />
            <div className="flex justify-between items-center text-3xl font-black text-cyan-600">
              <span>Total</span>
              <span>${selectedPackage?.price ?? '0.00'}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg)}
                className={`w-full text-left rounded-2xl border px-4 py-3 transition ${selectedPackage?.id === pkg.id ? 'border-cyan-500 bg-cyan-50 text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{pkg.name}</span>
                  <span className="font-bold text-cyan-600">${pkg.price}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{pkg.duration_days} day package</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="inline-flex items-center gap-2 font-semibold text-slate-900 mb-2"><CheckCircle size={14} className="text-cyan-500" /> Verified checkout</div>
            Secure payment handling and manual verification before publishing.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="flex justify-center h-screen items-center text-slate-300">Loading checkout...</div>}>
      <PayPageInner />
    </Suspense>
  );
}
