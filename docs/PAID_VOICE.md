# Gear X Paid Tier — Grok Voice Hybrid

Free tier stays fully local (mic + Ollama + SQLite).  
Paid tier adds **Grok Voice** as ears and mouth. The solar-system agents remain the brain.

```
Phone mic
   ↓
Grok Voice WebSocket  (speech-to-speech / STT + TTS)
   ↓ tool calls
Local agents: Extractor · Weaver · Archivist · Retriever · Summarizer · Questioner
   ↓
SQLite vault + clock-planet UI
   ↓ optional spoken reply
Grok Voice audio deltas
```

---

## Files

| Path | Role |
|------|------|
| `src/paid/grokVoiceClient.ts` | WebSocket client stub + session + tool bridge |
| `src/paid/tools.ts` | Tool schemas + local agent execution |
| `src/paid/latencyTracker.ts` | Marks vs `docs/LATENCY.md` budgets |
| `src/paid/index.ts` | Public exports |

---

## Security

- **Never** ship `XAI_API_KEY` inside the mobile app.
- Backend mints an **ephemeral token**:

```http
POST /api/voice/ephemeral-token
Authorization: Bearer <user session>
→ { "token": "...", "expires_in": 60 }
```

- Client connects with that token only.

Realtime endpoint:

```
wss://api.x.ai/v1/realtime?model=grok-voice-latest
Authorization: Bearer <ephemeral token>
```

---

## Latency marks (logged every turn)

| Mark | Meaning |
|------|---------|
| `audio_chunk_sent` | Mic chunk left the device |
| `first_partial_transcript` | First STT partial from Grok |
| `final_transcript` | Utterance committed |
| `local_extractor_done` | Local Extractor finished |
| `local_archivist_done` | Insight in SQLite (gear can update) |
| `local_retriever_done` | Vault answer ready |
| `first_audio_byte` | First TTS / S2S audio delta |
| `turn_complete` | Session/turn closed |

Budgets (from `docs/LATENCY.md`):

| Metric | Target | Stretch |
|--------|--------|---------|
| Time to first partial transcript | 400 ms | 250 ms |
| Time to first gear update | 1500 ms | 900 ms |
| Time to spoken answer | 1500 ms | 1000 ms |

`LatencyTracker.report()` returns `pass` / `stretch` / `miss` per metric.

---

## Minimal usage (paid path)

```ts
import { GrokVoiceClient, fetchEphemeralToken } from './src/paid';

const { token } = await fetchEphemeralToken('https://your-api.com', userJwt);

const client = new GrokVoiceClient(
  {
    ephemeralToken: token,
    voice: 'eve',
    onPartialTranscript: (t) => setStatus(t),
    onFinalTranscript: (t) => runLocalSideEffects(t),
    onAudioDelta: (b64) => playPcm(b64),
    onLatencyReport: (r) => console.log(r.budgetChecks),
    onStatus: setStatusText,
  },
  insightsRef
);

await client.connect();
// stream mic chunks:
client.sendAudioChunk(base64Pcm);
client.commitAudio();
```

Wire `onLatencyReport` into your debug UI so you can see live budget hits during demos.

---

## Event names

Realtime event names evolve. The stub matches current xAI patterns (`session.update`, `input_audio_buffer.append`, `response.output_audio.delta`, function-call output). Align with the latest [Voice docs](https://docs.x.ai/developers/model-capabilities/audio/voice) when you go to production.

---

## Cost note

Speech-to-speech is metered (~$0.05/min). Hybrid keeps multi-agent thinking local so you only pay for the voice pipe, not for every Summarizer/Questioner token in the cloud.
