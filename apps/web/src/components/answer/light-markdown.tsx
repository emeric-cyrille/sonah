import { Fragment, type ReactNode } from 'react';

/**
 * Rendu Markdown minimal et sûr : paragraphes, retours à la ligne, listes, titres,
 * gras, italique, code, liens http(s) et marqueurs de citation [n].
 * Tout le texte passe par React (échappement automatique) : aucun HTML brut n'est injecté.
 */

type Block =
  | { readonly type: 'p'; readonly lines: string[] }
  | { readonly type: 'ul'; readonly items: string[] }
  | { readonly type: 'ol'; readonly items: string[]; readonly start: number }
  | { readonly type: 'h'; readonly text: string };

const UL_ITEM = /^\s*[-*•]\s+(.*)$/;
const OL_ITEM = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  const flush = (): void => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trimEnd();
    if (line.trim().length === 0) {
      flush();
      continue;
    }
    const heading = HEADING.exec(line);
    const ul = UL_ITEM.exec(line);
    const ol = OL_ITEM.exec(line);

    if (heading) {
      flush();
      blocks.push({ type: 'h', text: heading[1] ?? '' });
    } else if (ul) {
      if (current?.type !== 'ul') {
        flush();
        current = { type: 'ul', items: [] };
      }
      current.items.push(ul[1] ?? '');
    } else if (ol) {
      if (current?.type !== 'ol') {
        flush();
        current = { type: 'ol', items: [], start: Number(ol[1]) || 1 };
      }
      current.items.push(ol[2] ?? '');
    } else if ((current?.type === 'ul' || current?.type === 'ol') && /^\s{2,}/.test(rawLine)) {
      // Ligne indentée : suite de l'élément de liste précédent
      const last = current.items.length - 1;
      current.items[last] = `${current.items[last] ?? ''} ${line.trim()}`;
    } else {
      if (current?.type !== 'p') {
        flush();
        current = { type: 'p', lines: [] };
      }
      current.lines.push(line.trim());
    }
  }
  flush();
  return blocks;
}

const INLINE =
  /\*\*([^*]+?)\*\*|__([^_]+?)__|`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\[(\d+(?:\s*[,;]\s*\d+)*)\](?!\()|\*([^*\s][^*\n]*?)\*/g;

export type CitationRenderer = (index: number, key: string) => ReactNode | null;

function renderInline(
  text: string,
  renderCitation: CitationRenderer | undefined,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(INLINE.source, 'g');

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${keyPrefix}-${match.index}`;
    const [whole, bold1, bold2, code, linkText, linkUrl, citations, italic] = match;

    if (bold1 !== undefined || bold2 !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {renderInline(bold1 ?? bold2 ?? '', renderCitation, key)}
        </strong>,
      );
    } else if (code !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">
          {code}
        </code>,
      );
    } else if (linkText !== undefined && linkUrl !== undefined) {
      nodes.push(
        <a key={key} href={linkUrl} target="_blank" rel="noreferrer" className="underline">
          {linkText}
        </a>,
      );
    } else if (citations !== undefined) {
      const indexes = citations.split(/[,;]/).map((part) => Number(part.trim()));
      const rendered = indexes.map((index, position) =>
        renderCitation ? renderCitation(index, `${key}-${position}`) : null,
      );
      if (rendered.every((node) => node !== null)) {
        nodes.push(<Fragment key={key}>{rendered}</Fragment>);
      } else {
        nodes.push(whole);
      }
    } else if (italic !== undefined) {
      nodes.push(
        <em key={key} className="italic">
          {renderInline(italic, renderCitation, key)}
        </em>,
      );
    } else {
      nodes.push(whole);
    }
    lastIndex = match.index + whole.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function LightMarkdown({
  text,
  renderCitation,
  className = '',
}: {
  readonly text: string;
  readonly renderCitation?: CitationRenderer;
  readonly className?: string;
}): JSX.Element {
  const blocks = parseBlocks(text);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, blockIndex) => {
        const key = `b${blockIndex}`;
        switch (block.type) {
          case 'h':
            return (
              <p key={key} className="pt-1 font-semibold">
                {renderInline(block.text, renderCitation, key)}
              </p>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-1.5 pl-5 marker:opacity-60">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInline(item, renderCitation, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol
                key={key}
                start={block.start}
                className="list-decimal space-y-1.5 pl-5 marker:opacity-60"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInline(item, renderCitation, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={key}>
                {block.lines.map((line, lineIndex) => (
                  <Fragment key={`${key}-${lineIndex}`}>
                    {lineIndex > 0 && <br />}
                    {renderInline(line, renderCitation, `${key}-${lineIndex}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
