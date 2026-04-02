export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-2 text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account and using PostFlow, you agree to be bound by these Terms of Service.
              If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>
              PostFlow is a social media scheduling tool that uses AI to adapt your content
              for multiple platforms including Facebook, Instagram, Twitter/X, and LinkedIn.
              You can schedule posts to be automatically published at a future time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Your Responsibilities</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You are responsible for all content you publish through PostFlow</li>
              <li>You must comply with each social media platform's own terms of service</li>
              <li>You must not use PostFlow to post spam, hate speech, or illegal content</li>
              <li>You must keep your account credentials secure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms
              or misuse the service. You may delete your account at any time from the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
            <p>
              PostFlow is provided "as is" without warranties of any kind. We are not responsible
              for any failed posts, API downtime from third-party platforms, or loss of data.
              Use the service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of PostFlow after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@postflow.app" className="text-indigo-600 hover:underline">
                support@postflow.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}