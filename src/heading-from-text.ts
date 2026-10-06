import type { HeadingCache } from "obsidian";

export function normalizeHeadingText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

const ATX = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const FENCE = /^( {0,3})(`{3,}|~{3,})/;

function loc(line: number): HeadingCache["position"]["start"] {
  return { line, col: 0, offset: 0 };
}

function toHeading(heading: string, level: number, line: number): HeadingCache {
  const start = loc(line);
  return {
    heading,
    level,
    position: { start, end: start },
  };
}

/**
 * ATX headings only. Used when metadataCache has no headings
 * (Markdown opened outside the vault).
 */
export function headingsFromMarkdown(text: string): HeadingCache[] {
  const lines = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
  const out: HeadingCache[] = [];
  let i = 0;
  if (lines[0] === "---") {
    i = 1;
    while (i < lines.length && lines[i] !== "---") {
      i++;
    }
    if (i < lines.length) i++;
  }

  let fenceMarker: string | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(FENCE);
    if (fenceMarker) {
      const close = line.match(FENCE);
      if (close && close[2][0] === fenceMarker[0] && close[2].length >= fenceMarker.length) {
        fenceMarker = null;
      }
      continue;
    }
    if (fence) {
      fenceMarker = fence[2];
      continue;
    }
    const atx = line.match(ATX);
    if (!atx) continue;
    const heading = normalizeHeadingText(atx[2]);
    if (!heading) continue;
    out.push(toHeading(heading, atx[1].length, i));
  }
  return out;
}
