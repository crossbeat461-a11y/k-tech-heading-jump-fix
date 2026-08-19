# Changelog

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
