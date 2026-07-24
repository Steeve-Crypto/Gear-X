# Gear X

**A living mechanical clock that listens, thinks, and evolves.**

Gear X is a mobile-first real-time voice memory system. Open the app and the ornate gears begin to turn like the inside of a clock. The AI listens to conversations around you, extracts insights with a multi-agent system, and physically grows the mechanism — new teeth appear, linkages shift, and the whole apparatus becomes a visual map of your knowledge.

This is the project that makes people say: *"This kid built a thinking clock."*

> Note: Built with Expo (React Native) for mobile. A pure Linux desktop version is possible later with Tauri or Electron + the same agent core.

---

## The 8 Agents

These are **application-level agents** (not Mixture-of-Experts layers inside one model). A central **Router** decides which ones to wake based on the current audio stream and user intent.

| # | Agent | Role |
|---|-------|------|
| 1 | **Router** | The orchestrator. Looks at the current context (listening? new transcript? user query?) and decides which other agents to activate. |
| 2 | **Listener** | Real-time speech-to-text + basic speaker awareness. Turns raw microphone audio into clean text that the rest of the system can use. |
| 3 | **Extractor** | Pulls structured insights out of the transcript: facts, decisions, action items, people, deadlines, open loops. |
| 4 | **Connector** | Links every new insight to existing knowledge. Builds the living graph that makes the system remember across conversations. |
| 5 | **Summarizer** | Compresses long conversations into durable, high-signal notes that stay queryable forever. |
| 6 | **Questioner** | Surfaces clarifying questions and open loops the user might want to close later. |
| 7 | **Visualizer** | Translates knowledge events into gear animations (new teeth, speed changes, new linkages, glow). This is what makes the clock *feel* alive. |
| 8 | **Retriever** | Answers natural-language questions against everything the system has ever heard. |

---

## Current Status

✅ Repository created  
✅ Full 8-agent architecture  
✅ Expo + TypeScript mobile scaffold  
✅ GearClock component (spinning interlocking gears that grow with insights)  
✅ Router agent  
✅ **Listener agent + real microphone wiring** (expo-av)  
✅ Audio service (permissions, start/stop recording)  

**Next:** Extractor + Visualizer so real insights start adding teeth automatically.

---

## Tech Stack

**Mobile**  
Expo (React Native) + TypeScript · React Native Reanimated + SVG · expo-av (microphone) · Zustand · expo-sqlite

**AI (local-first goal)**  
Moonshine / Whisper for STT · Ollama / llama.cpp (Qwen 3.5 or Llama 3.3 8B) · Smart agent routing + token compression

---

**Built by a student who ships.**  
Gear X — the machine that remembers for you.

https://github.com/Steeve-Crypto/Gear-X
