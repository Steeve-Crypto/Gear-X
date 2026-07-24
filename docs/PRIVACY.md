# Privacy

Gear X processes personal speech and derived knowledge.

## Stored locally

Sessions, transcript segments, insights, summaries, questions, threads, settings, and diagnostic run metadata are stored in `gearx.db` inside the application sandbox. The app does not currently provide SQLCipher or application-level encryption. Do not describe this database as end-to-end encrypted.

Recording URIs are retained in the session record only when recording retention is enabled. Platform cache cleanup is separate and depends on Expo/device behavior.

## Remote processing

Remote processing is off by default. Remote adapters must check persisted consent before sending data. Grok Voice additionally requires an ephemeral credential issued by a secure backend; long-lived API keys must never enter the mobile binary, source, or client environment.

## Logging

Production paths should log error codes, provider IDs, durations, and run status—not transcript, prompts, response bodies, access tokens, or exported knowledge.

## User controls

Privacy settings expose remote consent, recording retention, selectable JSON export, and delete-all. Session/insight deletion uses SQLite foreign-key behavior. Exported JSON is plaintext after it leaves the app sandbox.

## Upgrade path

Before a broader production release, evaluate SQLCipher or platform-key-wrapped encryption, secure file export, biometric confirmation for destructive/export actions, and a privacy-reviewed crash reporter with redaction.
