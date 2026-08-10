import { AICapability, ProviderMetadata } from '../../domain/aiCapabilities';

export interface InferenceRequest {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  capability?: AICapability;
}

export interface InferenceProvider {
  id: string;
  name: string;
  remote: boolean;
  metadata?: ProviderMetadata;
  isAvailable(signal?: AbortSignal): Promise<boolean>;
  generate(request: InferenceRequest): Promise<string>;
}
