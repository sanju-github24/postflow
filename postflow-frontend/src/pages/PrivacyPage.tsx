export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm">Last updated: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. What We Collect</h2>
            <p>PostFlow collects the following information when you use our service:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your name and email address when you create an account</li>
              <li>Social media access tokens when you connect your accounts (Facebook, Instagram, Twitter/X, LinkedIn)</li>
              <li>Post content and scheduled times you create within the app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>To authenticate you and manage your account</li>
              <li>To publish and schedule posts to your connected social media accounts on your behalf</li>
              <li>To display your post history and account connection status</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Store Your Data</h2>
            <p>
              All social media access tokens are encrypted before being stored in our database.
              We use Supabase for secure data storage. We do not store your social media passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Sharing</h2>
            <p>
              We do not sell, rent, or share your personal data with third parties for marketing purposes.
              Data is only shared with social media platforms (Facebook, Instagram, Twitter/X, LinkedIn)
              as required to publish your posts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Deletion</h2>
            <p>
              You can disconnect any social media account at any time from the Accounts page.
              This immediately removes the associated token from our database.
              To delete your entire account and all associated data, visit our{" "}
              <a href="/data-deletion" className="text-indigo-600 hover:underline">Data Deletion page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Cookies</h2>
            <p>
              PostFlow uses browser localStorage to store your authentication token.
              We do not use third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, contact us at{" "}
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