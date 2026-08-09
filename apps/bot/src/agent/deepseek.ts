import { env } from '../env.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DeepSeekResponse {
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chat(
  messages: ChatMessage[],
  opts: DeepSeekOptions = {},
): Promise<DeepSeekResponse> {
  const url = `${env.DEEPSEEK_BASE_URL.replace(/\/$/, '')}/chat/completions`;

  const body = {
    model: opts.model ?? env.DEEPSEEK_MODEL,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 500,
    stream: false,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: DeepSeekResponse['usage'];
  };

  return {
    text: data.choices[0]?.message?.content?.trim() ?? '',
    usage: data.usage,
  };
}
