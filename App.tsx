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
  summarizerAgent,
  questionerAgent,
  restoreKnowledge,
  Insight,
} from './src/agents';
import { loadLatestSummary } from './src/services/database';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [insightCount, setInsightCount] = useState(0);
  const [statusText, setStatusText] = useState('Initializing vault...');
  const [recentTranscript, setRecentTranscript] = useState('');
  const [lastInsight, setLastInsight] = useState<string>('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [lastSummary, setLastSummary] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const insightsRef = useRef<Insight[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const granted = await requestMicrophonePermission();
        if (!granted) setStatusText('Microphone permission needed');

        const stored = await restoreKnowledge();
        insightsRef.current = stored;
        setInsightCount(stored.length);

        const summary = await loadLatestSummary();
        if (summary) {
          setLastSummary(`${summary.title}\n${summary.body}`);
        }

        if (stored.length > 0) {
          setStatusText(`Vault restored · ${stored.length} insights`);
          setLastInsight(stored[stored.length - 1].content);
        } else {
          setStatusText('Ready · all 8 planets online');
        }
      } catch (e) {
        console.warn('Init error', e);
        setStatusText('Ready');
      }
    })();
  }, []);

  const maybeSummarize = async () => {
    if (insightsRef.current.length < 2) return;

    setStatusText('Summarizer compressing knowledge...');
    const result = await summarizerAgent.run({
      recentTranscript: '',
      currentInsights: insightsRef.current,
      isListening: false,
    });

    if (result.success && result.data?.summary) {
      const s = result.data.summary;
      setLastSummary(`${s.title}\n${s.body}`);
      setStatusText(`Summary ready · ${result.data.source}`);
      setAnswer('');
      setQuestions([]);
    }
  };

  const runQuestioner = async () => {
    if (insightsRef.current.length === 0 && !recentTranscript) {
      setStatusText('Nothing to question yet');
      return;
    }

    setStatusText('Questioner scanning for open loops...');
    const result = await questionerAgent.run({
      recentTranscript,
      currentInsights: insightsRef.current,
      isListening: false,
    });

    if (result.success && result.data?.questions?.length) {
      setQuestions(result.data.questions);
      setAnswer('');
      setLastSummary('');
      setStatusText(`Questioner · ${result.data.count} question(s) · ${result.data.source}`);
    } else {
      setQuestions([]);
      setStatusText(result.data?.message || 'No open questions');
    }
  };

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

        await weaverAgent.run({
          ...ctx,
          currentInsights: insightsRef.current,
        });

        const archiveResult = await archivistAgent.run({
          ...ctx,
          currentInsights: newInsights,
        });
        if (archiveResult.success) {
          setStatusText(
            `+${newInsights.length} saved · vault: ${archiveResult.data?.totalStored ?? insightCount}`
          );
        }

        // Auto Summarizer + Questioner every 5 insights
        if (insightsRef.current.length >= 5 && insightsRef.current.length % 5 === 0) {
          await maybeSummarize();
          await runQuestioner();
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
    setQuestions([]);

    const result = await retrieverAgent.run({
      recentTranscript: '',
      currentInsights: insightsRef.current,
      isListening: false,
      userQuery: query.trim(),
    });

    if (result.success && result.data?.answer) {
      setAnswer(result.data.answer);
      setLastSummary('');
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

      if (insightsRef.current.length >= 2) {
        await maybeSummarize();
        await runQuestioner();
      }

      setStatusText(`Stopped · ${insightsRef.current.length} insights · all planets online`);
    } else {
      const started = await startListening();
      if (started) {
        setIsListening(true);
        setStatusText('Listening...');
        setLastInsight('');
        setAnswer('');
        setQuestions([]);

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

      <View style={styles.row}>
        <Pressable style={styles.secondaryButton} onPress={maybeSummarize}>
          <Text style={styles.secondaryText}>SUMMARIZE</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={runQuestioner}>
          <Text style={styles.secondaryText}>QUESTION</Text>
        </Pressable>
      </View>

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
        Insights: {insightCount}  •  All 8 planets online
      </Text>

      {questions.length > 0 ? (
        <View style={styles.questionsBox}>
          {questions.map((q, i) => (
            <Text key={i} style={styles.questionItem} numberOfLines={2}>
              {i + 1}. {q}
            </Text>
          ))}
        </View>
      ) : answer ? (
        <Text style={styles.answer} numberOfLines={6}>
          {answer}
        </Text>
      ) : lastSummary ? (
        <Text style={styles.summary} numberOfLines={7}>
          {lastSummary}
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
    marginBottom: 28,
    letterSpacing: 1,
  },
  clockContainer: {
    width: 260,
    height: 260,
    marginBottom: 20,
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
  row: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3a3a2a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  secondaryText: {
    color: '#a09070',
    fontWeight: '600',
    letterSpacing: 1.5,
    fontSize: 11,
  },
  queryRow: {
    flexDirection: 'row',
    marginTop: 14,
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
    marginTop: 12,
    color: '#c08040',
    fontSize: 12,
    letterSpacing: 1,
  },
  metrics: {
    marginTop: 6,
    color: '#5a5040',
    fontSize: 11,
    letterSpacing: 1,
  },
  transcript: {
    marginTop: 14,
    color: '#6a6050',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 300,
  },
  answer: {
    marginTop: 14,
    color: '#c8b890',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 310,
    lineHeight: 18,
  },
  summary: {
    marginTop: 14,
    color: '#b0a080',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 310,
    lineHeight: 17,
  },
  questionsBox: {
    marginTop: 14,
    maxWidth: 310,
    width: '100%',
  },
  questionItem: {
    color: '#d0c090',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 17,
  },
});
