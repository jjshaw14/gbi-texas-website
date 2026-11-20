<?php
/**
 * Copy this file to feedback-config.php (same folder as feedback.php) and fill it in.
 * feedback-config.php is git-ignored: it holds your email address and the export key,
 * so it must never be committed to the (public) repo.
 */
return [
    // Where each submission is emailed. Leave empty to only save files.
    'to' => 'you@example.com',

    // Sender address. Use an address on the domain the server sends mail for, so
    // it isn't marked as spam. Empty = no-reply@<this host>.
    'from' => '',

    // Websites allowed to post here (exact origins, no trailing slash).
    'allowed_origins' => [
        'https://jjshaw14.github.io',
    ],

    // A long random string. Anyone who knows it can read every submission through
    //   feedback.php?action=export&key=THE_KEY
    // Generate one with:  php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
    // Empty = export disabled.
    'export_key' => '',

    // Where submissions are saved. Keep it outside the web root. If feedback.php sits at
    // <app>/public_html/gbi-review/, this puts the data in the app's private_html folder, above public_html:
    // 'store' => dirname(__DIR__, 2) . '/private_html/gbi-review-data',
];
