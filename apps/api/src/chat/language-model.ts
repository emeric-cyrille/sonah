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

/** Point d'accès de Groq compatible avec l'API OpenAI (palier gratuit, modèles ouverts). */
export const GROQ_OPENAI_BASE_URL = 'https://api.groq.com/openai/v1';

/** Point d'accès de Gemini compatible avec l'API OpenAI. */
export const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

export interface ChatModelOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly baseURL?: string;
  /**
   * Niveau de réflexion interne (modèles de raisonnement : gpt-oss, Gemini).
   * « low » ou « minimal » : réponses plus rapides et quota gratuit mieux utilisé.
   */
  readonly reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high';
}

/**
 * Regroupe toutes les consignes système en un seul message de tête, dans leur ordre.
 * La couche de compatibilité OpenAI de Gemini ne garde que le dernier message système :
 * sans regroupement, les règles de Sonah (citations, interdits) seraient ignorées.
 */
export function mergeSystemTurns(
  turns: readonly ChatTurn[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const system = turns.filter((turn) => turn.role === 'system').map((turn) => turn.content);
  const others = turns
    .filter((turn) => turn.role !== 'system')
    .map((turn) => ({ role: turn.role as 'user' | 'assistant', content: turn.content }));
  return system.length > 0 ? [{ role: 'system', content: system.join('\n\n') }, ...others] : others;
}

/** Modèle de chat via le SDK OpenAI : Groq, Gemini ou OpenAI selon l'adresse du serveur. */
export class OpenAICompatibleLanguageModel implements LanguageModel {
  readonly name: string;
  private readonly client: OpenAI;
  private readonly reasoningEffort?: ChatModelOptions['reasoningEffort'];

  constructor(options: ChatModelOptions) {
    this.name = options.model;
    this.reasoningEffort = options.reasoningEffort;
    // Un seul nouvel essai, 20 s au plus : au-delà, Sonah bascule sur la réponse extractive
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      maxRetries: 1,
      timeout: 20_000,
    });
  }

  async complete(turns: readonly ChatTurn[]): Promise<string> {
    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: this.name,
      messages: mergeSystemTurns(turns),
      temperature: 0.2,
      // Marge pour les modèles de raisonnement (gpt-oss) : leur réflexion consomme aussi des tokens
      max_tokens: 2048,
    };
    // Certaines valeurs (« none », « minimal ») ne sont pas dans les types du SDK mais sont acceptées
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

/**
 * Modèle principal avec repli : si le premier échoue (quota, panne), le suivant est essayé.
 * Si tous échouent, l'erreur remonte et Sonah répond en citant les textes.
 */
export class FallbackLanguageModel implements LanguageModel {
  constructor(private readonly models: readonly LanguageModel[]) {
    if (models.length === 0) throw new Error('Au moins un modèle est requis');
  }

  get name(): string {
    return this.models.map((model) => model.name).join(' → ');
  }

  async complete(turns: readonly ChatTurn[]): Promise<string> {
    let lastError: unknown;
    for (const model of this.models) {
      try {
        return await model.complete(turns);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

export const LANGUAGE_MODEL = Symbol('LANGUAGE_MODEL');
