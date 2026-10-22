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

/** Point d'accès de Gemini compatible avec l'API OpenAI. */
export const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

export interface ChatModelOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly baseURL?: string;
  /**
   * Niveau de réflexion interne (« none » désactive la réflexion des modèles Gemini 2.5 :
   * réponses plus rapides et quota gratuit mieux utilisé).
   */
  readonly reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
}

/** Modèle de chat via le SDK OpenAI : OpenAI directement, ou Gemini par sa couche de compatibilité. */
export class OpenAICompatibleLanguageModel implements LanguageModel {
  readonly name: string;
  private readonly client: OpenAI;
  private readonly reasoningEffort?: ChatModelOptions['reasoningEffort'];

  constructor(options: ChatModelOptions) {
    this.name = options.model;
    this.reasoningEffort = options.reasoningEffort;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      maxRetries: 3,
      timeout: 45_000,
    });
  }

  async complete(turns: readonly ChatTurn[]): Promise<string> {
    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.name,
      messages: turns.map((turn) => ({ role: turn.role, content: turn.content })),
      temperature: 0.2,
      max_tokens: 1200,
    };
    // « none » n'est pas dans les types du SDK mais est accepté par Gemini
    const body = this.reasoningEffort
      ? { ...params, reasoning_effort: this.reasoningEffort }
      : params;
    const completion = await this.client.chat.completions.create(
      body as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    );
    const content = completion.choices[0]?.message.content?.trim();
    if (!content) throw new Error('Réponse vide du modèle de langage');
    return content;
  }
}

export const LANGUAGE_MODEL = Symbol('LANGUAGE_MODEL');
