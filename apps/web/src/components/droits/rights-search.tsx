'use client';

import { Loader2, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiUnavailableError, searchLegalTexts, type SearchResult } from '@/lib/api-client';

type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'done'; readonly results: readonly SearchResult[] }
  | { readonly status: 'error'; readonly message: string };

const EXAMPLES = [
  'liberté d’expression',
  'droit de grève',
  'congé de maternité',
  'période d’essai',
] as const;

export function RightsSearch(): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });

  const runSearch = async (value: string): Promise<void> => {
    const text = value.trim();
    if (text.length < 3) return;
    setQuery(text);
    setState({ status: 'loading' });
    try {
      const results = await searchLegalTexts(text);
      setState({ status: 'done', results });
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof ApiUnavailableError
            ? 'La recherche dans les textes officiels est en cours de mise en service. Réessayez bientôt.'
            : 'La recherche a échoué. Merci de réessayer.',
      });
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void runSearch(query);
  };

  return (
    <div>
      <form onSubmit={onSubmit} role="search" className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="rights-query" className="sr-only">
          Rechercher un droit
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          />
          <input
            id="rights-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            minLength={3}
            maxLength={300}
            placeholder="Ex. : Puis-je être licencié pendant un arrêt maladie ?"
            className="h-12 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-base focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-primary h-12" disabled={state.status === 'loading'}>
          {state.status === 'loading' && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Rechercher
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => void runSearch(example)}
            className="rounded-full border border-slate-200 px-3 py-1 text-ink-700 hover:bg-slate-50"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-8" aria-live="polite">
        {state.status === 'error' && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            {state.message}
          </p>
        )}
        {state.status === 'done' && state.results.length === 0 && (
          <p className="text-ink-700">
            Aucun article ne correspond. Essayez une autre formulation.
          </p>
        )}
        {state.status === 'done' && state.results.length > 0 && (
          <ul className="space-y-4">
            {state.results.map((result) => (
              <li key={result.id} className="card">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {result.category}
                </p>
                <h3 className="mt-1 font-semibold">{result.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{result.content}</p>
                <p className="mt-3 text-xs text-ink-500">Source : {result.source}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
