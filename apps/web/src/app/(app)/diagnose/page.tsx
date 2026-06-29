'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  Droplet,
  Wind,
  Plug,
  Home,
  Thermometer,
  ShieldCheck,
  Box,
  Star,
} from 'lucide-react';
import { saveBrief, syncBriefToServer } from '@/lib/home-record';
import { categoryLabel } from '@/lib/categories';
import { Card, Chip, FeatureTile, Label, SectionHeader, severityTone, confidenceTone } from '@/components/brand';

type Step =
  | 'intake'
  | 'diagnosing'
  | 'clarify'
  | 'refining'
  | 'result'
  | 'matches'
  | 'consent'
  | 'done';

type Severity = 'urgent' | 'soon' | 'monitor';

type ClarifyingQuestion = {
  id: string;
  question: string;
  type: 'text' | 'yesno' | 'select';
  options?: string[];
};

type DiagnosisResult = {
  issue: string;
  severity: Severity;
  recommendedCategory: string;
  scopeOfWork: string;
  fairPriceRange: string;
  diyOrPro: 'diy' | 'pro';
  explanation: string;
  confidence?: number;
  clarifyingQuestions?: ClarifyingQuestion[];
  diyShoppingQuery?: string;
};

type AmazonProduct = {
  asin: string;
  title: string;
  url: string;
  image: string | null;
  price: string | null;
  priceAmount: number | null;
  rating: number | null;
  reviewCount: number | null;
};

type CuratedIconKey =
  | 'wrench'
  | 'droplet'
  | 'wind'
  | 'plug'
  | 'home'
  | 'thermometer'
  | 'shield'
  | 'box';

type CuratedProduct = {
  id: string;
  title: string;
  description: string;
  priceRange: string;
  searchKeywords: string;
  category: string;
  icon: CuratedIconKey;
  url: string | null;
};

type ShoppingBucket = {
  query: string;
  products: AmazonProduct[];
  curatedProducts: CuratedProduct[];
  searchUrl: string | null;
  error: string | null;
} | null;

const CURATED_ICON_MAP: Record<CuratedIconKey, typeof Wrench> = {
  wrench: Wrench,
  droplet: Droplet,
  wind: Wind,
  plug: Plug,
  home: Home,
  thermometer: Thermometer,
  shield: ShieldCheck,
  box: Box,
};

type Provider = {
  provider_id: string;
  name: string;
  category: string;
  phone: string;
  website?: string;
  google_maps_url?: string;
  rating?: number;
};

const categories = [
  { id: 'plumbing_drainage', label: 'Plumbing & Drainage' },
  { id: 'gutters_drainage', label: 'Gutters & Drainage' },
  { id: 'landscaping', label: 'Landscaping & Yard' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'pest_control', label: 'Pest Control' },
  { id: 'handyman', label: 'Handyman' },
  { id: 'painting', label: 'Painting' },
  { id: 'other', label: 'Other / not sure' },
];

const neighborhoods = [
  'Berkeley',
  'North Oakland / Rockridge',
  'Albany',
  'El Cerrito',
  'Kensington',
  'Piedmont',
  'Emeryville',
  'Alameda',
  'Other (East Bay)',
];

const severityConfig: Record<Severity, { icon: any; color: string; label: string }> = {
  urgent: { icon: AlertCircle, color: 'text-red-600', label: 'Urgent' },
  soon: { icon: Clock, color: 'text-orange-600', label: 'Soon' },
  monitor: { icon: CheckCircle2, color: 'text-gray-600', label: 'Monitor' },
};

export default function DiagnosePage() {
  // useSearchParams must be inside a Suspense boundary for Next.js to bail
  // out of static rendering cleanly. The inner component holds all the state
  // machine logic and is wrapped here.
  return (
    <Suspense fallback={null}>
      <DiagnoseInner />
    </Suspense>
  );
}

function DiagnoseInner() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('intake');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstPass, setFirstPass] = useState<DiagnosisResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shopping, setShopping] = useState<ShoppingBucket>(null);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [savedBriefId, setSavedBriefId] = useState<string | null>(null);
  const [savingBrief, setSavingBrief] = useState(false);

  // Pre-fill from URL params when arriving via /my-home's per-trade CTAs.
  // Only fires once and only if the params match our known options, so users
  // who land on /diagnose without params get a blank form like before.
  useEffect(() => {
    const c = searchParams.get('category');
    if (c && categories.some((cat) => cat.id === c)) setSelectedCategory(c);
    const n = searchParams.get('neighborhood');
    if (n && neighborhoods.includes(n)) setNeighborhood(n);
  }, [searchParams]);

  // Fetch Amazon DIY products as soon as a diagnosis exists.
  async function fetchShoppingForBrief(d: DiagnosisResult) {
    if (!d.diyShoppingQuery) return;
    setShoppingLoading(true);
    try {
      const res = await fetch('/api/amazon-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: d.diyShoppingQuery }),
      });
      const data = await res.json();
      if (res.ok && data.single) setShopping(data.single);
    } catch {
      // Non-fatal — the rest of the result screen still works.
    } finally {
      setShoppingLoading(false);
    }
  }

  function handleSaveBrief() {
    if (!diagnosis) return;
    setSavingBrief(true);
    try {
      const briefPayload = {
        category: diagnosis.recommendedCategory,
        neighborhood,
        issue: diagnosis.issue,
        severity: diagnosis.severity,
        scopeOfWork: diagnosis.scopeOfWork,
        fairPriceRange: diagnosis.fairPriceRange,
        diyOrPro: diagnosis.diyOrPro,
        explanation: diagnosis.explanation,
        confidence: diagnosis.confidence ?? 0,
        diyShoppingQuery: diagnosis.diyShoppingQuery ?? '',
      };
      const saved = saveBrief(briefPayload);
      setSavedBriefId(saved.id);
      // Fire-and-forget DB sync. 401 means anonymous user — fine, the brief
      // lives in localStorage until they sign up.
      void syncBriefToServer(briefPayload);
    } finally {
      setSavingBrief(false);
    }
  }

  const stripExifAndResize = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        reject(new Error('Browser environment required'));
        return;
      }

      const img = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to process image'));
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.error('Browser environment required for image processing');
      return;
    }

    try {
      const strippedBlob = await stripExifAndResize(file);
      const strippedFile = new File([strippedBlob], file.name, { type: 'image/jpeg' });
      setPhotoFile(strippedFile);
      setPhotoPreview(URL.createObjectURL(strippedFile));
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const handleDiagnose = async () => {
    if (!selectedCategory || !neighborhood) return;

    setIsSubmitting(true);
    setStep('diagnosing');

    try {
      const formData = new FormData();
      formData.append('category', selectedCategory);
      formData.append('description', description);
      formData.append('neighborhood', neighborhood);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Diagnosis failed');
      }

      const result: DiagnosisResult = await response.json();

      // If Gemini wants clarification, go through the clarify step before
      // committing to a final diagnosis. Otherwise jump straight to result.
      const needsClarify =
        Array.isArray(result.clarifyingQuestions) && result.clarifyingQuestions.length > 0;

      if (needsClarify) {
        setFirstPass(result);
        // Pre-fill answers map so inputs are controlled from the start
        const initial: Record<string, string> = {};
        for (const q of result.clarifyingQuestions ?? []) initial[q.id] = '';
        setAnswers(initial);
        setStep('clarify');
      } else {
        setDiagnosis(result);
        await loadProvidersFor(result.recommendedCategory);
        setStep('result');
        void fetchShoppingForBrief(result);
      }
    } catch (error) {
      console.error('Error during diagnosis:', error);
      alert('Failed to diagnose. Please try again.');
      setStep('intake');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadProvidersFor = async (recommendedCategory: string) => {
    try {
      const providersResponse = await fetch(
        `/api/providers?category=${recommendedCategory}&neighborhood=${encodeURIComponent(neighborhood)}`
      );
      const providersData = await providersResponse.json();
      setProviders(providersData.providers || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setProviders([]);
    }
  };

  const handleRefine = async () => {
    if (!firstPass) return;
    setIsSubmitting(true);
    setStep('refining');
    try {
      const formData = new FormData();
      formData.append('category', selectedCategory);
      formData.append('description', description);
      formData.append('neighborhood', neighborhood);
      formData.append('firstPass', JSON.stringify(firstPass));
      formData.append('answers', JSON.stringify(answers));
      if (photoFile) formData.append('photo', photoFile);

      const response = await fetch('/api/diagnose-refine', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Refine failed');

      const refined: DiagnosisResult = await response.json();
      setDiagnosis(refined);
      await loadProvidersFor(refined.recommendedCategory);
      setStep('result');
      void fetchShoppingForBrief(refined);
    } catch (error) {
      console.error('Error during refine:', error);
      alert('Failed to refine. Showing first-pass diagnosis instead.');
      // Fall back gracefully — show what we have
      if (firstPass) {
        setDiagnosis(firstPass);
        await loadProvidersFor(firstPass.recommendedCategory);
        setStep('result');
        void fetchShoppingForBrief(firstPass);
      } else {
        setStep('intake');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewMatches = () => {
    setStep('matches');
  };

  const handleSelectProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    setStep('consent');
  };

  const handleConnect = async () => {
    setIsSubmitting(true);
    try {
      // Create lead with provider connection
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: diagnosis?.recommendedCategory,
          problem: diagnosis?.issue,
          scope: diagnosis?.scopeOfWork,
          fair_price_range: diagnosis?.fairPriceRange,
          severity: diagnosis?.severity,
          neighborhood,
          chosen_provider_id: selectedProvider,
        }),
      });

      if (response.ok) {
        setStep('done');
      }
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Failed to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setStep('intake');
    setSelectedCategory('');
    setDescription('');
    setNeighborhood('');
    setPhotoFile(null);
    setPhotoPreview('');
    setDiagnosis(null);
    setProviders([]);
    setSelectedProvider('');
    setFirstPass(null);
    setAnswers({});
    setShopping(null);
    setShoppingLoading(false);
    setSavedBriefId(null);
  };

  const allClarifyingAnswered =
    firstPass?.clarifyingQuestions?.every((q) => (answers[q.id] ?? '').trim().length > 0) ?? false;

  if (step === 'clarify' && firstPass) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
            Quick clarification
          </p>
          <h1
            className="text-4xl font-bold text-od-navy mb-2 tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            A few quick questions
          </h1>
          <p className="text-base text-od-muted">
            Best guess so far: <span className="font-semibold text-od-navy">{firstPass.issue}</span>{' '}
            ({firstPass.confidence ?? 70}% confident). A few short answers below will tighten the
            estimate range and let providers quote more accurately.
          </p>

          <div className="mt-8 space-y-6">
            {firstPass.clarifyingQuestions?.map((q, idx) => (
              <div key={q.id}>
                <label htmlFor={q.id} className="block text-sm font-semibold text-od-navy">
                  {idx + 1}. {q.question}
                </label>
                {q.type === 'yesno' && (
                  <div className="mt-2 flex gap-2">
                    {['Yes', 'No', 'Unsure'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                          answers[q.id] === opt
                            ? 'border-od-navy bg-od-navy text-white'
                            : 'border-od-border bg-white text-od-navy hover:bg-od-primary-soft'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'select' && q.options && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                          answers[q.id] === opt
                            ? 'border-od-navy bg-od-navy text-white'
                            : 'border-od-border bg-white text-od-navy hover:bg-od-primary-soft'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'text' && (
                  <input
                    id={q.id}
                    type="text"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer..."
                    className="mt-2 w-full rounded-xl border border-od-border bg-white px-4 py-3 text-base text-od-navy placeholder:text-od-subtle focus:border-od-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-od-primary focus-visible:ring-offset-1"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={async () => {
                // Skip clarification — show the first-pass result as-is
                setDiagnosis(firstPass);
                await loadProvidersFor(firstPass.recommendedCategory);
                setStep('result');
              }}
              className="inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-5 py-3 text-base font-semibold text-od-navy hover:bg-od-primary-soft"
            >
              Skip — use first-pass
            </button>
            <button
              type="button"
              onClick={handleRefine}
              disabled={!allClarifyingAnswered || isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-od-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-od-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sharpen diagnosis →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'diagnosing' || step === 'refining') {
    const isRefining = step === 'refining';
    return (
      <div className="mx-auto flex w-full max-w-md min-h-[60vh] items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-od-border border-t-od-ink"
            style={{ animation: 'spin 1s linear infinite' }}
            aria-hidden="true"
          />
          <h2
            className="text-[24px] font-semibold leading-[1.2] text-od-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isRefining ? 'Refining with your answers…' : 'Diagnosing your issue…'}
          </h2>
          <p className="mt-2 text-[14px] text-od-muted">
            {isRefining
              ? 'A moment while we tighten the estimate range.'
              : 'This should take just a moment.'}
          </p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (step === 'result' && diagnosis) {
    const diyRecommended = diagnosis.diyOrPro === 'diy';
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-8 sm:px-6 sm:pt-8">
        <SectionHeader
          eyebrow="Diagnosis"
          title={diagnosis.issue}
          size="h1"
        />

        {/* Severity + confidence chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip tone={severityTone(diagnosis.severity)}>
            {severityConfig[diagnosis.severity].label}
          </Chip>
          {typeof diagnosis.confidence === 'number' && (
            <Chip tone={confidenceTone(diagnosis.confidence)}>
              Confidence {diagnosis.confidence}%
            </Chip>
          )}
        </div>

        {/* Hero: fair price range, prominent (Fraunces 30px) */}
        <Card className="mt-5">
          <Label>Fair price range</Label>
          <p
            className="mt-1 text-[30px] font-semibold leading-[1.15] text-od-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {diagnosis.fairPriceRange}
          </p>
          <p className="mt-3 text-[15px] leading-[1.5] text-od-body">
            {diagnosis.explanation}
          </p>
        </Card>

        {/* Scope of work */}
        <Card className="mt-3">
          <Label>Scope of work</Label>
          <p className="mt-1 text-[15px] leading-[1.5] text-od-body">
            {diagnosis.scopeOfWork}
          </p>
        </Card>

        {/* What to do next — DIY first (full-width clay tile with embedded
            product cards), Pro tile stacked below. */}
        <div className="mt-5 space-y-3">
          <FixItYourselfTile
            title={diagnosis.diyShoppingQuery || 'See the exact parts to buy'}
            recommended={diyRecommended}
            loading={shoppingLoading}
            shopping={shopping}
          />

          <FeatureTile
            tone="good"
            recommended={!diyRecommended}
            onClick={handleViewMatches}
            eyebrow="Hire a pro"
            title={
              providers.length > 0
                ? `${providers.length} vetted ${providers.length === 1 ? 'pro' : 'pros'} matched`
                : 'Get matched with a local pro'
            }
            body="Pre-diagnosed brief sent to vetted pros in your area. Quotes back within 24 hours."
            cta="View matched providers"
          />
        </div>

        {/* Save the brief to the home record */}
        <div className="mt-5">
          <SaveBriefBanner
            savedBriefId={savedBriefId}
            saving={savingBrief}
            onSave={handleSaveBrief}
          />
        </div>
      </div>
    );
  }

  if (step === 'matches') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-od-navy mb-2 tracking-tight sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Matched providers
            </h1>
            <p className="text-sm text-gray-500">
              We found {providers.length} vetted {providers.length === 1 ? 'pro' : 'pros'} in{' '}
              {neighborhood}
            </p>
          </div>

          {providers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-600 mb-4">
                No providers found in your area for this category.
              </p>
              <button
                onClick={handleStartOver}
                className="text-sm font-medium text-od-leaf hover:text-od-leaf"
              >
                Start over
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="bg-white rounded-xl border border-od-border p-6 hover:border-od-leaf/30 transition-colors"
                >
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-od-ink mb-1">{provider.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs text-od-muted">
                        {categoryLabel(provider.category)}
                      </span>
                      {provider.rating && (
                        <>
                          <span className="text-od-border">·</span>
                          <span className="text-xs text-od-body">★ {provider.rating}</span>
                        </>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-od-green-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-od-green">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Verified
                      </span>
                    </div>
                  </div>

                  {provider.google_maps_url && (
                    <a
                      href={provider.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-od-leaf hover:text-od-ink mb-4 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  )}

                  <button
                    onClick={() => handleSelectProvider(provider.provider_id)}
                    className="w-full rounded-full bg-od-ink px-4 py-3 text-sm font-semibold text-od-bg transition-colors hover:bg-od-leaf"
                  >
                    Connect with {provider.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'consent') {
    const selectedPro = providers.find((p) => p.provider_id === selectedProvider);
    return (
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-od-navy mb-2 tracking-tight sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to connect?
            </h1>
            <p className="text-sm text-gray-500">
              We'll share your contact info with this provider
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">What happens next</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-gray-400">-</span>
                <span>
                  We'll share your name, address, phone, and this diagnosis with {selectedPro?.name}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-400">-</span>
                <span>They'll reach out to schedule a visit and provide a quote</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-400">-</span>
                <span>You'll work directly with them to complete the job</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
            <div className="text-xs font-medium text-gray-500 mb-2">CONNECTING WITH</div>
            <div className="text-base font-semibold text-gray-900">{selectedPro?.name}</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('matches')}
              className="flex-1 bg-white border border-gray-200 text-gray-900 rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Go back
            </button>
            <button
              onClick={handleConnect}
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're all set!</h2>
          <p className="text-sm text-gray-600 mb-8">
            The provider will reach out soon to schedule a visit. Check your phone and email.
          </p>
          <button
            onClick={handleStartOver}
            className="bg-gray-900 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Diagnose another issue
          </button>
        </div>
      </div>
    );
  }

  // Intake step
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-6 sm:px-6">
      <header>
        <h1
          className="text-3xl font-bold text-od-navy tracking-tight sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What&apos;s going on at home?
        </h1>
        <p className="mt-3 text-base text-od-muted">
          A photo helps a lot. A short note helps more. Both are optional, but they sharpen the
          diagnosis.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {/* Photo */}
        <div>
          <label className="block text-sm font-semibold text-od-navy">Photo</label>
          {photoPreview ? (
            <div className="relative mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-56 object-cover rounded-2xl border border-od-border"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview('');
                }}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-sm border border-od-border hover:bg-od-cream"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="mt-2 flex flex-col items-center justify-center w-full h-44 border-2 border-od-border border-dashed rounded-2xl cursor-pointer bg-white hover:bg-od-cream transition-colors">
              <div className="flex flex-col items-center justify-center py-4 text-od-primary">
                <Upload className="w-7 h-7" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-od-navy">Take or upload a photo</p>
                <p className="mt-1 text-xs text-od-subtle">↥ Metadata is stripped before upload</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="diag-description" className="block text-sm font-semibold text-od-navy">
            What&apos;s going on? <span className="font-normal text-od-muted">(optional)</span>
          </label>
          <input
            id="diag-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. brown stain on bedroom ceiling"
            className="mt-2 w-full rounded-xl border border-od-border bg-white px-4 py-3 text-base text-od-navy placeholder:text-od-subtle focus:border-od-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-od-primary focus-visible:ring-offset-1"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="diag-category" className="block text-sm font-semibold text-od-navy">
            Category
          </label>
          <div className="relative mt-2">
            <select
              id="diag-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full appearance-none rounded-xl border border-od-border bg-white pl-4 pr-11 py-3 text-base focus:border-od-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-od-primary focus-visible:ring-offset-1 ${
                selectedCategory ? 'text-od-navy' : 'text-od-subtle'
              }`}
            >
              <option value="">Pick the closest match</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-od-navy">
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-od-muted"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Neighborhood */}
        <div>
          <label htmlFor="diag-neighborhood" className="block text-sm font-semibold text-od-navy">
            Neighborhood
          </label>
          <div className="relative mt-2">
            <select
              id="diag-neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={`w-full appearance-none rounded-xl border border-od-border bg-white pl-4 pr-11 py-3 text-base focus:border-od-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-od-primary focus-visible:ring-offset-1 ${
                neighborhood ? 'text-od-navy' : 'text-od-subtle'
              }`}
            >
              <option value="">Where is this?</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n} className="text-od-navy">
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-od-muted"
              aria-hidden="true"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleDiagnose}
          disabled={!selectedCategory || !neighborhood || isSubmitting}
          className="w-full inline-flex items-center justify-center rounded-2xl bg-od-navy px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-od-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Diagnosing…' : 'Get my diagnosis'}
        </button>
        <p className="text-center text-xs text-od-subtle">
          Odosan is upfront when it&apos;s unsure — and will ask quick questions if it needs to.
        </p>
      </div>
    </div>
  );
}

// ─── Result-screen sub-components ────────────────────────────────────────────

function ProPrimary({
  onClick,
  providerCount,
}: {
  onClick: () => void;
  providerCount: number;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-od-primary/30 bg-od-primary-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
        Recommended · hire a pro
      </p>
      <h3 className="mt-1 text-lg font-bold text-od-navy">
        {providerCount > 0
          ? `${providerCount} vetted ${providerCount === 1 ? 'pro' : 'pros'} matched`
          : 'Get matched with a local pro'}
      </h3>
      <p className="mt-1 text-sm text-od-muted">
        We send your brief to the pros; they reply with quotes inside 24 hours.
      </p>
      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
      >
        View matched providers <ChevronRight className="ml-1 w-4 h-4" />
      </button>
    </div>
  );
}

function ProSecondary({
  onClick,
  providerCount,
}: {
  onClick: () => void;
  providerCount: number;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-od-border bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-od-muted">
        Or — get a pro quote
      </p>
      <h3 className="mt-1 text-lg font-bold text-od-navy">Rather have a pro do it?</h3>
      <p className="mt-1 text-sm text-od-muted">
        {providerCount > 0
          ? `We've already matched ${providerCount} vetted ${providerCount === 1 ? 'pro' : 'pros'} in your area.`
          : 'Send your brief to local pros for quotes.'}
      </p>
      <button
        onClick={onClick}
        className="mt-3 inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-5 py-2 text-sm font-semibold text-od-navy hover:bg-od-primary-soft"
      >
        View matched providers <ChevronRight className="ml-1 w-4 h-4" />
      </button>
    </div>
  );
}

function SaveBriefBanner({
  savedBriefId,
  saving,
  onSave,
}: {
  savedBriefId: string | null;
  saving: boolean;
  onSave: () => void;
}) {
  if (savedBriefId) {
    return (
      <div className="mt-2 rounded-xl border border-od-green/20 bg-od-green-soft p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm font-semibold text-od-green">
          ✓ Saved to My home.
        </p>
        <a
          href="/my-home"
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90 sm:mt-0 sm:w-auto"
        >
          View My home →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-od-border bg-gray-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-semibold text-od-navy">Save this to My home</p>
        <p className="mt-1 text-xs text-od-muted">
          A lightweight record of your home's health. Refer back any time.
        </p>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90 disabled:opacity-50 sm:mt-0 sm:w-auto"
      >
        {saving ? 'Saving…' : 'Save to My home'}
      </button>
    </div>
  );
}

// ─── DIY shopping tile ──────────────────────────────────────────────────
// Partner tag is publicly visible in every outbound Amazon link, so the
// literal can safely live in client code as a defensive fallback. The
// server-side API also tags URLs; this helper just guarantees it.
const AFFILIATE_PARTNER_TAG = 'summerchang0a-20';

function ensureAffiliateTag(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('tag')) {
      u.searchParams.set('tag', AFFILIATE_PARTNER_TAG);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function ProductImage({ image, alt }: { image: string | null; alt: string }) {
  if (!image) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[12px] bg-[#E8E2D5]">
        <span className="text-[11px] text-od-subtle">image</span>
      </div>
    );
  }
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[12px] bg-white p-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-[14px] bg-white/70 p-3">
      <div className="h-20 w-20 shrink-0 rounded-[12px] bg-[#E8E2D5]" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-3/4 rounded bg-[#E8E2D5]" />
        <div className="h-5 w-20 rounded bg-[#E8E2D5]" />
        <div className="h-3 w-24 rounded bg-[#E8E2D5]" />
      </div>
    </div>
  );
}

function RealProductCard({
  product,
  topPick,
}: {
  product: AmazonProduct;
  topPick: boolean;
}) {
  const href = ensureAffiliateTag(product.url) ?? '#';
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="flex items-center gap-3 rounded-[14px] bg-white/70 p-3 transition-shadow hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
    >
      <ProductImage image={product.image} alt={product.title} />
      <div className="min-w-0 flex-1">
        {topPick && (
          <span className="mb-1.5 inline-block rounded-full bg-od-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Top pick
          </span>
        )}
        <p className="line-clamp-2 text-[14px] font-medium leading-tight text-od-ink">
          {product.title}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[17px] font-semibold text-od-ink">
            {product.price ?? '—'}
          </span>
          {typeof product.rating === 'number' && (
            <span className="inline-flex items-center gap-1 text-[12px] text-od-orange">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />{' '}
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-od-leaf" aria-hidden="true" />
    </a>
  );
}

function CuratedProductCard({
  product,
  fallbackSearchUrl,
  topPick,
}: {
  product: CuratedProduct;
  fallbackSearchUrl: string | null;
  topPick: boolean;
}) {
  const href = ensureAffiliateTag(product.url ?? fallbackSearchUrl) ?? '#';
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="flex items-center gap-3 rounded-[14px] bg-white/70 p-3 transition-shadow hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
    >
      <ProductImage image={null} alt={product.title} />
      <div className="min-w-0 flex-1">
        {topPick && (
          <span className="mb-1.5 inline-block rounded-full bg-od-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Top pick
          </span>
        )}
        <p className="line-clamp-2 text-[14px] font-medium leading-tight text-od-ink">
          {product.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-od-muted">
          {product.description}
        </p>
        <div className="mt-1">
          <span className="text-[17px] font-semibold text-od-ink">
            {product.priceRange}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-od-leaf" aria-hidden="true" />
    </a>
  );
}

function FixItYourselfTile({
  title,
  recommended,
  loading,
  shopping,
}: {
  title: string;
  recommended: boolean;
  loading: boolean;
  shopping: ShoppingBucket;
}) {
  const hasRealProducts = (shopping?.products.length ?? 0) > 0;
  const hasCurated = (shopping?.curatedProducts.length ?? 0) > 0;
  const showProducts = hasRealProducts || hasCurated;
  const eyebrow = recommended ? 'Recommended · Fix it yourself' : 'Fix it yourself';
  const searchUrlTagged = ensureAffiliateTag(shopping?.searchUrl);

  return (
    <div className="rounded-[20px] border border-od-border bg-od-orange-soft p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-orange">
        {eyebrow}
      </p>
      <h3
        className="mt-2 text-[22px] font-semibold leading-[1.2] text-od-ink"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.5] text-od-muted">
        Skip the labor cost — these are the parts most homeowners use for this fix.
      </p>

      <div className="mt-4 space-y-2">
        {loading && !showProducts && (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        )}

        {!loading && hasRealProducts &&
          shopping!.products
            .slice(0, 3)
            .map((p, i) => <RealProductCard key={p.asin} product={p} topPick={i === 0} />)}

        {!loading && !hasRealProducts && hasCurated &&
          shopping!.curatedProducts.map((p, i) => (
            <CuratedProductCard
              key={p.id}
              product={p}
              fallbackSearchUrl={shopping!.searchUrl}
              topPick={i === 0}
            />
          ))}

        {!loading && !showProducts && (
          <a
            href={searchUrlTagged ?? '#'}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="flex items-center justify-between rounded-[14px] bg-white/70 px-4 py-3 text-[14px] font-semibold text-od-ink hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
          >
            <span>Find on Amazon</span>
            <ChevronRight className="h-4 w-4 text-od-leaf" aria-hidden="true" />
          </a>
        )}
      </div>

      <p className="mt-4 text-[11px] text-od-subtle">
        As an Amazon Associate, Odosan earns from qualifying purchases.
      </p>
    </div>
  );
}
