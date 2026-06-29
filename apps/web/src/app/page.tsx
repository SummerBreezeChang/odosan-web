import Link from 'next/link';

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
      strokeWidth="2"
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
      strokeWidth="2"
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
      strokeWidth="2"
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
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-6 sm:px-6">
      {/* Hero */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-leaf">
          Your home&apos;s dad
        </p>
        <h1
          className="mt-3 text-[30px] font-semibold leading-[1.15] text-od-ink sm:text-[36px]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Know what&apos;s wrong — and whether you can fix it yourself.
        </h1>
        <p className="mt-4 text-[15px] leading-[1.5] text-od-body">
          Snap a photo. Odosan tells you what it is, what it should cost, and whether it&apos;s a
          quick DIY or worth calling a pro — so you spend the least to keep your home healthy.
        </p>

        <Link
          href="/diagnose"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-od-ink px-6 py-3.5 text-[15px] font-semibold text-od-bg transition-colors hover:bg-od-leaf"
        >
          <CameraIcon className="h-5 w-5" />
          Diagnose a problem
        </Link>
        <p className="mt-3 text-center text-[13px] text-od-subtle">Free. No account needed.</p>
      </section>

      {/* How it works — tightened: smaller padding, single-row eyebrow with icon */}
      <section className="mt-10">
        <h2
          className="text-[20px] font-semibold leading-[1.2] text-od-ink"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          How it works
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {STEPS.map(({ n, title, desc }) => (
            <div
              key={n}
              className="rounded-[18px] border border-od-border bg-white/60 px-4 py-3.5 shadow-[0_1px_2px_rgba(27,56,42,0.05)]"
            >
              <div className="flex items-center gap-2 text-od-leaf">
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-od-subtle">
                  {n}
                </span>
              </div>
              <h3
                className="mt-1 text-[17px] font-semibold leading-[1.25] text-od-ink"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h3>
              <p className="mt-1 text-[13px] leading-[1.5] text-od-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Where it's going */}
      <section className="mt-4">
        <div className="flex items-start gap-3 rounded-[18px] border border-od-border bg-white/50 px-4 py-3.5">
          <SparkIcon className="mt-0.5 h-5 w-5 shrink-0 text-od-leaf" />
          <p className="text-[13px] leading-[1.5] text-od-muted">
            <span className="font-semibold text-od-ink">Where it&apos;s going.</span> One day, walk
            through your home once and Odosan maps everything that needs care — turning maintenance
            into resale equity.
          </p>
        </div>
      </section>
    </div>
  );
}
