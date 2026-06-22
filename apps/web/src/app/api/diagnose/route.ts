import { NextRequest } from 'next/server';
import { invokeClaudeOnBedrock, isBedrockConfigured } from '@/lib/aws-bedrock';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type ClarifyingQuestion = {
  id: string;
  question: string;
  type: 'text' | 'yesno' | 'select';
  options?: string[];
};

type DiagnosisResult = {
  issue: string;
  severity: 'urgent' | 'soon' | 'monitor';
  recommendedCategory: string;
  scopeOfWork: string;
  fairPriceRange: string;
  diyOrPro: 'diy' | 'pro';
  explanation: string;
  confidence: number; // 0-100
  clarifyingQuestions: ClarifyingQuestion[];
  diyShoppingQuery: string; // Amazon search keywords for DIY parts (always populated)
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const neighborhood = formData.get('neighborhood') as string;
    const photo = formData.get('photo') as File | null;

    if (!category || !neighborhood) {
      return Response.json({ error: 'Category and neighborhood are required' }, { status: 400 });
    }

    // Log every diagnose request for cost tracking
    console.log('[DIAGNOSE REQUEST]', {
      timestamp: new Date().toISOString(),
      category,
      neighborhood,
      hasPhoto: !!photo,
      hasDescription: !!description,
    });

    let imageBase64 = '';
    if (photo) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageBase64 = buffer.toString('base64');
    }

    const prompt = `You are a calm, trustworthy home maintenance expert — like a knowledgeable "home dad" a first-time homeowner can rely on. A homeowner has submitted this issue:

Category: ${category}
${description ? `Description: ${description}` : 'No description provided'}
Neighborhood: ${neighborhood}
${photo ? 'A photo is attached.' : 'No photo attached.'}

Analyze this home maintenance issue and provide a diagnosis. Be honest about uncertainty — never invent details you cannot verify from the image or description.

A photo plus a one-line description usually isn't enough to give a confident, actionable brief that a contractor can quote against. Your job is BOTH:
  (A) give your best first-pass diagnosis right now, AND
  (B) propose 2-3 short clarifying questions that, if answered, would let you sharpen severity / scope / fair price.

Score your own confidence honestly:
  - 90-100: photo + description are unambiguous, no questions needed
  - 60-89:  could go a few ways; ask 2-3 targeted questions
  - 0-59:   really unclear; ask 3 questions covering the main forks (size, severity, age, location)

Return ONLY valid JSON in exactly this format, with no markdown or code blocks:
{
  "issue": "short plain-English problem name",
  "severity": "urgent",
  "recommendedCategory": "plumbing_drainage",
  "scopeOfWork": "1-2 sentence scope a professional would perform",
  "fairPriceRange": "$150-$400",
  "diyOrPro": "pro",
  "explanation": "2-3 reassuring, clear sentences explaining what you see and why you recommend this approach",
  "confidence": 65,
  "clarifyingQuestions": [
    { "id": "q1", "question": "Is the stain wet right now, or dry?", "type": "yesno" },
    { "id": "q2", "question": "How long ago did you first notice this?", "type": "select", "options": ["This week", "1-4 weeks ago", "1-6 months", "Over 6 months", "Unsure"] },
    { "id": "q3", "question": "Briefly — what's directly above or behind this spot?", "type": "text" }
  ],
  "diyShoppingQuery": "P-trap kit 1.5 inch"
}

severity must be one of: urgent, soon, monitor
recommendedCategory must be one of: plumbing_drainage, gutters_drainage, landscaping, roofing, electrical, hvac, pest_control, handyman, painting
diyOrPro must be one of: diy, pro
confidence must be 0-100 integer
clarifyingQuestions must be 0-3 items; use [] only if your confidence is already 90+
Each question.type must be one of: text, yesno, select. If type=select, include options[]. Keep each question short and answerable in 5-15 seconds.

diyShoppingQuery: ALWAYS populate (even when diyOrPro=pro). 2-6 word Amazon search keywords for the part(s) a handy homeowner would buy to attempt or supplement this repair. Be specific: brand-agnostic, include the relevant size/type/material when inferable. Examples:
  - leaking P-trap → "P-trap kit 1.5 inch"
  - dripping faucet → "kitchen faucet cartridge replacement"
  - clogged shower drain → "drain snake auger 25 foot"
  - tripping breaker → "20 amp circuit breaker"
  - dirty HVAC filter → "MERV 11 furnace filter"
  - roof flashing leak → "roof sealant flashing repair kit"
When the issue truly has no DIY product (e.g. structural roof failure), return the closest preventive/temporary fix (e.g. "emergency roof tarp 20x30").`;

    let responseText: string | null = null;

    if (isBedrockConfigured()) {
      try {
        responseText = await invokeClaudeOnBedrock({
          system:
            'You are a calm, trustworthy home maintenance expert — like a knowledgeable "home dad" a first-time homeowner can rely on. Return only the JSON object requested — no markdown, no code blocks, no commentary.',
          maxTokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                ...(imageBase64
                  ? ([
                      {
                        type: 'image' as const,
                        source: {
                          type: 'base64' as const,
                          media_type: 'image/jpeg',
                          data: imageBase64,
                        },
                      },
                    ])
                  : []),
                { type: 'text', text: prompt },
              ],
            },
          ],
        });
      } catch (err) {
        console.error('[BEDROCK FAILED — falling back to Gemini]', err);
      }
    }

    if (responseText === null) {
      if (!GEMINI_API_KEY) {
        throw new Error('No AI provider configured (set AWS Bedrock or GEMINI_API_KEY)');
      }
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              ...(imageBase64
                ? [
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      };
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[GEMINI ERROR]', errorText);
        throw new Error(`AI provider error: ${geminiResponse.status}`);
      }
      const geminiData = await geminiResponse.json();
      responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Gemini can return 200 with no content when a safety filter triggers
      // or the prompt is blocked. Surface that as a real error instead of
      // letting JSON.parse('') explode downstream.
      if (!(responseText ?? "").trim()) {
        const finishReason = geminiData.candidates?.[0]?.finishReason;
        const promptFeedback = geminiData.promptFeedback;
        console.error('[GEMINI EMPTY RESPONSE]', {
          finishReason,
          promptFeedback,
          raw: JSON.stringify(geminiData).slice(0, 500),
        });
        throw new Error(
          finishReason
            ? `Gemini returned no content (finishReason: ${finishReason})`
            : 'Gemini returned no content'
        );
      }
    }

    // Strip any accidental markdown wrappers
    let jsonText = (responseText ?? '').trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const diagnosis: DiagnosisResult = JSON.parse(jsonText);

    if (
      !diagnosis.issue ||
      !diagnosis.severity ||
      !diagnosis.recommendedCategory ||
      !diagnosis.scopeOfWork ||
      !diagnosis.fairPriceRange ||
      !diagnosis.diyOrPro ||
      !diagnosis.explanation
    ) {
      throw new Error('Incomplete diagnosis from Gemini');
    }

    // Defensive defaults for optional fields that older clients might miss
    if (typeof diagnosis.confidence !== 'number') diagnosis.confidence = 70;
    if (!Array.isArray(diagnosis.clarifyingQuestions)) diagnosis.clarifyingQuestions = [];
    if (typeof diagnosis.diyShoppingQuery !== 'string' || !diagnosis.diyShoppingQuery.trim()) {
      diagnosis.diyShoppingQuery = `${diagnosis.recommendedCategory.replace(/_/g, ' ')} repair kit`;
    }

    return Response.json(diagnosis);
  } catch (error) {
    console.error('[/api/diagnose error]', error);
    return Response.json({ error: 'Failed to diagnose issue. Please try again.' }, { status: 500 });
  }
}
