import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { OpenAICompatibleLanguageModel } from './language-model';

interface Captured {
  url?: string;
  authorization?: string;
  body?: Record<string, unknown>;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    request.on('data', (chunk) => (data += chunk));
    request.on('end', () => resolve(data));
  });
}

/** Serveur local imitant /chat/completions (API OpenAI ou couche de compatibilité Gemini). */
async function startFakeServer(
  reply: string | null,
): Promise<{ server: Server; baseURL: string; captured: Captured }> {
  const captured: Captured = {};
  const server = createServer(async (request, response) => {
    captured.url = request.url;
    captured.authorization = request.headers.authorization;
    captured.body = JSON.parse(await readBody(request)) as Record<string, unknown>;
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        id: 'x',
        object: 'chat.completion',
        created: 0,
        model: 'm',
        choices: [
          { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: reply } },
        ],
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return { server, baseURL: `http://127.0.0.1:${port}/v1beta/openai/`, captured };
}

describe('OpenAICompatibleLanguageModel', () => {
  let server: Server | undefined;
  afterEach(
    () => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())),
  );

  it('envoie la requête au format Gemini (modèle, clé, réflexion désactivée)', async () => {
    const fake = await startFakeServer('  Bonjour, voici la démarche.  ');
    server = fake.server;
    const model = new OpenAICompatibleLanguageModel({
      apiKey: 'cle-gemini',
      model: 'gemini-2.5-flash',
      baseURL: fake.baseURL,
      reasoningEffort: 'none',
    });

    const reply = await model.complete([
      { role: 'system', content: 'Tu es Sonah.' },
      { role: 'user', content: 'Bonjour' },
    ]);

    expect(reply).toBe('Bonjour, voici la démarche.');
    expect(fake.captured.url).toBe('/v1beta/openai/chat/completions');
    expect(fake.captured.authorization).toBe('Bearer cle-gemini');
    expect(fake.captured.body).toMatchObject({
      model: 'gemini-2.5-flash',
      reasoning_effort: 'none',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Tu es Sonah.' },
        { role: 'user', content: 'Bonjour' },
      ],
    });
  });

  it('n’envoie pas reasoning_effort quand il n’est pas configuré (OpenAI)', async () => {
    const fake = await startFakeServer('ok');
    server = fake.server;
    await new OpenAICompatibleLanguageModel({
      apiKey: 'k',
      model: 'gpt-4o',
      baseURL: fake.baseURL,
    }).complete([{ role: 'user', content: 'test' }]);
    expect(fake.captured.body).not.toHaveProperty('reasoning_effort');
  });

  it('signale une réponse vide', async () => {
    const fake = await startFakeServer(null);
    server = fake.server;
    const model = new OpenAICompatibleLanguageModel({
      apiKey: 'k',
      model: 'm',
      baseURL: fake.baseURL,
    });
    await expect(model.complete([{ role: 'user', content: 'test' }])).rejects.toThrow(
      'Réponse vide',
    );
  });
});
