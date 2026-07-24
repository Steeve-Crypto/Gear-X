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

Full tables, stage budgets, and measurement notes: **[docs/LATENCY.md](docs/LATENCY.md)**  
Local brain timing helper: `src/services/benchmark.ts`

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
