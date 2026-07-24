import { Agent, AgentContext, AgentResult } from './types';

/**
 * Listener Agent
 * Handles real-time speech-to-text and basic speaker awareness.
 * In production this will use Moonshine / Whisper.cpp / on-device STT.
 * Transcription is supplied by a configured TranscriptionProvider after audio capture.
 */
export const listenerAgent: Agent = {
  id: 'listener',
  name: 'Listener',
  description: 'Real-time STT + speaker diarization. Streams clean text to the system.',
  continuous: true,

  async run(ctx: AgentContext): Promise<AgentResult> {
    if (!ctx.isListening) {
      return {
        agentId: 'listener',
        success: true,
        data: { status: 'idle', transcript: '' },
      };
    }

    // In a full implementation this would:
    // 1. Receive audio chunks from expo-av / live stream
    // 2. Run local STT (Moonshine / Whisper)
    // 3. Optionally do simple speaker diarization
    // 4. Return clean rolling transcript

    // The capture pipeline passes only provider-produced transcript text.
    const transcript = ctx.recentTranscript || '';

    return {
      agentId: 'listener',
      success: true,
      data: {
        status: 'listening',
        transcript,
        confidence: 0.85,
        speakers: [],
      },
    };
  },
};
