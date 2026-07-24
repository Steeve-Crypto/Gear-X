# Gear X

**A living mechanical clock that listens, thinks, and evolves.**

Open the app → the gears start turning.  
Speak → the agents extract insight.  
Every insight physically grows the mechanism (new teeth, linkages, glow).

This is the project that makes people say: *"This kid built a thinking clock."*

> Mobile-first (Expo). The pure agent core is TypeScript, so a Linux desktop shell (Tauri/Electron) can come later.

---

## Architecture: Solar System Model

**The Sun (central core)**  
- **Router** — the only orchestrator. Looks at context (listening? new speech? user query?) and decides which planetary agents to wake.

**The 8 Planetary Agents**

| # | Agent | Role |
|---|-------|------|
| 1 | **Listener** | Real-time speech-to-text + speaker awareness |
| 2 | **Extractor** | Pulls structured insights (facts, decisions, actions, deadlines, open loops) |
| 3 | **Connector** | Links new insights into the living knowledge graph |
| 4 | **Summarizer** | Compresses long conversations into durable notes |
| 5 | **Questioner** | Surfaces clarifying questions and open loops |
| 6 | **Visualizer** | Turns knowledge events into gear animations (teeth, speed, linkages, glow) |
| 7 | **Retriever** | Answers natural-language questions against everything heard |
| 8 | **Archivist** | Long-term storage, indexing, and persistence |

Router is the Sun. The eight planets do the actual work.

---

## Current Status

✅ Repository + full architecture  
✅ Expo mobile scaffold + GearClock (spinning gears that grow teeth)  
✅ Real microphone wiring (expo-av)  
✅ Listener agent  
✅ **Extractor agent** — produces real Insights from speech  
✅ **Visualizer agent** — converts insights into gear commands  
✅ Live pipeline: speech → Extractor → Visualizer → teeth appear in real time  

**Next planets to fully implement:** Connector, Summarizer, Questioner, Retriever, Archivist.

---

## How the live loop works right now

1. You hit **START LISTENING** → mic opens, gears accelerate + glow  
2. Simulated (and later real) speech arrives  
3. **Listener** cleans it  
4. **Router** decides who wakes  
5. **Extractor** pulls Insights  
6. **Visualizer** issues `add_tooth` / `pulse` / `glow` commands  
7. GearClock reacts → more teeth appear on the gears  

---

**Built by a student who ships.**  
Gear X — the machine that remembers for you.

https://github.com/Steeve-Crypto/Gear-X
