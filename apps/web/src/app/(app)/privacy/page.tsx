import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-6"
          >
            ← Back to home
          </Link>
          <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
            Privacy & security
          </h1>
          <p className="text-base text-gray-600">You're anonymous until you choose to connect</p>
        </div>

        {/* Progressive disclosure */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progressive disclosure</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            When you submit a problem, providers see only what they need to evaluate the job — never
            your personal information until you consent.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-xs font-medium text-gray-500 mb-3">PROVIDERS SEE</div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Problem description</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Scope of work</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Photos (EXIF-stripped)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Neighborhood only</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <div className="text-xs font-medium text-gray-500 mb-3">PROVIDERS DON'T SEE</div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Your name</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Your exact address</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Your phone number</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">-</span>
                  <span>Your email</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consent gate */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            You control when contact is shared
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            After reviewing matched providers, you decide who to connect with. Only when you tap
            "Connect" do we share your name, address, phone, and email with that specific provider.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Until then, you're completely anonymous. No lead spam, no unsolicited calls.
          </p>
        </div>

        {/* Photo privacy */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Photo metadata protection</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            When you upload a photo, we automatically resize it in your browser and strip all EXIF
            metadata — including GPS coordinates, camera model, and timestamps — before it leaves
            your device.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Providers only see the image itself, never location data embedded in the file.
          </p>
        </div>

        {/* Your rights */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your data rights</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>
                <span className="font-semibold text-gray-900">Delete a request:</span> You can
                delete any diagnosis or lead at any time.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>
                <span className="font-semibold text-gray-900">Delete your data:</span> Request full
                deletion of your account and all associated data.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>
                <span className="font-semibold text-gray-900">Export your history:</span> Download a
                copy of all your home maintenance records.
              </span>
            </div>
          </div>
        </div>

        {/* Security practices */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security practices</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>All data is encrypted in transit (HTTPS) and at rest</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>Provider identities are verified before joining the network</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>We never sell or share your data with third parties</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400">-</span>
              <span>Access logs track who views what, when</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
