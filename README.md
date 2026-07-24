# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

Speak → agents extract insight → SQLite remembers → Summarizer compresses → you can ask the vault anything.

---

## Solar System Model

**The Sun**  
- **Router** — central orchestrator

**The 8 Planetary Agents**

| # | Agent | Role |
|---|-------|------|
| 1 | **Listener** | Real-time STT + speaker awareness |
| 2 | **Extractor** | Structured insights (local LLM + rules) |
| 3 | **Weaver** | Narrative threads from insights |
| 4 | **Summarizer** | Durable high-signal notes *(now live)* |
| 5 | **Questioner** | Open loops & clarifying questions |
| 6 | **Visualizer** | Clock-planet animations |
| 7 | **Retriever** | Natural-language Q&A against the vault |
| 8 | **Archivist** | SQLite persistence & restore |

---

## Summarizer (now live)

- Compresses the current insight set into a titled, durable note
- Prefers local Ollama; falls back to structured rule-based summary
- Saved in SQLite `summaries` table
- Auto-runs every 5 insights and when you stop listening
- Manual **SUMMARIZE** button in the UI
- Latest summary restored on app launch

---

## Current Status

✅ Clock-planet visualization  
✅ Microphone + Listener  
✅ Extractor (LLM + rules)  
✅ Visualizer  
✅ Archivist + SQLite  
✅ Retriever  
✅ Weaver  
✅ **Summarizer**  

**Last stub:** Questioner

---

https://github.com/Steeve-Crypto/Gear-X
