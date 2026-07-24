import { summarizerAgent } from '../agents/summarizer';
import {
  deleteSummary,
  loadAllInsights,
  loadAllSummaries,
  SummaryRecord,
  updateSummary,
} from './database';

export const summaryService = {
  list: loadAllSummaries,
  update: updateSummary,
  remove: deleteSummary,
  async generate(): Promise<SummaryRecord | null> {
    const insights = await loadAllInsights();
    const result = await summarizerAgent.run({
      recentTranscript: '',
      currentInsights: insights,
      isListening: false,
    });
    return result.data?.summary ?? null;
  },
};
