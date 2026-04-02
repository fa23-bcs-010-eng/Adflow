export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="section-title">Privacy Policy</h1>
      <p className="section-sub">How we collect, use, and protect your information.</p>

      <div className="card p-6 space-y-5 text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-white font-semibold mb-2">1. Information We Collect</h2>
          <p>
            We collect account details, listing content, and activity data needed to operate the platform.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">2. How We Use Data</h2>
          <p>
            Data is used for authentication, moderation, billing verification, and improving user experience.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">3. Data Sharing</h2>
          <p>
            We do not sell personal data. We may share limited data with service providers required to run the app.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">4. Contact</h2>
          <p>
            For privacy-related requests, contact us at support@adflow.pro.
          </p>
        </section>
      </div>
    </div>
  );
}