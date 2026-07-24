# Troubleshooting

## Ollama unavailable

Start Ollama, pull the configured model, and use Settings → Inference → Test connection. A physical phone cannot reach the development computer through `localhost`; use the computer’s LAN address and ensure the firewall allows the port.

## Recording works but no transcript appears

This is expected until a compatible transcription provider is configured. Expo AV records audio but does not perform speech-to-text. The default device adapter reports this limitation and leaves the failed session recoverable.

## Microphone denied

Enable microphone access in device settings, then return to Orbit and start a new session.

## Database migration error

Do not delete the database automatically. Open Diagnostics, record the database version/error, export data if available, and inspect the migration. Migrations are forward-only and transactional.

## npm or lint dependency errors

Use Node 20/22 LTS, remove no user data, and run a clean `npm install`. If the package manager is resolving a broken global npm shim, invoke the npm bundled with the active Node installation.

## Expo cannot resolve routes

Confirm `package.json` uses `"main": "expo-router/entry"`, the router plugin remains in `app.json`, and route filenames under `app/` are unchanged.
