# Listing copy (for community.obsidian.md → Edit listing)

Paste these values in the developer dashboard.

## Important (automated review)

- **`manifest.json` → `description` must NOT contain the word `Obsidian`.**
- **`authorUrl`** must be a GitHub **profile** URL, not the plugin repository.
- **`fundingUrl`** is set to Buy Me a Coffee (shows in plugin browser).
- **GitHub Release title** must include the version (e.g. `Heading Jump Fix 1.2.1`). CI sets this on tag push.
- **Release assets** (`main.js`, `manifest.json`, `styles.css`) are published via GitHub Actions with **artifact attestations**.
- Short description: **200 characters or fewer**. Longer description: **1000 characters or fewer** (spaces included).

## Short description

```
Auto-correct scroll after outline, search, wikilink, heading, and block-reference jumps from click or keyboard, including Reading view. Unfolds folded headings at the jump target.
```

The **Overview** tab on the plugin page is the GitHub `README.md` (not this listing block). After changing the README, wait for the directory to refresh, or re-save the listing in the developer dashboard.

## Longer description (if available)

```
Heading Jump Fix helps when a heading in the Outline sidebar, a match in Search, a [[wikilink#heading]] in the note, a [[note#^block]] block reference, or a heading in Outgoing links / Backlinks moves the cursor but does not scroll into view — especially on long notes, after opening the app, or with a split editor + Reading layout.

After each jump, the plugin waits, then unfolds a folded target and scrolls to the heading or block. Outline confirm with Enter and Follow link under cursor use the same correction as a click. In Reading view it scrolls the preview; in Live Preview it scrolls the editor. Duplicate headings are matched by order in the outline. Retry delay, retry count, scroll-to-center, and theme scroll-behavior override are configurable.

It does not turn non-link headings in Reading view into a table of contents. Fully offline — no network requests. Does not fix general UI lag or sync delay.

Support development via Buy Me a Coffee (link in plugin settings and manifest).
```

## Suggested categories / tags

- Navigation
- Outline
- Utility
- Buy Me a Coffee

## Screenshot to upload

Upload this file on Edit listing → Screenshots:

`images/screenshot.png` in the GitHub repo

Direct link after release:

`https://github.com/crossbeat461-a11y/k-tech-heading-jump-fix/raw/main/images/screenshot.png`
