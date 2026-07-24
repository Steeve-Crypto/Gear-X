import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { GearClock } from './src/components/GearClock';
import { startListening, stopListening, requestMicrophonePermission } from './src/services/audio';
import {
  routerAgent,
  listenerAgent,
  extractorAgent,
  visualizerAgent,
  Insight,
} from './src/agents';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [insightCount, setInsightCount] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [recentTranscript, setRecentTranscript] = useState('');
  const [lastInsight, setLastInsight] = useState<string>('');
  const insightsRef = useRef<Insight[]>([]);

  // Ask for mic permission on first launch
  useEffect(() => {
    requestMicrophonePermission().then((granted) => {
      if (!granted) {
        setStatusText('Microphone permission needed');
      }
    });
  }, []);

  /** Full agent pipeline: Listener → Router → Extractor → Visualizer */
  const runPipeline = async (transcript: string, listening: boolean) => {
    const ctx = {
      recentTranscript: transcript,
      currentInsights: insightsRef.current,
      isListening: listening,
    };

    // 1. Listener
    await listenerAgent.run(ctx);

    // 2. Router decides who wakes
    const routerResult = await routerAgent.run(ctx);
    const active = routerResult.data?.activeAgents || [];

    // 3. Extractor (if Router woke it or we have new speech)
    if (active.includes('extractor') || transcript.length > 15) {
      const extractResult = await extractorAgent.run(ctx);

      if (extractResult.events && extractResult.events.length > 0) {
        const newInsights = extractResult.data?.insights || [];
        insightsRef.current = [...insightsRef.current, ...newInsights];
        setInsightCount(insightsRef.current.length);

        if (newInsights.length > 0) {
          setLastInsight(newInsights[0].content);
          setStatusText(`+${newInsights.length} insight${newInsights.length > 1 ? 's' : ''} extracted`);
        }
      }
    }

    // 4. Visualizer always runs so gears stay in sync
    const vizCtx = {
      ...ctx,
      currentInsights: insightsRef.current,
    };
    await visualizerAgent.run(vizCtx);
  };

  const toggleListening = async () => {
    if (isListening) {
      // Stop
      const uri = await stopListening();
      setIsListening(false);
      setStatusText(uri ? 'Recording saved · processing final insights...' : 'Stopped');

      await runPipeline(recentTranscript, false);
      setStatusText(`Stopped · ${insightsRef.current.length} total insights`);
    } else {
      // Start
      const started = await startListening();
      if (started) {
        setIsListening(true);
        setStatusText('Listening...');
        setLastInsight('');

        // Simulate live speech arriving (replace with real streaming STT later)
        // This triggers the full Extractor → Visualizer pipeline
        setTimeout(async () => {
          const simulated = 'We need to finish the proposal by Friday and decide on the client meeting.';
          setRecentTranscript(simulated);
          await runPipeline(simulated, true);
        }, 2200);

        // Second wave of speech a few seconds later
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
        <GearClock
          isListening={isListening}
          insightCount={insightCount}
        />
      </View>

      <Pressable
        style={[styles.button, isListening && styles.buttonActive]}
        onPress={toggleListening}
      >
        <Text style={styles.buttonText}>
          {isListening ? 'STOP LISTENING' : 'START LISTENING'}
        </Text>
      </Pressable>

      <Text style={styles.status}>{statusText}</Text>

      <Text style={styles.metrics}>
        Insights: {insightCount}  •  Sun + 8 planets active
      </Text>

      {lastInsight ? (
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
    marginBottom: 40,
    letterSpacing: 1,
  },
  clockContainer: {
    width: 320,
    height: 320,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a2a',
    paddingVertical: 16,
    paddingHorizontal: 40,
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
  status: {
    marginTop: 16,
    color: '#c08040',
    fontSize: 13,
    letterSpacing: 1,
  },
  metrics: {
    marginTop: 12,
    color: '#5a5040',
    fontSize: 12,
    letterSpacing: 1,
  },
  transcript: {
    marginTop: 20,
    color: '#6a6050',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
  },
});
