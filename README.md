# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

All 8 planetary agents are online.

Speak → extract → weave → archive → summarize → surface questions → ask the vault.

---

## Solar System Model

**The Sun**  
- **Router** — central orchestrator

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

## Questioner (now live)

- Surfaces clarifying questions and unresolved open loops
- Prefers local Ollama; rule-based fallback
- Auto-runs every 5 insights and when listening stops
- Manual **QUESTION** button in the UI
- Emits `question_surfaced` events into the knowledge log

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
