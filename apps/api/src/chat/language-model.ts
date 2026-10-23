import OpenAI from 'openai';

export interface ChatTurn {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

/** Modèle de langage qui rédige les réponses de Sonah. */
export interface LanguageModel {
  readonly name: string;
  complete(turns: readonly ChatTurn[]): Promise<string>;
}

export class OpenAILanguageModel implements LanguageModel {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly name: string,
  ) {
    // Un seul nouvel essai, 20 s au plus : au-delà, Sonah bascule sur la réponse extractive
    this.client = new OpenAI({ apiKey, maxRetries: 1, timeout: 20_000 });
  }

  async complete(turns: readonly ChatTurn[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.name,
      messages: turns.map((turn) => ({ role: turn.role, content: turn.content })),
      temperature: 0.2,
      max_tokens: 900,
    });
    const content = completion.choices[0]?.message.content?.trim();
    if (!content) throw new Error('Réponse vide du modèle de langage');
    return content;
  }
}

export const LANGUAGE_MODEL = Symbol('LANGUAGE_MODEL');
