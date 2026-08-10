import { AgentContext } from '../agents/types';
import { GearXError } from '../domain/errors';
import { InferenceRequest } from '../infrastructure/inference/types';
import { runRepository } from '../repositories/runRepository';
import { createId } from '../utils/id';
import { operationCapability } from '../domain/aiCapabilities';

export async function requestInference(
  context: AgentContext,
  operation: string,
  request: Omit<InferenceRequest, 'signal'>,
): Promise<string> {
  const provider = context.inferenceProvider;
  if (!provider) return '';

  const runId = context.sessionId ? createId('provider') : null;
  const startedAt = Date.now();
  if (runId && context.sessionId) {
    await runRepository.startProvider({
      id: runId,
      sessionId: context.sessionId,
      providerId: provider.id,
      operation,
      remote: provider.remote,
    });
  }

  try {
    if (!(await provider.isAvailable(context.signal))) {
      if (runId) await runRepository.finishProvider(runId, startedAt, 'PROVIDER_UNAVAILABLE');
      return '';
    }
    const output = await provider.generate({
      ...request,
      capability: operationCapability[operation],
      signal: context.signal,
    });
    if (runId) await runRepository.finishProvider(runId, startedAt);
    return output;
  } catch (error) {
    const code = error instanceof GearXError ? error.code : 'PROVIDER_UNAVAILABLE';
    if (runId) await runRepository.finishProvider(runId, startedAt, code);
    return '';
  }
}
