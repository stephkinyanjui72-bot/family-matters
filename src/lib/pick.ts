export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffled-bag pick: excludes indices already drawn this session.
// When the bag is exhausted, the caller should treat "seen" as reset (server handles that).
export function pickUnseen<T>(
  arr: readonly T[],
  seen: readonly number[] | undefined,
): { item: T; index: number; poolSize: number } {
  const size = arr.length;
  const used = new Set(seen || []);
  const available: number[] = [];
  for (let i = 0; i < size; i++) if (!used.has(i)) available.push(i);
  const pool = available.length > 0 ? available : Array.from({ length: size }, (_, i) => i);
  const index = pool[Math.floor(Math.random() * pool.length)];
  return { item: arr[index], index, poolSize: size };
}
