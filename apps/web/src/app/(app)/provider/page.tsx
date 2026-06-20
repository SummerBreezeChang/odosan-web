'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, CheckCircle2, MapPin } from 'lucide-react';
import { DateDisplay } from '@/components/DateDisplay';
import { useSession } from '@/lib/auth-client';

type Lead = {
  lead_id: string;
  category: string;
  problem: string;
  scope: string;
  fair_price_range: string;
  severity: 'urgent' | 'soon' | 'monitor';
  neighborhood: string;
  status: string;
  created_at: string;
  quoted: boolean;
  quote_low: number | null;
  quote_high: number | null;
  quoted_at: string | null;
};

type MyProvider = {
  provider_id: string;
  name: string;
  category: string;
  phone: string;
  areas_served: string[];
  rating: number | null;
  verification_status: string;
};

const severityConfig = {
  urgent: { icon: AlertCircle, color: 'text-od-red', label: 'Urgent' },
  soon: { icon: Clock, color: 'text-od-orange', label: 'Soon' },
  monitor: { icon: CheckCircle2, color: 'text-od-muted', label: 'Monitor' },
};

const categoryLabels: Record<string, string> = {
  plumbing_drainage: 'Plumbing & Drainage',
  gutters_drainage: 'Gutters & Drainage',
  landscaping: 'Landscaping & Yard',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest Control',
  handyman: 'Handyman',
  painting: 'Painting',
};

export default function ProviderInbox() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [provider, setProvider] = useState<MyProvider | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteLeadId, setQuoteLeadId] = useState<string>('');
  const [quoteLow, setQuoteLow] = useState('');
  const [quoteHigh, setQuoteHigh] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace('/account/signin?next=/provider');
    }
  }, [session, sessionLoading, router]);

  // Load provider + inbox
  useEffect(() => {
    if (sessionLoading || !session?.user) return;
    (async () => {
      try {
        const myProvRes = await fetch('/api/my-provider');
        const myProv = await myProvRes.json();
        if (!myProv.provider) {
          // Signed in but no provider claimed yet
          router.replace('/account/claim-provider?next=/provider');
          return;
        }
        setProvider(myProv.provider);
        const leadsRes = await fetch('/api/leads?for_provider=me');
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads ?? []);
      } catch (err) {
        console.error('Provider inbox load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, sessionLoading, router]);

  async function submitQuote(leadId: string) {
    const low = parseFloat(quoteLow);
    const high = parseFloat(quoteHigh);
    if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high < low) {
      alert('Please enter a valid price range (low ≤ high, both positive).');
      return;
    }
    setSubmittingQuote(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          amount_low: low,
          amount_high: high,
          notes: quoteNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed to submit estimate');
        return;
      }
      // Refresh inbox
      const leadsRes = await fetch('/api/leads?for_provider=me');
      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads ?? []);
      setQuoteLeadId('');
      setQuoteLow('');
      setQuoteHigh('');
      setQuoteNotes('');
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSubmittingQuote(false);
    }
  }

  if (sessionLoading || (!session?.user && true)) {
    return (
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-od-navy/10 border-t-od-navy" />
        <p className="mt-4 text-sm text-od-muted">Checking your sign-in…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-od-navy/10 border-t-od-navy" />
        <p className="mt-4 text-sm text-od-muted">Loading your inbox…</p>
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Welcome + provider summary */}
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
              Welcome back
            </p>
            <h1
              className="text-4xl font-bold text-od-navy mb-2 tracking-tight sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {provider.name}
            </h1>
            <p className="text-sm text-od-muted">
              {categoryLabels[provider.category] ?? provider.category}
              {provider.rating ? ` · ★ ${provider.rating}` : ''}
              {provider.verification_status === 'verified' ? ' · ✓ verified' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-od-navy">{leads.length}</p>
            <p className="text-xs text-od-muted">open leads matched</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-od-subtle">
          Areas served: {provider.areas_served?.join(', ') || '—'}
        </p>
      </div>

      {/* Privacy banner */}
      <div className="mt-4 rounded-2xl border border-od-primary/15 bg-od-primary-soft p-4 text-sm text-od-navy">
        <p>
          <span className="font-semibold">Privacy:</span> homeowner contact info is released only
          when they choose to connect with you. Your estimate goes back through Odosan; you pay a
          flat connect fee on connection.
        </p>
      </div>

      {/* Leads list */}
      {leads.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-od-border bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-od-navy">No matched leads yet</p>
          <p className="mt-2 text-sm text-od-muted">
            New leads in {provider.areas_served?.slice(0, 3).join(', ')} for{' '}
            {(categoryLabels[provider.category] ?? provider.category).toLowerCase()} will appear
            here. Check back, or share Odosan with East Bay homeowners you know.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {leads.map((lead) => {
            const sev = severityConfig[lead.severity];
            const SevIcon = sev.icon;
            const isQuoting = quoteLeadId === lead.lead_id;
            return (
              <div
                key={lead.lead_id}
                className="rounded-3xl border border-od-border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`mt-1 ${sev.color}`}>
                      <SevIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
                        {sev.label} · <DateDisplay date={lead.created_at} />
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-od-navy">{lead.problem}</h3>
                      <p className="mt-1 text-sm text-od-muted">
                        <MapPin className="inline h-3 w-3" /> {lead.neighborhood}
                      </p>
                    </div>
                  </div>
                  {lead.quoted ? (
                    <span className="inline-flex rounded-full bg-od-green-soft px-3 py-1 text-xs font-semibold text-od-green">
                      ✓ Quoted ${lead.quote_low}–${lead.quote_high}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQuoteLeadId(lead.lead_id)}
                      className="inline-flex items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90"
                    >
                      Submit estimate →
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50/70 p-3">
                    <p className="text-xs uppercase text-od-subtle">Scope of work</p>
                    <p className="mt-1 text-sm text-od-navy">{lead.scope}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50/70 p-3">
                    <p className="text-xs uppercase text-od-subtle">Fair price range</p>
                    <p className="mt-1 text-sm font-semibold text-od-navy">
                      {lead.fair_price_range}
                    </p>
                  </div>
                </div>

                {isQuoting && (
                  <div className="mt-4 rounded-2xl border border-od-primary/15 bg-od-cream p-4">
                    <p className="text-sm font-semibold text-od-navy">Your estimate</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        type="number"
                        value={quoteLow}
                        onChange={(e) => setQuoteLow(e.target.value)}
                        placeholder="Low ($)"
                        className="w-32 rounded-xl border border-od-border bg-white px-3 py-2 text-sm text-od-navy focus:border-od-primary focus:outline-none"
                      />
                      <input
                        type="number"
                        value={quoteHigh}
                        onChange={(e) => setQuoteHigh(e.target.value)}
                        placeholder="High ($)"
                        className="w-32 rounded-xl border border-od-border bg-white px-3 py-2 text-sm text-od-navy focus:border-od-primary focus:outline-none"
                      />
                    </div>
                    <textarea
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Optional: notes for the homeowner..."
                      rows={2}
                      className="mt-2 w-full rounded-xl border border-od-border bg-white px-3 py-2 text-sm text-od-navy placeholder:text-od-subtle focus:border-od-primary focus:outline-none"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => submitQuote(lead.lead_id)}
                        disabled={submittingQuote}
                        className="inline-flex items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90 disabled:opacity-50"
                      >
                        {submittingQuote ? 'Sending…' : 'Send estimate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuoteLeadId('')}
                        className="inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-4 py-2 text-sm font-semibold text-od-navy hover:bg-od-primary-soft"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
