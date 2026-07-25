import { routerAgent } from '../agents/router';
import { AgentRuntime } from '../agents/runtime';
import { agentRegistry } from '../agents/registry';
import { Insight } from '../agents/types';
import { CaptureSession } from '../domain/models';
import { GearXError } from '../domain/errors';
import { TranscriptionProvider } from '../infrastructure/transcription/types';
import { InferenceProvider } from '../infrastructure/inference/types';
import { sessionRepository } from '../repositories/sessionRepository';
import { createId } from '../utils/id';
import { runRepository } from '../repositories/runRepository';
import { deleteRecording, startListening, stopListening } from './audio';

const runtime = new AgentRuntime(agentRegistry);

export async function startCaptureSession(input: {
  transcriptionProvider: string;
  inferenceProvider: string;
  processingMode: CaptureSession['processingMode'];
}): Promise<CaptureSession> {
  const now = Date.now();
  const session: CaptureSession = {
    id: createId('session'),
    startedAt: now,
    endedAt: null,
    durationMs: 0,
    status: 'recording',
    audioUri: null,
    transcriptionProvider: input.transcriptionProvider,
    inferenceProvider: input.inferenceProvider,
    processingMode: input.processingMode,
    createdAt: now,
    updatedAt: now,
  };
  await sessionRepository.create(session);
  const started = await startListening();
  if (!started) {
    await sessionRepository.remove(session.id);
    throw new GearXError('RECORDING_FAILED', 'Recording could not start.');
  }
  return session;
}

export async function setCaptureSessionStatus(
  session: CaptureSession,
  status: 'recording' | 'paused',
): Promise<CaptureSession> {
  if (!['recording', 'paused'].includes(session.status)) {
    throw new GearXError('CORRUPT_SESSION', 'Only an active recording can be paused or resumed.');
  }
  const updated = { ...session, status, updatedAt: Date.now() };
  await sessionRepository.update(updated);
  return updated;
}

export async function stopAndProcessSession(input: {
  session: CaptureSession;
  provider: TranscriptionProvider;
  inferenceProvider?: InferenceProvider;
  retainRecording: boolean;
  currentInsights: Insight[];
  signal?: AbortSignal;
  onAgents?: (ids: string[]) => void;
  autoSummarize?: boolean;
  autoQuestion?: boolean;
}): Promise<ProcessedSession> {
  const endedAt = Date.now();
  const uri = await stopListening();
  if (!uri) throw new GearXError('RECORDING_FAILED', 'No recording file was produced.');
  let session: CaptureSession = {
    ...input.session,
    endedAt,
    durationMs: endedAt - input.session.startedAt,
    status: 'processing',
    audioUri: uri,
    updatedAt: endedAt,
  };
  await sessionRepository.update(session);

  return processCapturedSession({
    ...input,
    session,
    audioUri: uri,
  });
}

export async function retryCapturedSession(input: {
  sessionId: string;
  provider: TranscriptionProvider;
  inferenceProvider?: InferenceProvider;
  retainRecording: boolean;
  currentInsights: Insight[];
  signal?: AbortSignal;
  onAgents?: (ids: string[]) => void;
  autoSummarize?: boolean;
  autoQuestion?: boolean;
}): Promise<ProcessedSession> {
  const existing = await sessionRepository.get(input.sessionId);
  if (!existing?.audioUri || !['processing', 'failed'].includes(existing.status)) {
    throw new GearXError('SESSION_NOT_RECOVERABLE', 'This session has no recoverable recording.');
  }
  const session = { ...existing, status: 'processing' as const, updatedAt: Date.now() };
  await sessionRepository.update(session);
  return processCapturedSession({ ...input, session, audioUri: existing.audioUri });
}

async function processCapturedSession(input: {
  session: CaptureSession;
  audioUri: string;
  provider: TranscriptionProvider;
  inferenceProvider?: InferenceProvider;
  retainRecording: boolean;
  currentInsights: Insight[];
  signal?: AbortSignal;
  onAgents?: (ids: string[]) => void;
  autoSummarize?: boolean;
  autoQuestion?: boolean;
}): Promise<ProcessedSession> {
  let session = input.session;
  try {
    if (!(await input.provider.isAvailable())) {
      throw new GearXError('PROVIDER_UNAVAILABLE', 'The transcription provider is unavailable.');
    }
    const providerRunId = createId('provider');
    const providerStartedAt = Date.now();
    await runRepository.startProvider({
      id: providerRunId,
      sessionId: session.id,
      providerId: input.provider.id,
      operation: 'transcription',
      remote: input.provider.remote,
    });
    let transcription;
    try {
      transcription = await input.provider.transcribe({
        sessionId: session.id,
        audioUri: input.audioUri,
        signal: input.signal,
      });
      await runRepository.finishProvider(providerRunId, providerStartedAt);
    } catch (error) {
      await runRepository.finishProvider(providerRunId, providerStartedAt, 'TRANSCRIPTION_FAILED');
      throw error;
    }
    await sessionRepository.replaceSegments(
      session.id,
      transcription.segments.map((source) => ({
        id: createId('segment'),
        sessionId: session.id,
        text: source.text,
        startMs: source.startMs,
        endMs: source.endMs,
        speakerLabel: source.speakerLabel,
        confidence: source.confidence,
        createdAt: Date.now(),
      })),
    );

    const context = {
      sessionId: session.id,
      recentTranscript: transcription.text,
      currentInsights: input.currentInsights,
      isListening: false,
      signal: input.signal,
      inferenceProvider: input.inferenceProvider,
    };
    const routed = await routerAgent.run(context);
    const active = (routed.data?.activeAgents ?? []).filter((id) => (
      (id !== 'summarizer' || input.autoSummarize !== false)
      && (id !== 'questioner' || input.autoQuestion !== false)
    ));
    input.onAgents?.(active);
    const runGroup = `${session.id}:final`;
    const results = await runtime.execute(active, context, {
      signal: input.signal,
      idempotencyKey: runGroup,
      onEvent: (event) => runRepository.recordAgentEvent(session.id, runGroup, event),
    });
    const failure = results.find((result) => !result.success);
    if (failure) {
      throw new GearXError('AGENT_FAILED', failure.error ?? 'Knowledge processing failed.');
    }
    const newInsights = results
      .filter((result) => result.agentId === 'extractor')
      .flatMap((result) => (result.data?.insights ?? []) as Insight[]);
    const recordingDeleted = input.retainRecording
      ? false
      : await deleteRecording(input.audioUri);
    session = {
      ...session,
      status: 'complete',
      audioUri: input.retainRecording || !recordingDeleted ? input.audioUri : null,
      updatedAt: Date.now(),
    };
    await sessionRepository.update(session);
    return {
      session,
      transcript: transcription.text,
      newInsights,
      recordingCleanupFailed: !input.retainRecording && !recordingDeleted,
    };
  } catch (cause) {
    session = { ...session, status: 'failed', updatedAt: Date.now() };
    await sessionRepository.update(session);
    if (cause instanceof GearXError) throw cause;
    throw new GearXError('TRANSCRIPTION_FAILED', 'Session processing failed.', cause);
  } finally {
    input.onAgents?.([]);
  }
}

interface ProcessedSession {
  session: CaptureSession;
  transcript: string;
  newInsights: Insight[];
  recordingCleanupFailed: boolean;
}
