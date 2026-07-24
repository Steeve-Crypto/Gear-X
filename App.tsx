import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { GearClock } from './src/components/GearClock';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [insightCount, setInsightCount] = useState(0);

  const toggleListening = () => {
    setIsListening((prev) => !prev);
    // Later: start/stop real audio stream + agents
  };

  // Temporary demo: add a fake insight every few seconds when listening
  // (will be replaced by real Extractor + Visualizer agents)

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

      <Text style={styles.metrics}>
        Insights: {insightCount}  •  Gears evolving
      </Text>
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
    marginBottom: 48,
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
  metrics: {
    marginTop: 24,
    color: '#5a5040',
    fontSize: 12,
    letterSpacing: 1,
  },
});
