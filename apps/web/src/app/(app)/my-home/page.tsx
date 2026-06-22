'use client';

import { useEffect, useState } from 'react';
import {
  SYSTEM_LABELS,
  loadHomeRecord,
  type DiagnosisBrief,
  type SystemRecord,
} from '@/lib/home-record';

const CATEGORY_LABELS: Record<string, string> = {
  plumbing_drainage: 'Plumbing',
  gutters_drainage: 'Gutters',
  landscaping: 'Landscaping',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest',
  handyman: 'Handyman',
  painting: 'Painting',
};

const SEVERITY_STYLE: Record<DiagnosisBrief['severity'], string> = {
  urgent: 'bg-od-red-soft text-od-red',
  soon: 'bg-od-orange-soft text-od-orange',
  monitor: 'bg-od-green-soft text-od-green',
};

export default function MyHomePage() {
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [briefs, setBriefs] = useState<DiagnosisBrief[]>([]);

  useEffect(() => {
    function refresh() {
      const rec = loadHomeRecord();
      setSystems(rec.systems);
      setBriefs(rec.briefs);
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <header>
        <h1
          className="text-4xl font-bold text-od-navy tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          My home
        </h1>
        <p className="mt-3 text-base text-od-muted">
          A lightweight record of your home&apos;s health. It grows every time you diagnose
          something.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-od-navy">Saved diagnoses</h2>
        {briefs.length === 0 ? (
          <EmptyCard
            heading="Nothing saved yet"
            body="Diagnose your first problem and tap ‘Save to My home’ to start a record."
            cta={{ href: '/diagnose', label: 'Diagnose a problem' }}
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {briefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-od-navy">Scanned systems</h2>
        {systems.length === 0 ? (
          <EmptyCard
            heading="No systems scanned yet"
            body="When you DIY, scanning your water heater, HVAC, or panel adds it here."
            cta={{ href: '/my-home/document', label: 'Scan a system' }}
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {systems.map((system) => (
              <SystemCard key={system.id} system={system} />
            ))}
          </ul>
        )}
      </section>

      <aside className="mt-10 rounded-2xl border border-od-border bg-od-cream p-4 sm:p-5">
        <div className="flex gap-3">
          <span aria-hidden className="text-od-primary">✦</span>
          <p className="text-sm text-od-navy">
            <span className="font-semibold">Coming soon.</span> A transferable Home Health
            Scorecard at resale — proof you&apos;ve taken care of the place.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EmptyCard({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="mt-3 rounded-2xl border border-od-border bg-white p-6 text-center shadow-sm sm:p-8">
      <p className="text-base font-semibold text-od-navy">{heading}</p>
      <p className="mt-2 text-sm text-od-muted">{body}</p>
      <a
        href={cta.href}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
      >
        {cta.label}
      </a>
    </div>
  );
}

function BriefCard({ brief }: { brief: DiagnosisBrief }) {
  const savedDate = new Date(brief.saved_at);
  return (
    <li className="rounded-2xl border border-od-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[brief.severity]}`}
        >
          {brief.severity.toUpperCase()}
        </span>
        <span className="text-xs font-semibold uppercase text-od-muted">
          {CATEGORY_LABELS[brief.category] ?? brief.category}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            brief.diyOrPro === 'diy'
              ? 'bg-od-primary-soft text-od-primary'
              : 'bg-od-navy/10 text-od-navy'
          }`}
        >
          {brief.diyOrPro === 'diy' ? 'DIY' : 'Pro'}
        </span>
        <span className="ml-auto text-xs text-od-subtle">{savedDate.toLocaleDateString()}</span>
      </div>
      <p className="mt-2 text-base font-bold text-od-navy">{brief.issue}</p>
      <p className="mt-1 line-clamp-2 text-sm text-od-muted">{brief.scopeOfWork}</p>
      <p className="mt-2 text-xs text-od-muted">
        Fair range: <span className="font-semibold text-od-navy">{brief.fairPriceRange}</span>
      </p>
    </li>
  );
}

function SystemCard({ system }: { system: SystemRecord }) {
  return (
    <li className="rounded-2xl border border-od-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-bold text-od-navy">{SYSTEM_LABELS[system.system_type]}</p>
        <span className="text-xs text-od-subtle">
          Scanned {new Date(system.documented_at).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1 text-sm text-od-navy">
        {system.make ?? 'Unknown brand'}
        {system.capacity ? ` · ${system.capacity}` : ''}
      </p>
      {system.estimated_age_years !== null && (
        <p className="mt-1 text-xs text-od-muted">
          ~{system.estimated_age_years} years old
          {system.expected_lifespan_years
            ? ` · ~${system.expected_lifespan_years}y typical lifespan`
            : ''}
        </p>
      )}
      {system.recall_or_safety_flag && (
        <p className="mt-2 rounded-md bg-od-red-soft px-2 py-1 text-xs font-semibold text-od-red">
          ⚠ {system.recall_or_safety_flag}
        </p>
      )}
    </li>
  );
}
