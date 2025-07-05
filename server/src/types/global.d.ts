declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }
  
  function pdf(buffer: Buffer): Promise<PDFData>;
  export = pdf;
}

declare module 'langchain/text_splitter' {
  export class RecursiveCharacterTextSplitter {
    constructor(options: {
      chunkSize?: number;
      chunkOverlap?: number;
      separators?: string[];
    });
    
    splitText(text: string): Promise<string[]>;
  }
} 