'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle2, MapPin } from 'lucide-react';
import { DateDisplay } from '@/components/DateDisplay';

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
};

const severityConfig = {
  urgent: { icon: AlertCircle, color: 'text-red-600', label: 'Urgent' },
  soon: { icon: Clock, color: 'text-orange-600', label: 'Soon' },
  monitor: { icon: CheckCircle2, color: 'text-gray-600', label: 'Monitor' },
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch all open leads for the provider inbox
    fetch('/api/leads?status=open')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch leads');
        return res.json();
      })
      .then((data) => {
        setLeads(data.leads || []);
      })
      .catch((err) => {
        console.error('Error fetching leads:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-od-navy/10 border-t-od-navy" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-4xl font-bold text-od-navy mb-3 tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Lead inbox
          </h1>
          <p className="text-base text-od-muted">
            Pre-diagnosed, scoped leads from homeowners in your service area
          </p>
        </div>

        {/* Privacy notice */}
        <div className="bg-blue-50 rounded-xl border border-gray-200 p-6 mb-8">
          <div className="text-sm text-gray-900 font-semibold mb-2">Privacy-first leads</div>
          <p className="text-sm text-gray-600">
            Homeowner contact info is shared only when they choose to connect with you. Until then,
            you see the problem, scope, and neighborhood only.
          </p>
        </div>

        {/* Leads */}
        {leads.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">No leads yet</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              When homeowners in your service area submit issues that match your trade, you'll see
              anonymized lead cards here. You'll be charged only when they choose to connect with
              you.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {leads.map((lead) => {
              const SeverityIcon = severityConfig[lead.severity].icon;
              return (
                <div key={lead.lead_id} className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${severityConfig[lead.severity].color}`}>
                        <SeverityIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {lead.problem}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full border border-gray-200 ${severityConfig[lead.severity].color}`}
                          >
                            {severityConfig[lead.severity].label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {categoryLabels[lead.category] || lead.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <DateDisplay dateString={lead.created_at} format="short" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Scope of work</div>
                      <div className="text-sm text-gray-900">{lead.scope}</div>
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Fair price range
                        </div>
                        <div className="text-sm text-gray-900 font-semibold">
                          {lead.fair_price_range}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">Location</div>
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {lead.neighborhood}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  {lead.status === 'connected' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Homeowner connected with you — check your email/phone
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
