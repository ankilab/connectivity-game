import { CONFIG, clamp, sigmoid } from './config.js';
import { SeededRng } from './prng.js';

export function lightProbability(distance) { return distance > CONFIG.lightRadius ? 0 : clamp(CONFIG.lightGain / Math.sqrt(Math.max(distance, 1)), 0, 1); }
/** Fixed-step stochastic dynamics. Inputs read an old event history, so cycles cannot recurse. */
export class Simulation {
  constructor(network) {
    this.network = network; this.rng = new SeededRng(network.seed).derive('simulation-noise-v1'); this.reset();
  }
  reset() {
    const n = this.network.count; this.time = 0; this.stimulation = null;
    this.state = Array.from({ length: n }, () => ({ membrane: 0, calcium: CONFIG.calciumBaseline, displayed: CONFIG.calciumBaseline, fired: false, refractory: 0 }));
    this.history = Array.from({ length: CONFIG.synapticDelaySteps + 1 }, () => Array(n).fill(false));
    this.traces = Array.from({ length: n }, () => Array(CONFIG.historyLength).fill(CONFIG.calciumBaseline));
    this.membraneTraces = Array.from({ length: n }, () => Array(CONFIG.historyLength).fill(0));
  }
  setStimulation(point, active) { this.stimulation = active && point ? { ...point, until: this.time + CONFIG.pulseSeconds } : null; }
  step() {
    const oldEvents = this.history[0]; const nextEvents = Array(this.network.count).fill(false);
    for (let i = 0; i < this.network.count; i += 1) {
      const cell = this.state[i]; let synaptic = 0;
      for (const edge of this.network.incoming[i]) if (oldEvents[edge.pre]) synaptic += edge.type === 'excitatory' ? edge.weight : -edge.weight;
      let light = 0;
      if (this.stimulation && this.time < this.stimulation.until) {
        const neuron = this.network.neurons[i]; const p = lightProbability(Math.hypot(neuron.x - this.stimulation.x, neuron.y - this.stimulation.y));
        // Direct photoactivation is sampled, then added as a local depolarising current.
        if (this.rng.chance(p)) light = CONFIG.lightDrive;
      }
      /*
       * Leaky integration makes individual EPSPs/IPSPs visible and lets closely
       * spaced EPSPs add together. `synaptic` is delayed by the event history,
       * so feedback cycles remain ordinary finite timestep updates.
       */
      cell.membrane *= Math.exp(-CONFIG.membraneLeakRate * CONFIG.timeStep);
      cell.membrane += this.network.baselines[i] + synaptic + light + this.rng.range(-CONFIG.backgroundNoise, CONFIG.backgroundNoise);
      cell.membrane = clamp(cell.membrane, CONFIG.membraneFloor, CONFIG.spikeThreshold + 0.25);
      const fired = cell.refractory === 0 && cell.membrane >= CONFIG.spikeThreshold;
      nextEvents[i] = fired; cell.fired = fired;
      cell.refractory = fired ? CONFIG.refractorySteps : Math.max(0, cell.refractory - 1);
      if (fired) cell.membrane = CONFIG.resetPotential;
      cell.calcium += fired ? CONFIG.calciumJump : 0;
      cell.calcium += (CONFIG.calciumBaseline - cell.calcium) * (1 - Math.exp(-CONFIG.calciumDecay * CONFIG.timeStep));
      cell.displayed = clamp(cell.calcium + this.rng.range(-CONFIG.observationNoise, CONFIG.observationNoise), 0, 1.2);
      this.traces[i].push(cell.displayed); this.traces[i].shift();
      // Preserve the threshold crossing in the plotted trace even though the
      // state is immediately reset for the next timestep.
      this.membraneTraces[i].push(fired ? CONFIG.spikeThreshold : cell.membrane); this.membraneTraces[i].shift();
    }
    this.history.push(nextEvents); this.history.shift(); this.time += CONFIG.timeStep;
    if (this.stimulation && this.time >= this.stimulation.until) this.stimulation = null;
  }
  // Retained for the small test harness and for instructors comparing drives.
  probabilityForDrive(drive) { return sigmoid(drive); }
}
