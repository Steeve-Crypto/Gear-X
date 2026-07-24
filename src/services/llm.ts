/**
 * Local LLM Service for Gear X
 *
 * Targets Ollama (or any OpenAI-compatible local server).
 * Default: http://localhost:11434  (change to your laptop IP when testing on phone)
 *
 * Recommended models:
 *   - qwen2.5:3b or qwen2.5:7b  (fast + solid)
 *   - llama3.2:3b
 *   - phi3:mini
 *
 * Run on your machine:
 *   ollama serve
 *   ollama pull qwen2.5:3b
 */

const DEFAULT_BASE = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2.5:3b';

export interface LLMOptions {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callLocalLLM(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const baseUrl = options.baseUrl || DEFAULT_BASE;
  const model = options.model || DEFAULT_MODEL;

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.3,
          num_predict: options.maxTokens ?? 512,
        },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.message?.content?.trim() || '';
  } catch (err) {
    console.warn('[LLM] Local call failed, falling back:', err);
    return ''; // caller should handle fallback
  }
}

/**
 * Check if a local Ollama instance is reachable
 */
export async function isLocalLLMAvailable(baseUrl = DEFAULT_BASE): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
