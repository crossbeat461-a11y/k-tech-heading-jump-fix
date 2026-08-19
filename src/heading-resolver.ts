import type { App, HeadingCache, TFile } from "obsidian";

export interface JumpTarget {
  file: TFile;
  headingText: string;
  level: number;
  occurrenceIndex?: number;
}

export interface ResolvedHeading {
  line: number;
  heading: HeadingCache;
}

export function normalizeHeadingText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function resolveHeading(
  app: App,
  target: JumpTarget
): ResolvedHeading | null {
  const cache = app.metadataCache.getFileCache(target.file);
  const headings = cache?.headings;
  if (!headings?.length) return null;

  const normalized = normalizeHeadingText(target.headingText);
  const matches = headings.filter(
    (h) =>
      h.level === target.level &&
      normalizeHeadingText(h.heading) === normalized
  );

  if (!matches.length) return null;

  const occurrence = target.occurrenceIndex ?? 0;
  const heading = matches[Math.min(occurrence, matches.length - 1)];
  return { line: heading.position.start.line, heading };
}

export function resolveHeadingByText(
  app: App,
  file: TFile,
  headingText: string,
  occurrenceIndex = 0
): ResolvedHeading | null {
  const cache = app.metadataCache.getFileCache(file);
  const headings = cache?.headings;
  if (!headings?.length) return null;

  const normalized = normalizeHeadingText(headingText);
  const matches = headings.filter(
    (h) => normalizeHeadingText(h.heading) === normalized
  );
  if (!matches.length) return null;

  const heading = matches[Math.min(occurrenceIndex, matches.length - 1)];
  return { line: heading.position.start.line, heading };
}

export function findHeadingAtLine(
  app: App,
  file: TFile,
  line: number
): ResolvedHeading | null {
  const cache = app.metadataCache.getFileCache(file);
  const headings = cache?.headings;
  if (!headings?.length) return null;

  let best: HeadingCache | null = null;
  for (const h of headings) {
    const hLine = h.position.start.line;
    if (hLine <= line && (!best || hLine > best.position.start.line)) {
      best = h;
    }
  }

  if (!best) return null;
  return { line: best.position.start.line, heading: best };
}

export function countPriorMatchingHeadings(
  item: HTMLElement,
  headingText: string,
  level: number,
  outlineRoot: Element
): number {
  const items = Array.from(outlineRoot.querySelectorAll(".tree-item"));
  const index = items.indexOf(item);
  if (index < 0) return 0;

  let count = 0;
  for (let i = 0; i < index; i++) {
    const other = items[i];
    if (
      getOutlineItemLevel(other) === level &&
      getOutlineItemText(other) === headingText
    ) {
      count++;
    }
  }
  return count;
}

export function getOutlineItemLevel(item: Element): number {
  for (const el of [item, item.querySelector(".tree-item-self")]) {
    if (!el) continue;
    const modLevel = Array.from(el.classList).find((c) =>
      c.startsWith("mod-heading-")
    );
    if (modLevel) {
      const n = parseInt(modLevel.replace("mod-heading-", ""), 10);
      if (Number.isFinite(n)) return Math.min(Math.max(n, 1), 6);
    }
  }

  const self = item.querySelector(".tree-item-self");
  const indentLevels = self?.querySelectorAll(".tree-item-indent-level");
  if (indentLevels && indentLevels.length > 0) {
    return Math.min(indentLevels.length, 6);
  }

  const indent = item.querySelector(".tree-item-indent");
  if (indent) {
    const levels = indent.querySelectorAll(".tree-item-indent-level");
    if (levels.length > 0) return Math.min(levels.length, 6);
  }

  return 1;
}

export function getOutlineItemText(item: Element): string {
  const inner = item.querySelector(".tree-item-inner");
  return normalizeHeadingText(inner?.textContent ?? "");
}
