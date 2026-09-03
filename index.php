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
    <h1>Neural Circuit Detective</h1>
    <div class="header-actions">
      <a class="header-link" href="leaderboard.php">Leaderboard</a>
      <button id="login-trigger" class="login-icon" type="button" aria-label="Log in or manage local account" title="Log in">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c.8-4.1 3.4-6.2 8-6.2s7.2 2.1 8 6.2"></path></svg>
      </button>
    </div>
  </header>
  <main>
    <section class="intro card" aria-labelledby="intro-title">
      <div><h2 id="intro-title">Find the hidden directed circuit</h2><p>Hold <kbd>Ctrl</kbd> while clicking or dragging to shine blue optogenetic light. <kbd>Alt</kbd>+click a neuron to watch its calcium trace, then <kbd>Shift</kbd>+click a source and target to classify that ordered pair.</p></div>
      <div class="legend" aria-label="Connection legend"><span><b class="symbol exc">→</b> Excitatory</span><span><b class="symbol inh">⊣</b> Inhibitory</span><span><b class="symbol none">×</b> Marked unconnected</span></div>
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

    <section class="card matrix-card" aria-labelledby="matrix-title"><div class="section-title"><div><h2 id="matrix-title">Directed hypothesis matrix</h2><p class="muted">Rows = presynaptic source; columns = postsynaptic target. Each cell shows your current answer.</p></div><div class="matrix-actions"><span class="matrix-key">→ excitatory · ⊣ inhibitory · ○ unconnected · ? unknown</span><button id="mark-unknown-unconnected-button" type="button" class="secondary">Set all unknown to unconnected</button></div></div><div class="matrix-scroll"><table id="guess-matrix"></table></div></section>
    <section id="results-panel" class="card results" hidden aria-live="polite"></section>
  </main>
  <footer class="site-footer">
    <span>© Andreas Kist, 2026</span>
    <nav aria-label="External links">
      <a href="https://www.anki.xyz/" target="_blank" rel="noopener noreferrer">anki.xyz</a>
      <a href="https://github.com/ankilab/connectivity-game" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="https://www.linkedin.com/in/andreas-kist/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </nav>
  </footer>
  <div id="confirm-dialog" class="dialog-backdrop" hidden><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">Lock in your answers?</h2><p id="confirm-copy"></p><p class="warning">Unknown pairs score zero in the overall score.</p><div class="button-row"><button id="confirm-lock-button" type="button" class="primary">Confirm lock-in</button><button id="cancel-lock-button" type="button" class="secondary">Keep editing</button></div></section></div>
  <div id="account-dialog" class="dialog-backdrop" hidden><section class="dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title"><button id="close-login-button" class="dialog-close" type="button" aria-label="Close account dialog">×</button><p class="eyebrow">Optional local account</p><h2 id="account-title">Login to the Olympic leaderboard</h2><p class="muted">A perfect N=10 earns 90 points; ten perfect N=3 circuits earn 60.</p><form id="login-form" class="login-form"><label>Nickname<input id="nickname-input" name="nickname" minlength="3" maxlength="16" pattern="[A-Za-z0-9 _-]+" autocomplete="username" required></label><label>4-digit PIN<input id="pin-input" name="pin" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="current-password" required></label><button type="submit">Log in / create account</button></form><div id="account-session" hidden><p id="account-status" class="account-status"></p><button id="logout-button" type="button" class="secondary">Log out</button></div><p id="account-message" class="muted" aria-live="polite">First use of a nickname creates its local account.</p></section></div>
  <p id="status-message" class="sr-only" aria-live="polite"></p>
  <script type="module" src="assets/js/main.js"></script>
</body>
</html>
