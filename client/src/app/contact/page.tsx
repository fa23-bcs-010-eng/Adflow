export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="section-title">Contact Us</h1>
      <p className="section-sub">Get in touch with the AdFlow Pro team.</p>

      <div className="card p-6 space-y-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          Need help with listings, payments, or moderation? Reach out and we will respond as soon as possible.
        </p>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            <span className="text-white font-semibold">Email:</span> support@adflow.pro
          </p>
          <p>
            <span className="text-white font-semibold">Phone:</span> +92 300 0000000
          </p>
          <p>
            <span className="text-white font-semibold">Hours:</span> Mon-Sat, 10:00 AM - 7:00 PM
          </p>
        </div>
      </div>
    </div>
  );
}