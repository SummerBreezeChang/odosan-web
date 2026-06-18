import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-xl font-semibold text-gray-900 mb-4">Odosan</div>
            <p className="text-sm text-gray-600">Your privacy-first home maintenance concierge</p>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Product</div>
            <div className="space-y-2">
              <Link
                href="/how-it-works"
                className="block text-sm text-gray-600 hover:text-gray-900"
              >
                How it works
              </Link>
              <Link href="/privacy" className="block text-sm text-gray-600 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/home" className="block text-sm text-gray-600 hover:text-gray-900">
                My Home
              </Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">For Providers</div>
            <div className="space-y-2">
              <Link href="/provider" className="block text-sm text-gray-600 hover:text-gray-900">
                Provider inbox
              </Link>
              <a href="#" className="block text-sm text-gray-600 hover:text-gray-900">
                Join as a pro
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Service Area</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Berkeley</div>
              <div>Oakland / Rockridge</div>
              <div>Albany / El Cerrito</div>
              <div>Piedmont / Emeryville</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              © 2026 Odosan. Built for H0 & Gemini XPRIZE hackathons.
            </div>
            <div className="text-xs text-gray-500">
              お父さん (otōsan) — the "home dad" you can call
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
