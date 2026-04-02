export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Data Deletion</h1>
          <p className="text-muted-foreground mt-2 text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How to Delete Your Data</h2>
            <p>
              You have full control over your data on PostFlow. Here are the ways to delete it:
            </p>
          </section>

          <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-indigo-800">Option 1 — Disconnect a platform</h3>
            <p className="text-indigo-700">
              Go to <strong>Accounts</strong> page → click <strong>Disconnect</strong> next to any platform.
              This immediately removes the access token for that platform from our database.
            </p>
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">Option 2 — Request full account deletion</h3>
            <p>
              To delete your entire account and all associated data (posts, schedules, tokens), 
              send an email to:
            </p>
            <a
              href="mailto:support@postflow.app?subject=Account Deletion Request"
              className="inline-block mt-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              support@postflow.app — Request Deletion
            </a>
            <p className="text-xs text-slate-400 mt-2">
              Include the email address associated with your PostFlow account.
              We will process your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">What Gets Deleted</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name and email address</li>
              <li>All encrypted social media access tokens</li>
              <li>All scheduled and published post records</li>
              <li>All media files uploaded through PostFlow</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Facebook Data Deletion</h2>
            <p>
              If you connected PostFlow via Facebook Login, you can also request data deletion
              directly through Facebook. Go to{" "}
              <strong>Facebook Settings → Apps and Websites → PostFlow → Remove</strong>.
              This will trigger a deletion request to our servers automatically.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}