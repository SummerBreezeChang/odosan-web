import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function HowItWorks() {
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
            How Odosan works
          </h1>
          <p className="text-base text-gray-600">
            Your home maintenance concierge — diagnosis first, privacy always
          </p>
        </div>

        {/* Four steps */}
        <div className="space-y-8 mb-16">
          <div className="border-l-2 border-gray-200 pl-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                STEP 1
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Tell us what's wrong</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Pick a category, snap a photo (optional), describe the problem, and share your
              neighborhood. No contact info required yet.
            </p>
          </div>

          <div className="border-l-2 border-gray-200 pl-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                STEP 2
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Get an AI diagnosis</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our AI analyzes your issue and tells you what's wrong, how urgent it is, the
              recommended scope of work, and a fair price range — before you talk to anyone.
            </p>
          </div>

          <div className="border-l-2 border-gray-200 pl-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                STEP 3
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Compare vetted pros</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              We match you with 2–3 local professionals who do this exact work in your neighborhood.
              You stay completely anonymous — they can't see your name, address, or contact info
              yet.
            </p>
          </div>

          <div className="border-l-2 border-gray-200 pl-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                STEP 4
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Connect when you're ready</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Choose your favorite pro, confirm, and we'll share your contact info with them.
              They'll reach out to schedule a visit and provide a quote. The work agreement is
              between you and them.
            </p>
          </div>
        </div>

        {/* Who pays */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Who pays what?</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">For homeowners</div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Free.</span> Diagnosis, matching, and connecting
                with pros costs you nothing. You only pay the provider directly for the work they
                do.
              </p>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-1">For providers</div>
              <p className="text-sm text-gray-600">
                Providers pay only when a homeowner chooses to connect with them — no upfront fees,
                no spam leads. They receive pre-diagnosed, scoped, and consented warm leads.
              </p>
            </div>
          </div>
        </div>

        {/* What we're not */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Odosan is — and isn't</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Odosan is the{' '}
            <span className="font-semibold">diagnosis, matchmaking, and privacy layer</span>. We are
            not a contractor and do not perform or warranty work.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            The work agreement, pricing, scheduling, and completion are directly between you and the
            provider you choose. We facilitate and protect the connection.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get started
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
