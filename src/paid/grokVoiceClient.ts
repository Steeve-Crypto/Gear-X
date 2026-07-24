/**
 * Gear X — Paid hybrid Grok Voice client (stub)
 *
 * Architecture:
 *   Device mic → this client (WebSocket) → Grok Voice (ears + mouth)
 *   Grok tool calls → local solar-system agents (brain + vault)
 *
 * NEVER put XAI_API_KEY in the mobile binary.
 * Use an ephemeral token from your backend proxy:
 *   POST /api/voice/ephemeral-token → short-lived credential
 *
 * Endpoint (docs):
 *   wss://api.x.ai/v1/realtime?model=grok-voice-latest
 */

import { LatencyTracker, TurnReport } from './latencyTracker';
import {
  GEAR_X_VOICE_TOOLS,
  executeGearXTool,
  ToolContext,
  ToolName,
} from './tools';
import { Insight } from '../agents/types';

const REALTIME_URL = 'wss://api.x.ai/v1/realtime?model=grok-voice-latest';

export interface GrokVoiceConfig {
  /** Ephemeral token from your backend — NOT the long-lived API key */
  ephemeralToken: string;
  remoteConsent: boolean;
  voice?: string; // e.g. 'eve', 'ara', 'leo'
  instructions?: string;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onAudioDelta?: (base64Pcm: string) => void;
  onStatus?: (msg: string) => void;
  onLatencyReport?: (report: TurnReport) => void;
  onError?: (err: string) => void;
}

const DEFAULT_INSTRUCTIONS = `You are the voice interface for Gear X, a living knowledge clock.
You listen, confirm briefly, and use tools to save insights, search the vault, summarize, or surface questions.
Keep spoken replies short and concrete. Do not invent facts that are not in tool results.
When the user shares decisions, deadlines, or open loops, call save_insights_from_transcript.
When they ask what was said or decided, call search_vault.`;

export class GrokVoiceClient {
  private ws: WebSocket | null = null;
  private tracker: LatencyTracker | null = null;
  private config: GrokVoiceConfig;
  private toolCtx: ToolContext;
  private connected = false;

  constructor(config: GrokVoiceConfig, insightsRef: { current: Insight[] }) {
    this.config = config;
    this.toolCtx = {
      insightsRef,
      onStatus: config.onStatus,
    };
  }

  /**
   * Open the realtime session.
   * In React Native, prefer connecting via a backend proxy if Authorization
   * headers on WebSocket are restricted on the platform.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.remoteConsent) {
        reject(new Error('Remote processing consent is required for Grok Voice.'));
        return;
      }
      this.tracker = new LatencyTracker();

      // Note: standard RN WebSocket may not support custom headers.
      // Production path: backend upgrades connection or returns a short-lived URL.
      try {
        const HeaderWebSocket = WebSocket as unknown as new (
          url: string,
          protocols?: string | string[],
          options?: { headers?: Record<string, string> },
        ) => WebSocket;
        this.ws = new HeaderWebSocket(REALTIME_URL, undefined, {
          // Header options are supported by React Native's runtime WebSocket.
          headers: {
            Authorization: `Bearer ${this.config.ephemeralToken}`,
          },
        });
      } catch {
        reject(new Error('This runtime requires a secure backend WebSocket proxy.'));
        return;
      }

      const ws = this.ws;
      if (!ws) {
        reject(new Error('WebSocket failed to construct'));
        return;
      }

      ws.onopen = () => {
        this.connected = true;
        this.config.onStatus?.('Grok Voice session open');
        this.sendSessionUpdate();
        resolve();
      };

      ws.onmessage = (ev) => this.handleMessage(String(ev.data));

      ws.onerror = () => {
        this.config.onError?.('Grok Voice WebSocket error');
        this.config.onStatus?.('Voice connection error');
      };

      ws.onclose = () => {
        this.connected = false;
        this.config.onStatus?.('Grok Voice session closed');
        if (this.tracker) {
          this.tracker.mark('turn_complete');
          this.config.onLatencyReport?.(this.tracker.report());
        }
      };

      // Safety timeout for connect
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Grok Voice connect timeout — check token / network / proxy'));
        }
      }, 8000);
    });
  }

  private sendSessionUpdate() {
    this.send({
      type: 'session.update',
      session: {
        voice: this.config.voice || 'eve',
        instructions: this.config.instructions || DEFAULT_INSTRUCTIONS,
        turn_detection: { type: 'server_vad' },
        tools: GEAR_X_VOICE_TOOLS,
      },
    });
  }

  /** Mark that the user started sending audio (call when mic chunk leaves device) */
  noteAudioChunkSent(meta?: Record<string, unknown>) {
    this.tracker?.mark('audio_chunk_sent', meta);
  }

  /**
   * Send a base64 audio chunk to Grok.
   * Exact event name may vary by API revision — keep aligned with current docs.
   */
  sendAudioChunk(base64Audio: string) {
    if (!this.connected || !this.ws) return;
    this.noteAudioChunkSent({ bytesApprox: Math.floor((base64Audio.length * 3) / 4) });
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  /** Commit the current audio buffer (end of utterance hint) */
  commitAudio() {
    this.send({ type: 'input_audio_buffer.commit' });
  }

  /** Ask Grok to speak a short text (e.g. Retriever answer) if not using full S2S tools path */
  requestSpokenReply(text: string) {
    this.tracker?.mark('tts_request_sent');
    this.send({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: `Speak this briefly to the user: ${text}`,
      },
    });
  }

  private async handleMessage(raw: string) {
    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    const type: string = event.type || '';

    // Transcripts (names aligned to common realtime event patterns)
    if (
      type.includes('transcript') &&
      (type.includes('delta') || type.includes('partial'))
    ) {
      const text = event.delta || event.transcript || event.text || '';
      if (text) {
        if (!this.tracker?.report().deltas.time_to_first_partial_transcript) {
          this.tracker?.mark('first_partial_transcript');
        }
        this.config.onPartialTranscript?.(String(text));
      }
    }

    if (
      type.includes('transcript') &&
      (type.includes('done') || type.includes('completed') || type.includes('final'))
    ) {
      const text = event.transcript || event.text || event.delta || '';
      this.tracker?.mark('final_transcript');
      if (text) this.config.onFinalTranscript?.(String(text));
    }

    // Audio out
    if (type === 'response.output_audio.delta' || type.includes('output_audio.delta')) {
      const delta = event.delta || '';
      if (delta) {
        const already = this.tracker
          ?.report()
          .marks.some((m) => m.mark === 'first_audio_byte');
        if (!already) this.tracker?.mark('first_audio_byte');
        this.config.onAudioDelta?.(String(delta));
      }
    }

    // Tool calls from Grok → local agents
    if (type.includes('function_call') || type === 'response.function_call_arguments.done') {
      await this.handleToolCall(event);
    }

    if (type === 'error') {
      this.config.onError?.(event.error?.message || JSON.stringify(event));
    }
  }

  private async handleToolCall(event: any) {
    const name = (event.name || event.function_call?.name) as ToolName | undefined;
    let args: Record<string, unknown> = {};
    try {
      const rawArgs = event.arguments || event.function_call?.arguments || '{}';
      args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
    } catch {
      args = {};
    }

    if (!name) return;

    this.config.onStatus?.(`Tool: ${name}`);

    if (name === 'save_insights_from_transcript') {
      this.tracker?.mark('local_router_done');
    }

    const t0 = Date.now();
    const { ok, result } = await executeGearXTool(name, args, this.toolCtx);
    const elapsed = Date.now() - t0;

    if (name === 'save_insights_from_transcript') {
      this.tracker?.mark('local_extractor_done', { ms: elapsed });
      this.tracker?.mark('local_archivist_done');
    }
    if (name === 'search_vault') {
      this.tracker?.mark('local_retriever_done', { ms: elapsed });
    }

    // Return tool result to Grok so it can speak from real vault data
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: event.call_id || event.id,
        output: JSON.stringify({ ok, ...((result as object) || {}) }),
      },
    });
    this.send({ type: 'response.create' });

    if (this.tracker) {
      this.config.onLatencyReport?.(this.tracker.report());
      this.config.onStatus?.(this.tracker.summaryLine());
    }
  }

  private send(payload: object) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect() {
    if (this.tracker) {
      this.tracker.mark('turn_complete');
      this.config.onLatencyReport?.(this.tracker.report());
    }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  getLastLatencySummary() {
    return this.tracker?.summaryLine() || '';
  }
}

/**
 * Example backend contract (implement on your server, not in the app):
 *
 * POST /api/voice/ephemeral-token
 *   Authorization: Bearer <user session>
 *   → { token: string, expires_in: number }
 *
 * Server uses XAI_API_KEY to mint a short-lived credential.
 * Mobile only ever sees the ephemeral token.
 */
export async function fetchEphemeralToken(backendBaseUrl: string, userToken: string) {
  const res = await fetch(`${backendBaseUrl}/api/voice/ephemeral-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`ephemeral-token failed: ${res.status}`);
  return res.json() as Promise<{ token: string; expires_in: number }>;
}
