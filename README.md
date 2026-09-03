# Neural Circuit Detective

A self-contained browser game for students to infer hidden, directed neural connectivity using virtual optogenetic stimulation and noisy calcium imaging. It is built for ordinary PHP shared hosting: upload the project files and open `index.php`; no Node.js, database, server process, or build step is required.

## Install and run

1. Upload the whole directory to a PHP-enabled web folder.
2. Visit `index.php`, for example `https://example.org/neural-game/index.php?seed=class-demo-12&n=12`.
3. Choose a seed and neuron count (3–30) in the Session controls, then restart the seed.

For the optional leaderboard, PHP must be able to write to the included `data` directory and `data/leaderboard.json`. Most shared hosts do this automatically; if score saving reports an error, set that directory’s permissions to allow the web-server account to write (commonly `775`).

The only server-side code is `index.php`, which validates and safely renders the initial `seed` and `n` URL parameters. All interaction uses standards-based HTML Canvas and browser ES modules, supported by current desktop Chrome, Firefox, Safari, and Edge.

## Play

- Hold **Ctrl** while clicking or click-dragging in the dark imaging field to shine blue light. Neurons inside the displayed radius may be directly activated. Repeated stimulation is expected: individual responses are noisy.
- **Alt-click** a neuron to place its membrane-potential (white) and fluorescence (green) traces in the Recent signal plot. The dashed orange line is its spike threshold. Excitatory events step the white trace upward (EPSPs), inhibitory events step it downward (IPSPs), and closely timed EPSPs can accumulate to a spike. Its dashed cyan ring remains visible while you stimulate other neurons.
- Hold **Shift** and click a neuron to choose the presynaptic source, then Shift-click another neuron for the postsynaptic target. The selected ordered pair is shown as `N3 → N7`.
- Choose **Excitatory** (`E`), **Inhibitory** (`I`), **Unconnected** (`U`), or **Unknown** (`X`). Swap selected direction with `S`, toggle your overlay with `H`, and clear selection with `Escape` or the button.
- Rows in the matrix are sources and columns are targets. A connection in one direction says nothing by itself about the reverse direction.
- Use **Set all unknown to unconnected** in the matrix to rapidly make a complete null-connection hypothesis. Existing excitatory, inhibitory, and unconnected answers are preserved and can still be edited individually before lock-in.
- Optionally show **My hypothesis**. This draws your submitted excitatory and inhibitory hypotheses, plus a neutral dashed line with an **×** for pairs you marked unconnected. It never reveals the answer.
- Select **Lock in answers** when ready. Unknown is a valid student state, but scores zero in the overall score. The review exposes the real network and labels correct answers, wrong direction, sign errors, missed connections, and false positives.

## Optional Olympic leaderboard

Open `leaderboard.php` to view rankings. The top-right account icon on either page opens the optional local-login dialog. Enter a 3–16 character nickname and a four-digit PIN to create a local account. On later visits, the same nickname/PIN logs in again. PINs are saved only as PHP password hashes in `data/leaderboard.json`; no external login service or database is used.

Only a **perfect**, fully completed network is recorded. Challenges from N=3 through N=10 are eligible, and a seed can be credited only once per account. Olympic points equal the number of directed pairs, `N × (N−1)`: an N=10 success earns 90 points, while ten N=3 successes earn 60. The public board displays only accounts with at least one recorded success, ranks by points, and gives tiers based on the largest resolved circuit:

- Gold — resolved N=10
- Silver — resolved N=7–9
- Bronze — resolved N=3–6

## Design and simulation

`assets/js/config.js` is the single documented instructor-editable configuration object. Defaults are 12 neurons, supports compact 3–30 neuron circuits, uses a 0.18 independent directed connection probability, 75% excitatory edges, and no self-connections. Set `allowSelfConnections: true` there only if self-pairs are desired; the matrix and score calculation will then include them.

`assets/js/prng.js` provides a stable text hash and deterministic PRNG. A seed has independent derived streams for hidden network construction (`network-v1`) and simulation noise (`simulation-noise-v1`). Thus the same seed, initial state, and action sequence reproduce positions, graph, weights, baselines, and observed stochastic response; display-frame timing does not alter the generated circuit.

For each fixed timestep, each neuron computes:

`V(t + dt) = leak × V(t) + baseline + optogenetic input + delayed EPSPs − delayed IPSPs + small seeded noise`

The membrane state is leaky: each delayed excitatory event adds a positive postsynaptic potential (EPSP), while each inhibitory event subtracts an inhibitory postsynaptic potential (IPSP). Excitatory weights are tuned so a short burst from one active presynaptic partner reliably crosses threshold; a single EPSP can still remain visible below threshold. Inhibitory connections instead reduce or prevent postsynaptic spiking. Background drive and small seeded noise are added at each step. When membrane potential crosses `spikeThreshold`, the neuron emits one spike, resets to `resetPotential`, and observes a short refractory period. Firing increases calcium quickly; calcium then decays exponentially to a baseline. Displayed fluorescence adds small seeded observation noise. Synaptic inputs use an event-history buffer delayed by `synapticDelaySteps`, so cycles and reciprocal edges remain safe finite state updates—there is no recursive graph traversal.

For a neuron at distance `d` within the blue radius, direct-light probability is:

`p_light = clamp(lightGain / sqrt(max(d, 1)), 0, 1)`

Outside the radius it is zero. The app deliberately does not display these probabilities or the hidden weights. Tuning `lightGain`, `lightDrive`, delay, weight ranges, noise, and calcium response in `config.js` changes the classroom difficulty.

## Project map

- `index.php` — accessible page shell and sanitized URL setup.
- `leaderboard.php` — separate Olympic leaderboard page.
- `api.php` — local PHP session/account and file-backed leaderboard endpoint.
- `data/leaderboard.json` — locally stored account hashes and successful challenge records (server writable).
- `assets/css/styles.css` — responsive scientific interface, focus states, reduced motion.
- `assets/js/config.js` — all central defaults and shared constants.
- `assets/js/prng.js` — deterministic seeded random streams.
- `assets/js/network.js` — positions, hidden directed graph, baselines, weights.
- `assets/js/simulation.js` — fixed timestep stochastic dynamics and fluorescence traces.
- `assets/js/renderer.js` — microscopy canvas, overlay, selected markers, plot.
- `assets/js/ui.js` — DOM controls, directed matrix, confirmation and results review.
- `assets/js/scoring.js` — directed-pair score and review classifications.
- `assets/js/main.js` — game state and input coordination.
- `tests.html` / `assets/js/tests.js` — no-install browser test harness.

## Verification

Open `tests.html` through the same web server (for example `https://example.org/neural-game/tests.html`). It checks identical/different seeds, independent directed representations, reciprocal connections, safe cycles, excitatory/inhibitory probability effects, unknown scoring, direction and sign errors, disabled self-pairs, and the light probability’s distance/zero behavior.

Manual QA checklist:

- [ ] Load the same `seed` and `n` twice; positions and behavior from the same actions match.
- [ ] Hold Ctrl while clicking or dragging in several field regions; blue pulse and local calcium changes are visible.
- [ ] Shift-click two neurons, classify both directions separately, and see matching matrix cells.
- [ ] Toggle **My hypothesis** before lock-in; only selected student edges appear.
- [ ] Try locking with unknown cells; confirmation count and zero-score warning appear.
- [ ] Confirm; editing disables, true edges appear, results/table explain all pair outcomes.
- [ ] Hide/show the browser tab; simulation resumes without a large jump.
- [ ] Tab through controls; focus is visible and screen-reader status messages announce selection/actions.

## Limitation

This is a client-side educational game. The hidden graph has to be available to the simulation code, so a technically skilled user can inspect browser-delivered JavaScript or runtime memory. It is therefore not cheat-resistant. For graded or high-stakes use, score and keep the graph on a trusted server instead.

The optional leaderboard follows the same educational trust model: the browser reports a perfect client-side result to `api.php`. It is suitable for a classroom-friendly local board, not for high-stakes competition security.
