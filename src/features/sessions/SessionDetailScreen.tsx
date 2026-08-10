import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { ActionButton, EmptyState, Panel, Screen, commonStyles } from '../../components/primitives';
import { sessionRepository, SessionDetailData } from '../../repositories/sessionRepository';
import { retryCapturedSession } from '../../services/captureSession';
import {
  createInferenceProvider,
  createTranscriptionProvider,
} from '../../services/providerFactory';
import { useSettingsStore } from '../../state/settingsStore';
import { userErrorMessage } from '../../domain/errors';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [details, setDetails] = useState<SessionDetailData | null>(null);
  const [exportText, setExportText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const settings = useSettingsStore();

  const load = async (sessionId: string) => {
    try {
      setDetails(await sessionRepository.details(sessionId));
    } catch {
      setError('The session details could not be loaded.');
    }
  };

  useEffect(() => {
    if (id) void load(id);
  }, [id]);

  const session = details?.session ?? null;
  const segments = details?.segments ?? [];

  return <Screen title="Capture Session" eyebrow={session?.status.toUpperCase() ?? 'LOADING'}>
    {session ? <Panel>
      <Text style={commonStyles.label}>{new Date(session.startedAt).toLocaleString()}</Text>
      <Text style={commonStyles.body}>{Math.round(session.durationMs / 1000)} seconds · {session.processingMode}</Text>
      <Text style={commonStyles.meta}>Transcription: {session.transcriptionProvider} · Inference: {session.inferenceProvider}</Text>
      {session.audioUri ? <Text style={commonStyles.meta}>Recording retained for recovery or user retention.</Text> : null}
    </Panel> : null}

    {!segments.length ? <EmptyState title="No transcript available"
      body="The recording may still need a compatible transcription provider." /> :
      <Section title="TRANSCRIPT">{segments.map((segment) => <Text key={segment.id} style={commonStyles.body}>
        {segment.text}{'\n'}<Text style={commonStyles.meta}>{segment.startMs}–{segment.endMs} ms</Text>
      </Text>)}</Section>}

    {details?.insights.length ? <Section title="INSIGHTS">
      {details.insights.map((insight) => <Link key={String(insight.id)}
        href={{ pathname: '/insight/[id]', params: { id: String(insight.id) } }}>
        <Text style={commonStyles.label}>{String(insight.type)} · {String(insight.content)}</Text>
      </Link>)}
    </Section> : null}

    {details?.summaries.length ? <Section title="SUMMARIES">
      {details.summaries.map((summary) => <Text key={String(summary.id)} style={commonStyles.body}>
        {String(summary.title)}{String(summary.body) ? `\n${String(summary.body)}` : ''}
      </Text>)}
    </Section> : null}

    {details?.questions.length ? <Section title="QUESTIONS">
      {details.questions.map((question) => <Link key={String(question.id)}
        href={{ pathname: '/loop/[id]', params: { id: String(question.id) } }}>
        <Text style={commonStyles.label}>{String(question.status)} · {String(question.question)}</Text>
      </Link>)}
    </Section> : null}

    {details?.threads.length ? <Section title="RELATED THREADS">
      {details.threads.map((thread) => <Link key={String(thread.id)}
        href={{ pathname: '/thread/[id]', params: { id: String(thread.id) } }}>
        <Text style={commonStyles.label}>{String(thread.title)}</Text>
      </Link>)}
    </Section> : null}

    {details?.agentRuns.length ? <Section title="AGENT RUNS">
      {details.agentRuns.map((run) => <RunLine key={String(run.id)} label={String(run.agent_id)} run={run} />)}
    </Section> : null}

    {details?.providerRuns.length ? <Section title="PROVIDER RUNS">
      {details.providerRuns.map((run) => <RunLine key={String(run.id)}
        label={`${String(run.provider_id)} · ${String(run.operation)}`} run={run} />)}
    </Section> : null}

    {error ? <Panel><Text accessibilityLiveRegion="polite"
      style={commonStyles.body}>{error}</Text></Panel> : null}

    {session ? <>
      {['processing', 'failed'].includes(session.status) && session.audioUri ? (
        <ActionButton label={busy ? 'Retrying…' : 'Retry processing'} disabled={busy}
          onPress={async () => {
            setBusy(true);
            setError('');
            try {
              const result = await retryCapturedSession({
                sessionId: session.id,
                provider: createTranscriptionProvider(settings),
                inferenceProvider: createInferenceProvider(settings),
                retainRecording: settings.retainRecordings,
                currentInsights: [],
                autoSummarize: settings.autoSummarize,
                autoQuestion: settings.autoQuestion,
              });
              await load(session.id);
              if (result.recordingCleanupFailed) {
                setError('Processing completed, but the recording file could not be deleted.');
              }
            } catch (cause) {
              setError(userErrorMessage(cause));
              await load(session.id);
            } finally {
              setBusy(false);
            }
          }} />
      ) : null}
      <ActionButton label="Prepare session export" onPress={async () => {
        const data = await sessionRepository.export(session.id);
        setExportText(data ? JSON.stringify(data, null, 2) : '');
      }} />
      {exportText ? <Panel><Text selectable style={commonStyles.body}>{exportText}</Text></Panel> : null}
      <ActionButton label="Delete session" destructive onPress={() => Alert.alert(
        'Delete session?',
        'Transcript segments, session insights, summaries, questions, and run records will be removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
            await sessionRepository.remove(session.id); router.back();
          } },
        ],
      )} />
    </> : null}
  </Screen>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Panel><Text style={commonStyles.meta}>{title}</Text>{children}</Panel>;
}

function RunLine({ label, run }: { label: string; run: Record<string, unknown> }) {
  const duration = run.duration_ms == null ? '' : ` · ${String(run.duration_ms)} ms`;
  const error = run.error_code ? ` · ${String(run.error_code)}` : '';
  return <Text style={commonStyles.body}>{label} · {String(run.status)}{duration}{error}</Text>;
}
