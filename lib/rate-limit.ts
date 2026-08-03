// シンプルなインメモリのレート制限。
// サーバーレス環境では複数インスタンスに分散されるため厳密な制限にはならないが、
// 単純な連投・bot対策としての初期実装。将来的にはRedis等の共有ストアへの置き換えを推奨。
const attemptsByKey = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 5;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (attemptsByKey.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (timestamps.length >= MAX_ATTEMPTS_PER_WINDOW) {
    attemptsByKey.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  attemptsByKey.set(key, timestamps);
  return false;
}
