# Obsidian community submission checklist

Use **release `0.1.0` or later** (GitHub Actions + artifact attestations).

## Before submitting a new version

1. Bump `version` in `manifest.json` and `versions.json` (must match the git tag).
2. Ensure `description` does **not** include the word **Obsidian**.
3. Run `npm run build` and commit `main.js`.
4. Commit and push to `main`.
5. Create and push tag: `git tag 0.1.0 && git push origin 0.1.0`
6. Wait for [Release workflow](https://github.com/crossbeat461-a11y/k-tech-heading-jump-fix/actions) to finish.
7. Update listing from `LISTING.md` on [community.obsidian.md](https://community.obsidian.md).

## Expected scan results

| Check | Expected |
|-------|----------|
| MANIFEST | Pass — no "Obsidian" in description |
| RELEASES | Pass — release title includes version; attestations present |
| NETWORK | Pass — no remote requests in plugin code |

## Release assets (auto-uploaded)

- `main.js`
- `manifest.json`
- `styles.css`
