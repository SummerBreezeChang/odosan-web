'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Check,
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
import { useSession } from '@/lib/auth-client';
import { categoryLabel } from '@/lib/categories';
import { Card, Chip, FeatureTile, Label, SectionHeader, severityTone, confidenceTone, Button, ButtonLink, InputField, InfoBanner } from '@/components/brand';

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

  // Auto-save the brief as soon as the diagnosis result is on screen so it
  // always lands in My home even if the user immediately taps "View matched
  // providers" or "Find on Amazon" without explicitly clicking Save. The
  // SaveBriefBanner downstream switches to its "Saved ✓" confirmation state
  // on the next render. Re-running a diagnosis (handleStartOver) clears
  // savedBriefId, so the next result auto-saves freshly.
  useEffect(() => {
    if (step !== 'result' || !diagnosis || savedBriefId || savingBrief) return;
    handleSaveBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, diagnosis, savedBriefId]);

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
      <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
        <SectionHeader
          eyebrow="Quick clarification"
          title="A few quick questions"
          subtitle={
            <>
              Best guess so far:{' '}
              <span className="font-semibold text-od-navy">{firstPass.issue}</span>{' '}
              ({firstPass.confidence ?? 70}% confident). A few short answers will tighten
              the estimate range.
            </>
          }
          size="h1"
          className="mb-8"
        />

        <div className="space-y-6">
          {firstPass.clarifyingQuestions?.map((q, idx) => (
            <div key={q.id}>
              <p className="mb-1.5 text-[13px] font-semibold text-od-navy">
                {idx + 1}. {q.question}
              </p>
              {(q.type === 'yesno' || q.type === 'select') && (
                <div className="flex flex-wrap gap-2">
                  {(q.type === 'yesno' ? ['Yes', 'No', 'Unsure'] : q.options ?? []).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                          answers[q.id] === opt
                            ? 'border-od-ink bg-od-ink text-od-bg'
                            : 'border-od-border bg-white text-od-navy hover:bg-od-primary-soft'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              )}
              {q.type === 'text' && (
                <InputField
                  id={q.id}
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer…"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="secondary"
            onClick={async () => {
              setDiagnosis(firstPass);
              await loadProvidersFor(firstPass.recommendedCategory);
              setStep('result');
            }}
          >
            Skip — use first-pass
          </Button>
          <Button
            onClick={handleRefine}
            disabled={!allClarifyingAnswered || isSubmitting}
            loading={isSubmitting}
          >
            Sharpen diagnosis
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'diagnosing' || step === 'refining') {
    return step === 'refining' ? (
      <DiagnosingState
        heading="Refining with your answers…"
        subline="Tightening things up so the estimate — and the parts — are spot on."
        steps={REFINING_STEPS}
      />
    ) : (
      <DiagnosingState
        heading="Diagnosing your home…"
        subline="A careful read takes a moment — we'd rather be right than fast."
        steps={DIAGNOSING_STEPS}
      />
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
      <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
        <SectionHeader
          eyebrow="Matched providers"
          title={`${providers.length} vetted ${providers.length === 1 ? 'pro' : 'pros'} in ${neighborhood}`}
          size="h1"
          className="mb-6"
        />

        {providers.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-[14px] text-od-muted">
              No providers found in your area for this category.
            </p>
            <button
              onClick={handleStartOver}
              className="mt-4 text-[13px] font-semibold text-od-leaf hover:text-od-ink"
            >
              Start over
            </button>
          </Card>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <Card key={provider.provider_id} className="flex flex-col gap-3">
                <div>
                  <h3
                    className="text-[15px] font-semibold text-od-navy"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {provider.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[12px] text-od-muted">
                      {categoryLabel(provider.category)}
                    </span>
                    {provider.rating && (
                      <>
                        <span className="text-od-border" aria-hidden>·</span>
                        <span className="text-[12px] text-od-body">★ {provider.rating}</span>
                      </>
                    )}
                    <Chip tone="good">
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                      Verified
                    </Chip>
                  </div>
                </div>

                {provider.google_maps_url && (
                  <a
                    href={provider.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-semibold text-od-leaf hover:text-od-ink"
                  >
                    View on Google Maps →
                  </a>
                )}

                <Button
                  onClick={() => handleSelectProvider(provider.provider_id)}
                  className="w-full justify-center"
                >
                  Connect with {provider.name}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 'consent') {
    const selectedPro = providers.find((p) => p.provider_id === selectedProvider);
    return (
      <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
        <SectionHeader
          title="Ready to connect?"
          subtitle="We'll share your contact info with this provider."
          size="h1"
          className="mb-6"
        />

        <Card className="mb-3">
          <p
            className="mb-3 text-[14px] font-semibold text-od-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What happens next
          </p>
          <ul className="space-y-2 text-[13px] leading-[1.5] text-od-muted">
            {[
              `We'll share your name, address, phone, and this diagnosis with ${selectedPro?.name}.`,
              "They'll reach out to schedule a visit and provide a quote.",
              "You'll work directly with them to complete the job.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-od-leaf" aria-hidden>–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-od-muted">
            Connecting with
          </p>
          <p
            className="mt-1 text-[16px] font-semibold text-od-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {selectedPro?.name}
          </p>
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep('matches')} className="flex-1 justify-center">
            Go back
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1 justify-center"
          >
            Connect
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-5 py-20 text-center sm:px-6">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-od-green-soft text-od-green">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <SectionHeader
          title="You're all set!"
          subtitle="The provider will reach out soon to schedule a visit. Check your phone and email."
          size="h2"
          className="mb-8"
        />
        <Button onClick={handleStartOver} size="lg">
          Diagnose another issue
        </Button>
      </div>
    );
  }

  // Intake step
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
      <SectionHeader
        eyebrow="Step 1 of 1"
        title="What's going on at home?"
        subtitle="A photo helps a lot. A short note helps more. Both are optional, but they sharpen the diagnosis."
        size="h1"
        className="mb-8"
      />

      <div className="space-y-6">
        {/* Photo */}
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-od-navy">Photo</p>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Preview"
                className="h-56 w-full rounded-[18px] border border-od-border object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview('');
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-od-border bg-white text-[13px] shadow-sm hover:bg-od-cream"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-od-border bg-white transition-colors hover:bg-od-cream">
              <div className="flex flex-col items-center gap-2 py-4 text-od-primary">
                <Upload className="h-7 w-7" aria-hidden="true" />
                <p className="text-[14px] font-semibold text-od-navy">Take or upload a photo</p>
                <p className="text-[12px] text-od-subtle">Metadata is stripped before upload</p>
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
        <InputField
          id="diag-description"
          label={<>What&apos;s going on? <span className="font-normal text-od-muted">(optional)</span></>}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. brown stain on bedroom ceiling"
        />

        {/* Category */}
        <div>
          <label htmlFor="diag-category" className="mb-1.5 block text-[13px] font-semibold text-od-navy">
            Category
          </label>
          <div className="relative">
            <select
              id="diag-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`od-input appearance-none pl-4 pr-11 ${selectedCategory ? 'text-od-navy' : 'text-od-subtle'}`}
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
          <label htmlFor="diag-neighborhood" className="mb-1.5 block text-[13px] font-semibold text-od-navy">
            Neighborhood
          </label>
          <div className="relative">
            <select
              id="diag-neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={`od-input appearance-none pl-4 pr-11 ${neighborhood ? 'text-od-navy' : 'text-od-subtle'}`}
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

        <Button
          onClick={handleDiagnose}
          disabled={!selectedCategory || !neighborhood || isSubmitting}
          loading={isSubmitting}
          size="lg"
          className="w-full justify-center"
        >
          {isSubmitting ? 'Diagnosing…' : 'Get my diagnosis'}
        </Button>
        <p className="text-center text-[12px] text-od-subtle">
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
  const { data: session, isPending } = useSession();
  const isSignedIn = !!session?.user;
  const firstName = session?.user?.name?.split(' ')[0];
  const destinationShort = isSignedIn
    ? firstName
      ? `${firstName}'s My home (saved to your account)`
      : 'your account'
    : 'this browser';

  if (savedBriefId) {
    return (
      <InfoBanner
        tone="good"
        title="Saved to My home"
        body={`Stored in ${destinationShort}.`}
        action={
          <ButtonLink href="/my-home" size="md">
            View My home
          </ButtonLink>
        }
      />
    );
  }

  return (
    <InfoBanner
      tone="leaf"
      title="Save this to My home"
      body={
        isPending
          ? 'Checking where to save…'
          : isSignedIn
          ? `Will be saved to ${destinationShort}.`
          : 'Will be saved to this browser. Anyone who clears the cache loses it.'
      }
      action={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={onSave} disabled={saving} loading={saving} size="md">
            {saving ? 'Saving…' : 'Save to My home'}
          </Button>
          {!isPending && !isSignedIn && (
            <p className="text-[12px] text-od-muted">
              <a
                href="/account/signup?next=/diagnose"
                className="font-semibold text-od-leaf underline-offset-2 hover:underline"
              >
                Create a free account
              </a>{' '}
              to keep your record across devices.
            </p>
          )}
        </div>
      }
    />
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

// Category → background + foreground hex (no #) for the placeholder
// thumbnails. Tuned to the cream/forest brand so they sit on the clay
// tile without fighting it.
const CURATED_THUMB_COLORS: Record<string, { bg: string; fg: string }> = {
  water_heater: { bg: 'DCE9DD', fg: '1B4332' },
  hvac: { bg: 'F6E6CC', fg: '8A5A1B' },
  plumbing: { bg: 'DCE9DD', fg: '2F5A3A' },
  electrical: { bg: 'F6E6CC', fg: '8A5A1B' },
  roofing: { bg: 'F4EEE6', fg: '2C6E49' },
  general: { bg: 'F4EEE6', fg: '2C6E49' },
};

function buildCuratedThumbnailUrl(product: CuratedProduct): string {
  const colors = CURATED_THUMB_COLORS[product.category] ?? CURATED_THUMB_COLORS.general;
  // Strip parens, take first 3 meaningful words, encode for URL.
  const label = product.title
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  const text = encodeURIComponent(label);
  return `https://placehold.co/200x200/${colors.bg}/${colors.fg}/png?text=${text}&font=playfair`;
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
  const thumb = buildCuratedThumbnailUrl(product);
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="flex items-center gap-3 rounded-[14px] bg-white/70 p-3 transition-shadow hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
    >
      <ProductImage image={thumb} alt={product.title} />
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

// ─── DiagnosingState (narrated wait) ────────────────────────────────────
// Branded loading screen for the 'diagnosing' and 'refining' steps.
// Breathing Odosan logo + dawn glow + spinning ring, and a checklist of
// status steps that reveal one by one. After the last step, holds briefly
// and loops — the real API call may still be running and the parent
// component navigates away when it returns.

const DIAGNOSING_STEPS = [
  'Reading your photo',
  'Checking the make & model',
  'Comparing common East Bay issues',
  'Estimating a fair local price',
  'Writing your diagnosis',
] as const;

const REFINING_STEPS = [
  'Factoring in your answers',
  'Tightening the price range',
  "Finding the exact parts you'll need",
  'Double-checking the recommendation',
] as const;

function DiagnosingState({
  heading,
  subline,
  steps,
}: {
  heading: string;
  subline: string;
  steps: readonly string[];
}) {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    // Hide the global site footer while the loader owns the viewport.
    document.body.classList.add('odosan-loading');

    // Respect prefers-reduced-motion: skip the sequenced reveal, show all
    // steps statically. The CSS keyframes are also disabled via media query.
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setCompleted(steps.length);
      return () => {
        document.body.classList.remove('odosan-loading');
      };
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;
    let i = 0;

    function tick() {
      if (cancelled) return;
      i += 1;
      if (i > steps.length) {
        // Hold the fully-checked list for a beat, then loop.
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          i = 0;
          setCompleted(0);
          timeoutId = setTimeout(tick, 600);
        }, 1400);
      } else {
        setCompleted(i);
        timeoutId = setTimeout(tick, 900);
      }
    }

    timeoutId = setTimeout(tick, 600);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      document.body.classList.remove('odosan-loading');
    };
  }, [steps.length]);

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 py-10 sm:px-6">
      {/* Hero stack: dawn glow → spinning ring → breathing logo */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div
          className="diag-dawn absolute -inset-8 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(246,217,168,0.7) 0%, rgba(246,217,168,0) 65%)',
          }}
          aria-hidden="true"
        />
        <svg
          className="diag-spin absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="rgba(27,56,42,0.08)"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="#2C6E49"
            strokeWidth="1.5"
            strokeDasharray="50 250"
            strokeLinecap="round"
          />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          aria-hidden="true"
          className="diag-breathe relative h-20 w-20 rounded-2xl"
        />
      </div>

      <h2
        className="mt-8 text-center text-[26px] font-semibold leading-[1.2] text-od-ink"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {heading}
      </h2>
      <p className="mt-2 max-w-sm text-center text-[14px] leading-[1.5] text-od-muted">
        {subline}
      </p>

      <ul className="mt-8 w-full max-w-xs space-y-3" aria-live="polite">
        {steps.map((step, i) => {
          const isDone = i < completed;
          return (
            <li
              key={step}
              className="flex items-center gap-3 transition-opacity duration-500"
              style={{ opacity: isDone ? 1 : 0.4 }}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  isDone ? 'bg-od-green' : 'bg-od-border'
                }`}
              >
                {isDone && (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden="true" />
                )}
              </span>
              <span className={`text-[15px] ${isDone ? 'text-od-ink' : 'text-od-muted'}`}>
                {step}
              </span>
            </li>
          );
        })}
      </ul>

      <style jsx global>{`
        @keyframes diag-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes diag-dawn {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.12); }
        }
        @keyframes diag-spin {
          to { transform: rotate(360deg); }
        }
        .diag-breathe { animation: diag-breathe 2.6s ease-in-out infinite; }
        .diag-dawn { animation: diag-dawn 3.6s ease-in-out infinite; }
        .diag-spin {
          animation: diag-spin 2.4s linear infinite;
          transform-origin: center;
        }
        body.odosan-loading footer { display: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .diag-breathe,
          .diag-dawn,
          .diag-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
