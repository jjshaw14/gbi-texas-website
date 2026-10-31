#!/usr/bin/env python3
"""
Build a static HTML export of site/ into docs/, for GitHub Pages.

The site's only PHP is one shared footer include per page
(partials/footer.php), which uses absolute "/..." paths since it's
included via DOCUMENT_ROOT. This script inlines that footer into each
page, rewriting its absolute paths to the correct relative prefix for
that page's depth, then rewrites internal *.php links to *.html and
writes the result under docs/ as plain .html files.
"""
import re
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "docs"

INCLUDE_RE = re.compile(
    r"<\?php\s+include\s+\$_SERVER\['DOCUMENT_ROOT'\]\s*\.\s*'/partials/footer\.php';\s*\?>"
)

def load_footer(prefix):
    text = (SITE / "partials" / "footer.php").read_text(encoding="utf-8")
    # Strip the leading <?php /** ... */ ?> docblock comment.
    # The comment itself mentions "?>", so anchor on the closing "*/ ?>".
    text = re.sub(r"^<\?php\s*/\*\*.*?\*/\s*\?>\s*", "", text, count=1, flags=re.DOTALL)
    # Rewrite absolute root paths to the page's relative prefix.
    text = re.sub(r'(href|src)="/', rf'\1="{prefix}', text)
    return text

def php_links_to_html(text):
    def repl(m):
        url = m.group(2)
        if url.startswith(("http://", "https://", "mailto:", "tel:", "sms:")):
            return m.group(0)
        return f'{m.group(1)}="{url[:-4]}.html{m.group(3)}"'
    # href="path.php" or href="path.php#anchor"
    return re.sub(r'(href)="([^"]+?)\.php(#[^"]*)?"',
                  lambda m: f'{m.group(1)}="{m.group(2)}.html{m.group(3) or ""}"', text)

def convert(php_path: Path):
    rel = php_path.relative_to(SITE)
    depth = len(rel.parts) - 1  # 0 for root-level pages, 1 for about/services/projects/*
    prefix = "../" * depth
    text = php_path.read_text(encoding="utf-8")
    text = INCLUDE_RE.sub(load_footer(prefix), text)
    text = php_links_to_html(text)
    out_path = OUT / rel.with_suffix(".html")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")
    return out_path

def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    php_files = sorted(SITE.rglob("*.php"))
    php_files = [f for f in php_files if "partials" not in f.parts]
    for f in php_files:
        convert(f)
    print(f"Converted {len(php_files)} pages.")

    shutil.copytree(SITE / "assets", OUT / "assets")
    print("Copied assets/.")

    # GitHub Pages otherwise runs Jekyll and ignores files/folders starting with "_".
    (OUT / ".nojekyll").touch()

if __name__ == "__main__":
    main()
