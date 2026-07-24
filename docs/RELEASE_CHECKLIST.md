# Beta Release Checklist

- [ ] Clean `npm install` succeeds on Node 20/22 LTS.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run validate` passes.
- [ ] Expo starts without route/config errors.
- [ ] Android physical-device microphone and audio recording pass.
- [ ] iOS simulator or physical-device navigation and permissions pass.
- [ ] SQLite survives process restart.
- [ ] Interrupted recording and app resume are verified.
- [ ] Reduced motion and low-performance mode are verified.
- [ ] Ollama reachable and unreachable states are verified.
- [ ] Remote consent denial is verified.
- [ ] Export content and delete-all behavior are verified.
- [ ] No simulated transcript exists in production paths.
- [ ] Secret scan is clean.
- [ ] Store disclosures state that local SQLite is not application-level encrypted.
- [ ] Native transcription or secure backend transcription is selected and device-tested.
