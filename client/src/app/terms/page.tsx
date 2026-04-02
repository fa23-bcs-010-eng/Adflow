export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="section-title">Terms of Service</h1>
      <p className="section-sub">Please review these terms before using AdFlow Pro.</p>

      <div className="card p-6 space-y-5 text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-white font-semibold mb-2">1. Platform Usage</h2>
          <p>
            Users must provide accurate information and comply with local laws when posting ads.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">2. Listings and Moderation</h2>
          <p>
            All listings are subject to review. We may reject or remove content that violates policies.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">3. Payments</h2>
          <p>
            Package purchases and featured options are non-refundable once verified and processed.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">4. Liability</h2>
          <p>
            AdFlow Pro acts as a listing platform and is not responsible for transactions between users.
          </p>
        </section>
      </div>
    </div>
  );
}