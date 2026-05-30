import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiKey: string;
  // llama-3.3-70b-versatile — free tier, fast, high quality
  private readonly model = 'llama-3.3-70b-versatile';
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('GROQ_API_KEY not set — AI rewrites will be unavailable');
    }
  }

  async rewriteProfessional(text: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured on the server.');
    }

    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: `You are an expert professional writing assistant. Your sole task is to rewrite the user's text to be more professional, clear, and polished.

Rules:
- Preserve the original meaning and intent completely
- Improve vocabulary, tone, and sentence structure
- Make it suitable for a formal business context
- Return ONLY the rewritten text — no explanations, no preamble, no quotes
- Match the approximate length of the original`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,      // Low temp = consistent, professional output
        max_tokens: 1024,       // Cost-effective ceiling
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Groq API error ${response.status}: ${error}`);
      throw new Error(`Groq API returned ${response.status}: ${error}`);
    }

    const data: GroqResponse = await response.json();
    const rewritten = data.choices[0]?.message?.content?.trim();

    this.logger.log(
      `Groq rewrite | tokens used: ${data.usage?.total_tokens} | model: ${this.model}`,
    );

    if (!rewritten) throw new Error('Groq returned an empty response.');
    return rewritten;
  }
}
