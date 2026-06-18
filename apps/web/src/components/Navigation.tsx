import Link from 'next/link';

export function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            Odosan
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/diagnose"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Diagnose
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/home"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              My Home
            </Link>
            <Link
              href="/provider"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              For Providers
            </Link>
            <Link
              href="/support"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
