# HANDOFF — Heading Jump Fix

<!-- updated: 2026-08-19 -->

## Product

| Field | Value |
|---|---|
| ID | `k-tech-heading-jump-fix` |
| Name | Heading Jump Fix |
| Author | K-Tech Studio |
| Repo | `crossbeat461-a11y/k-tech-heading-jump-fix` |
| Version | 1.0.0 (stable) |

## README (community listing)

`README.md` is user-facing. [community.obsidian.md](https://community.obsidian.md/plugins/k-tech-heading-jump-fix) shows it as the plugin overview. Keep install steps as Community plugins only. Do not put `npm`, manual plugin-folder copy, `HANDOFF.md`, or test fixtures in the README.

Build and local deploy stay in this file.

## Community listing decision (Phase 4)

Stay listed on community.obsidian.md. After each GitHub Release, paste `LISTING.md` into the developer dashboard if the Overview is stale.

## Build

```bash
cd c:\Github\k-tech-heading-jump-fix
npm install
npm run build          # writes main.js
npm run dev            # watch mode
```

Deploy to Mybox (manual copy):

```
c:\Users\chuyo\Dropbox\アプリ\remotely-save\Mybox\.obsidian\plugins\k-tech-heading-jump-fix\
  main.js, manifest.json, styles.css
```

Enable in Settings → Community plugins → Heading Jump Fix.

## Architecture

```
src/main.ts              Plugin entry, settings, command, theme CSS class
src/settings.ts          Settings + tab UI
src/heading-resolver.ts  metadataCache → line; outline DOM helpers
src/jump-engine.ts       scroll + rAF retry + viewport verify + backoff
src/outline-hook.ts      Outline click capture (popout-safe)
src/link-hook.ts         Wikilink + outgoing/backlink pane clicks
src/theme-scroll.ts      Apply instant-scroll body class (popout-safe)
src/debug.ts             Console debug log (opt-in)
styles.css               Override theme scroll-behavior: smooth
```

## Phase roadmap

| Phase | Version | Scope | Status |
|---|---|---|---|
| 1 | 0.1.0 | Outline auto-retry MVP | **Done** |
| 2 | 0.2.0 | Viewport verify, wikilink hook, link pane | **Done** (shipped in 1.0.0) |
| 3 | 0.3.0 | Theme scroll-behavior CSS, debug log | **Done** |
| 4 | 1.0.0 | Stabilize, community listing decision | **Done** |

## Test

Fixture: `test/fixtures/long-note.md` — copy into vault manually.

Checklist (manual in Obsidian):

- [ ] Outline one-click jump on long note
- [ ] First jump after app cold start
- [ ] Duplicate heading (second "Duplicate name")
- [ ] `[[note#heading]]` in Live Preview
- [ ] Heading click in Outgoing links / Backlinks
- [ ] Plugin disabled → no hook
- [ ] Coexists with TableCSV, Tasks, Dataview
- [ ] Theme with `scroll-behavior: smooth` still lands on the heading (override ON)
- [ ] Debug log ON → `[Heading Jump Fix]` lines in developer console

## Release

Same as TableCSV: tag `1.0.0` → `.github/workflows/release.yml` → GitHub Release with attestation.

Do not include "Obsidian" in `manifest.json` description.
