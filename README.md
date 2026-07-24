# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

Speak → agents extract insight → SQLite remembers forever → you can ask the vault anything.

---

## Solar System Model

**The Sun**  
- **Router** — central orchestrator

**The 8 Planetary Agents**

| # | Agent | Role |
|---|-------|------|
| 1 | **Listener** | Real-time STT + speaker awareness |
| 2 | **Extractor** | Structured insights (local LLM + rules) |
| 3 | **Weaver** | Weaves insights into narrative threads *(replaced old Connector)* |
| 4 | **Summarizer** | Durable conversation notes |
| 5 | **Questioner** | Open loops & clarifying questions |
| 6 | **Visualizer** | Clock-planet animations |
| 7 | **Retriever** | Natural-language Q&A against the vault |
| 8 | **Archivist** | SQLite persistence & restore |

---

## Retriever (now live)

- Search bar in the UI: type a question → hit **ASK**
- Pulls matching insights from SQLite
- Optionally synthesizes a clean answer with local Ollama
- Falls back to a readable list of matches if the LLM is offline

---

## Weaver (new planet)

Replaces the old Connector.  
Instead of just linking IDs, it groups insights into thematic and chronological **threads** the system can reason over later.

---

## Current Status

✅ Clock-planet visualization  
✅ Microphone + Listener  
✅ Extractor (LLM + rules)  
✅ Visualizer  
✅ Archivist + SQLite  
✅ **Retriever** (ask the vault)  
✅ **Weaver** (narrative threads)  

**Still stubs:** Summarizer, Questioner

---

https://github.com/Steeve-Crypto/Gear-X
