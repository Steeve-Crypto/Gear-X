import { routerAgent } from '../agents/router';
import { AgentRuntime } from '../agents/runtime';
import { agentRegistry } from '../agents/registry';
import { Insight } from '../agents/types';
import { CaptureSession } from '../domain/models';
import { GearXError } from '../domain/errors';
import { TranscriptionProvider } from '../infrastructure/transcription/types';
import { sessionRepository } from '../repositories/sessionRepository';
import { createId } from '../utils/id';
import { startListening, stopListening } from './audio';

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

export async function stopAndProcessSession(input: {
  session: CaptureSession;
  provider: TranscriptionProvider;
  retainRecording: boolean;
  currentInsights: Insight[];
  signal?: AbortSignal;
  onAgents?: (ids: string[]) => void;
}): Promise<{ session: CaptureSession; transcript: string; newInsights: Insight[] }> {
  const endedAt = Date.now();
  const uri = await stopListening();
  if (!uri) throw new GearXError('RECORDING_FAILED', 'No recording file was produced.');
  let session: CaptureSession = {
    ...input.session,
    endedAt,
    durationMs: endedAt - input.session.startedAt,
    status: 'processing',
    audioUri: input.retainRecording ? uri : null,
    updatedAt: endedAt,
  };
  await sessionRepository.update(session);

  try {
    if (!(await input.provider.isAvailable())) {
      throw new GearXError('PROVIDER_UNAVAILABLE', 'The transcription provider is unavailable.');
    }
    const transcription = await input.provider.transcribe({
      sessionId: session.id,
      audioUri: uri,
      signal: input.signal,
    });
    for (const source of transcription.segments) {
      await sessionRepository.addSegment({
        id: createId('segment'),
        sessionId: session.id,
        text: source.text,
        startMs: source.startMs,
        endMs: source.endMs,
        speakerLabel: source.speakerLabel,
        confidence: source.confidence,
        createdAt: Date.now(),
      });
    }

    const context = {
      sessionId: session.id,
      recentTranscript: transcription.text,
      currentInsights: input.currentInsights,
      isListening: false,
      signal: input.signal,
    };
    const routed = await routerAgent.run(context);
    const active = routed.data?.activeAgents ?? [];
    input.onAgents?.(active);
    const results = await runtime.execute(active, context, {
      signal: input.signal,
      idempotencyKey: `${session.id}:final`,
    });
    const newInsights = results
      .filter((result) => result.agentId === 'extractor')
      .flatMap((result) => (result.data?.insights ?? []) as Insight[]);
    session = { ...session, status: 'complete', updatedAt: Date.now() };
    await sessionRepository.update(session);
    return { session, transcript: transcription.text, newInsights };
  } catch (cause) {
    session = { ...session, status: 'failed', updatedAt: Date.now() };
    await sessionRepository.update(session);
    if (cause instanceof GearXError) throw cause;
    throw new GearXError('TRANSCRIPTION_FAILED', 'Session processing failed.', cause);
  } finally {
    input.onAgents?.([]);
  }
}
