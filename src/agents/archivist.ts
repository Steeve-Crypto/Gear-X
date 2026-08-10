import { Agent, AgentContext, AgentResult, Insight } from './types';
import { saveInsights, loadAllInsights, getInsightCount, logEvent } from '../services/database';

/**
 * Archivist Agent (8th Planet)
 * Long-term storage, indexing, and persistence via SQLite.
 * Saves every new insight and can restore the full knowledge base on launch.
 */
export const archivistAgent: Agent = {
  id: 'archivist',
  name: 'Archivist',
  description: 'Long-term storage, indexing, and persistence of insights using SQLite.',
  continuous: false,

  async run(ctx: AgentContext): Promise<AgentResult> {
    try {
      // In practice the pipeline passes only the freshly extracted ones,
      // but we accept the full list and upsert.
      const toSave = ctx.currentInsights;
      const saved = await saveInsights(toSave);

      await logEvent('archive_batch', {
        saved,
        totalInMemory: ctx.currentInsights.length,
      });

      const total = await getInsightCount();

      return {
        agentId: 'archivist',
        success: true,
        data: {
          saved,
          totalStored: total,
          message: `Archived ${saved} insight(s). Total in vault: ${total}`,
        },
      };
    } catch (error: unknown) {
      return {
        agentId: 'archivist',
        success: false,
        error: error instanceof Error ? error.message : 'SQLite write failed',
      };
    }
  },
};

/** Helper used by App on launch */
export async function restoreKnowledge(): Promise<Insight[]> {
  try {
    return await loadAllInsights();
  } catch {
    return [];
  }
}
