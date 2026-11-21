<?php
/**
 * GBI Austin client-review endpoint.
 *
 * The review layer on the preview site POSTs the client's answers here. Each
 * submission is (1) saved as a JSON file under data/ and (2) emailed to the
 * address in feedback-config.php. An authorised caller can also read everything
 * back with GET ?action=export&key=...
 *
 * Deploy: upload this file and feedback-config.php (copied from
 * feedback-config.sample.php and filled in) to a PHP host. See README.md.
 */
declare(strict_types=1);

// ---- Config -------------------------------------------------------------
$cfgFile = getenv('GBI_FEEDBACK_CONFIG') ?: __DIR__ . '/feedback-config.php';
$cfg = is_file($cfgFile) ? (array) require $cfgFile : [];
$cfg += [
    'to'              => '',                    // who gets the email; empty = save only
    'from'            => '',                    // sender address on your domain; empty = no-reply@<host>
    'allowed_origins' => [],                    // e.g. ['https://jjshaw14.github.io']
    'export_key'      => '',                    // long random string; empty = export disabled
    'store'           => __DIR__ . '/data',
    'max_bytes'       => 900000,
    'rate_per_hour'   => 30,
    'subject_prefix'  => '[GBI Austin review]',
];

// ---- CORS + headers -----------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$originAllowed = $origin !== '' && in_array($origin, $cfg['allowed_origins'], true);
if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $code, array $body): never
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(mixed $v, int $max = 4000): string
{
    $s = is_scalar($v) ? (string) $v : '';
    $s = preg_replace('/[^\P{C}\n\t]/u', '', $s) ?? '';   // drop control characters
    return mb_substr(trim($s), 0, $max);
}

function oneLine(string $s): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $s) ?? '');   // header-injection guard
}

function storeDir(array $cfg): string
{
    $dir = rtrim($cfg['store'], '/');
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    // Keep the data folder from being served over the web.
    if (!is_file($dir . '/.htaccess')) {
        file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
    }
    if (!is_file($dir . '/index.html')) {
        file_put_contents($dir . '/index.html', '');
    }
    return $dir;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ---- Export (read back submissions) -------------------------------------
if ($method === 'GET') {
    if (($_GET['action'] ?? '') !== 'export') {
        respond(200, ['ok' => true, 'service' => 'gbi-austin-review']);
    }
    $key = (string) ($_GET['key'] ?? '');
    if ($cfg['export_key'] === '' || !hash_equals($cfg['export_key'], $key)) {
        respond(403, ['ok' => false, 'error' => 'forbidden']);
    }
    $dir = storeDir($cfg);
    $files = glob($dir . '/submission-*.json') ?: [];
    sort($files);
    $all = [];
    foreach ($files as $f) {
        $j = json_decode((string) file_get_contents($f), true);
        if (is_array($j)) {
            $all[] = $j;
        }
    }
    respond(200, ['ok' => true, 'count' => count($all), 'submissions' => $all]);
}

if ($method !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method not allowed']);
}

// ---- Submit -------------------------------------------------------------
if ($origin !== '' && !$originAllowed) {
    respond(403, ['ok' => false, 'error' => 'origin not allowed']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $cfg['max_bytes']) {
    respond(413, ['ok' => false, 'error' => 'too large']);
}
if (!empty($_POST['website'] ?? '')) {                 // honeypot: bots fill this in
    respond(200, ['ok' => true]);
}
$raw = (string) ($_POST['payload'] ?? file_get_contents('php://input'));
if (strlen($raw) > $cfg['max_bytes']) {
    respond(413, ['ok' => false, 'error' => 'too large']);
}
$in = json_decode($raw, true);
if (!is_array($in) || !isset($in['answers']) || !is_array($in['answers'])) {
    respond(400, ['ok' => false, 'error' => 'bad payload']);
}

$dir = storeDir($cfg);

// Light rate limit per IP: N submissions per hour.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = $dir . '/rate-' . md5($ip) . '.json';
$now = time();
$hits = array_values(array_filter(
    is_file($rateFile) ? (array) json_decode((string) file_get_contents($rateFile), true) : [],
    static fn($t) => is_int($t) && $t > $now - 3600
));
if (count($hits) >= $cfg['rate_per_hour']) {
    respond(429, ['ok' => false, 'error' => 'too many submissions']);
}
$hits[] = $now;
file_put_contents($rateFile, json_encode($hits));

// Rebuild the record from known fields only.
$reviewer = is_array($in['reviewer'] ?? null) ? $in['reviewer'] : [];
$email = clean($reviewer['email'] ?? '', 200);
$record = [
    'id'          => date('Ymd-His') . '-' . bin2hex(random_bytes(3)),
    'receivedAt'  => date('c'),
    'submittedAt' => clean($in['submittedAt'] ?? '', 40),
    'site'        => clean($in['site'] ?? '', 300),
    'page'        => clean($in['page'] ?? '', 200),
    'reviewer'    => [
        'name'  => clean($reviewer['name'] ?? '', 200),
        'email' => filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '',
    ],
    'answers'     => [],
    'general'     => [],
];
foreach (array_slice($in['answers'], 0, 100) as $a) {
    if (!is_array($a)) {
        continue;
    }
    $record['answers'][] = [
        'id'      => clean($a['id'] ?? '', 80),
        'label'   => clean($a['label'] ?? '', 200),
        'where'   => clean($a['where'] ?? '', 200),
        'current' => clean($a['current'] ?? '', 600),
        'status'  => in_array($a['status'] ?? '', ['ok', 'change', 'skip', 'not reviewed'], true) ? $a['status'] : 'not reviewed',
        'change'  => clean($a['change'] ?? ''),
        'note'    => clean($a['note'] ?? ''),
    ];
}
$record['sections'] = [];
foreach (array_slice(is_array($in['sections'] ?? null) ? $in['sections'] : [], 0, 800) as $sec) {
    if (!is_array($sec)) {
        continue;
    }
    $record['sections'][] = [
        'page'     => clean($sec['page'] ?? '', 120),
        'id'       => clean($sec['id'] ?? '', 120),
        'heading'  => clean($sec['heading'] ?? '', 300),
        'hash'     => clean($sec['hash'] ?? '', 20),
        'status'   => in_array($sec['status'] ?? '', ['approved', 'edited', 'outdated', 'not reviewed'], true) ? $sec['status'] : 'not reviewed',
        'original' => clean($sec['original'] ?? '', 12000),
        'edited'   => clean($sec['edited'] ?? '', 12000),
    ];
}
foreach (array_slice(is_array($in['general'] ?? null) ? $in['general'] : [], 0, 50) as $g) {
    if (is_array($g)) {
        $record['general'][] = ['page' => clean($g['page'] ?? '', 200), 'text' => clean($g['text'] ?? '')];
    }
}

// 1) Save
$file = $dir . '/submission-' . $record['id'] . '.json';
if (file_put_contents($file, json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) === false) {
    respond(500, ['ok' => false, 'error' => 'could not save']);
}

// 2) Email (best effort; the saved file is the source of truth)
$emailed = false;
if ($cfg['to'] !== '') {
    $tag = ['ok' => 'CONFIRMED', 'change' => 'CHANGE', 'skip' => 'NOT SURE', 'not reviewed' => 'NOT REVIEWED'];
    $lines = [
        'GBI Austin website review',
        'Received: ' . $record['receivedAt'],
        'From: ' . ($record['reviewer']['name'] ?: '(no name)') . ($record['reviewer']['email'] ? ' <' . $record['reviewer']['email'] . '>' : ''),
        'Page they were on: ' . $record['page'],
        '',
    ];
    foreach ($record['answers'] as $a) {
        $lines[] = '[' . $tag[$a['status']] . '] ' . $a['label'] . ' (' . $a['where'] . ')';
        $lines[] = '   Site says: ' . $a['current'];
        if ($a['change'] !== '') {
            $lines[] = '   Should say: ' . $a['change'];
        }
        if ($a['note'] !== '') {
            $lines[] = '   Note: ' . $a['note'];
        }
        $lines[] = '';
    }
    if ($record['sections']) {
        $by = [];
        foreach ($record['sections'] as $sc) {
            $by[$sc['page']][] = $sc;
        }
        $lines[] = 'WORDING';
        foreach ($by as $pg => $rows) {
            $cnt = static fn(string $st): int => count(array_filter($rows, static fn($r) => $r['status'] === $st));
            $lines[] = '   ' . $pg . ': ' . $cnt('approved') . ' approved, ' . $cnt('edited') . ' edited, ' . ($cnt('not reviewed') + $cnt('outdated')) . ' not reviewed';
        }
        $lines[] = '';
        foreach ($record['sections'] as $sc) {
            if ($sc['status'] === 'edited') {
                $lines[] = '[EDITED] ' . $sc['page'] . ' > ' . $sc['heading'];
                $lines[] = '   Original: ' . str_replace("\n", "\n   ", $sc['original']);
                $lines[] = '   New: ' . str_replace("\n", "\n   ", $sc['edited']);
                $lines[] = '';
            }
        }
    }
    if ($record['general']) {
        $lines[] = 'Other comments';
        foreach ($record['general'] as $g) {
            $lines[] = '   ' . $g['page'] . ': ' . $g['text'];
        }
        $lines[] = '';
    }
    $lines[] = 'Saved as ' . basename($file);

    $host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
    $from = oneLine($cfg['from'] !== '' ? $cfg['from'] : 'no-reply@' . $host);
    $headers = ['From: ' . $from, 'Content-Type: text/plain; charset=UTF-8'];
    if ($record['reviewer']['email'] !== '') {
        $headers[] = 'Reply-To: ' . oneLine($record['reviewer']['email']);
    }
    $changes = count(array_filter($record['answers'], static fn($a) => $a['status'] === 'change'))
        + count(array_filter($record['sections'], static fn($sc) => $sc['status'] === 'edited'));
    $subject = oneLine($cfg['subject_prefix'] . ' ' . ($record['reviewer']['name'] ?: 'New feedback') . ($changes ? " ($changes change" . ($changes > 1 ? 's' : '') . ')' : ''));
    $emailed = @mail($cfg['to'], $subject, implode("\n", $lines), implode("\r\n", $headers));
}

respond(200, ['ok' => true, 'id' => $record['id'], 'emailed' => $emailed]);
