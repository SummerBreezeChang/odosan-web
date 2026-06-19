import { NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type DiagnosisResult = {
  issue: string;
  severity: 'urgent' | 'soon' | 'monitor';
  recommendedCategory: string;
  scopeOfWork: string;
  fairPriceRange: string;
  diyOrPro: 'diy' | 'pro';
  explanation: string;
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

    // Log every Gemini call for cost tracking
    console.log('[GEMINI API CALL]', {
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

Return ONLY valid JSON in exactly this format, with no markdown or code blocks:
{
  "issue": "short plain-English problem name",
  "severity": "urgent",
  "recommendedCategory": "plumbing_drainage",
  "scopeOfWork": "1-2 sentence scope a professional would perform",
  "fairPriceRange": "$150-$400",
  "diyOrPro": "pro",
  "explanation": "2-3 reassuring, clear sentences explaining what you see and why you recommend this approach"
}

severity must be one of: urgent, soon, monitor
recommendedCategory must be one of: plumbing_drainage, gutters_drainage, landscaping, roofing, electrical, hvac, pest_control, handyman, painting
diyOrPro must be one of: diy, pro`;

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
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental markdown wrappers
    let jsonText = responseText.trim();
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

    return Response.json(diagnosis);
  } catch (error) {
    console.error('[/api/diagnose error]', error);
    return Response.json({ error: 'Failed to diagnose issue. Please try again.' }, { status: 500 });
  }
}
