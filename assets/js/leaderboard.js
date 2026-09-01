/** Optional local-account UI and small PHP leaderboard client. */
export class Leaderboard {
  constructor() {
    this.user = null;
    this.el = {
      form: document.getElementById('login-form'),
      nickname: document.getElementById('nickname-input'),
      pin: document.getElementById('pin-input'),
      session: document.getElementById('account-session'),
      status: document.getElementById('account-status'),
      message: document.getElementById('account-message'),
      logout: document.getElementById('logout-button'),
      trigger: document.getElementById('login-trigger'),
      close: document.getElementById('close-login-button'),
      dialog: document.getElementById('account-dialog'),
      refresh: document.getElementById('refresh-leaderboard-button'),
      body: document.getElementById('leaderboard-body')
    };
  }

  async request(action, body = null) {
    const options = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) } : {};
    const response = await fetch(body ? 'api.php' : `api.php?action=${encodeURIComponent(action)}`, options);
    const data = await response.json().catch(() => ({ ok: false, message: 'The server returned an invalid response.' }));
    if (!response.ok || !data.ok) throw new Error(data.message || 'The request could not be completed.');
    return data;
  }

  async init() {
    this.el.form.addEventListener('submit', (event) => { event.preventDefault(); this.login(); });
    this.el.logout.addEventListener('click', () => this.logout());
    this.el.trigger?.addEventListener('click', () => this.openLogin());
    this.el.close?.addEventListener('click', () => this.closeLogin());
    this.el.dialog?.addEventListener('click', (event) => { if (event.target === this.el.dialog) this.closeLogin(); });
    this.el.refresh?.addEventListener('click', () => this.refresh());
    try {
      const session = await this.request('session');
      this.user = session.user;
      this.renderAccount();
    } catch (error) { this.setMessage(error.message); }
    await this.refresh();
  }

  setMessage(message) { this.el.message.textContent = message; }

  renderAccount() {
    const loggedIn = this.user !== null;
    this.el.form.hidden = loggedIn;
    this.el.session.hidden = !loggedIn;
    if (loggedIn) {
      const tier = this.user.maxN >= 10 ? 'Gold' : this.user.maxN >= 7 ? 'Silver' : this.user.successes ? 'Bronze' : 'Unranked';
      this.el.status.textContent = `Logged in as ${this.user.nickname}: ${this.user.points} points, ${this.user.successes} resolved network${this.user.successes === 1 ? '' : 's'}, ${tier}.`;
      this.setMessage('Perfect N=3–10 results are saved automatically once per seed.');
    }
    if (this.el.trigger) {
      this.el.trigger.classList.toggle('logged-in', loggedIn);
      this.el.trigger.setAttribute('aria-label', loggedIn ? `Account: ${this.user.nickname}. Open account dialog.` : 'Log in or create a local account');
      this.el.trigger.title = loggedIn ? `Logged in as ${this.user.nickname}` : 'Log in';
    }
  }

  openLogin() {
    if (!this.el.dialog) return;
    this.el.dialog.hidden = false;
    (this.user ? this.el.logout : this.el.nickname).focus();
  }

  closeLogin() { if (this.el.dialog) this.el.dialog.hidden = true; }

  async login() {
    const nickname = this.el.nickname.value.trim();
    const pin = this.el.pin.value;
    try {
      const data = await this.request('login', { nickname, pin });
      this.user = data.user;
      this.el.pin.value = '';
      this.renderAccount();
      this.setMessage(data.created ? 'Account created. Perfect results will now be recorded.' : 'Logged in. Perfect results will now be recorded.');
      await this.refresh();
    } catch (error) { this.setMessage(error.message); }
  }

  async logout() {
    try {
      await this.request('logout', {});
      this.user = null;
      this.el.form.reset();
      this.renderAccount();
      this.setMessage('Logged out. You can still play without an account.');
    } catch (error) { this.setMessage(error.message); }
  }

  async recordSuccess(seed, n) {
    if (!this.user || n < 3 || n > 10) return { recorded: false, loggedIn: Boolean(this.user) };
    const data = await this.request('record', { seed, n });
    this.user = data.user;
    this.renderAccount();
    await this.refresh();
    return { recorded: !data.alreadyRecorded, loggedIn: true, points: data.user.points };
  }

  async refresh() {
    if (!this.el.body) return;
    try {
      const data = await this.request('leaderboard');
      this.renderRows(data.rows);
    } catch (error) {
      this.el.body.replaceChildren(this.messageRow(error.message));
    }
  }

  messageRow(message) {
    const row = document.createElement('tr'), cell = document.createElement('td');
    cell.colSpan = 6; cell.textContent = message; row.append(cell); return row;
  }

  renderRows(rows) {
    this.el.body.replaceChildren();
    if (!rows.length) { this.el.body.append(this.messageRow('No resolved networks yet. Be the first scientist on the board.')); return; }
    rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : String(index + 1);
      [medal, row.nickname, row.tier, String(row.points), String(row.successes), `N=${row.maxN}`].forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; tr.append(cell); });
      tr.className = `tier-${row.tier.toLowerCase()}`;
      this.el.body.append(tr);
    });
  }
}
