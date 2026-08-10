export type AICapability =
  | 'structured-extraction'
  | 'relationship-refinement'
  | 'summarization'
  | 'question-refinement'
  | 'answer-synthesis';

export type ProviderCostClass = 'free' | 'metered';

export interface ProviderMetadata {
  capabilities: readonly AICapability[];
  costClass: ProviderCostClass;
  configured: boolean;
}

export const operationCapability: Record<string, AICapability> = {
  extract: 'structured-extraction',
  weave: 'relationship-refinement',
  summarize: 'summarization',
  question: 'question-refinement',
  retrieve: 'answer-synthesis',
};
