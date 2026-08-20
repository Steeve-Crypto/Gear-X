export type GearXErrorCode =
  | 'MIC_PERMISSION_DENIED'
  | 'RECORDING_FAILED'
  | 'RECORDING_INTERRUPTED'
  | 'TRANSCRIPTION_FAILED'
  | 'PROVIDER_UNAVAILABLE'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_MODEL_OUTPUT'
  | 'DATABASE_WRITE_FAILED'
  | 'DATABASE_MIGRATION_FAILED'
  | 'RETRIEVAL_FAILED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CORRUPT_SESSION'
  | 'SESSION_NOT_RECOVERABLE'
  | 'AGENT_FAILED'
  | 'MISSING_AUDIO_FILE'
  | 'NETWORK_UNAVAILABLE'
  | 'REMOTE_CONSENT_MISSING'
  | 'UNAUTHORIZED'
  | 'CONSENT_REQUIRED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'PAYLOAD_TOO_LARGE'
  | 'PROVIDER_TIMEOUT'
  | 'MALFORMED_PROVIDER_OUTPUT'
  | 'INTERNAL_ERROR'
  | 'ENTITLEMENT_REQUIRED'
  | 'CLOUD_DISABLED'
  | 'BILLING_UNAVAILABLE'
  | 'SHARE_UNAVAILABLE';

export class GearXError extends Error {
  constructor(
    public readonly code: GearXErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GearXError';
  }
}

export const userErrorMessage = (error: unknown): string => {
  if (!(error instanceof GearXError)) return 'Something went wrong. Your saved data was not changed.';
  const messages: Record<GearXErrorCode, string> = {
    MIC_PERMISSION_DENIED: 'Microphone access is required to start a capture session.',
    RECORDING_FAILED: 'Gear X could not start recording. Check microphone access and try again.',
    RECORDING_INTERRUPTED: 'Recording was interrupted. The session can be resumed.',
    TRANSCRIPTION_FAILED: 'The recording was saved, but transcription did not complete.',
    PROVIDER_UNAVAILABLE: 'The selected provider is unavailable.',
    MODEL_UNAVAILABLE: 'The selected local model is not available.',
    TIMEOUT: 'Processing took too long and was cancelled.',
    INVALID_MODEL_OUTPUT: 'The model returned an invalid response.',
    DATABASE_WRITE_FAILED: 'Gear X could not save this change.',
    DATABASE_MIGRATION_FAILED: 'The private vault could not be upgraded safely.',
    RETRIEVAL_FAILED: 'The vault search could not be completed.',
    INSUFFICIENT_EVIDENCE: 'No stored evidence supports an answer yet.',
    CORRUPT_SESSION: 'This capture session is incomplete or damaged.',
    SESSION_NOT_RECOVERABLE: 'This session no longer has a recording that can be retried.',
    AGENT_FAILED: 'The recording was transcribed, but knowledge processing did not complete.',
    MISSING_AUDIO_FILE: 'The recording file is no longer available.',
    NETWORK_UNAVAILABLE: 'A configured network provider cannot be reached.',
    REMOTE_CONSENT_MISSING: 'Enable remote-processing consent before using this provider.',
    UNAUTHORIZED: 'The secure cloud session expired. Reconnect and try again.',
    CONSENT_REQUIRED: 'Enable remote-processing consent before using cloud processing.',
    QUOTA_EXCEEDED: 'The cloud request limit has been reached. Local processing remains available.',
    INVALID_REQUEST: 'The cloud request could not be processed safely.',
    PAYLOAD_TOO_LARGE: 'The selected recording or context is too large for cloud processing.',
    PROVIDER_TIMEOUT: 'The cloud provider took too long and was cancelled.',
    MALFORMED_PROVIDER_OUTPUT: 'The cloud provider returned an invalid response.',
    INTERNAL_ERROR: 'The secure cloud service could not complete the request.',
    ENTITLEMENT_REQUIRED: 'This cloud enhancement is not included. Local Gear X remains available.',
    CLOUD_DISABLED: 'Cloud enhancements are temporarily unavailable. Local Gear X remains available.',
    BILLING_UNAVAILABLE: 'Subscription services are unavailable. Your local data and tools are unchanged.',
    SHARE_UNAVAILABLE: 'Sharing is unavailable on this device. The export was not sent.',
  };
  return messages[error.code];
};
