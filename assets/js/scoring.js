import { CONFIG, TYPES, pairKey } from './config.js';
export function summarize(network, guesses) {
  const pairs = network.validPairs(); let correct = 0, incorrect = 0, unknown = 0; const confusion = {};
  for (const truth of [TYPES.EXC, TYPES.INH, TYPES.NONE]) confusion[truth] = { excitatory: 0, inhibitory: 0, unconnected: 0, unknown: 0 };
  const reviews = pairs.map(([pre, post]) => {
    const truth = network.edgeType(pre, post); const guess = guesses.get(pairKey(pre, post)) || TYPES.UNKNOWN;
    let verdict = 'Incorrect';
    if (guess === TYPES.UNKNOWN) { unknown += 1; verdict = 'Unanswered'; }
    else if (guess === truth) { correct += 1; verdict = 'Correct'; }
    else { incorrect += 1; const reverse = network.edgeType(post, pre); if (guess !== TYPES.NONE && reverse === guess) verdict = 'Wrong direction'; else if (guess !== TYPES.NONE && truth !== TYPES.NONE) verdict = 'Wrong sign'; else if (guess !== TYPES.NONE) verdict = 'False-positive connection'; else verdict = 'Missed connection'; }
    confusion[truth][guess] += 1; return { pre, post, truth, guess, verdict };
  });
  const answered = correct + incorrect; const total = pairs.length;
  return { total, correct, incorrect, unknown, answered, overall: correct / total, accuracy: answered ? correct / answered : 0, completion: answered / total, confusion, reviews };
}
export function isValidPair(pre, post) { return CONFIG.allowSelfConnections || pre !== post; }
