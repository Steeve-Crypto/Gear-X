/**
 * Gear X paid hybrid layer
 * Grok Voice = ears + mouth
 * Local 8 planets = brain + vault
 */

export { GrokVoiceClient, fetchEphemeralToken } from './grokVoiceClient';
export { LatencyTracker, BUDGETS_MS } from './latencyTracker';
export type { TurnReport, LatencyMark } from './latencyTracker';
export { GEAR_X_VOICE_TOOLS, executeGearXTool } from './tools';
export type { ToolName, ToolContext } from './tools';
