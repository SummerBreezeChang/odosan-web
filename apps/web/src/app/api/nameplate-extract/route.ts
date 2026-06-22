import { NextRequest } from 'next/server';
import { invokeClaudeOnBedrock, isBedrockConfigured } from '@/lib/aws-bedrock';
import { isS3Configured, uploadPhoto } from '@/lib/aws-s3';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type SystemType = 'water_heater' | 'hvac' | 'electrical_panel' | 'roof_invoice';

type ExtractedFields = {
  system_type: SystemType;
  make: string | null;
  model: string | null;
  serial: string | null;
  install_date: string | null; // ISO YYYY-MM-DD when known, else YYYY-MM or YYYY
  manufacture_date: string | null;
  capacity: string | null; // e.g. "50 gal", "3 ton", "200A"
  fuel_or_type: string | null; // e.g. "natural gas", "heat pump", "FPE Stab-Lok"
  estimated_age_years: number | null;
  expected_lifespan_years: number | null;
  notes: string | null;
  recall_or_safety_flag: string | null;
  confidence: number; // 0-100
  raw_text: string; // verbatim text seen on the nameplate / document
};

const SYSTEM_GUIDANCE: Record<SystemType, string> = {
  water_heater: `This is a water heater nameplate. Typical labels show: brand (Rheem, AO Smith, Bradford White, State, Navien, Rinnai, Noritz), model number, serial number, capacity in gallons (tank) or GPM (tankless), fuel (natural gas / propane / electric), and a manufacture date. Many brands encode the manufacture date INSIDE the serial number — be explicit about this:
  - Rheem / Ruud: serial like "RHLN0124..." → "01" = week, "24" = year (2024)
  - AO Smith: first 2 digits of serial = year, next 2 = week
  - Bradford White: first letter = year code (e.g. M=2020, N=2021...), second letter = month
  - State Industries: similar to AO Smith
If you can decode the manufacture date from the serial, set manufacture_date and explain in notes.
Typical lifespan: tank 10-12 years, tankless 18-20 years.`,
  hvac: `This is an HVAC condenser / furnace / heat pump nameplate. Typical labels show: brand (Carrier, Trane, Lennox, Goodman, Rheem, York, Bryant, Mitsubishi, Daikin), model number, serial number, tonnage / BTU rating, refrigerant type (R-410A, R-32, R-22). Manufacture date is often in the serial:
  - Carrier / Bryant: first 4 digits = WWYY (week-year), e.g. "1224..." = week 12 of 2024
  - Trane: positions 2-3 = year, 4-5 = week
  - Lennox: first 4 digits = YYWW
  - Goodman: first 4 digits = YYMM
If refrigerant is R-22, flag that — phased out, expensive to service, signals pre-2010 unit.
Typical lifespan: 15-20 years for AC, 20-25 for furnaces.`,
  electrical_panel: `This is a residential electrical panel (breaker box). Identify the brand (Square D, Eaton/Cutler-Hammer, Siemens, GE, Federal Pacific, Zinsco, Pushmatic), main breaker amperage (60A / 100A / 125A / 150A / 200A / 400A), and any visible model / catalog number.
CRITICAL SAFETY FLAGS — set recall_or_safety_flag if you see:
  - "Federal Pacific" or "FPE" or "Stab-Lok" → known fire hazard, recommend immediate replacement
  - "Zinsco" or "Sylvania-Zinsco" → known fire hazard, recommend immediate replacement
  - "Pushmatic" or "Bulldog" → obsolete, parts unavailable, recommend evaluation
  - 60A or lower main → undersized for modern loads, recommend service upgrade
Panel age is harder to read directly — use brand discontinuation dates as a hint (FPE stopped ~1980, Zinsco ~1973, Pushmatic ~1986). Typical panel lifespan: 25-40 years before upgrade is recommended.`,
  roof_invoice: `This is a roofing invoice, receipt, or work-order document (NOT a photo of a roof). Extract: contractor name (set as "make"), invoice/work date (set as install_date), roof material in fuel_or_type (asphalt shingle / tile / metal / TPO / flat / composition), square footage or "squares" in capacity, and any warranty period mentioned in notes. The install_date is the date the work was completed, not the invoice date if they differ.
Typical lifespan: asphalt shingle 20-25 years, architectural shingle 25-30, tile 40-50, metal 40-70, TPO 20-25.`,
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const systemType = formData.get('system_type') as SystemType | null;
    const photo = formData.get('photo') as File | null;

    if (!systemType || !SYSTEM_GUIDANCE[systemType]) {
      return Response.json(
        { error: 'system_type is required (water_heater, hvac, electrical_panel, or roof_invoice)' },
        { status: 400 }
      );
    }
    if (!photo) {
      return Response.json({ error: 'photo is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageBase64 = buffer.toString('base64');
    const mimeType = photo.type || 'image/jpeg';

    console.log('[NAMEPLATE EXTRACT]', {
      timestamp: new Date().toISOString(),
      system_type: systemType,
      mime: mimeType,
      bytes: buffer.length,
      bedrock: isBedrockConfigured(),
      s3: isS3Configured(),
    });

    // Fire-and-await S3 upload in parallel with the model call. Non-fatal if S3
    // is unconfigured — the extraction still works without persisted photos.
    const s3Promise = isS3Configured()
      ? uploadPhoto(buffer, mimeType, `nameplates/${systemType}`).catch((err) => {
          console.error('[S3 UPLOAD FAILED]', err);
          return null;
        })
      : Promise.resolve(null);

    const currentYear = new Date().getFullYear();
    const prompt = `You are a home-inspector AI extracting equipment data from a photo. Be honest about what is and isn't legible — never invent details. If a field is unreadable or absent, return null. Current year: ${currentYear}.

${SYSTEM_GUIDANCE[systemType]}

Task: read every legible character on the label/document, then populate the structured fields below. In raw_text, transcribe everything you can read verbatim (brand line, model number, serial, all printed text, capacity stamps, certification marks). This raw_text is the most important field — even if you can't parse a manufacture date, the raw text lets a human verify.

Score confidence honestly:
  - 85-100: nameplate is crisp, all key fields legible, manufacture date confirmable
  - 60-84:  most fields legible, some inference required (e.g. decoded from serial)
  - 30-59:  partial — brand and capacity readable but key fields blurry
  - 0-29:   unreadable, wrong subject, or not a nameplate

Return ONLY valid JSON in exactly this shape, no markdown:
{
  "system_type": "${systemType}",
  "make": "Rheem" | null,
  "model": "XE50T06ST45U1" | null,
  "serial": "RHLN0124..." | null,
  "install_date": "2024-03-15" | "2024-03" | "2024" | null,
  "manufacture_date": "2024-01" | null,
  "capacity": "50 gal" | "3 ton" | "200A" | null,
  "fuel_or_type": "natural gas" | "heat pump" | null,
  "estimated_age_years": 2 | null,
  "expected_lifespan_years": 12 | null,
  "notes": "Decoded manufacture date from serial RHLN0124: week 01 of 2024." | null,
  "recall_or_safety_flag": "Federal Pacific Stab-Lok panel — known fire hazard" | null,
  "confidence": 88,
  "raw_text": "RHEEM\\nMODEL: XE50T06ST45U1\\nSERIAL: RHLN012412345\\n50 GAL\\n40,000 BTU/HR\\nNATURAL GAS"
}

install_date defaults to manufacture_date when no separate install record is visible (typical for nameplates).
estimated_age_years = ${currentYear} - year(install_date or manufacture_date) — return null if neither date is known.
expected_lifespan_years follows the typical ranges in the guidance above.`;

    let responseText: string | null = null;
    let aiProvider: 'bedrock' | 'gemini' | null = null;

    // Primary: Claude on Amazon Bedrock (AWS-native AI for the AWS hackathon story).
    if (isBedrockConfigured()) {
      try {
        responseText = await invokeClaudeOnBedrock({
          system:
            'You are a home-inspector AI. Return only the JSON object requested — no markdown, no code blocks, no commentary.',
          maxTokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mimeType, data: imageBase64 },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        });
        aiProvider = 'bedrock';
      } catch (err) {
        console.error('[BEDROCK FAILED — falling back to Gemini]', err);
      }
    }

    // Fallback: Gemini (keeps the demo working if Bedrock isn't configured yet
    // on Vercel preview, or if the model is temporarily unavailable).
    if (responseText === null) {
      if (!GEMINI_API_KEY) {
        return Response.json(
          { error: 'No AI provider configured (set AWS Bedrock or GEMINI_API_KEY)' },
          { status: 500 }
        );
      }
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
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
        return Response.json(
          { error: `AI provider error: ${geminiResponse.status}` },
          { status: 502 }
        );
      }
      const geminiData = await geminiResponse.json();
      responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!(responseText ?? "").trim()) {
        const finishReason = geminiData.candidates?.[0]?.finishReason;
        console.error('[GEMINI NAMEPLATE EMPTY RESPONSE]', {
          finishReason,
          raw: JSON.stringify(geminiData).slice(0, 500),
        });
        return Response.json(
          {
            error: finishReason
              ? `AI provider returned no content (finishReason: ${finishReason})`
              : 'AI provider returned no content',
          },
          { status: 502 }
        );
      }
      aiProvider = 'gemini';
    }

    let jsonText = (responseText ?? '').trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    let extracted: ExtractedFields;
    try {
      extracted = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[NAMEPLATE PARSE ERROR]', parseErr, jsonText.slice(0, 500));
      return Response.json(
        { error: 'Model returned unparseable JSON', raw: jsonText },
        { status: 502 }
      );
    }

    extracted.system_type = systemType;
    if (typeof extracted.confidence !== 'number') extracted.confidence = 0;
    if (typeof extracted.raw_text !== 'string') extracted.raw_text = '';

    const s3Result = await s3Promise;

    return Response.json({
      extracted,
      ai_provider: aiProvider,
      photo: s3Result
        ? { bucket: s3Result.bucket, key: s3Result.key, region: s3Result.region }
        : null,
    });
  } catch (error) {
    console.error('[/api/nameplate-extract error]', error);
    return Response.json({ error: 'Failed to extract nameplate' }, { status: 500 });
  }
}
