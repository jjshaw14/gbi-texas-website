# Review endpoint (feedback-server)

Receives the client's answers from the review layer on the preview site, saves each one as a
JSON file, and emails it to you. It is a single PHP file; GitHub Pages can't run PHP, so it
lives on the Cloudways server and the preview site posts to it.

```
Client's browser (preview on GitHub Pages)  --POST-->  feedback.php (Cloudways)
                                                         ├─ saves data/submission-*.json
                                                         └─ emails you
```

## Deploy on Cloudways (about 10 minutes)

1. **Pick a spot.** Any Cloudways PHP application works. A new folder inside it keeps this
   separate, for example `public_html/gbi-review/`.
2. **Upload two files** there (SFTP, or the Cloudways file manager):
   - `feedback.php`
   - `feedback-config.php`, made by copying `feedback-config.sample.php` and filling it in:
     - `to`: where the emails go.
     - `from`: an address on a domain the server may send as (see "Email" below).
     - `allowed_origins`: leave `https://jjshaw14.github.io` (no trailing slash). Add any other
       address the preview is served from.
     - `export_key`: a long random string. Generate one with
       `php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"`
     - `store` (recommended): a folder **above** `public_html`, so saved answers are never
       reachable from the web. With `feedback.php` at `public_html/gbi-review/`, use
       `dirname(__DIR__, 2) . '/private_html/gbi-review-data'` (Cloudways' `private_html` folder sits beside `public_html` and isn't served). This matters on the Lightning (Nginx) stack,
       which ignores `.htaccess`. If you leave `store` out, `data/` is created next to
       `feedback.php` and protected only by an `.htaccess` (Hybrid/Apache stacks).
3. **Check it responds.** Open `https://<your-app-domain>/gbi-review/feedback.php`. You should
   see `{"ok":true,"service":"gbi-austin-review"}`.
4. **Point the site at it.** In `site/assets/js/review-items.js` set
   `endpoint: 'https://<your-app-domain>/gbi-review/feedback.php'`, then run
   `python3 scripts/build-static.py` and push.
5. **Send a test** from the preview (answer one item, press Send feedback). Look for the
   email, or read it back (below).

## Updating feedback.php

When `feedback.php` itself changes in the repo (for example, to accept wording approvals), upload
the new copy over the one on the server. Leave `feedback-config.php` alone: it holds your
email address and export key, and it is not in the repo.

## Reading the answers

```
https://<your-app-domain>/gbi-review/feedback.php?action=export&key=<export_key>
```

returns every submission as JSON. Anyone with that link and key can read the feedback, so
treat the key like a password and rotate it (edit `feedback-config.php`) when you're done.

## Email

The saved JSON file is always the source of truth; email is best effort. PHP's `mail()` on a
Cloudways server often needs help to land in an inbox: enable the **Elastic Email** (or another
SMTP) add-on in Cloudways, and use a `from` address on a domain whose SPF/DKIM are set up for
it. If emails don't show up, the export link above still has everything.

## Safeguards built in

- Only origins listed in `allowed_origins` may post (others get 403).
- A hidden "honeypot" field drops most bots; submissions over 200 KB are refused; 30 per hour
  per IP (`rate_per_hour`).
- Only known fields are kept, trimmed and stripped of control characters; mail headers can't be
  injected into.
- `feedback-config.php` and `data/` are git-ignored. Never commit them: the repo is public.

## Test it locally

```
GBI_FEEDBACK_CONFIG=/path/to/test-config.php php -S localhost:8093 -t feedback-server
```

## At launch

Build with `python3 scripts/build-static.py --production`: the markers, popups, panel and
their scripts are left out of the site entirely. Then delete `feedback-server` from Cloudways.
