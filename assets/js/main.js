import { CONFIG, TYPES, pairKey, isValidCount } from './config.js';
import { HiddenNetwork } from './network.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { summarize } from './scoring.js';

const VALID_SEED = /^[A-Za-z0-9 _.-]{1,80}$/;
const field = document.getElementById('field-canvas');
const ui = new UI(); const renderer = new Renderer(field, document.getElementById('activity-canvas'));
let game = null; let lastFrame = 0; let accumulator = 0; let pointerDown = false; let generatedSeedNumber = 0;
function pointFromEvent(event) { const rect = field.getBoundingClientRect(); return { x: (event.clientX - rect.left) / rect.width * CONFIG.fieldWidth, y: (event.clientY - rect.top) / rect.height * CONFIG.fieldHeight }; }
function validSeed(value) { return VALID_SEED.test(value.trim()); }
function newSeed() {
  const values = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
    return `lab-${values[0].toString(36)}-${values[1].toString(36)}`;
  }
  // Fallback is only for naming a fresh seed; seeded game decisions still never use Math.random().
  generatedSeedNumber += 1;
  return `lab-${Date.now().toString(36)}-${generatedSeedNumber}`;
}
function queryFor(seed, count) { const params=new URLSearchParams({seed,n:String(count)}); history.replaceState(null,'',`${location.pathname}?${params}`); }
function start(seed, count) {
  game = { state:'setup', network: new HiddenNetwork(seed, count), simulation: null, guesses: new Map(), selection: { pre:null, post:null, shiftMode:false }, watchedNeuron:null, locked:false, showHypothesis:false };
  game.simulation = new Simulation(game.network); game.state='playing'; ui.el.results_panel.hidden=true; ui.el.results_panel.replaceChildren(); ui.el.seed_input.value=seed;ui.el.count_input.value=count;queryFor(seed,count); refresh(); ui.announce(`Loaded seed ${seed} with ${count} neurons.`);
}
function refresh() { if (!game) return; ui.setPair(game.selection,game.locked);ui.setWatchedNeuron(game.watchedNeuron);ui.updateProgress(game.network,game.guesses);ui.renderMatrix(game.network,game.guesses,game.selection,game.locked,pickPair);ui.el.lock_button.disabled=game.locked;ui.el.mode_label.textContent=game.locked?'Results: true network shown':game.selection.shiftMode?'Pair selection: shift-click a neuron':'Playing: Ctrl-click to stimulate'; }
function pickPair(pre, post) { if (game.locked) return; game.selection={pre,post,shiftMode:false}; game.state='pair-selection'; refresh(); ui.announce(`Selected N${pre+1} to N${post+1}.`); }
function selectNeuron(id) { if (game.locked) return; if (game.selection.pre === null || game.selection.post !== null) { game.selection={pre:id,post:null,shiftMode:true}; game.state='pair-selection'; } else if (game.selection.pre === id) { ui.announce('Choose a different target neuron.'); return; } else game.selection={pre:game.selection.pre,post:id,shiftMode:false}; refresh(); }
function watchNeuron(id) { if (game.locked) return; game.watchedNeuron=id; refresh(); ui.announce(`Watching calcium activity from N${id + 1}.`); }
function answer(type) { const {pre,post}=game.selection;if(game.locked||pre===null||post===null)return;game.guesses.set(pairKey(pre,post),type);ui.announce(`N${pre+1} to N${post+1} classified as ${type}.`);refresh(); }
function stimulate(point) { if(game.locked)return; game.simulation.setStimulation(point,true); }
function draw() { renderer.draw(game.network,game.simulation,{...game.selection,watched:game.watchedNeuron},game.guesses,game.showHypothesis,game.locked); renderer.drawPlot(game.simulation,game.watchedNeuron); }
function animate(timestamp) { if (!lastFrame) lastFrame=timestamp; const delta=Math.min((timestamp-lastFrame)/1000,.1);lastFrame=timestamp;if(game&&!document.hidden){if(pointerDown&&renderer.pointer)stimulate(renderer.pointer);accumulator+=delta;let steps=0;while(accumulator>=CONFIG.timeStep&&steps<CONFIG.maxStepsPerFrame){game.simulation.step();accumulator-=CONFIG.timeStep;steps+=1;}}if(game)draw();requestAnimationFrame(animate); }
field.addEventListener('contextmenu',(event)=>event.preventDefault());
field.addEventListener('pointermove',(event)=>{const point=pointFromEvent(event);renderer.setPointer(point);if(pointerDown)stimulate(point);});
field.addEventListener('pointerleave',()=>renderer.setPointer(null));
field.addEventListener('pointerdown',(event)=>{ if(event.button!==0)return;event.preventDefault();field.setPointerCapture?.(event.pointerId);const point=pointFromEvent(event);renderer.setPointer(point);const neuron=renderer.neuronAt(game.network,point);if(event.altKey){if(neuron!==null)watchNeuron(neuron);else ui.announce('Alt-click directly on a neuron to watch its calcium activity.');return;}if(event.shiftKey){if(neuron!==null)selectNeuron(neuron);else ui.announce('Shift-click directly on a neuron to select it.');return;}if(!event.ctrlKey){ui.announce('Hold Control while clicking or dragging to stimulate.');return;}pointerDown=true;stimulate(point); });
field.addEventListener('pointerup',()=>{pointerDown=false;game?.simulation.setStimulation(null,false);});
field.addEventListener('pointercancel',()=>{pointerDown=false;game?.simulation.setStimulation(null,false);});
field.addEventListener('keydown',(event)=>{if(event.key==='Escape'){game.selection={pre:null,post:null,shiftMode:false};game.state='playing';refresh();} });
ui.el.answer_buttons.addEventListener('click',(event)=>{const button=event.target.closest('button[data-answer]');if(button)answer(button.dataset.answer);});
ui.el.swap_button.addEventListener('click',()=>{const s=game.selection;game.selection={pre:s.post,post:s.pre,shiftMode:false};refresh();});
ui.el.clear_pair_button.addEventListener('click',()=>{game.selection={pre:null,post:null,shiftMode:false};game.state='playing';refresh();});
ui.el.hypothesis_toggle.addEventListener('change',()=>{game.showHypothesis=ui.el.hypothesis_toggle.checked;});
ui.el.restart_button.addEventListener('click',()=>{const seed=ui.el.seed_input.value.trim(),count=Number(ui.el.count_input.value);if(!validSeed(seed)||!isValidCount(count)){ui.announce('Use a valid seed and 3 to 30 neurons.');return;}start(seed,count);});
ui.el.new_seed_button.addEventListener('click',()=>{const count=Number(ui.el.count_input.value);if(!isValidCount(count)){ui.announce('Choose a neuron count from 3 to 30.');return;}start(newSeed(),count);});
ui.el.lock_button.addEventListener('click',()=>{game.state='submission-confirmation';ui.showConfirmation(summarize(game.network,game.guesses));});
ui.el.cancel_lock_button.addEventListener('click',()=>{game.state=game.selection.pre===null?'playing':'pair-selection';ui.hideConfirmation();});
ui.el.confirm_lock_button.addEventListener('click',()=>{const summary=summarize(game.network,game.guesses);game.locked=true;game.state='results';game.selection={pre:null,post:null,shiftMode:false};ui.hideConfirmation();refresh();ui.renderResults(summary,game.network);ui.announce(`Results ready. Overall score ${(summary.overall*100).toFixed(1)} percent.`);});
document.addEventListener('keydown',(event)=>{if(event.target.matches('input,textarea,select'))return;if(!game||game.locked)return;const key=event.key.toLowerCase();if(key==='e')answer(TYPES.EXC);if(key==='i')answer(TYPES.INH);if(key==='u')answer(TYPES.NONE);if(key==='x')answer(TYPES.UNKNOWN);if(key==='s'&&game.selection.pre!==null&&game.selection.post!==null){const p=game.selection.pre;game.selection.pre=game.selection.post;game.selection.post=p;refresh();}if(key==='h'){ui.el.hypothesis_toggle.checked=!ui.el.hypothesis_toggle.checked;game.showHypothesis=ui.el.hypothesis_toggle.checked;}});
document.addEventListener('visibilitychange',()=>{lastFrame=0;accumulator=0;if(document.hidden&&game)game.simulation.setStimulation(null,false);});
start(ui.el.seed_input.value,Number(ui.el.count_input.value));requestAnimationFrame(animate);
