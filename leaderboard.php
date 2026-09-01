<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Olympic leaderboard for Neural Circuit Detective.">
  <title>Leaderboard · Neural Circuit Detective</title>
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <a class="skip-link" href="#leaderboard">Skip to leaderboard</a>
  <header class="site-header">
    <h1>Neural Circuit Detective</h1>
    <div class="header-actions">
      <a class="header-link" href="index.php">Experiment</a>
      <button id="login-trigger" class="login-icon" type="button" aria-label="Log in or manage local account" title="Log in">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c.8-4.1 3.4-6.2 8-6.2s7.2 2.1 8 6.2"></path></svg>
      </button>
    </div>
  </header>
  <main class="leaderboard-page">
    <section class="card leaderboard-card" id="leaderboard" aria-labelledby="leaderboard-title">
      <div class="section-title"><div><p class="eyebrow">Olympic circuit leaderboard</p><h2 id="leaderboard-title">Resolved networks</h2><p class="muted">Only perfect N=3–10 circuit resolutions count. Points equal N × (N−1): N=10 earns 90 points, while ten N=3 circuits earn 60.</p><p class="muted">Gold: at least one N=10 · Silver: N=7–9 · Bronze: N=3–6</p></div><button id="refresh-leaderboard-button" type="button" class="secondary">Refresh</button></div>
      <div class="leaderboard-scroll"><table class="leaderboard-table"><thead><tr><th>Rank</th><th>Scientist</th><th>Tier</th><th>Points</th><th>Resolved</th><th>Largest N</th></tr></thead><tbody id="leaderboard-body"><tr><td colspan="6">Loading leaderboard…</td></tr></tbody></table></div>
    </section>
  </main>
  <footer class="site-footer">
    <span>© Andreas Kist, 2026</span>
    <nav aria-label="External links"><a href="https://www.anki.xyz/" target="_blank" rel="noopener noreferrer">anki.xyz</a><a href="https://github.com/ankilab/connectivity-game" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/andreas-kist/" target="_blank" rel="noopener noreferrer">LinkedIn</a></nav>
  </footer>
  <div id="account-dialog" class="dialog-backdrop" hidden><section class="dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title"><button id="close-login-button" class="dialog-close" type="button" aria-label="Close account dialog">×</button><p class="eyebrow">Optional local account</p><h2 id="account-title">Login to the Olympic leaderboard</h2><p class="muted">A perfect N=10 earns 90 points; ten perfect N=3 circuits earn 60.</p><form id="login-form" class="login-form"><label>Nickname<input id="nickname-input" name="nickname" minlength="3" maxlength="16" pattern="[A-Za-z0-9 _-]+" autocomplete="username" required></label><label>4-digit PIN<input id="pin-input" name="pin" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="current-password" required></label><button type="submit">Log in / create account</button></form><div id="account-session" hidden><p id="account-status" class="account-status"></p><button id="logout-button" type="button" class="secondary">Log out</button></div><p id="account-message" class="muted" aria-live="polite">First use of a nickname creates its local account.</p></section></div>
  <script type="module" src="assets/js/leaderboard-page.js"></script>
</body>
</html>
