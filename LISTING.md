# Listing copy (for community.obsidian.md → Edit listing)

Paste these values in the developer dashboard.

## Important (automated review)

- **`manifest.json` → `description` must NOT contain the word `Obsidian`.**
- **`authorUrl`** must be a GitHub **profile** URL, not the plugin repository.
- **`fundingUrl`** is set to Buy Me a Coffee (shows in plugin browser).
- **GitHub Release title** must include the version (e.g. `Heading Jump Fix 0.1.0`). CI sets this on tag push.
- **Release assets** (`main.js`, `manifest.json`, `styles.css`) are published via GitHub Actions with **artifact attestations**.

## Short description

```
Auto-correct scroll position after outline or heading clicks so one click is enough.
```

## Longer description (if available)

```
Heading Jump Fix helps when clicking a heading in the Outline sidebar moves the cursor but does not scroll the editor into view — especially on long notes or right after opening the app.

After each outline click, the plugin waits briefly, then scrolls to the correct heading line using metadata from your vault. Duplicate headings are matched by order in the outline. Retry delay and retry count are configurable.

Fully offline — no network requests. Does not fix general UI lag or sync delay. Wikilink clicks in note body are planned for a future update.

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
