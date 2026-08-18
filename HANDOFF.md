# HANDOFF — Heading Jump Fix

<!-- updated: 2026-08-19 -->

## Product

| Field | Value |
|---|---|
| ID | `k-tech-heading-jump-fix` |
| Name | Heading Jump Fix |
| Author | K-Tech Studio |
| Repo | `crossbeat461-a11y/k-tech-heading-jump-fix` (not pushed yet) |
| Version | 0.1.0 (Phase 1) |

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
src/main.ts              Plugin entry, settings, command
src/settings.ts          Settings + tab UI
src/heading-resolver.ts  metadataCache → line; outline DOM helpers
src/jump-engine.ts       setCursor + scrollIntoView + rAF retry
src/outline-hook.ts      Outline click capture (Phase 1 scope)
```

## Phase roadmap

| Phase | Version | Scope | Status |
|---|---|---|---|
| 1 | 0.1.0 | Outline auto-retry MVP | **Done** |
| 2 | 0.2.0 | Viewport verify, wikilink hook, link pane | Planned |
| 3 | 0.3.0 | Theme scroll-behavior CSS, debug log | Planned |
| 4 | 1.0.0 | Stabilize, community listing decision | Planned |

## Phase 2 entry points

- `src/link-hook.ts` — wikilink click in Live Preview
- Extend `jump-engine.ts` with visibility check (`coordsAtPos` / editor API)
- Settings: body link fix, scroll position, max retries with backoff

## Test

Fixture: `test/fixtures/long-note.md` — copy into vault manually.

Checklist (manual in Obsidian):

- [ ] Outline one-click jump on long note
- [ ] First jump after app cold start
- [ ] Duplicate heading (second "Duplicate name")
- [ ] Plugin disabled → no hook
- [ ] Coexists with TableCSV, Tasks, Dataview

## Release

Same as TableCSV: tag `0.1.0` → `.github/workflows/release.yml` → GitHub Release with attestation.

Do not include "Obsidian" in `manifest.json` description.
