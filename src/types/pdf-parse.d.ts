declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: { Title?: string; Author?: string };
    metadata: unknown;
    version: string;
  }

  function pdfParse(buffer: Buffer): Promise<PdfParseResult>;
  export = pdfParse;
}
