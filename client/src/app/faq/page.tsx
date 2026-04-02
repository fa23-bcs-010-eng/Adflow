export default function FaqPage() {
  const faqs = [
    { q: 'How does AdFlow Pro work?', a: 'Post an ad, choose a package, submit payment proof, and our team reviews and publishes it. Only approved ads appear publicly.' },
    { q: 'What payment methods do you accept?', a: 'We accept bank transfer, EasyPaisa, JazzCash, and other methods. Upload a screenshot as proof of payment.' },
    { q: 'How long does approval take?', a: 'Moderators review ads within 24-48 hours. Payment verification takes 12-24 hours on business days.' },
    { q: 'Can I use image URLs?', a: 'Yes! We support image URLs, GitHub raw links, YouTube links, and CDN URLs. No direct file uploads.' },
    { q: 'What happens when my ad expires?', a: 'Expired ads are archived automatically. You can repost by creating a new draft and selecting a package.' },
    { q: 'What is the ranking formula?', a: 'Rank score = (featured ? 50 : 0) + packageWeight×10 + freshness + adminBoost + verifiedSellerPoints' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="section-title">Frequently Asked Questions</h1>
      <p className="section-sub">Everything you need to know about AdFlow Pro</p>
      <div className="space-y-4">
        {faqs.map(({ q, a }) => (
          <div key={q} className="card p-5">
            <h3 className="font-semibold text-white mb-2">{q}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
