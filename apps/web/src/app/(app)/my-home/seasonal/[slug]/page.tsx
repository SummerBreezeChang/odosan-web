import { X, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/brand/Button';
import { SEASONAL_TASKS, findSeasonalTask } from '@/lib/seasonal-tasks';

// Pre-generate static params for each known seasonal task so the pages are
// fast and the build catches typos in slugs.
export function generateStaticParams() {
  return SEASONAL_TASKS.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const task = findSeasonalTask(slug);
  if (!task) return { title: 'Seasonal — Odosan' };
  return {
    title: `${task.title} — Odosan`,
    description: task.shortWhy,
  };
}

export default async function SeasonalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const task = findSeasonalTask(slug);
  if (!task) notFound();

  const Icon = task.icon;
  const introParagraphs = task.intro.split('\n\n');

  return (
    <div className="seasonal-detail mx-auto w-full max-w-xl px-5 pb-12 pt-4 sm:px-6">
      {/* Slide UP from bottom on mount — reads as a sheet/modal pushed
          over /my-home. The X close button in the top-right reinforces
          the "this is a layer I can dismiss" mental model. Pure CSS,
          honors prefers-reduced-motion. */}
      <style>{`
        @keyframes seasonal-slide-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .seasonal-detail { animation: seasonal-slide-up 320ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .seasonal-detail { animation: none; }
        }
      `}</style>

      {/* Close (X) — returns to /my-home. Top-right placement so it's
          tappable with a thumb while reading. */}
      <div className="flex justify-end">
        <Link
          href="/my-home"
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-od-border bg-white text-od-muted transition-colors hover:bg-od-cream hover:text-od-ink"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Hero */}
      <div className="mt-5 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-od-primary-soft text-od-primary"
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-subtle">
            {task.when}
          </p>
          <h1
            className="mt-1 text-[28px] font-semibold leading-[1.15] text-od-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {task.title}
          </h1>
        </div>
      </div>

      {/* Intro */}
      <div className="mt-5 space-y-3 text-[15px] leading-[1.6] text-od-body">
        {introParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* What you'll need */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-subtle">
          What you’ll need
        </h2>
        <ul className="mt-3 space-y-2">
          {task.toolsNeeded.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-od-body">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-od-green"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* The basics */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-subtle">
          The basics
        </h2>
        <ol className="mt-3 space-y-3">
          {task.basics.map((step, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl border border-od-border bg-white p-3 text-[14px] leading-[1.5] text-od-body"
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-od-primary-soft text-[12px] font-semibold text-od-primary"
              >
                {i + 1}
              </span>
              <span className="flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Watch out for */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-orange">
          Watch out for
        </h2>
        <ul className="mt-3 space-y-2">
          {task.watchFor.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[14px] leading-[1.5] text-od-body"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-od-orange"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA — diagnose */}
      <section className="mt-10 rounded-2xl border border-od-border bg-od-cream p-5">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-od-primary-soft text-od-primary"
          >
            <Camera className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[17px] font-semibold leading-[1.25] text-od-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Spot something off? Let Odosan diagnose it.
            </p>
            <p className="mt-1 text-[13px] leading-[1.5] text-od-muted">
              {task.diagnoseHint}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ButtonLink
            href={`/diagnose?category=${task.category}`}
            size="lg"
            className="w-full justify-center"
          >
            Diagnose what I’m seeing
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
