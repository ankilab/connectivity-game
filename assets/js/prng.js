/** Stable text hashing plus Mulberry32. Never use Math.random for a seeded game. */
export function hashText(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export class SeededRng {
  constructor(seed) { this.seed = typeof seed === 'number' ? seed >>> 0 : hashText(String(seed)); this.state = this.seed || 0x6d2b79f5; }
  next() { let t = this.state += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  range(min, max) { return min + (max - min) * this.next(); }
  int(min, maxInclusive) { return Math.floor(this.range(min, maxInclusive + 1)); }
  chance(probability) { return this.next() < probability; }
  derive(label) { return new SeededRng(hashText(`${this.seed}|${label}`)); }
}
