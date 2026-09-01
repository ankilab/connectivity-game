You are a senior web game developer and computational-neuroscience engineer. Build a complete, polished browser game for students to infer the hidden directed connectivity of a small neural network through simulated optogenetic stimulation and calcium imaging.

## Hosting constraints

The project must run on ordinary shared PHP hosting such as all-inkl.com Privat+.

Requirements:

* Use PHP, HTML, CSS, and browser-native JavaScript.
* Do not require Node.js, npm, a bundler, a build step, a database, WebSockets, or a command-line process on the server.
* The deployed project must work after uploading its files to a web directory.
* Prefer vanilla JavaScript and the Canvas API.
* Avoid runtime CDN dependencies unless they are genuinely necessary.
* Use PHP only where useful, such as reading URL parameters or generating the initial page.
* Keep the project modular and maintainable even though it has no build system.
* Support current desktop versions of Chrome, Firefox, Safari, and Edge.

Produce the actual working project, not merely a design proposal.

## Game concept

The player sees `N` neurons distributed across a two-dimensional field. The true neural connectivity is hidden.

Every ordered pair of distinct neurons may be:

1. Excitatory: `pre → post`
2. Inhibitory: `pre ┤ post`
3. Unconnected

Connectivity is directed. Therefore, `A → B` and `B → A` are separate possibilities. Reciprocal connections and longer cycles are allowed. Disable self-connections by default, but make this a clearly documented configuration option.

The player experiments by shining blue optogenetic light on regions of the field. Stimulated neurons may become active, and their activity propagates through the hidden network. The player observes noisy calcium-like fluorescence and uses repeated experiments to infer the network.

The player can classify each directed pair as excitatory, inhibitory, unconnected, or unknown. At any time, they may lock in their answer and receive a score.

## Deterministic seeded games

A game is determined by a text or integer seed.

Implement a deterministic seeded pseudo-random number generator in JavaScript. Do not use `Math.random()` for any seeded network-generation decision.

The seed must deterministically control:

* Neuron positions
* Hidden connectivity
* Excitatory versus inhibitory connections
* Synaptic strengths
* Neuron-specific baseline excitability
* Simulation noise, when starting from the same initial state and action sequence

Support URLs such as:

`index.php?seed=class-demo-12&n=12`

Include controls for:

* Seed
* Number of neurons
* Restarting the current seed
* Starting a new seed

Validate all URL and form inputs.

Use separate derived random streams for network generation and simulation noise so that changes in animation rendering do not alter the generated network.

## Default network generation

Put important values in one documented configuration object.

Use reasonable defaults such as:

* `N = 12`
* Allowed range: 5–30 neurons
* Directed connection probability: approximately 0.18
* Approximately 75% of existing connections excitatory
* Approximately 25% inhibitory
* No self-connections
* Cycles and reciprocal connections allowed
* Seeded neuron positions with sufficient padding and minimum separation

Do not force the graph to be acyclic.

## Visual design

Create a clean, engaging scientific interface resembling a simplified calcium-imaging experiment.

The main field should contain:

* A dark microscopy-style background
* Softly rendered circular neurons
* Stable neuron IDs such as N1, N2, N3
* Fluorescence that increases when calcium activity rises
* Smooth fluorescence decay
* Subtle baseline noise
* A translucent blue circular optogenetic cursor
* A visible stimulation radius
* A brief blue pulse effect while stimulating

The true edges must remain hidden during play.

Use a responsive layout with:

* Main experiment canvas
* Experiment controls
* Selected-pair controls
* Guess/progress summary
* Activity plot or recent-activity display
* Lock-in button
* Instructions and legend

Make the interface usable on typical laptop screens. Mobile support is desirable but secondary.

## Optogenetic interaction

A normal left mouse press in the experiment field shines blue light. Support click-and-hold stimulation.

Only neurons inside the light radius are eligible for direct stimulation.

For a neuron at pixel distance `d` from the center of the light:

`p_light = clamp(lightGain / sqrt(max(d, 1)), 0, 1)`

Outside the light radius:

`p_light = 0`

Make `lightGain`, pulse duration, cursor radius, and stimulation strength configurable.

Show the player the light radius but do not display exact stimulation probabilities.

A successful optogenetic activation should raise the neuron's activity above baseline. It should then be able to affect its postsynaptic targets through hidden directed connections.

Prevent browser text selection and unwanted context-menu behavior inside the experiment area.

## Simplified neural dynamics

Use simplified, understandable stochastic dynamics rather than a full biophysical neuron simulator.

Run the simulation with a fixed timestep independent of display frame rate.

Each neuron should maintain at least:

* Baseline excitability
* Current activation or membrane-like state
* Spike/event state
* Calcium value
* Refractory state

At every simulation step:

1. Start with baseline drive.
2. Add optogenetic drive.
3. Add delayed excitatory input from presynaptic neurons.
4. Subtract delayed inhibitory input from presynaptic neurons.
5. Convert net drive to a bounded firing probability, for example with a sigmoid.
6. Sample a firing event using the seeded simulation RNG.
7. Apply a short refractory period.
8. Increase calcium after a firing event.
9. Exponentially decay calcium toward baseline.
10. Add small observation noise to the displayed fluorescence.

Existing edges should have seeded weights within configurable ranges. Include a short configurable synaptic delay.

The model must visibly demonstrate that:

* Excitatory presynaptic activity can increase a target’s probability of firing.
* Inhibitory presynaptic activity can suppress a target below its expected baseline activity.
* Unconnected neurons have no direct synaptic effect.
* Indirect paths can produce responses that might initially look like direct connections.
* Feedback cycles do not cause an infinite JavaScript loop.

Implement propagation through timestep-based state updates, never recursive edge traversal.

Tune defaults so activity is informative but not perfectly deterministic. A single experiment should not always reveal the answer; repeated stimulation should help.

## Calcium display

The visual signal should behave like a simplified calcium indicator:

* Fast rise after firing
* Slower exponential decay
* Smooth brightness interpolation
* Small baseline fluctuations
* Saturated but readable maximum brightness

Include a compact scrolling plot for the selected neuron or a small set of recently active neurons. Implement it with Canvas or SVG without an external charting dependency.

Do not show hidden synaptic inputs, weights, or true edges before lock-in.

## Selecting and classifying pairs

A normal click is reserved for optogenetic stimulation.

Use Shift-click for pair selection:

1. First Shift-click selects the presynaptic neuron.
2. Second Shift-click selects the postsynaptic neuron.
3. Display the ordered pair clearly as `N3 → N7`.

Visually distinguish the selected presynaptic and postsynaptic neurons.

After selecting a pair, provide four answer buttons:

* Excitatory
* Inhibitory
* Unconnected
* Unknown

Unknown is the default student state. It is not a possible ground-truth edge type.

Also provide:

* A button to swap direction
* A button to clear pair selection
* Keyboard shortcuts with an on-screen legend
* A matrix view showing every directed pair
* Clear color and symbol differences that do not rely on color alone

In the matrix:

* Rows represent presynaptic neurons.
* Columns represent postsynaptic neurons.
* The diagonal is disabled when self-connections are off.
* Each cell shows the student’s current classification, not the truth.
* Clicking a matrix cell selects that ordered pair.

Do not accidentally treat a pair as undirected.

## Student hypothesis visualization

Provide an optional “My hypothesis” overlay that displays only the edges the student has classified:

* Arrowhead for direction
* Excitatory connection as a line ending in an arrow
* Inhibitory connection as a line ending in a bar
* Unconnected and unknown pairs should not draw edges
* Curved paths for reciprocal connections so both directions remain visible

This overlay must never reveal ground truth.

## Lock-in and scoring

The player may press “Lock in answers” at any time.

Before final submission, show a confirmation dialog containing:

* Number of classified pairs
* Number still unknown
* Total possible directed pairs
* Warning that unknown pairs count as incomplete

After confirmation, freeze the answers and compare every valid directed pair against ground truth.

Ground truth contains only:

* Excitatory
* Inhibitory
* Unconnected

Report:

* Correct classifications
* Incorrect classifications
* Unknown/unanswered pairs
* Total possible pairs
* Overall score: correct divided by all possible directed pairs
* Accuracy on answered pairs
* Completion percentage
* Counts or a confusion matrix for excitatory, inhibitory, and unconnected answers

Unknown answers contribute zero to the overall score. They must not inflate accuracy.

After scoring, reveal the true network and compare it with the student hypothesis. Clearly mark:

* Correct guesses
* Incorrect guesses
* Missed connections
* Wrong direction
* Wrong sign
* False-positive connections

Provide a pair-by-pair review table. Allow the user to restart the same seed after viewing the results.

Do not reveal the answer in source-visible HTML or a global variable with an obvious name. However, document in the README that a purely client-side game cannot be made fully cheat-resistant because the simulation necessarily has access to the hidden graph.

## Game states

Implement explicit state handling for:

* Setup
* Playing
* Pair selection
* Submission confirmation
* Results/review

Prevent editing after final lock-in unless the game is restarted.

Pause or safely handle the simulation when the browser tab becomes hidden. Avoid large timestep jumps when it becomes visible again.

## Accessibility and usability

Include:

* A short first-run instruction panel
* Tooltips for unfamiliar terms
* A legend explaining excitatory and inhibitory symbols
* Keyboard-accessible controls
* Visible focus indicators
* Sufficient contrast
* A reduced-motion mode using `prefers-reduced-motion`
* Status messages that are accessible to screen readers
* Color-independent symbols and labels

Avoid relying on red/green alone.

## File structure

Create a clean project resembling:

* `index.php`
* `assets/css/styles.css`
* `assets/js/config.js`
* `assets/js/prng.js`
* `assets/js/network.js`
* `assets/js/simulation.js`
* `assets/js/renderer.js`
* `assets/js/ui.js`
* `assets/js/scoring.js`
* `assets/js/main.js`
* `README.md`

You may adjust this structure if there is a clear reason, but do not collapse the entire application into one huge file.

Use browser ES modules if compatible with the hosting constraints.

## Code quality

Requirements:

* Use clear classes or modules with documented responsibilities.
* Separate hidden network state, simulation state, rendering, student guesses, and scoring.
* Avoid inline JavaScript and inline CSS.
* Sanitize values printed by PHP.
* Avoid `eval`, dynamically generated code, and unsafe HTML insertion.
* Use semantic HTML for controls surrounding the canvas.
* Add comments explaining the dynamics and probability formulas.
* Avoid unnecessary abstractions and dependencies.
* Make simulation parameters easy for an instructor to modify.

## Verification

Add a small browser-based test page or deterministic test harness that requires no npm installation.

Test at least:

* Identical seeds produce identical networks.
* Different seeds usually produce different networks.
* Directed edges remain independent.
* Reciprocal connections are supported.
* Cycles do not cause recursion or hangs.
* Inhibitory inputs reduce firing probability.
* Excitatory inputs increase firing probability.
* Unknown answers are scored as incomplete.
* Edge direction is scored correctly.
* Sign errors are scored correctly.
* Self-pairs are excluded when self-connections are disabled.
* Optogenetic probability decreases with distance.
* Probability remains finite at distance zero.

Include a manual QA checklist in the README.

## Acceptance criteria

The work is complete only when:

1. Uploading the files to PHP shared hosting produces a playable game without a build step.
2. A seed reproduces the same neuron layout and hidden graph.
3. The player can stimulate arbitrary regions with a visible blue-light cursor.
4. Neurons show noisy calcium-like responses.
5. Excitatory and inhibitory effects are behaviorally distinguishable over repeated experiments.
6. Directed cycles and reciprocal edges work safely.
7. Shift-clicking two neurons selects an ordered pair.
8. Every directed pair can be classified.
9. The hypothesis can be changed until lock-in.
10. Lock-in produces correct, transparent scoring.
11. The results view reveals and explains the true graph.
12. The README explains installation, configuration, gameplay, simulation equations, and limitations.

Start by briefly stating your intended architecture and any assumptions. Then create all project files with complete contents. Do not stop at pseudocode, mockups, or partial snippets. After implementation, run or describe the deterministic tests and report any remaining limitations.
