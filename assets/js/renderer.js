import { CONFIG, TYPES } from './config.js';

function scaleFor(canvas, ctx) { const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1; const width = Math.round(rect.width * ratio); const height = Math.round(rect.height * ratio); if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; } ctx.setTransform(width / CONFIG.fieldWidth, 0, 0, height / CONFIG.fieldHeight, 0, 0); }
function curve(ctx, a, b, reverse) { const dx = b.x - a.x, dy = b.y - a.y, len = Math.max(Math.hypot(dx, dy), 1); const bend = reverse ? 20 : 0; const cx = (a.x + b.x) / 2 - dy / len * bend, cy = (a.y + b.y) / 2 + dx / len * bend; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); return { cx, cy }; }
function endpointTowards(a, b, distance) { const dx = b.x - a.x, dy = b.y - a.y, l = Math.max(Math.hypot(dx, dy), 1); return { x: b.x - dx / l * distance, y: b.y - dy / l * distance, angle: Math.atan2(dy, dx) }; }
function drawArrow(ctx, end, type, color) { ctx.save(); ctx.translate(end.x, end.y); ctx.rotate(end.angle); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2; if (type === TYPES.EXC) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke(); } ctx.restore(); }
export class Renderer {
  constructor(fieldCanvas, plotCanvas) { this.canvas = fieldCanvas; this.ctx = fieldCanvas.getContext('2d'); this.plotCanvas = plotCanvas; this.plotCtx = plotCanvas.getContext('2d'); this.pointer = null; }
  setPointer(point) { this.pointer = point; }
  neuronAt(network, point) { if (!point) return null; let found = null, closest = 26; for (const n of network.neurons) { const d = Math.hypot(point.x - n.x, point.y - n.y); if (d < closest) { closest = d; found = n.id; } } return found; }
  draw(network, simulation, selection, guesses, showHypothesis, revealed) {
    scaleFor(this.canvas, this.ctx); const ctx = this.ctx; const g = ctx.createRadialGradient(450, 300, 10, 450, 300, 700); g.addColorStop(0, '#11364a'); g.addColorStop(1, '#030910'); ctx.fillStyle = g; ctx.fillRect(0, 0, CONFIG.fieldWidth, CONFIG.fieldHeight);
    // fixed speckles are not random: decoration does not influence seeded state.
    ctx.fillStyle = '#75b5c714'; for (let i = 0; i < 84; i += 1) { const x = (i * 163) % 890 + 5, y = (i * 79) % 590 + 5; ctx.beginPath(); ctx.arc(x, y, (i % 3) + .5, 0, Math.PI * 2); ctx.fill(); }
    if (showHypothesis || revealed) this.drawEdges(network, guesses, revealed);
    if (this.pointer && !selection.shiftMode && !revealed) this.drawLight(simulation);
    for (const neuron of network.neurons) this.drawNeuron(neuron, simulation.state[neuron.id], selection);
  }
  drawEdges(network, guesses, revealed) {
    const ctx = this.ctx;
    for (const [pre, post] of network.validPairs()) {
      const truth = network.edgeType(pre, post); const guess = guesses.get(`${pre}:${post}`) || TYPES.UNKNOWN; const type = revealed ? truth : guess;
      const markedUnconnected = !revealed && type === TYPES.NONE;
      if (type === TYPES.UNKNOWN || (type === TYPES.NONE && !markedUnconnected)) continue;
      const a = network.neurons[pre], b = network.neurons[post], reversePresent = (revealed ? network.edgeType(post, pre) : guesses.get(`${post}:${pre}`)) in { excitatory: 1, inhibitory: 1 };
      const color = type === TYPES.EXC ? '#ffba59' : type === TYPES.INH ? '#b69aff' : '#a9c2cf';
      ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = .82; ctx.lineWidth = markedUnconnected ? 1.6 : 2.2;
      if (markedUnconnected) ctx.setLineDash([5, 4]);
      const marker = curve(ctx, a, b, reversePresent); ctx.stroke(); ctx.setLineDash([]);
      if (markedUnconnected) {
        ctx.strokeStyle = '#e8f6fb'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(marker.cx - 5, marker.cy - 5); ctx.lineTo(marker.cx + 5, marker.cy + 5); ctx.moveTo(marker.cx + 5, marker.cy - 5); ctx.lineTo(marker.cx - 5, marker.cy + 5); ctx.stroke();
      } else drawArrow(ctx, endpointTowards(a, b, 18), type, color);
      ctx.restore();
    }
  }
  drawLight(simulation) { const point = this.pointer; const ctx = this.ctx; const active = simulation.stimulation && simulation.time < simulation.stimulation.until; ctx.save(); ctx.strokeStyle = active ? '#73ddff' : '#438db7'; ctx.fillStyle = active ? '#2d98ff30' : '#2d98ff18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(point.x, point.y, CONFIG.lightRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (active) { ctx.strokeStyle = '#b4f3ff'; ctx.globalAlpha = .65; ctx.beginPath(); ctx.arc(point.x, point.y, CONFIG.lightRadius + 8, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); }
  drawNeuron(neuron, cell, selection) { const ctx = this.ctx; const v = Math.min(1, cell.displayed / 0.82); const isPre = selection.pre === neuron.id, isPost = selection.post === neuron.id, isWatched = selection.watched === neuron.id; ctx.save(); const glow = ctx.createRadialGradient(neuron.x, neuron.y, 2, neuron.x, neuron.y, 28); glow.addColorStop(0, `rgba(185,255,230,${.55 + v * .4})`); glow.addColorStop(.4, `rgba(73,220,164,${.25 + v * .6})`); glow.addColorStop(1, 'rgba(34,160,133,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(neuron.x, neuron.y, 28, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgb(${Math.round(48 + v * 175)},${Math.round(123 + v * 125)},${Math.round(122 + v * 100)})`; ctx.beginPath(); ctx.arc(neuron.x, neuron.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = isPre ? '#fff36b' : isPost ? '#51d7ff' : '#d8fff4'; ctx.lineWidth = isPre || isPost ? 3.5 : 1.2; ctx.stroke(); if (isWatched) { ctx.setLineDash([3, 3]); ctx.strokeStyle = '#51d7ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(neuron.x, neuron.y, 20, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); } ctx.fillStyle = '#edffff'; ctx.font = '700 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(neuron.label, neuron.x, neuron.y + 4); if (isPre || isPost) { ctx.font = '700 11px system-ui'; ctx.fillStyle = isPre ? '#fff36b' : '#51d7ff'; ctx.fillText(isPre ? 'PRE' : 'POST', neuron.x, neuron.y - 22); } ctx.restore(); }
  drawPlot(simulation, selected) {
    const canvas = this.plotCanvas, ctx = this.plotCtx;
    const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const w = rect.width, h = rect.height, membraneHeight = h * 0.62, calciumTop = membraneHeight + 10;
    ctx.fillStyle = '#081720'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#244658'; ctx.lineWidth = 1;
    [membraneHeight * .25, membraneHeight * .7, calciumTop + (h - calciumTop) * .5].forEach((y) => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); });
    ctx.font = '11px system-ui'; ctx.fillStyle = '#aac1d2'; ctx.fillText('Membrane potential (white; threshold orange)', 8, 13); ctx.fillText('Calcium fluorescence (green)', 8, calciumTop + 13);
    if (selected === null) { ctx.font = '14px system-ui'; ctx.fillStyle = '#9eb8c9'; ctx.fillText('Alt-click a neuron to monitor membrane potential and calcium.', 16, 38); return; }
    // Threshold is orange; a spike resets the white voltage trace after crossing it.
    const thresholdY = 16;
    ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#ffba59'; ctx.beginPath(); ctx.moveTo(0, thresholdY); ctx.lineTo(w, thresholdY); ctx.stroke(); ctx.restore();
    const membrane = simulation.membraneTraces[selected];
    const voltageRange = CONFIG.spikeThreshold - CONFIG.membraneFloor;
    ctx.strokeStyle = '#e7f7ff'; ctx.lineWidth = 1.8; ctx.beginPath();
    membrane.forEach((value, i) => { const x = i / (membrane.length - 1) * w; const fraction = (value - CONFIG.membraneFloor) / voltageRange; const y = membraneHeight - 6 - fraction * (membraneHeight - 22); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    const calcium = simulation.traces[selected];
    ctx.strokeStyle = '#6ff1be'; ctx.lineWidth = 2; ctx.beginPath();
    calcium.forEach((value, i) => { const x = i / (calcium.length - 1) * w; const y = h - 7 - Math.min(1.1, value) / 1.1 * (h - calciumTop - 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  }
}
