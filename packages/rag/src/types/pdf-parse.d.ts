/** Typage minimal de pdf-parse (les types publiés ne prévoient pas un pagerender asynchrone). */
declare module 'pdf-parse/lib/pdf-parse.js' {
  interface TextItem {
    str: string;
    transform: number[];
  }
  interface PdfPage {
    getTextContent(options: {
      normalizeWhitespace: boolean;
      disableCombineTextItems: boolean;
    }): Promise<{
      items: TextItem[];
    }>;
  }
  interface PdfParseOptions {
    pagerender?: (page: PdfPage) => Promise<string>;
  }
  export default function pdfParse(
    buffer: Buffer,
    options?: PdfParseOptions,
  ): Promise<{ numpages: number; text: string }>;
}
