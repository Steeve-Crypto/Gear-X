import { Agent, AgentContext, AgentResult, KnowledgeEvent, VisualizerCommand } from './types';

/**
 * Visualizer Agent
 * Translates knowledge events into concrete gear commands.
 * This is what makes the clock feel alive: new teeth, speed changes, linkages, pulses.
 */
export const visualizerAgent: Agent = {
  id: 'visualizer',
  name: 'Visualizer',
  description: 'Translates knowledge events into gear animations (new teeth, speed, linkages, glow).',
  continuous: true,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const commands: VisualizerCommand[] = [];

    // Base state while listening
    if (ctx.isListening) {
      commands.push({ action: 'glow', intensity: 0.6 });
      commands.push({ action: 'change_speed', intensity: 1.0 });
    } else {
      commands.push({ action: 'change_speed', intensity: 0.15 });
    }

    // Every insight adds teeth / complexity
    const insightCount = ctx.currentInsights.length;
    if (insightCount > 0) {
      // Add teeth to different gears based on count
      commands.push({
        action: 'add_tooth',
        gearIndex: 0, // central gear
        intensity: Math.min(insightCount, 20),
      });

      if (insightCount >= 2) {
        commands.push({
          action: 'add_tooth',
          gearIndex: 1,
          intensity: Math.floor(insightCount / 2),
        });
      }

      if (insightCount >= 3) {
        commands.push({
          action: 'add_tooth',
          gearIndex: 2,
          intensity: Math.floor(insightCount / 3),
        });
      }

      // Occasional linkage / pulse when knowledge grows
      if (insightCount % 3 === 0) {
        commands.push({ action: 'add_linkage', intensity: 0.8 });
        commands.push({ action: 'pulse', intensity: 1.0 });
      }
    }

    return {
      agentId: 'visualizer',
      success: true,
      data: { commands },
      visualCommands: commands,
    };
  },
};
