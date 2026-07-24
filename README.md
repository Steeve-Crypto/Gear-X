# Gear X

**A living mechanical clock that listens, thinks, and evolves.**

Gear X is a mobile-first real-time voice memory system. Open the app and the ornate gears begin to turn like the inside of a clock. The AI listens to conversations around you, extracts insights with a multi-agent system, and physically grows the mechanism — new teeth appear, linkages shift, and the whole apparatus becomes a visual map of your knowledge.

This is the project that makes people say: *"This kid built a thinking clock."*

---

## Core Concept

- **Hero UI**: A single, beautiful, spinning multi-gear mechanism (clock-style) that is the entire interface.
- **Always Listening**: Real-time audio capture → transcription → multi-agent processing.
- **Living Knowledge**: Every insight adds a tooth, shifts a gear ratio, or creates a new linkage in the visualization.
- **Query the Machine**: Ask questions and the gears respond with the exact context from past conversations.

---

## The 8 Agents (Multi-Agent System)

These are **application-level agents**, not Mixture-of-Experts layers. A central Router decides which agents to wake based on the current audio stream and user intent.

| # | Agent | Responsibility |
|---|-------|----------------|
| 1 | **Router** | Orchestrator. Decides which agents activate for every audio chunk or query. |
| 2 | **Listener** | Real-time STT + speaker diarization. Streams clean text to the system. |
| 3 | **Extractor** | Pulls structured insights: facts, decisions, action items, entities, deadlines. |
| 4 | **Connector** | Links new insights to existing knowledge. Builds the living graph. |
| 5 | **Summarizer** | Compresses long conversations into durable, queryable notes. |
| 6 | **Questioner** | Surfaces clarifying questions or open loops the user might want to close. |
| 7 | **Visualizer** | Translates knowledge events into gear animations (new teeth, speed changes, new linkages). |
| 8 | **Retriever** | Answers natural language questions against the entire knowledge store. |

The spinning gear visualization is driven live by the **Visualizer** agent.

---

## Tech Stack (MVP → Production)

### Mobile Frontend
- **Expo (React Native)** + TypeScript
- **React Native Reanimated** + **Skia** or SVG for the gear system
- **Expo AV** / react-native-live-audio-stream for microphone
- **Zustand** or Jotai for state
- **SQLite** (expo-sqlite) for local knowledge store

### AI Layer (Local-first)
- **Speech-to-Text**: Moonshine (edge) or Whisper.cpp / faster-whisper
- **LLM**: Ollama / llama.cpp with quantized Qwen3.5 or Llama 3.3 8B
- **Token Optimization**: LLMLingua-style compression + smart routing between agents
- **Multi-agent orchestration**: Custom router that only activates the needed agents per turn

### Later
- On-device embeddings for retrieval
- Background listening mode (with clear privacy controls)
- Export to Obsidian / Markdown

---

## Project Goals (for recognition & resume)

- Ship a working mobile prototype that listens, extracts, and visually evolves the gears in real time.
- Measurable metrics: conversations processed, insights extracted, gear complexity growth, query accuracy.
- Open source the core so people can fork and build on the "thinking clock" idea.

---

## Current Status

Repository just created. Architecture locked. Building the Expo scaffold and the first spinning gear next.

---

**Built by a student who ships.**  
Gear X — the machine that remembers for you.
