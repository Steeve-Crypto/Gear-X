import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton, EmptyState, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { CaptureSession, TranscriptSegment } from '../../src/domain/models';
import { sessionRepository } from '../../src/repositories/sessionRepository';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [exportText, setExportText] = useState('');
  useEffect(() => {
    if (!id) return;
    sessionRepository.get(id).then(setSession);
    sessionRepository.segments(id).then(setSegments);
  }, [id]);
  return <Screen title="Capture Session" eyebrow={session?.status.toUpperCase() ?? 'LOADING'}>
    {session ? <Panel>
      <Text style={commonStyles.label}>{new Date(session.startedAt).toLocaleString()}</Text>
      <Text style={commonStyles.body}>{Math.round(session.durationMs / 1000)} seconds · {session.processingMode}</Text>
      <Text style={commonStyles.meta}>Transcription: {session.transcriptionProvider} · Inference: {session.inferenceProvider}</Text>
    </Panel> : null}
    {!segments.length ? <EmptyState title="No transcript available" body="The recording may still need a compatible transcription provider." /> :
      segments.map((segment) => <Panel key={segment.id}><Text style={commonStyles.body}>{segment.text}</Text>
        <Text style={commonStyles.meta}>{segment.startMs}–{segment.endMs} ms</Text></Panel>)}
    {session ? <>
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
