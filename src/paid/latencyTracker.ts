/**
 * Gear X — Hybrid latency tracker
 * Logs timestamps against the budgets in docs/LATENCY.md
 */

export type LatencyMark =
  | 'session_open'
  | 'audio_chunk_sent'
  | 'first_partial_transcript'
  | 'final_transcript'
  | 'local_router_done'
  | 'local_extractor_done'
  | 'local_archivist_done'
  | 'local_retriever_done'
  | 'tts_request_sent'
  | 'first_audio_byte'
  | 'turn_complete';

/** Targets from docs/LATENCY.md (paid hybrid) */
export const BUDGETS_MS: Record<string, { target: number; stretch: number }> = {
  time_to_first_partial_transcript: { target: 400, stretch: 250 },
  time_to_first_gear_update: { target: 1500, stretch: 900 },
  time_to_spoken_answer: { target: 1500, stretch: 1000 },
  local_extractor_p95: { target: 2000, stretch: 1200 },
  sqlite_archive_p99: { target: 100, stretch: 40 },
};

export interface MarkRecord {
  mark: LatencyMark;
  t: number;
  meta?: Record<string, unknown>;
}

export interface TurnReport {
  turnId: string;
  marks: MarkRecord[];
  deltas: Record<string, number | null>;
  budgetChecks: {
    metric: string;
    valueMs: number | null;
    targetMs: number;
    stretchMs: number;
    status: 'pass' | 'stretch' | 'miss' | 'n/a';
  }[];
}

export class LatencyTracker {
  private marks: MarkRecord[] = [];
  private turnId: string;
  private t0: number;

  constructor(turnId?: string) {
    this.turnId = turnId || `turn_${Date.now()}`;
    this.t0 = Date.now();
    this.mark('session_open');
  }

  mark(mark: LatencyMark, meta?: Record<string, unknown>) {
    this.marks.push({ mark, t: Date.now(), meta });
  }

  private delta(from: LatencyMark, to: LatencyMark): number | null {
    const a = this.marks.find((m) => m.mark === from);
    const b = [...this.marks].reverse().find((m) => m.mark === to);
    if (!a || !b) return null;
    return b.t - a.t;
  }

  report(): TurnReport {
    const deltas: Record<string, number | null> = {
      time_to_first_partial_transcript: this.delta('audio_chunk_sent', 'first_partial_transcript'),
      time_to_final_transcript: this.delta('audio_chunk_sent', 'final_transcript'),
      time_to_first_gear_update: this.delta('audio_chunk_sent', 'local_archivist_done'),
      local_extractor_ms: this.delta('final_transcript', 'local_extractor_done'),
      local_archive_ms: this.delta('local_extractor_done', 'local_archivist_done'),
      time_to_spoken_answer: this.delta('audio_chunk_sent', 'first_audio_byte'),
      retriever_to_tts: this.delta('local_retriever_done', 'first_audio_byte'),
      full_turn: this.delta('audio_chunk_sent', 'turn_complete'),
    };

    const budgetChecks = [
      this.check('time_to_first_partial_transcript', deltas.time_to_first_partial_transcript),
      this.check('time_to_first_gear_update', deltas.time_to_first_gear_update),
      this.check('time_to_spoken_answer', deltas.time_to_spoken_answer),
      this.check('local_extractor_p95', deltas.local_extractor_ms),
      this.check('sqlite_archive_p99', deltas.local_archive_ms),
    ];

    return {
      turnId: this.turnId,
      marks: this.marks,
      deltas,
      budgetChecks,
    };
  }

  private check(
    metric: string,
    valueMs: number | null
  ): TurnReport['budgetChecks'][0] {
    const budget = BUDGETS_MS[metric];
    if (!budget || valueMs == null) {
      return {
        metric,
        valueMs,
        targetMs: budget?.target ?? 0,
        stretchMs: budget?.stretch ?? 0,
        status: 'n/a',
      };
    }
    let status: 'pass' | 'stretch' | 'miss' = 'miss';
    if (valueMs <= budget.stretch) status = 'stretch';
    else if (valueMs <= budget.target) status = 'pass';
    return {
      metric,
      valueMs,
      targetMs: budget.target,
      stretchMs: budget.stretch,
      status,
    };
  }

  /** Pretty one-liner for logs / UI status */
  summaryLine(): string {
    const r = this.report();
    const parts = r.budgetChecks
      .filter((c) => c.valueMs != null)
      .map((c) => `${c.metric.replace(/_/g, ' ')}: ${c.valueMs}ms [${c.status}]`);
    return parts.length ? parts.join(' · ') : 'no latency samples yet';
  }
}
