# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

Open the app → the central core and orbiting gears begin to turn.  
Speak → local agents extract insight.  
Every insight physically grows the solar system: more teeth, new orbital bodies, denser rings.

This is the project that makes people say: *"This kid built a thinking clock planet."*

---

## Architecture: Solar System Model

**The Sun (central core)**  
- **Router** — the only orchestrator. Decides which planetary agents wake.

**The 8 Planetary Agents**

| # | Agent | Role |
|---|-------|------|
| 1 | **Listener** | Real-time speech-to-text + speaker awareness |
| 2 | **Extractor** | Pulls structured insights (now powered by local LLM when available) |
| 3 | **Connector** | Links new insights into the living knowledge graph |
| 4 | **Summarizer** | Compresses long conversations into durable notes |
| 5 | **Questioner** | Surfaces clarifying questions and open loops |
| 6 | **Visualizer** | Turns knowledge into clock-planet animations (orbits, teeth, rings) |
| 7 | **Retriever** | Answers natural-language questions against everything heard |
| 8 | **Archivist** | Long-term storage, indexing, and persistence |

---

## Local LLM (Ollama / llama.cpp)

Extractor (and future agents) prefer a local model via Ollama.

**On your machine:**
```bash
ollama serve
ollama pull qwen2.5:3b   # or llama3.2:3b / phi3:mini
```

Default endpoint: `http://localhost:11434`  
When testing on a physical phone, change the base URL in `src/services/llm.ts` to your laptop’s LAN IP (e.g. `http://192.168.1.42:11434`).

If Ollama is unreachable the system automatically falls back to fast rule-based extraction so the demo never breaks.

---

## Current Status

✅ Clock-planet visualization (central core + orbiting gears + rings that grow with insight)  
✅ Real microphone (expo-av)  
✅ Listener + Router  
✅ Extractor with **local LLM** (Ollama) + rule fallback  
✅ Visualizer driving planetary growth stages  
✅ Live pipeline: speech → Extractor → Visualizer → gears/planets evolve  

**Next:** Connector, Archivist (SQLite), Retriever, and tighter LLM prompts.

---

**Built by a student who ships.**  
Gear X — the machine that remembers for you.

https://github.com/Steeve-Crypto/Gear-X
