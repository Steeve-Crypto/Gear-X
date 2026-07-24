# Gear X — Hybrid Latency Benchmarks

Target architecture: **free tier = fully local**, **paid tier = hybrid (Grok Voice ears/mouth + local solar-system brain)**.

All numbers below are engineering targets / expected ranges for a hybrid setup on a modern phone + laptop (or small cloud) backend. Measure on your hardware with `src/services/benchmark.ts`.

---

## 1. End-to-end user-perceived latency

| Path | Free (local) | Paid hybrid (Grok Voice) | Notes |
|------|--------------|---------------------------|-------|
| Speech → first transcript token | 300–1200 ms | **150–500 ms** | Grok streaming STT / speech-to-speech |
| Speech → first insight extracted | 800–3500 ms | 600–2000 ms | Dominated by Extractor LLM |
| Speech → vault archived | +20–80 ms | +20–80 ms | SQLite local write |
| Question → Retriever answer (text) | 400–2500 ms | 400–2500 ms | Local Ollama or rules |
| Question → spoken reply (TTS) | n/a or device TTS | **400–900 ms** | Grok TTS or S2S tail |
| Full turn: user stops speaking → agent starts speaking | n/a | **700–1800 ms** | Hybrid sweet spot |

Grok Voice marketing target is sub-second reasoning on the pure voice path. Hybrid adds one network hop + local agent work, so budget ~0.7–1.8 s for a natural full turn.

---

## 2. Stage-by-stage breakdown (hybrid)

```
Mic → [Grok STT / S2S] → Router → Extractor → Weaver → Archivist → Visualizer
                              ↳ Summarizer / Questioner (every 5 insights)
User question → Retriever → [optional Grok TTS]
```

| Stage | Expected latency | Runs on | Can parallelize? |
|-------|------------------|---------|------------------|
| Audio capture + upload | 20–80 ms | Device | — |
| Grok streaming STT (partial) | 150–400 ms to first partial | xAI | Yes |
| Router decision | <5 ms | Local | — |
| Extractor (local 3B) | 400–2000 ms | Ollama / device | After transcript stable |
| Extractor (rules fallback) | 5–30 ms | Local | — |
| Weaver | 5–40 ms | Local | Yes |
| Archivist (SQLite) | 10–60 ms | Local | Yes |
| Visualizer command gen | <5 ms | Local | Yes |
| Summarizer (local 3B) | 500–2500 ms | Ollama | Background |
| Questioner (local 3B) | 400–1800 ms | Ollama | Background |
| Retriever search + synth | 50–2000 ms | Local / Ollama | — |
| Grok TTS (short answer) | 200–600 ms to first audio | xAI | After text ready |

**Critical path for live listening:**  
Grok STT partial → Router → Extractor → Archivist → Visualizer update.

**Critical path for spoken Q&A:**  
User speech end → Grok STT final → Retriever → Grok TTS first byte.

---

## 3. Design targets for the paid hybrid product

| Metric | Target | Stretch |
|--------|--------|---------|
| Time to first partial transcript | < 400 ms | < 250 ms |
| Time to first gear/tooth update after speech | < 1.5 s | < 900 ms |
| Time to spoken answer (short query) | < 1.5 s | < 1.0 s |
| Local agent p95 (Extractor 3B) | < 2.0 s | < 1.2 s |
| SQLite archive p99 | < 100 ms | < 40 ms |
| Offline capability | Full (rules + local LLM) | Same |

---

## 4. What actually moves the needle

1. **Stream early** — feed partial transcripts to Router/Extractor instead of waiting for final STT.  
2. **Keep brain local** — only send audio + final short answers to Grok Voice; heavy multi-agent work stays on-device or on user’s Ollama box.  
3. **Background the expensive planets** — Summarizer + Questioner must never block the listening loop.  
4. **Rules fallback under 50 ms** — if Ollama is cold or offline, Extractor/Retriever still respond instantly.  
5. **Measure on device** — desktop numbers lie; always benchmark on the target phone + network.

---

## 5. How to measure

Use the helper in `src/services/benchmark.ts`:

```ts
import { runLocalPipelineBenchmark } from './src/services/benchmark';

const report = await runLocalPipelineBenchmark({
  transcript: 'We need to finish the proposal by Friday...',
  iterations: 5,
});
console.log(report);
```

It times Router → Extractor → Weaver → Archivist → Visualizer (and optionally Summarizer / Questioner / Retriever) and returns min / mean / p95 per stage.

For Grok Voice legs, log timestamps around:
- audio chunk send
- first partial transcript event
- final transcript
- TTS first audio byte

---

## 6. Cost vs latency note (paid)

Grok Voice speech-to-speech is priced around **$0.05 / min**. Hybrid keeps most minutes of *thinking* local, so you only pay for the voice pipe. That is the main reason hybrid beats “everything in the cloud” on both cost and privacy while still feeling fast.
