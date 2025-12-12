// projects/src/types/dream.ts
export type DreamCategory = 'stress'|'fear'|'anxiety'|'sadness'|'happy'|'neutral'|'confusion';

export interface DreamProbabilities {
  stress: number; fear: number; anxiety: number; sadness: number;
  happy: number; neutral: number; confusion: number;
}

export interface DreamItem {
  _id: string;
  dreamText: string;
  category: DreamCategory;
  confidence: number;            // 0..100
  probabilities: DreamProbabilities; // 0..1 mỗi key
  interpretation: string;
  tips?: string;
  analyzedAt: string;            // ISO
  formattedDate?: string;        // BE có virtual
}

export interface DreamStats {
  total: number;
  byCategory: Record<DreamCategory, number>;
  avgConfidence: number;
}
