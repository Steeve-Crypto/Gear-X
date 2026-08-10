# AI Runtime

## Purpose
Give ordinary iOS and Android users a useful Gear X without Ollama, a laptop, a LAN address, an API key, or developer tools, while retaining optional higher-quality providers.

## Scope
Transcription, structured extraction, summarization, question generation, answer synthesis, retrieval, provider selection, fallback, consent, availability, and usage limits.

## Non-goals
Bundling a general-purpose LLM in this milestone, uploading the full vault, making xAI Realtime Voice the recorder, or claiming every device supports offline speech recognition.

## User stories
- A consumer can record and process speech using device capabilities or an explicitly enabled Gear X cloud fallback.
- A privacy-sensitive user can prohibit all remote processing and still use deterministic intelligence and local retrieval.
- A quality-focused user can opt into stronger remote transcription and text inference.
- A developer can use Ollama or a custom endpoint without exposing those controls as consumer requirements.

## Decision
Use a capability router rather than a single application-wide AI provider.

1. **Transcription:** prefer native Apple Speech or Android SpeechRecognizer through `expo-speech-recognition`; use recorded-file input where the OS supports it. Private mode never falls back remotely. Balanced mode may use the Gear X backend only after consent and when configured. Quality mode prefers that backend. Developer mode can use a local Whisper server.
2. **Knowledge intelligence:** keep the existing deterministic Extractor, Weaver, Summarizer, and Questioner paths as the universal baseline. Optional device or remote text providers refine individual tasks. Router, Listener, Visualizer, Retriever, and Archivist do not require an LLM.
3. **Retrieval:** search the local SQLite vault first with an FTS5 index when the platform SQLite build supports it and an indexed lexical fallback otherwise. Send only selected evidence to an optional synthesis provider. SQLite remains the durable source of truth.
4. **Consumer cloud:** the app talks only to a Gear X backend with a short-lived session credential. Provider secrets remain server-side. Remote audio or evidence requires persisted consent and a visible state.
5. **Developer providers:** Ollama, local Whisper, self-hosted OpenAI-compatible endpoints, and future bring-your-own-provider integrations remain optional developer capabilities.

The first production configuration is native OS transcription plus deterministic local intelligence and retrieval. It has the smallest download and memory impact. A deployed Gear X backend is required for reliable fallback on devices whose speech service lacks recorded-file or on-device support.

## Option evaluation

Ratings are relative to this Expo/React Native application. Model sizes vary by locale/model, so ranges are deliberately qualitative rather than invented precision.

| Option | Platforms / Expo and native work | Offline, size, memory, thermal, latency | Privacy / cost | Difficulty, store risk, device reliability | Decision |
| --- | --- | --- | --- | --- | --- |
| Apple Speech | iOS; custom native development build via speech-recognition config plugin | On-device only when the installed locale/device supports it; no app-bundled model; low app memory and usually low latency | Audio stays on-device only when on-device recognition is required and available; no provider bill | Medium integration; standard permission review; availability varies by locale/OS | Primary iOS transcription capability with runtime checks |
| Android SpeechRecognizer | Android; native module/config plugin; recorded-file input requires Android 13+ in the chosen bridge | On-device service available from API 31 and language pack may need download; no bundled model; low app memory | Local only when on-device recognizer is explicitly selected; no provider bill | Medium; OEM/service and locale variability; normal microphone permission risk | Primary Android capability with runtime checks, never assumed |
| whisper.cpp / whisper.rn | iOS and Android; custom native build and model lifecycle | Fully offline; roughly tens of MB to multiple GB by model; material RAM, battery, heat, and slower older devices | Strong privacy, no per-call fee | High integration and QA; larger download; uneven device performance | Future optional offline pack, not first release default |
| Apple Foundation Models | Newer Apple Intelligence-capable devices; Swift native bridge | On-device model managed by OS; no bundled model; low network latency but device availability constrained | Local and no app provider bill | High cross-platform asymmetry; OS/device/Apple Intelligence state limits reliability | Future refinement provider, never a baseline dependency |
| Gemini Nano / ML Kit GenAI | Supported Android devices through AICore; Kotlin native bridge | On-device and OS-managed; availability and feature limits vary | Local and no per-call provider bill | High device fragmentation and platform asymmetry | Future Android refinement provider |
| Small bundled local LLM | Both platforms through a native runtime | Offline; hundreds of MB or more, high RAM and thermal cost, variable latency | Strong privacy and no per-call fee | High model licensing, download, lifecycle, and low-end-device risk | Not a default; reconsider as optional pack |
| ONNX Runtime Mobile | iOS/Android; Objective-C/C++/Java bridge and converted model | Offline; runtime can be reduced but model still must fit RAM/storage; acceleration is model/device specific | Local and no per-call fee | High export and per-device performance validation burden | Runtime candidate for focused models, not integrated now |
| ExecuTorch | iOS/Android native Swift/Java/C++ APIs | Offline; model-dependent size and memory; XNNPACK/Core ML acceleration available | Local and no per-call fee | High export, native integration, and broad-device validation effort | Candidate for a later focused model |
| xAI speech-to-text | Both through Gear X backend; no direct client secret | Online; no model download; network latency | Audio leaves device after consent; usage-based server cost | Backend, auth, rate limits, outage handling, and disclosures required | Preferred optional cloud transcription adapter behind backend |
| Grok text inference | Both through Gear X backend | Online; no device memory impact; network latency | Minimal selected evidence leaves device after consent; usage-based cost | Structured validation and outage handling required | Optional cloud refinement/synthesis, never Router logic |
| Self-hosted OpenAI-compatible | Both through backend or Developer endpoint | Online/LAN; server carries model cost | Deployment-dependent privacy and operating cost | Operationally complex; reliability belongs to operator | Supported by a generic future adapter, not consumer default |
| Ollama / desktop companion | Both as LAN client; ordinary user needs another computer | Local network; model size/RAM/thermal moved to desktop | No hosted call fee; transcript/evidence crosses LAN | Easy developer path but poor mobile onboarding and localhost is the phone | Developer mode only |
| Bring your own provider | Both through a secure backend account/token exchange | Provider-dependent | User/provider-dependent cost and privacy | Credential storage, schema variance, support, and store disclosure complexity | Interface-ready, deferred until secure credential UX exists |

Primary references: [Apple Speech recorded buffers and files](https://developer.apple.com/documentation/speech/sfspeechaudiobufferrecognitionrequest), [Apple Foundation Models](https://developer.apple.com/documentation/FoundationModels), [Android SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer.html), [Android Gemini Nano](https://developer.android.com/ai/gemini-nano), [expo-speech-recognition recorded audio](https://github.com/jamsch/expo-speech-recognition), [whisper.rn](https://github.com/mybigday/whisper.rn), [whisper.cpp](https://github.com/ggml-org/whisper.cpp), [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/), [ExecuTorch mobile](https://docs.pytorch.org/executorch/stable/getting-started.html), [xAI speech-to-text](https://docs.x.ai/developers/rest-api-reference/inference/speech-to-text), [xAI text generation](https://docs.x.ai/developers/model-capabilities/text/generate-text), [vLLM OpenAI-compatible server](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/), and [Ollama API](https://docs.ollama.com/api/introduction).

## Functional requirements
- Resolve providers per capability: transcription, structured extraction, relationship refinement, summarization, question refinement, and answer synthesis.
- Modes are Private, Balanced, Quality, and Developer.
- Private uses only local providers and deterministic fallbacks.
- Balanced prefers local transcription/retrieval and permits consented cloud fallback.
- Quality prefers consented cloud transcription and intelligence, then falls back locally.
- Developer enables Ollama and custom local endpoints.
- Provider fallback is ordered, bounded, abortable, and records availability/failure without transcript or prompt content.
- Existing deterministic agent paths must remain functional when no text model is available.
- Retrieval always executes locally before optional synthesis and exposes its evidence.
- Remote processing has separate feature toggles, a daily request ceiling, and no automatic retry after budget exhaustion.

## Technical requirements
- Provider metadata declares capabilities, locality, configuration, availability, and estimated cost class.
- Agent requests declare a capability; the router cannot infer one provider for every task.
- Native speech integration requires a development/store build; Expo Go is an unsupported runtime for that provider.
- Backend transcription uploads the actual audio file as multipart data, never a device-local URI in JSON.
- Backend inference sends only the prompt and locally selected evidence needed for the operation.
- Long-lived xAI or other cloud keys cannot exist in Expo public configuration, source, or the mobile bundle.
- Legacy `local` and `remote` mode values migrate safely to Private and Quality.

## Failure states
Unsupported device speech, missing language pack, denied permissions, unsupported recorded-audio format, native module absent, no network, timeout, cancellation, malformed provider output, missing consent, missing backend session, exhausted usage limit, missing Ollama model, and all providers unavailable.

Each failure preserves the recorded session when retention allows it, identifies the unavailable capability, and leaves deterministic/local features usable. No fallback may silently cross the local/remote boundary.

## Privacy implications
Private mode transmits nothing. Balanced and Quality disclose remote processing and require persisted consent before audio or evidence leaves the device. The entire vault is never uploaded. Provider diagnostics store identifiers, timing, status, and error codes—not transcript, prompt, response, token, or audio content. SQLite remains plaintext within the app sandbox until a separate encryption milestone is implemented.

## Acceptance criteria
- Normal defaults never instantiate or probe Ollama.
- Every agent has a working deterministic/local path; optional model calls are task-scoped.
- Supported native devices can transcribe a real recording through the OS bridge.
- Remote fallback is consent-gated, uploads actual audio, and requires no provider key in the client.
- Local retrieval returns evidence without a model or network.
- Selection, availability, fallback, cancellation, timeout, malformed output, consent, mode migration, and budget behavior are tested.
- Settings show modes and provider availability without making developer endpoints a consumer prerequisite.

## Dependencies
Expo custom development/store builds, `expo-speech-recognition`, platform speech services, SQLite repositories, agent runtime, privacy settings, and an optional deployed Gear X backend.

## Open implementation decisions
- Production Gear X backend URL, authentication/session-attestation design, xAI model selection, service budget, and retention policy.
- Whether to ship an optional whisper.cpp model pack after physical-device memory, heat, speed, size, and accuracy tests.
- Apple Foundation Models and Gemini Nano bridges after supported-device coverage justifies their maintenance cost.
- Compact local embedding model selection; FTS5 plus deterministic local ranking is the release baseline until semantic retrieval is benchmarked.

## Verification
Run provider and routing unit tests, mode migration and privacy tests, secret scan, `npm run validate`, Android development-build recording/transcription tests across API 31/33/current, and iOS device recording/transcription tests across supported and unsupported on-device locales. Record unavailable physical checks in `specs/release-readiness.md` and `RELEASE_STATUS.md`.
