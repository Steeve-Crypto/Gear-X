export interface InferenceRequest {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface InferenceProvider {
  id: string;
  name: string;
  remote: boolean;
  isAvailable(signal?: AbortSignal): Promise<boolean>;
  generate(request: InferenceRequest): Promise<string>;
}
