export function getAttemptLimit(retryLimit = 0): number {
  return Math.max(1, Math.floor(retryLimit) + 1);
}

export function shouldRetryAgent(input: {
  attempt: number;
  retryLimit?: number;
  aborted: boolean;
}): boolean {
  return !input.aborted && input.attempt < getAttemptLimit(input.retryLimit);
}
