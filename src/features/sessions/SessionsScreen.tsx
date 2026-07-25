import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Link } from 'expo-router';
import { EmptyState, Panel, Screen, commonStyles } from '../../components/primitives';
import { CaptureSession } from '../../domain/models';
import { sessionRepository } from '../../repositories/sessionRepository';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<CaptureSession[]>([]);
  useEffect(() => { void sessionRepository.list().then(setSessions); }, []);
  return <Screen title="Sessions" eyebrow="CAPTURE HISTORY">
    {!sessions.length ? <EmptyState title="No sessions yet" body="Start listening from Orbit to create a bounded capture session." /> :
      sessions.map((session) => <Link key={session.id}
        href={{ pathname: '/session/[id]', params: { id: session.id } }} asChild>
        <Pressable><Panel>
          <Text style={commonStyles.label}>{new Date(session.startedAt).toLocaleString()}</Text>
          <Text style={commonStyles.body}>{session.status} · {Math.round(session.durationMs / 1000)} seconds</Text>
          <Text style={commonStyles.meta}>{session.transcriptionProvider} · {session.processingMode}</Text>
        </Panel></Pressable>
      </Link>)}
  </Screen>;
}
