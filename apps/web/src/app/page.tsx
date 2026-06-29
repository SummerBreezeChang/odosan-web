import { ButtonLink } from '@/components/brand/Button';
import { Card } from '@/components/brand/Card';
import { SectionHeader } from '@/components/brand/SectionHeader';
import { InfoBanner } from '@/components/brand/InfoBanner';

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.7-.7-.7-2.7z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z" />
      <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </svg>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Snap + a sentence',
    desc: 'Take a photo, add a quick note. Get a diagnosis and fair price for your area.',
    Icon: CameraIcon,
  },
  {
    n: '02',
    title: 'DIY or pro? Straight answer.',
    desc: 'Odosan tells you which way costs less — then helps you spend the least either way.',
    Icon: WrenchIcon,
  },
  {
    n: '03',
    title: 'Save to My Home',
    desc: "A record of your home's health that grows over time. Refer back any time.",
    Icon: BookmarkIcon,
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
      {/* Hero */}
      <section>
        <SectionHeader
          eyebrow="Your home's dad"
          title="Know what's wrong — and whether you can fix it yourself."
          subtitle="Snap a photo. Odosan tells you what it is, what it should cost, and whether it's a quick DIY or worth calling a pro — so you spend the least to keep your home healthy."
          size="display"
        />

        <div className="mt-7 flex flex-col gap-3">
          <ButtonLink href="/diagnose" size="lg" className="w-full justify-center">
            <CameraIcon className="h-5 w-5" />
            Diagnose a problem
          </ButtonLink>
          <p className="text-center text-[13px] text-od-subtle">
            Free. No account needed.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-10" aria-labelledby="how-it-works-heading">
        <SectionHeader
          id="how-it-works-heading"
          title="How it works"
          size="h2"
          className="mb-4"
        />
        <div className="flex flex-col gap-2.5">
          {STEPS.map(({ n, title, desc, Icon }) => (
            <Card key={n} className="flex items-start gap-4 p-4">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-od-primary-soft text-od-leaf"
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-od-subtle">
                  {n}
                </p>
                <h3
                  className="text-[16px] font-semibold leading-[1.25] text-od-ink"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h3>
                <p className="mt-1 text-[13px] leading-[1.5] text-od-muted">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Where it's going */}
      <section className="mt-4" aria-label="Roadmap preview">
        <InfoBanner
          tone="neutral"
          icon={<SparkIcon className="h-5 w-5" />}
          title="Where it's going."
          body="One day, walk through your home once and Odosan maps everything that needs care — turning maintenance into resale equity."
        />
      </section>
    </div>
  );
}
