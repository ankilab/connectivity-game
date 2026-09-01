<?php
declare(strict_types=1);

/*
 * Small file-backed leaderboard API for ordinary PHP hosting.
 * PINs are hashed; the JSON data file never contains a plaintext PIN.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

const LEADERBOARD_FILE = __DIR__ . '/data/leaderboard.json';

function reply(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_data(): array {
    $raw = file_get_contents('php://input');
    if ($raw !== false && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) return $decoded;
    }
    return is_array($_POST) ? $_POST : [];
}

function valid_nickname(mixed $value): ?string {
    $nickname = is_string($value) ? trim($value) : '';
    return preg_match('/^[A-Za-z0-9 _-]{3,16}$/', $nickname) ? $nickname : null;
}

function valid_pin(mixed $value): ?string {
    $pin = is_string($value) ? $value : '';
    return preg_match('/^\d{4}$/', $pin) ? $pin : null;
}

function valid_seed(mixed $value): ?string {
    $seed = is_string($value) ? trim($value) : '';
    return ($seed !== '' && strlen($seed) <= 80 && preg_match('/^[A-Za-z0-9 _.-]+$/', $seed)) ? $seed : null;
}

function leaderboard_data(): array {
    if (!is_dir(dirname(LEADERBOARD_FILE))) mkdir(dirname(LEADERBOARD_FILE), 0775, true);
    if (!file_exists(LEADERBOARD_FILE)) file_put_contents(LEADERBOARD_FILE, '{"users":{}}');
    $raw = file_get_contents(LEADERBOARD_FILE);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    return is_array($data) && isset($data['users']) && is_array($data['users']) ? $data : ['users' => []];
}

function write_leaderboard(array $data): bool {
    $handle = fopen(LEADERBOARD_FILE, 'c+');
    if ($handle === false) return false;
    $ok = flock($handle, LOCK_EX);
    if ($ok) {
        ftruncate($handle, 0);
        rewind($handle);
        $ok = fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) !== false;
        fflush($handle);
        flock($handle, LOCK_UN);
    }
    fclose($handle);
    return $ok;
}

function public_profile(array $user): array {
    return [
        'nickname' => $user['nickname'],
        'successes' => (int) $user['successes'],
        'points' => (int) $user['points'],
        'maxN' => (int) $user['maxN'],
    ];
}

function current_user(array $data): ?array {
    $key = $_SESSION['neural_leaderboard_user'] ?? null;
    return is_string($key) && isset($data['users'][$key]) ? $data['users'][$key] : null;
}

function tier(int $maxN): string {
    if ($maxN >= 10) return 'Gold';
    if ($maxN >= 7) return 'Silver';
    return 'Bronze';
}

$input = request_data();
$action = is_string($input['action'] ?? null) ? $input['action'] : ($_GET['action'] ?? 'leaderboard');
$data = leaderboard_data();

if ($action === 'session') {
    $user = current_user($data);
    reply(['ok' => true, 'user' => $user ? public_profile($user) : null]);
}

if ($action === 'login') {
    $nickname = valid_nickname($input['nickname'] ?? null);
    $pin = valid_pin($input['pin'] ?? null);
    if ($nickname === null || $pin === null) reply(['ok' => false, 'message' => 'Use a 3–16 character nickname and exactly four PIN digits.'], 422);
    $key = strtolower($nickname);
    $created = false;
    if (!isset($data['users'][$key])) {
        $created = true;
        $data['users'][$key] = ['nickname' => $nickname, 'pinHash' => password_hash($pin, PASSWORD_DEFAULT), 'successes' => 0, 'points' => 0, 'maxN' => 0, 'completed' => []];
        if (!write_leaderboard($data)) reply(['ok' => false, 'message' => 'Server could not save the account.'], 500);
    } elseif (!password_verify($pin, $data['users'][$key]['pinHash'])) {
        reply(['ok' => false, 'message' => 'That PIN does not match this nickname.'], 401);
    }
    $_SESSION['neural_leaderboard_user'] = $key;
    reply(['ok' => true, 'user' => public_profile($data['users'][$key]), 'created' => $created]);
}

if ($action === 'logout') {
    unset($_SESSION['neural_leaderboard_user']);
    reply(['ok' => true]);
}

if ($action === 'record') {
    $key = $_SESSION['neural_leaderboard_user'] ?? null;
    $n = filter_var($input['n'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 3, 'max_range' => 10]]);
    $seed = valid_seed($input['seed'] ?? null);
    if (!is_string($key) || !isset($data['users'][$key])) reply(['ok' => false, 'message' => 'Log in to record a success.'], 401);
    if ($n === false || $seed === null) reply(['ok' => false, 'message' => 'Invalid leaderboard result.'], 422);
    $challenge = hash('sha256', $n . "\0" . $seed);
    $user = &$data['users'][$key];
    $alreadyRecorded = isset($user['completed'][$challenge]);
    if (!$alreadyRecorded) {
        $user['completed'][$challenge] = true;
        $user['successes'] += 1;
        $user['points'] += $n * ($n - 1);
        $user['maxN'] = max($user['maxN'], $n);
        if (!write_leaderboard($data)) reply(['ok' => false, 'message' => 'Server could not record the result.'], 500);
    }
    reply(['ok' => true, 'alreadyRecorded' => $alreadyRecorded, 'user' => public_profile($user)]);
}

if ($action === 'leaderboard') {
    $rows = [];
    foreach ($data['users'] as $user) if ((int) $user['successes'] > 0) $rows[] = public_profile($user) + ['tier' => tier((int) $user['maxN'])];
    usort($rows, static fn(array $a, array $b): int => $b['points'] <=> $a['points'] ?: $b['maxN'] <=> $a['maxN'] ?: $a['successes'] <=> $b['successes'] ?: strcasecmp($a['nickname'], $b['nickname']));
    reply(['ok' => true, 'rows' => array_slice($rows, 0, 25)]);
}

reply(['ok' => false, 'message' => 'Unknown request.'], 400);
