import { TYPES, pairKey } from './config.js';
import { HiddenNetwork } from './network.js';
import { Simulation, lightProbability } from './simulation.js';
import { summarize } from './scoring.js';
const out=document.getElementById('test-results');const rows=[];
function test(name,fn){try{fn();rows.push([name,true,'']);}catch(error){rows.push([name,false,error.message]);}}
function assert(ok,message='assertion failed'){if(!ok)throw new Error(message);}
function snapshot(n){return JSON.stringify({p:n.neurons,b:n.baselines,e:n.edges});}
test('Identical seeds produce identical networks',()=>assert(snapshot(new HiddenNetwork('same',12))===snapshot(new HiddenNetwork('same',12))));
test('Different seeds usually produce different networks',()=>assert(snapshot(new HiddenNetwork('one',12))!==snapshot(new HiddenNetwork('two',12))));
test('Directed edges are independent',()=>{const n=new HiddenNetwork('independence',12);let differs=false;for(const [a,b] of n.validPairs())if(n.edgeType(a,b)!==n.edgeType(b,a)){differs=true;break;}assert(differs);});
test('Reciprocal connections are supported by representation',()=>{const n=new HiddenNetwork('reciprocal',5);n.edges[0][1]={type:TYPES.EXC};n.edges[1][0]={type:TYPES.INH};assert(n.edgeType(0,1)!==n.edgeType(1,0));});
test('Cycles step without recursion or hangs',()=>{const s=new Simulation(new HiddenNetwork('cycle',8));for(let i=0;i<300;i+=1)s.step();assert(Number.isFinite(s.time));});
test('Inhibitory input reduces firing probability',()=>{const s=new Simulation(new HiddenNetwork('p',5));assert(s.probabilityForDrive(-1)>s.probabilityForDrive(-2));});
test('Excitatory input increases firing probability',()=>{const s=new Simulation(new HiddenNetwork('p',5));assert(s.probabilityForDrive(1)>s.probabilityForDrive(0));});
test('Unknown is scored incomplete',()=>{const n=new HiddenNetwork('score',5),r=summarize(n,new Map());assert(r.unknown===r.total&&r.overall===0);});
test('Edge direction is scored correctly',()=>{const n=new HiddenNetwork('direction',5);n.edges[0][1]={type:TYPES.EXC};n.edges[1][0]=null;const g=new Map([[pairKey(1,0),TYPES.EXC]]);assert(summarize(n,g).reviews.find(r=>r.pre===1&&r.post===0).verdict==='Wrong direction');});
test('Sign errors are identified',()=>{const n=new HiddenNetwork('sign',5);n.edges[0][1]={type:TYPES.EXC};const g=new Map([[pairKey(0,1),TYPES.INH]]);assert(summarize(n,g).reviews.find(r=>r.pre===0&&r.post===1).verdict==='Wrong sign');});
test('Self pairs are excluded by default',()=>{const n=new HiddenNetwork('self',5);assert(n.validPairs().length===20);});
test('Optogenetic probability decreases with distance',()=>assert(lightProbability(10)>lightProbability(100)));
test('Probability is finite at distance zero',()=>assert(Number.isFinite(lightProbability(0))));
const list=document.createElement('ul');rows.forEach(([name,ok,message])=>{const li=document.createElement('li');li.textContent=`${ok?'PASS':'FAIL'} — ${name}${message?`: ${message}`:''}`;li.style.color=ok?'#6de3ad':'#ff8293';list.append(li);});out.append(list);const summary=document.createElement('p');summary.textContent=`${rows.filter(r=>r[1]).length}/${rows.length} tests passed.`;out.prepend(summary);
