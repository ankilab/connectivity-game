import { CONFIG, TYPES } from './config.js';
import { SeededRng } from './prng.js';

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function randomPositions(count, rng) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    let selected = null;
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const point = { x: rng.range(CONFIG.positionPadding, CONFIG.fieldWidth - CONFIG.positionPadding), y: rng.range(CONFIG.positionPadding, CONFIG.fieldHeight - CONFIG.positionPadding) };
      if (points.every((other) => distance(point, other) >= CONFIG.minSeparation)) { selected = point; break; }
    }
    // A deterministic grid fallback preserves a valid layout at maximum density.
    if (!selected) selected = { x: CONFIG.positionPadding + (i % 6) * 145, y: CONFIG.positionPadding + Math.floor(i / 6) * 120 };
    points.push({ ...selected, id: i, label: `N${i + 1}` });
  }
  return points;
}

/** Hidden directed graph. `edges` is deliberately only held by game modules. */
export class HiddenNetwork {
  constructor(seed, count) {
    this.seed = String(seed); this.count = count;
    const rng = new SeededRng(this.seed).derive('network-v1');
    this.neurons = randomPositions(count, rng.derive('positions'));
    this.baselines = Array.from({ length: count }, () => rng.range(...CONFIG.baselineDrive));
    this.edges = Array.from({ length: count }, () => Array(count).fill(null));
    this.incoming = Array.from({ length: count }, () => []);
    for (let pre = 0; pre < count; pre += 1) for (let post = 0; post < count; post += 1) {
      if (!CONFIG.allowSelfConnections && pre === post) continue;
      if (!rng.chance(CONFIG.connectionProbability)) continue;
      const type = rng.chance(CONFIG.excitatoryFraction) ? TYPES.EXC : TYPES.INH;
      const weight = rng.range(...(type === TYPES.EXC ? CONFIG.excitatoryWeight : CONFIG.inhibitoryWeight));
      const edge = { pre, post, type, weight };
      this.edges[pre][post] = edge; this.incoming[post].push(edge);
    }
  }
  edgeType(pre, post) { return this.edges[pre]?.[post]?.type || TYPES.NONE; }
  edge(pre, post) { return this.edges[pre]?.[post] || null; }
  validPairs() { const pairs = []; for (let pre = 0; pre < this.count; pre += 1) for (let post = 0; post < this.count; post += 1) if (CONFIG.allowSelfConnections || pre !== post) pairs.push([pre, post]); return pairs; }
}
