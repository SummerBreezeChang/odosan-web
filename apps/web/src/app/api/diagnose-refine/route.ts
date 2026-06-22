import { NextRequest } from 'next/server';
import { invokeClaudeOnBedrock, isBedrockConfigured } from '@/lib/aws-bedrock';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type DiagnosisResult = {
  issue: string;
  severity: 'urgent' | 'soon' | 'monitor';
  recommendedCategory: string;
  scopeOfWork: string;
  fairPriceRange: string;
  diyOrPro: 'diy' | 'pro';
  explanation: string;
  confidence: number;
  diyShoppingQuery: string;
};

/**
 * Second-pass diagnosis after the homeowner answers the clarifying questions
 * from /api/diagnose. Returns a refined DiagnosisResult with higher confidence
 * (typically 85-95) and NO further clarifying questions.
 *
 * Body:
 *   category, description, neighborhood   — original intake
 *   firstPass                              — JSON-stringified first DiagnosisResult
 *   answers                                — JSON-stringified Record<questionId, string>
 *   photo                                  — optional, same as /api/diagnose
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const neighborhood = formData.get('neighborhood') as string;
    const firstPassRaw = formData.get('firstPass') as string;
    const answersRaw = formData.get('answers') as string;
    const photo = formData.get('photo') as File | null;

    if (!category || !neighborhood || !firstPassRaw || !answersRaw) {
      return Response.json(
        { error: 'category, neighborhood, firstPass, and answers are required' },
        { status: 400 }
      );
    }

    let firstPass: DiagnosisResult;
    let answers: Record<string, string>;
    try {
      firstPass = JSON.parse(firstPassRaw);
      answers = JSON.parse(answersRaw);
    } catch {
      return Response.json({ error: 'firstPass or answers is not valid JSON' }, { status: 400 });
    }

    const answersBlock = Object.entries(answers)
      .map(([id, ans]) => `  ${id}: ${ans}`)
      .join('\n');

    let imageBase64 = '';
    if (photo) {
      const bytes = await photo.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString('base64');
    }

    const prompt = `You are a calm, trustworthy home maintenance expert. You gave a first-pass diagnosis a moment ago, asked the homeowner some clarifying questions, and now have their answers.

ORIGINAL INTAKE
  Category: ${category}
  Description: ${description || 'none'}
  Neighborhood: ${neighborhood}
  Photo: ${photo ? 'attached again' : 'none'}

YOUR FIRST-PASS DIAGNOSIS
  Issue: ${firstPass.issue}
  Severity: ${firstPass.severity}
  Scope: ${firstPass.scopeOfWork}
  Fair price range: ${firstPass.fairPriceRange}
  DIY-or-Pro: ${firstPass.diyOrPro}
  Confidence: ${firstPass.confidence}/100
  Reasoning: ${firstPass.explanation}

HOMEOWNER'S ANSWERS TO YOUR CLARIFYING QUESTIONS
${answersBlock}

Now give a REFINED diagnosis. Use the answers to:
  - Confirm or change the issue name
  - Tighten the severity (escalate or downgrade if the answers warrant it)
  - Tighten the scope of work to be specific enough that a contractor could quote it
  - Tighten the fair price range (narrower than the first pass)
  - Reconsider DIY-vs-Pro now that you know more
  - Update the explanation to reference what the answers told you
  - Raise your confidence — typically to 85-95 after good clarification

Return ONLY valid JSON, no markdown:
{
  "issue": "...",
  "severity": "urgent" | "soon" | "monitor",
  "recommendedCategory": "...",
  "scopeOfWork": "...",
  "fairPriceRange": "...",
  "diyOrPro": "diy" | "pro",
  "explanation": "2-3 sentences. Explicitly mention how the answers shaped your refinement.",
  "confidence": 90,
  "diyShoppingQuery": "P-trap kit 1.5 inch"
}

recommendedCategory must be one of: plumbing_drainage, gutters_drainage, landscaping, roofing, electrical, hvac, pest_control, handyman, painting
diyShoppingQuery: 2-6 word Amazon search keywords for the DIY part(s) for this repair. ALWAYS populate, even when diyOrPro=pro (useful as a temporary fix or supplement). Refine from the first-pass query using what the answers revealed (size, location, severity).
Do NOT include clarifyingQuestions — refinement is the final answer.`;

    let responseText: string | null = null;

    if (isBedrockConfigured()) {
      try {
        responseText = await invokeClaudeOnBedrock({
          system:
            'You are a home maintenance expert refining an earlier diagnosis based on the homeowner answers. Return only the JSON object requested — no markdown, no code blocks, no commentary.',
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
        console.error('[BEDROCK REFINE FAILED — falling back to Gemini]', err);
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
                ? [{ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }]
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
        console.error('[GEMINI REFINE ERROR]', errorText);
        throw new Error(`AI provider error: ${geminiResponse.status}`);
      }
      const geminiData = await geminiResponse.json();
      responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    let jsonText = (responseText ?? '').trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const refined: DiagnosisResult = JSON.parse(jsonText);

    if (
      !refined.issue ||
      !refined.severity ||
      !refined.recommendedCategory ||
      !refined.scopeOfWork ||
      !refined.fairPriceRange ||
      !refined.diyOrPro ||
      !refined.explanation
    ) {
      throw new Error('Incomplete refined diagnosis from Gemini');
    }

    if (typeof refined.confidence !== 'number') refined.confidence = 90;
    if (typeof refined.diyShoppingQuery !== 'string' || !refined.diyShoppingQuery.trim()) {
      refined.diyShoppingQuery = `${refined.recommendedCategory.replace(/_/g, ' ')} repair kit`;
    }

    return Response.json(refined);
  } catch (error) {
    console.error('[/api/diagnose-refine error]', error);
    return Response.json(
      { error: 'Failed to refine diagnosis. Please try again.' },
      { status: 500 }
    );
  }
}
