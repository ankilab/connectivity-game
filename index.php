<?php
declare(strict_types=1);

function valid_seed(mixed $value): string {
    $seed = is_string($value) ? trim($value) : '';
    if ($seed === '' || strlen($seed) > 80 || !preg_match('/^[A-Za-z0-9 _.-]+$/', $seed)) {
        return 'class-demo-12';
    }
    return $seed;
}

function valid_count(mixed $value): int {
    $count = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 3, 'max_range' => 30]]);
    return $count === false ? 12 : $count;
}

$seed = valid_seed($_GET['seed'] ?? 'class-demo-12');
$count = valid_count($_GET['n'] ?? 12);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Infer a hidden directed neural network using simulated optogenetics and calcium imaging.">
  <title>Neural Circuit Detective</title>
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <a class="skip-link" href="#experiment">Skip to experiment controls</a>
  <header class="site-header">
    <div><p class="eyebrow">Virtual calcium-imaging lab</p><h1>Neural Circuit Detective</h1></div>
    <p class="header-note">Stimulate, observe, infer.</p>
  </header>
  <main>
    <section class="intro card" aria-labelledby="intro-title">
      <div><h2 id="intro-title">Find the hidden directed circuit</h2><p>Hold <kbd>Ctrl</kbd> while clicking or dragging to shine blue optogenetic light. <kbd>Alt</kbd>+click a neuron to watch its calcium trace, then <kbd>Shift</kbd>+click a source and target to classify that ordered pair.</p></div>
      <div class="legend" aria-label="Connection legend"><span><b class="symbol exc">→</b> Excitatory</span><span><b class="symbol inh">⊣</b> Inhibitory</span><span><b class="symbol none">○</b> Unconnected</span></div>
    </section>

    <section class="layout" id="experiment" aria-label="Experiment workspace">
      <div class="lab-column">
        <section class="canvas-card card" aria-label="Neural imaging field">
          <div class="canvas-toolbar"><span id="mode-label">Playing: click to stimulate</span><label><input id="hypothesis-toggle" type="checkbox"> My hypothesis</label></div>
          <div id="canvas-wrap"><canvas id="field-canvas" width="900" height="600" tabindex="0" aria-label="Neural imaging field. Hold Control while clicking and dragging to stimulate. Alt-click a neuron to watch its calcium signal. Shift-click neurons to choose a directed pair."></canvas></div>
          <p class="canvas-help">Blue circle = stimulation area. <kbd>Ctrl</kbd>+click/drag stimulates. <kbd>Alt</kbd>+click watches calcium. <kbd>Shift</kbd>+click selects pairs.</p>
        </section>
        <section class="plot-card card" aria-labelledby="plot-title"><div class="section-title"><h2 id="plot-title">Recent membrane &amp; calcium signal</h2><span id="plot-label">Alt-click a neuron to watch</span></div><canvas id="activity-canvas" width="900" height="160" aria-label="Recent membrane-potential and calcium activity plot. Orange dashed line is the spike threshold; white is membrane potential; green is calcium."></canvas></section>
      </div>

      <aside class="controls-column">
        <section class="card" aria-labelledby="session-title"><h2 id="session-title">Session</h2>
          <div class="form-grid"><label>Seed<input id="seed-input" maxlength="80" value="<?= htmlspecialchars($seed, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" aria-describedby="seed-help"></label><label>Neurons<input id="count-input" type="number" min="3" max="30" value="<?= $count ?>"></label></div>
          <p id="seed-help" class="muted">Letters, numbers, spaces, dots, hyphens and underscores.</p>
          <div class="button-row"><button id="restart-button" type="button">Restart seed</button><button id="new-seed-button" type="button" class="secondary">New seed</button></div>
        </section>
        <section class="card" aria-labelledby="pair-title"><h2 id="pair-title">Classify a directed pair</h2><p id="pair-display" class="pair-display">Shift-click a presynaptic neuron, then a postsynaptic neuron.</p>
          <div id="answer-buttons" class="answer-grid" aria-label="Connection classification"><button data-answer="excitatory" type="button" disabled><span>→</span> Excitatory <kbd>E</kbd></button><button data-answer="inhibitory" type="button" disabled><span>⊣</span> Inhibitory <kbd>I</kbd></button><button data-answer="unconnected" type="button" disabled><span>○</span> Unconnected <kbd>U</kbd></button><button data-answer="unknown" type="button" disabled><span>?</span> Unknown <kbd>X</kbd></button></div>
          <div class="button-row"><button id="swap-button" type="button" class="secondary" disabled>Swap direction <kbd>S</kbd></button><button id="clear-pair-button" type="button" class="secondary">Clear pair</button></div>
        </section>
        <section class="card progress-card" aria-labelledby="progress-title"><h2 id="progress-title">Hypothesis progress</h2><p><strong id="classified-count">0</strong> classified · <strong id="unknown-count">0</strong> unknown · <strong id="total-count">0</strong> possible pairs</p><button id="lock-button" type="button" class="primary">Lock in answers</button></section>
      </aside>
    </section>

    <section class="card matrix-card" aria-labelledby="matrix-title"><div class="section-title"><div><h2 id="matrix-title">Directed hypothesis matrix</h2><p class="muted">Rows = presynaptic source; columns = postsynaptic target. Each cell shows your current answer.</p></div><span class="matrix-key">→ excitatory · ⊣ inhibitory · ○ unconnected · ? unknown</span></div><div class="matrix-scroll"><table id="guess-matrix"></table></div></section>
    <section id="results-panel" class="card results" hidden aria-live="polite"></section>
  </main>
  <div id="confirm-dialog" class="dialog-backdrop" hidden><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">Lock in your answers?</h2><p id="confirm-copy"></p><p class="warning">Unknown pairs score zero in the overall score.</p><div class="button-row"><button id="confirm-lock-button" type="button" class="primary">Confirm lock-in</button><button id="cancel-lock-button" type="button" class="secondary">Keep editing</button></div></section></div>
  <p id="status-message" class="sr-only" aria-live="polite"></p>
  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
