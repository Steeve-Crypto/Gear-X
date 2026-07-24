# Gear X

**A living mechanical clock-planet that listens, thinks, and evolves.**

Multi-agent mobile application: real-time listening, insight extraction, persistent knowledge vault, and interactive visualization.

---

## Architecture

**Router (orchestrator)**  
Inspects context and activates the appropriate agents. Does not extract, store, or synthesize content itself.

**Agents**

| # | Agent | Role |
|---|-------|------|
| 1 | **Listener** | Real-time audio capture and speech input |
| 2 | **Extractor** | Structured insight extraction (local LLM + rules) |
| 3 | **Weaver** | Narrative threads across insights |
| 4 | **Summarizer** | Durable high-signal notes |
| 5 | **Questioner** | Open loops and clarifying questions |
| 6 | **Visualizer** | Clock-planet UI updates |
| 7 | **Retriever** | Natural-language queries against the vault |
| 8 | **Archivist** | SQLite persistence and restore |

---

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Client | Expo / React Native | Cross-platform mobile (iOS + Android) from one codebase |
| Language | TypeScript | Shared types across agents, UI, and services; safer refactors |
| Local inference | Ollama | Offline-capable agent reasoning |
| Persistence | expo-sqlite | On-device knowledge vault |
| Paid voice (optional) | Grok Voice API | Speech-to-speech upgrade path |

This is a mobile app. TypeScript here is the application language for the Expo client and agent runtime, not a substitute for a native-only project.

---

## Hybrid latency

| Path | Local | Paid hybrid (Grok Voice) |
|------|-------|---------------------------|
| Speech → first transcript | 300–1200 ms | 150–500 ms |
| Speech → insight + UI update | 800–3500 ms | 600–2000 ms |
| Short question → spoken answer | device TTS / n/a | 700–1800 ms |

Details: [docs/LATENCY.md](docs/LATENCY.md) · Paid voice: [docs/PAID_VOICE.md](docs/PAID_VOICE.md)

---

## Setup

```bash
npm install
npx expo start
```

Local LLM (optional but recommended):

```bash
ollama serve
ollama pull qwen2.5:3b
```

Default Ollama endpoint: `http://localhost:11434`  
On a physical device, point the client at your machine's LAN IP.

---

## Repository

https://github.com/Steeve-Crypto/Gear-X
