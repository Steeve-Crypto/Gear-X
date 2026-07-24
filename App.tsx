import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { GearClock } from './src/components/GearClock';
import { startListening, stopListening, requestMicrophonePermission } from './src/services/audio';
import { routerAgent, listenerAgent } from './src/agents';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [insightCount, setInsightCount] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [recentTranscript, setRecentTranscript] = useState('');

  // Ask for mic permission on first launch
  useEffect(() => {
    requestMicrophonePermission().then((granted) => {
      if (!granted) {
        setStatusText('Microphone permission needed');
      }
    });
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      // Stop
      const uri = await stopListening();
      setIsListening(false);
      setStatusText(uri ? 'Recording saved · processing...' : 'Stopped');

      // Run Listener + Router once more with final state
      const ctx = {
        recentTranscript,
        currentInsights: [],
        isListening: false,
      };
      await listenerAgent.run(ctx);
      await routerAgent.run(ctx);
    } else {
      // Start
      const started = await startListening();
      if (started) {
        setIsListening(true);
        setStatusText('Listening...');

        // Simulate incoming transcript for demo (replace with real STT later)
        // In production the Listener agent will receive real chunks
        setTimeout(() => {
          setRecentTranscript('This is a simulated live transcript while the gears turn...');
          setInsightCount((c) => c + 1);
        }, 2500);
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
          onInsightAdded={() => setInsightCount((c) => c + 1)}
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
        Insights: {insightCount}  •  Agents ready
      </Text>

      {recentTranscript ? (
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
    maxWidth: 280,
  },
});
