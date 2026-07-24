import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable, Alert, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { GearClock } from './src/components/GearClock';
import { startListening, stopListening, requestMicrophonePermission } from './src/services/audio';
import {
  routerAgent,
  listenerAgent,
  extractorAgent,
  visualizerAgent,
  archivistAgent,
  retrieverAgent,
  weaverAgent,
  restoreKnowledge,
  Insight,
} from './src/agents';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [insightCount, setInsightCount] = useState(0);
  const [statusText, setStatusText] = useState('Initializing vault...');
  const [recentTranscript, setRecentTranscript] = useState('');
  const [lastInsight, setLastInsight] = useState<string>('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const insightsRef = useRef<Insight[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const granted = await requestMicrophonePermission();
        if (!granted) setStatusText('Microphone permission needed');

        const stored = await restoreKnowledge();
        insightsRef.current = stored;
        setInsightCount(stored.length);

        if (stored.length > 0) {
          setStatusText(`Vault restored · ${stored.length} insights`);
          setLastInsight(stored[stored.length - 1].content);
        } else {
          setStatusText('Ready · empty vault');
        }
      } catch (e) {
        console.warn('Init error', e);
        setStatusText('Ready');
      }
    })();
  }, []);

  const runPipeline = async (transcript: string, listening: boolean) => {
    const ctx = {
      recentTranscript: transcript,
      currentInsights: insightsRef.current,
      isListening: listening,
    };

    await listenerAgent.run(ctx);
    const routerResult = await routerAgent.run(ctx);
    const active = routerResult.data?.activeAgents || [];

    if (active.includes('extractor') || transcript.length > 15) {
      const extractResult = await extractorAgent.run(ctx);

      if (extractResult.events && extractResult.events.length > 0) {
        const newInsights = extractResult.data?.insights || [];
        insightsRef.current = [...insightsRef.current, ...newInsights];
        setInsightCount(insightsRef.current.length);

        if (newInsights.length > 0) {
          setLastInsight(newInsights[0].content);
          setStatusText(`+${newInsights.length} insight(s) extracted`);
        }

        // Weaver — form threads from the growing knowledge
        await weaverAgent.run({
          ...ctx,
          currentInsights: insightsRef.current,
        });

        // Archivist — persist
        const archiveResult = await archivistAgent.run({
          ...ctx,
          currentInsights: newInsights,
        });
        if (archiveResult.success) {
          setStatusText(
            `+${newInsights.length} saved · vault: ${archiveResult.data?.totalStored ?? insightCount}`
          );
        }
      }
    }

    await visualizerAgent.run({
      ...ctx,
      currentInsights: insightsRef.current,
    });
  };

  const askVault = async () => {
    if (!query.trim()) return;
    setStatusText('Retriever searching vault...');
    setAnswer('');

    const result = await retrieverAgent.run({
      recentTranscript: '',
      currentInsights: insightsRef.current,
      isListening: false,
      userQuery: query.trim(),
    });

    if (result.success && result.data?.answer) {
      setAnswer(result.data.answer);
      setStatusText(
        `Retriever · ${result.data.matchCount || 0} match(es) · ${result.data.source}`
      );
    } else {
      setAnswer(result.error || 'No answer returned');
      setStatusText('Retriever failed');
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      const uri = await stopListening();
      setIsListening(false);
      setStatusText(uri ? 'Recording saved · final archive...' : 'Stopped');
      await runPipeline(recentTranscript, false);
      setStatusText(`Stopped · ${insightsRef.current.length} insights in vault`);
    } else {
      const started = await startListening();
      if (started) {
        setIsListening(true);
        setStatusText('Listening...');
        setLastInsight('');
        setAnswer('');

        setTimeout(async () => {
          const simulated = 'We need to finish the proposal by Friday and decide on the client meeting.';
          setRecentTranscript(simulated);
          await runPipeline(simulated, true);
        }, 2200);

        setTimeout(async () => {
          const simulated2 = 'I am not sure about the budget yet. Maybe we should ask the team tomorrow?';
          setRecentTranscript(simulated2);
          await runPipeline(simulated2, true);
        }, 5500);
      } else {
        Alert.alert(
          'Microphone Access',
          'Gear X needs microphone permission to listen and build your living knowledge clock.'
        );
        setStatusText('Permission denied');
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>GEAR X</Text>
      <Text style={styles.subtitle}>The machine that remembers</Text>

      <View style={styles.clockContainer}>
        <GearClock isListening={isListening} insightCount={insightCount} />
      </View>

      <Pressable
        style={[styles.button, isListening && styles.buttonActive]}
        onPress={toggleListening}
      >
        <Text style={styles.buttonText}>
          {isListening ? 'STOP LISTENING' : 'START LISTENING'}
        </Text>
      </Pressable>

      {/* Retriever query bar */}
      <View style={styles.queryRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask the vault..."
          placeholderTextColor="#5a5040"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={askVault}
          returnKeyType="search"
        />
        <Pressable style={styles.askButton} onPress={askVault}>
          <Text style={styles.askText}>ASK</Text>
        </Pressable>
      </View>

      <Text style={styles.status}>{statusText}</Text>

      <Text style={styles.metrics}>
        Insights: {insightCount}  •  SQLite vault + Retriever
      </Text>

      {answer ? (
        <Text style={styles.answer} numberOfLines={6}>
          {answer}
        </Text>
      ) : lastInsight ? (
        <Text style={styles.transcript} numberOfLines={3}>
          {lastInsight}
        </Text>
      ) : recentTranscript ? (
        <Text style={styles.transcript} numberOfLines={2}>
          {recentTranscript}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#e8e0d0',
    letterSpacing: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8a8070',
    marginBottom: 32,
    letterSpacing: 1,
  },
  clockContainer: {
    width: 300,
    height: 300,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a2a',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 4,
  },
  buttonActive: {
    backgroundColor: '#2a1a0a',
    borderColor: '#c08040',
  },
  buttonText: {
    color: '#e8e0d0',
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 13,
  },
  queryRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    maxWidth: 320,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#141410',
    borderWidth: 1,
    borderColor: '#2a2a1a',
    color: '#e8e0d0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 13,
  },
  askButton: {
    backgroundColor: '#2a1a0a',
    borderWidth: 1,
    borderColor: '#c08040',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 4,
  },
  askText: {
    color: '#e8e0d0',
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 12,
  },
  status: {
    marginTop: 14,
    color: '#c08040',
    fontSize: 13,
    letterSpacing: 1,
  },
  metrics: {
    marginTop: 8,
    color: '#5a5040',
    fontSize: 12,
    letterSpacing: 1,
  },
  transcript: {
    marginTop: 16,
    color: '#6a6050',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
  },
  answer: {
    marginTop: 16,
    color: '#c8b890',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 310,
    lineHeight: 18,
  },
});
