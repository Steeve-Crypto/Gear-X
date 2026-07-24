import { InferenceProvider, InferenceRequest } from './types';

export class MockInferenceProvider implements InferenceProvider {
  id = 'mock-test';
  name = 'Deterministic test inference';
  remote = false;
  constructor(private readonly output: string) {}
  async isAvailable() {
    return true;
  }
  async generate(_request: InferenceRequest) {
    return this.output;
  }
}
