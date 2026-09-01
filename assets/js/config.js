/** Instructor-editable settings. Self connections are intentionally off by default. */
export const CONFIG = Object.freeze({
  // Small 3–4 neuron circuits are useful for introductory demonstrations.
  defaultN: 12, minN: 3, maxN: 30, allowSelfConnections: false,
  fieldWidth: 900, fieldHeight: 600, positionPadding: 48, minSeparation: 52,
  connectionProbability: 0.18, excitatoryFraction: 0.75,
  // Postsynaptic-potential amplitudes in arbitrary membrane-potential units.
  // Even the weakest excitatory edge crosses threshold after a short burst,
  // rather than remaining permanently subthreshold during sustained input.
  excitatoryWeight: [0.60, 0.80], inhibitoryWeight: [0.36, 0.60],
  // Small cell-specific background current plus noise keeps resting cells quiet.
  baselineDrive: [-0.003, 0.008], backgroundNoise: 0.006,
  timeStep: 1 / 60, synapticDelaySteps: 3, membraneLeakRate: 8,
  spikeThreshold: 1, resetPotential: 0, membraneFloor: -1.25, refractorySteps: 3,
  calciumBaseline: 0.08, calciumJump: 0.7, calciumDecay: 1.25,
  observationNoise: 0.025, lightRadius: 82, lightGain: 4.2,
  // Two local light hits generally drive a neuron across threshold.
  lightDrive: 0.85, pulseSeconds: 0.12, historyLength: 270, maxStepsPerFrame: 5
});

export const TYPES = Object.freeze({ EXC: 'excitatory', INH: 'inhibitory', NONE: 'unconnected', UNKNOWN: 'unknown' });
export const DISPLAY = Object.freeze({ excitatory: '→', inhibitory: '⊣', unconnected: '○', unknown: '?' });
export function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
export function sigmoid(value) { return 1 / (1 + Math.exp(-clamp(value, -20, 20))); }
export function pairKey(pre, post) { return `${pre}:${post}`; }
export function isValidCount(value) { return Number.isInteger(value) && value >= CONFIG.minN && value <= CONFIG.maxN; }
