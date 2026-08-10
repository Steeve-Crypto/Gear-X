import { CaptureSession, TranscriptSegment } from '../domain/models';
import { GearXError } from '../domain/errors';
import { openAppDatabase } from '../infrastructure/database';

const toSession = (row: Record<string, unknown>): CaptureSession => ({
  id: String(row.id),
  startedAt: Number(row.started_at),
  endedAt: row.ended_at == null ? null : Number(row.ended_at),
  durationMs: Number(row.duration_ms),
  status: row.status as CaptureSession['status'],
  audioUri: row.audio_uri == null ? null : String(row.audio_uri),
  transcriptionProvider: String(row.transcription_provider),
  inferenceProvider: String(row.inference_provider),
  processingMode: row.processing_mode as CaptureSession['processingMode'],
  createdAt: Number(row.created_at),
  updatedAt: Number(row.updated_at),
});

export interface SessionDetailData {
  session: CaptureSession;
  segments: TranscriptSegment[];
  insights: Record<string, unknown>[];
  summaries: Record<string, unknown>[];
  questions: Record<string, unknown>[];
  threads: Record<string, unknown>[];
  agentRuns: Record<string, unknown>[];
  providerRuns: Record<string, unknown>[];
}

export const sessionRepository = {
  async create(session: CaptureSession): Promise<void> {
    try {
      const db = await openAppDatabase();
      await db.runAsync(
        `INSERT INTO sessions
          (id, started_at, ended_at, duration_ms, status, audio_uri,
           transcription_provider, inference_provider, processing_mode, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.startedAt,
          session.endedAt,
          session.durationMs,
          session.status,
          session.audioUri,
          session.transcriptionProvider,
          session.inferenceProvider,
          session.processingMode,
          session.createdAt,
          session.updatedAt,
        ],
      );
    } catch (cause) {
      throw new GearXError('DATABASE_WRITE_FAILED', 'Could not create session.', cause);
    }
  },

  async get(id: string): Promise<CaptureSession | null> {
    const db = await openAppDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM sessions WHERE id = ?',
      [id],
    );
    return row ? toSession(row) : null;
  },

  async list(limit = 30, offset = 0): Promise<CaptureSession[]> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ? OFFSET ?',
      [Math.min(limit, 100), Math.max(offset, 0)],
    );
    return rows.map(toSession);
  },

  async listRecoverable(): Promise<CaptureSession[]> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM sessions
       WHERE status IN ('processing', 'failed') AND audio_uri IS NOT NULL
       ORDER BY updated_at DESC`,
    );
    return rows.map(toSession);
  },

  async update(session: CaptureSession): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      `UPDATE sessions SET ended_at = ?, duration_ms = ?, status = ?, audio_uri = ?,
       transcription_provider = ?, inference_provider = ?, processing_mode = ?, updated_at = ?
       WHERE id = ?`,
      [
        session.endedAt,
        session.durationMs,
        session.status,
        session.audioUri,
        session.transcriptionProvider,
        session.inferenceProvider,
        session.processingMode,
        session.updatedAt,
        session.id,
      ],
    );
  },

  async addSegment(segment: TranscriptSegment): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      `INSERT INTO transcript_segments
       (id, session_id, text, start_ms, end_ms, speaker_label, confidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        segment.id,
        segment.sessionId,
        segment.text,
        segment.startMs,
        segment.endMs,
        segment.speakerLabel,
        segment.confidence,
        segment.createdAt,
      ],
    );
  },

  async replaceSegments(sessionId: string, segments: TranscriptSegment[]): Promise<void> {
    const db = await openAppDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM transcript_segments WHERE session_id = ?', [sessionId]);
      for (const segment of segments) {
        await db.runAsync(
          `INSERT INTO transcript_segments
           (id, session_id, text, start_ms, end_ms, speaker_label, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            segment.id,
            segment.sessionId,
            segment.text,
            segment.startMs,
            segment.endMs,
            segment.speakerLabel,
            segment.confidence,
            segment.createdAt,
          ],
        );
      }
    });
  },

  async segments(sessionId: string): Promise<TranscriptSegment[]> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM transcript_segments WHERE session_id = ? ORDER BY start_ms ASC',
      [sessionId],
    );
    return rows.map((row) => ({
      id: String(row.id),
      sessionId: String(row.session_id),
      text: String(row.text),
      startMs: Number(row.start_ms),
      endMs: Number(row.end_ms),
      speakerLabel: row.speaker_label == null ? null : String(row.speaker_label),
      confidence: row.confidence == null ? null : Number(row.confidence),
      createdAt: Number(row.created_at),
    }));
  },

  async details(id: string): Promise<SessionDetailData | null> {
    const session = await this.get(id);
    if (!session) return null;
    const db = await openAppDatabase();
    const [segments, insights, summaries, questions, threads, agentRuns, providerRuns] = await Promise.all([
      this.segments(id),
      db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM insights WHERE session_id = ? ORDER BY created_at', [id],
      ),
      db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM summaries WHERE session_id = ? ORDER BY created_at', [id],
      ),
      db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM questions WHERE session_id = ? ORDER BY created_at', [id],
      ),
      db.getAllAsync<Record<string, unknown>>(
        `SELECT DISTINCT t.* FROM threads t
         JOIN thread_insights ti ON ti.thread_id = t.id
         JOIN insights i ON i.id = ti.insight_id
         WHERE i.session_id = ? ORDER BY t.updated_at DESC`, [id],
      ),
      db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM agent_runs WHERE session_id = ? ORDER BY started_at', [id],
      ),
      db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM provider_runs WHERE session_id = ? ORDER BY started_at', [id],
      ),
    ]);
    return { session, segments, insights, summaries, questions, threads, agentRuns, providerRuns };
  },

  async remove(id: string): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
  },

  async export(id: string): Promise<Record<string, unknown> | null> {
    const db = await openAppDatabase();
    const session = await db.getFirstAsync('SELECT * FROM sessions WHERE id = ?', [id]);
    if (!session) return null;
    const [segments, insights, summaries, questions, runs, providerRuns] = await Promise.all([
      db.getAllAsync('SELECT * FROM transcript_segments WHERE session_id = ? ORDER BY start_ms', [id]),
      db.getAllAsync('SELECT * FROM insights WHERE session_id = ? ORDER BY created_at', [id]),
      db.getAllAsync('SELECT * FROM summaries WHERE session_id = ? ORDER BY created_at', [id]),
      db.getAllAsync('SELECT * FROM questions WHERE session_id = ? ORDER BY created_at', [id]),
      db.getAllAsync('SELECT * FROM agent_runs WHERE session_id = ? ORDER BY started_at', [id]),
      db.getAllAsync('SELECT * FROM provider_runs WHERE session_id = ? ORDER BY started_at', [id]),
    ]);
    return {
      format: 'gear-x-session',
      version: 1,
      exportedAt: new Date().toISOString(),
      session,
      transcriptSegments: segments,
      insights,
      summaries,
      questions,
      agentRuns: runs,
      providerRuns,
    };
  },
};
