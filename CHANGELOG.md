# Changelog

## 1.2.1 — 2026-09-09

### Fixed

- Community review: declare `minAppVersion` 1.8.7 for `getLanguage()`
- Community review: cross-window `instanceOf(win.HTMLElement)` (no extra type assertion)

## 1.2.0 — 2026-09-09

### Added

- Reading view: after Outline or heading / block-link jumps, scroll the preview to the target
- Split layout: correct both the editor pane and the Reading pane when the same note is open

### Notes

- Reading-view heading clicks that are not links stay unchanged (headings are not turned into a table of contents)
- Remaining work (search, keyboard, unfold) is listed in `ROADMAP.md`

## 1.1.1 — 2026-08-31

### Fixed

- Community review: no `console.log` (debug toggle removed from settings)
- Community review: type-safe block-id lookup (no `any` access)
- Community review: instant-scroll CSS without `!important`

## 1.1.0 — 2026-08-26

### Added

- Correct scroll after `[[note#^block]]` clicks (same retry path as heading jumps)
- Works in the note and in Outgoing links / Backlinks (uses the existing wikilink / link-pane settings)

### Notes

- Reading-view heading clicks that are not links are unchanged

## 1.0.0 — 2026-08-19

Stable release. Includes Phase 2 (wikilink / viewport verify / link pane) and Phase 4 (stabilize).

### Added

- In-note `[[wikilink#heading]]` click correction (Live Preview and preview links)
- Outgoing links / Backlinks pane heading click correction
- Viewport check after each scroll pass; stop early when the heading is on screen
- Exponential backoff on extra retry passes
- Settings: wikilink fix, link pane fix, scroll heading to center
- Pop-out window click listeners (outline and links)

### Notes

- Community listing stays on community.obsidian.md; update copy from `LISTING.md` after the GitHub Release
- Block references (`#^`) are not corrected
- Reading-view heading clicks that are not links are unchanged

## 0.3.0 — 2026-08-19

Phase 3: theme scroll-behavior override and debug log.

### Added

- Setting **Override theme scroll-behavior** (default ON) — forces instant editor scroll so theme `scroll-behavior: smooth` does not miss the heading
- Setting **Debug log** (default OFF) — writes jump details to the developer console (no network)

### Notes

- Wikilink / viewport verify (Phase 2) remains planned
- Outline DOM may change in future app versions

## 0.1.3 — 2026-08-19

### Fixed

- Remove redundant "General" settings heading (review feedback)

## 0.1.2 — 2026-08-19

### Fixed

- Remove plugin name from settings section headings (review feedback)
- Use instance method `treeItem.instanceOf(HTMLElement)` for cross-window checks

## 0.1.1 — 2026-08-19

### Fixed

- Obsidian 1.13+ declarative settings (`getSettingDefinitions`) for global settings search
- Settings headings use `Setting.setHeading()` for consistent UI
- Popout-window-safe timers and `Element.instanceOf()` checks
- Replace deprecated `builtin-modules` with `node:module` in esbuild config

## 0.1.0 — 2026-08-19

Phase 1 (MVP): outline click auto-retry.

### Added

- Outline sidebar click hook (capture phase) with configurable delay and retry count
- Heading resolution via `metadataCache.getFileCache().headings`
- Duplicate heading disambiguation by document order in outline DOM
- `Jump to heading at cursor line reliably` command (debug / manual use)
- Settings: enable, outline fix, retry delay (ms), retry count
- Buy Me a Coffee modal on first install and on version update
- Buy Me a Coffee link in plugin settings

### Outline DOM selectors (Obsidian 1.5+)

- Leaf: `.workspace-leaf-content[data-type="outline"]`
- Item: `.tree-item` / `.tree-item-self` / `.tree-item-inner`
- Level: `.mod-heading-N` or `.tree-item-indent-level` count

### Known limits

- Does not fix general UI lag or Dropbox sync delay
- Does not yet handle in-note wikilink clicks (Phase 2)
- Outline DOM may change in future app versions
