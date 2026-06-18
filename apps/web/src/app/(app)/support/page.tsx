export default function Support() {
  return (
    <div className="min-h-screen bg-od-bg">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1
          className="font-bold text-4xl text-od-navy mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Support
        </h1>
        <p className="text-lg text-od-muted mb-12">Need help with Odosan? We&apos;re here for you.</p>
        <div className="space-y-10 text-od-muted">
          <div className="bg-white rounded-2xl p-8 border border-od-primary/10">
            <h2
              className="font-bold text-xl text-od-navy mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Contact Us
            </h2>
            <p className="mb-4">For questions or support, email us at:</p>
            <a
              href="mailto:contact@odosan.care"
              className="text-od-primary font-semibold text-lg hover:underline"
            >
              contact@odosan.care
            </a>
            <p className="mt-2 text-sm text-od-muted/60">We typically respond within 24 hours.</p>
          </div>
          <div>
            <h2
              className="font-bold text-2xl text-od-navy mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <Faq
                q="What is Odosan?"
                a="A home maintenance sidekick for first-time homeowners. It tracks your home's systems, sends seasonal alerts, calculates a health score, and gives you practical advice — like a knowledgeable parent who knows houses."
              />
              <Faq
                q="What does 'Odosan' mean?"
                a="It's inspired by the Japanese word for father (お父さん / Otou-san). Odosan represents the trusted voice that knows when to check the sump pump, clean the gutters, and call a plumber."
              />
              <Faq
                q="How does the Home Health Score work?"
                a="Your score (0–100) is calculated from five categories: structural age, systems coverage, service history, profile completeness, and risk readiness. Log services and your score goes up."
              />
              <Faq
                q="How does Odosan know about my soil type and climate?"
                a="When you enter your address, Odosan uses heuristic matching to estimate your region's soil type, climate zone, and hazards. This is labeled as estimated — not from GPS or government databases."
              />
              <Faq
                q="What is the AR Scan feature?"
                a="Point your phone at a home system (water heater, HVAC unit). The app identifies it and shows health status, service history, and next steps. Currently in beta with mock detection — real AI recognition coming soon."
              />
              <Faq
                q="Can I share my scorecard with my insurance company?"
                a="Yes. Tap 'Share with insurer' to generate a formatted maintenance report with timestamps, service logs, and your health score. Share via AirDrop, email, or any app."
              />
              <Faq
                q="Is my data private?"
                a="Your home data is stored locally on your device. We don't maintain a centralized database. The AI chat uses the Claude API for personalized responses. We don't sell data or show ads."
              />
              <Faq
                q="How do I delete my account?"
                a="Go to Profile → Settings → Delete account and all data. This permanently removes all your home data, service history, and scores from your device. You can also email contact@odosan.care."
              />
              <Faq
                q="Is Odosan free?"
                a="The core app is free. Premium features (AR scanning, advanced AI chat, multi-property support) are available with a subscription."
              />
            </div>
          </div>
          <div className="bg-od-primary-soft rounded-2xl p-8">
            <h2
              className="font-bold text-xl text-od-navy mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Report a Problem
            </h2>
            <p className="mb-2">
              Email{' '}
              <a
                href="mailto:contact@odosan.care"
                className="text-od-primary font-semibold hover:underline"
              >
                contact@odosan.care
              </a>{' '}
              with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-od-muted/80 ml-2">
              <li>What you were trying to do</li>
              <li>What happened instead</li>
              <li>Your device model and iOS version</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-od-primary/10 pb-5">
      <h3 className="font-semibold text-od-navy mb-2">{q}</h3>
      <p className="text-od-muted/80 leading-relaxed">{a}</p>
    </div>
  );
}
