import { InferenceProvider, InferenceRequest } from './types';
import { AICapability } from '../../domain/aiCapabilities';

const capabilities: AICapability[] = [
  'structured-extraction',
  'relationship-refinement',
  'summarization',
  'question-refinement',
  'answer-synthesis',
];

export class MockInferenceProvider implements InferenceProvider {
  id = 'mock-test';
  name = 'Deterministic test inference';
  remote = false;
  metadata = { capabilities, costClass: 'free' as const, configured: true };
  constructor(private readonly output: string) {}
  async isAvailable() {
    return true;
  }
  async generate(_request: InferenceRequest) {
    return this.output;
  }
}
