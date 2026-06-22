import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

/**
 * Thin Bedrock client wrapper that speaks the Anthropic Messages API shape
 * (the wire protocol Claude on Bedrock uses for InvokeModel).
 *
 * Env vars:
 *   AWS_BEDROCK_REGION   (default: us-west-2 — Bedrock model availability varies by region)
 *   AWS_REGION           (fallback if AWS_BEDROCK_REGION unset)
 *   BEDROCK_MODEL_ID     (default: anthropic.claude-sonnet-4-6 — vision-capable, cheaper than Opus)
 *   AWS_ACCESS_KEY_ID    (standard AWS SDK credential resolution)
 *   AWS_SECRET_ACCESS_KEY
 */

const DEFAULT_MODEL_ID = 'anthropic.claude-sonnet-4-6';

let cachedClient: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (cachedClient) return cachedClient;
  const region =
    process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-west-2';
  cachedClient = new BedrockRuntimeClient({ region });
  return cachedClient;
}

export type ClaudeMessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: { type: 'base64'; media_type: string; data: string };
    };

export type ClaudeMessage = {
  role: 'user' | 'assistant';
  content: ClaudeMessageContent[];
};

export type InvokeOptions = {
  messages: ClaudeMessage[];
  system?: string;
  maxTokens?: number;
  modelId?: string;
};

export async function invokeClaudeOnBedrock(opts: InvokeOptions): Promise<string> {
  const modelId = opts.modelId || process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID;

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: opts.messages,
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(body),
  });

  const response = await getClient().send(command);
  const raw = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(raw) as {
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string;
  };

  const textBlock = parsed.content?.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('Bedrock response had no text content');
  }
  return textBlock.text;
}

export function isBedrockConfigured(): boolean {
  return Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_SESSION_TOKEN
  );
}
