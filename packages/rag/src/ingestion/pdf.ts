import { readFile } from 'node:fs/promises';
// Import direct du module : l'entrée principale de pdf-parse exécute un mode debug
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

/** Extrait le texte d'un PDF, page par page (séparateur =====PAGE=====). */
export async function extractPdfText(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const pages: string[] = [];
  await pdfParse(buffer, {
    pagerender: async (page) => {
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });
      let lastY: number | undefined;
      let text = '';
      for (const item of content.items) {
        const y = item.transform[5] ?? 0;
        text += lastY === undefined || lastY === y ? item.str : `\n${item.str}`;
        lastY = y;
      }
      pages.push(text);
      return text;
    },
  });
  return pages.join('\n=====PAGE=====\n');
}
