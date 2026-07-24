# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

All 8 planetary agents are online.

Speak → extract → weave → archive → summarize → surface questions → ask the vault.

---

## Solar System Model

**The Sun**  
- **Router** — central orchestrator. Inspects context and decides which planets wake. Does not extract, store, or speak itself.

**The 8 Planetary Agents (complete)**

| # | Agent | Role | Status |
|---|-------|------|--------|
| 1 | **Listener** | Real-time STT + speaker awareness | ✅ |
| 2 | **Extractor** | Structured insights (local LLM + rules) | ✅ |
| 3 | **Weaver** | Narrative threads from insights | ✅ |
| 4 | **Summarizer** | Durable high-signal notes | ✅ |
| 5 | **Questioner** | Open loops & clarifying questions | ✅ |
| 6 | **Visualizer** | Clock-planet animations | ✅ |
| 7 | **Retriever** | Natural-language Q&A against the vault | ✅ |
| 8 | **Archivist** | SQLite persistence & restore | ✅ |

---

## Hybrid latency (free local vs paid Grok Voice)

| Path | Free (local) | Paid hybrid |
|------|--------------|-------------|
| Speech → first transcript | 300–1200 ms | **150–500 ms** |
| Speech → first insight + gear update | 800–3500 ms | 600–2000 ms |
| Short question → spoken answer | device TTS / n/a | **700–1800 ms** |

Full tables: **[docs/LATENCY.md](docs/LATENCY.md)**  
Local brain timer: `src/services/benchmark.ts`  
Paid hybrid client + live budget tracker: **[docs/PAID_VOICE.md](docs/PAID_VOICE.md)** · `src/paid/`

---

## Paid tier (stub ready)

Grok Voice = ears + mouth. Local agents = brain + vault.

```
src/paid/
  grokVoiceClient.ts   # WebSocket session, audio, tool bridge
  tools.ts             # save / search / summarize / question → local agents
  latencyTracker.ts    # pass / stretch / miss vs latency budgets
```

Requires backend ephemeral tokens — never put `XAI_API_KEY` in the app.

---

## UI Controls

- **START / STOP LISTENING** — mic + full pipeline
- **SUMMARIZE** — force Summarizer
- **QUESTION** — force Questioner
- **ASK** — Retriever query against the vault

---

## Local LLM

```bash
ollama serve
ollama pull qwen2.5:3b
```

Default: `http://localhost:11434`  
(Change to your laptop IP when testing on a physical phone.)

---

**Built by a student who ships.**  
https://github.com/Steeve-Crypto/Gear-X
