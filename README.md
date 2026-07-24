# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

Open the app → the central core and orbiting gears begin to turn.  
Speak → local agents extract insight.  
Every insight is persisted in SQLite and physically grows the solar system.

---

## Architecture: Solar System Model

**The Sun**  
- **Router** — central orchestrator

**The 8 Planetary Agents**

| # | Agent | Role |
|---|-------|------|
| 1 | **Listener** | Real-time STT + speaker awareness |
| 2 | **Extractor** | Structured insights (local LLM + rules fallback) |
| 3 | **Connector** | Knowledge graph linking |
| 4 | **Summarizer** | Durable conversation notes |
| 5 | **Questioner** | Open loops & clarifying questions |
| 6 | **Visualizer** | Clock-planet animations (orbits, teeth, rings) |
| 7 | **Retriever** | Natural-language Q&A over the vault |
| 8 | **Archivist** | **SQLite persistence** — long-term storage & restore |

---

## SQLite Archivist (now live)

- Database: `gearx.db` (expo-sqlite)
- Tables: `insights` + `knowledge_events`
- On launch: automatically restores every previously saved insight
- After every extraction: Archivist upserts new insights into the vault
- Survives app restarts — the clock-planet remembers

---

## Local LLM

Extractor prefers Ollama:
```bash
ollama serve
ollama pull qwen2.5:3b
```
Default: `http://localhost:11434`  
(Change to your laptop IP when testing on a physical phone.)

---

## Current Status

✅ Clock-planet visualization  
✅ Microphone + Listener  
✅ Extractor (LLM + rules)  
✅ Visualizer  
✅ **Archivist + SQLite** (persist + restore on launch)  
✅ Live pipeline: speech → extract → archive → gears grow  

**Next:** Connector, Retriever, Summarizer, Questioner.

---

**Built by a student who ships.**  
https://github.com/Steeve-Crypto/Gear-X
