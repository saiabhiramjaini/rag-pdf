import { Embeddings } from "@langchain/core/embeddings";
import { TfIdf, WordTokenizer } from "natural";

class LocalEmbeddings extends Embeddings {
  private dimension = 384;
  private tfidf: TfIdf;
  private tokenizer: WordTokenizer;
  private vocabulary: Map<string, number> = new Map();
  private documents: string[] = [];

  constructor() {
    super({});
    this.tfidf = new TfIdf();
    this.tokenizer = new WordTokenizer();
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    // Add documents to TF-IDF if not already present
    for (const text of texts) {
      if (!this.documents.includes(text)) {
        this.documents.push(text);
        this.tfidf.addDocument(text);
      }
    }

    // Build vocabulary
    this.buildVocabulary();

    return texts.map(text => this.createEmbedding(text));
  }

  async embedQuery(text: string): Promise<number[]> {
    // If no documents have been added yet, create a simple embedding
    if (this.documents.length === 0) {
      return this.createSimpleEmbedding(text);
    }

    return this.createEmbedding(text);
  }

  private buildVocabulary() {
    const allWords = new Set<string>();
    
    for (const doc of this.documents) {
      const tokens = this.tokenizer.tokenize(doc.toLowerCase()) || [];
      tokens.forEach(token => allWords.add(token));
    }

    let index = 0;
    for (const word of allWords) {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, index++);
      }
    }
  }

  private createEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];

    // Use TF-IDF scores for embedding
    for (let i = 0; i < this.documents.length; i++) {
      const docTokens = this.tokenizer.tokenize(this.documents[i].toLowerCase()) || [];
      
      for (const token of tokens) {
        if (docTokens.includes(token)) {
          const tfidfScore = this.tfidf.tfidf(token, i);
          const vocabIndex = this.vocabulary.get(token);
          
          if (vocabIndex !== undefined && vocabIndex < this.dimension) {
            embedding[vocabIndex] += tfidfScore;
          }
        }
      }
    }

    // Add word-based features for remaining dimensions
    for (let i = 0; i < tokens.length && i < this.dimension; i++) {
      const token = tokens[i];
      const hash = this.simpleHash(token) % this.dimension;
      embedding[hash] += 1 / tokens.length;
    }

    // Normalize the embedding
    return this.normalizeVector(embedding);
  }

  private createSimpleEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];

    // Create embedding based on character and word features
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Hash-based positioning
      const hash1 = this.simpleHash(token) % this.dimension;
      const hash2 = this.simpleHash(token + i.toString()) % this.dimension;
      
      embedding[hash1] += 1;
      embedding[hash2] += 0.5;
    }

    // Add character-level features
    for (let i = 0; i < text.length && i < 100; i++) {
      const charIndex = text.charCodeAt(i) % this.dimension;
      embedding[charIndex] += 0.1;
    }

    return this.normalizeVector(embedding);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vector.map(val => val / norm) : vector;
  }
}

export const embeddings = new LocalEmbeddings();
