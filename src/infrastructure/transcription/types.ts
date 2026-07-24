export interface TranscriptionInput {
  sessionId: string;
  audioUri: string;
  locale?: string;
  signal?: AbortSignal;
}

export interface TranscriptionResult {
  text: string;
  confidence: number | null;
  segments: {
    text: string;
    startMs: number;
    endMs: number;
    confidence: number | null;
    speakerLabel: string | null;
  }[];
}

export interface TranscriptionProvider {
  id: string;
  name: string;
  remote: boolean;
  isAvailable(): Promise<boolean>;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
  cancel?(sessionId: string): Promise<void>;
}
