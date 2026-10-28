/** 시드 고정 난수 (mulberry32). 같은 시드면 같은 런이 나와요. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  weighted<K extends string>(w: Record<K, number>): K {
    const entries = Object.entries(w) as [K, number][];
    const total = entries.reduce((a, [, v]) => a + v, 0);
    let r = this.next() * total;
    for (const [k, v] of entries) {
      if ((r -= v) < 0) return k;
    }
    return entries[entries.length - 1][0];
  }
}
