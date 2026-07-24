# Architecture

Expo Router composes screens from reusable components. Screen modules own presentation state and call application services or repositories; they never issue SQL or provider-specific requests.

The capture flow is:

```text
Orbit → capture service → audio recording → persistent session
      → configured transcription adapter → transcript segments
      → Router decision → ordered agent runtime
      → Extractor → Weaver/Archivist/Questioner/Summarizer
      → repositories → SQLite
```

AgentRuntime orders declared dependencies, deduplicates an idempotency group, limits each run with a timeout, accepts cancellation, stops a failed pipeline, and emits events. Agent and provider runs are recorded without prompt/transcript content.

SQLite uses forward migrations through `schema_migrations`. Legacy prototype insight/summary columns remain compatible while normalized session, transcript, thread, question, run, and provider tables support the beta.

Zustand contains only current-session and settings UI state. SQLite remains the durable source of truth.
