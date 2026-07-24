import { Agent, AgentContext, AgentResult, VisualizerCommand } from './types';

/**
 * Visualizer Agent — Clock Planet edition
 * Translates knowledge growth into orbital / planetary gear commands.
 * More insights = more planets, denser teeth, stronger rings, faster orbits.
 */
export const visualizerAgent: Agent = {
  id: 'visualizer',
  name: 'Visualizer',
  description: 'Turns knowledge events into clock-planet animations (orbits, teeth, rings, glow).',
  continuous: true,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const commands: VisualizerCommand[] = [];
    const count = ctx.currentInsights.length;

    // Listening state
    if (ctx.isListening) {
      commands.push({ action: 'glow', intensity: 0.7 });
      commands.push({ action: 'change_speed', intensity: 1.4 });
    } else {
      commands.push({ action: 'change_speed', intensity: 0.25 });
    }

    // Core always gains teeth
    if (count > 0) {
      commands.push({
        action: 'add_tooth',
        gearIndex: 0, // central sun/core
        intensity: Math.min(count, 18),
      });
    }

    // Planetary growth stages
    if (count >= 1) {
      commands.push({ action: 'add_tooth', gearIndex: 1, intensity: Math.floor(count / 2) });
    }
    if (count >= 2) {
      commands.push({ action: 'add_linkage', intensity: 0.6 }); // rings appear
    }
    if (count >= 3) {
      commands.push({ action: 'add_tooth', gearIndex: 2, intensity: Math.floor(count / 3) });
    }
    if (count >= 4) {
      commands.push({ action: 'add_tooth', gearIndex: 3, intensity: Math.floor(count / 2) }); // 4th planet appears
    }
    if (count >= 6) {
      commands.push({ action: 'add_linkage', intensity: 0.9 }); // outer ring
      commands.push({ action: 'pulse', intensity: 1.0 });
    }

    return {
      agentId: 'visualizer',
      success: true,
      data: { commands, stage: count },
      visualCommands: commands,
    };
  },
};
