import type { HeadingCache } from "obsidian";
import { normalizeHeadingText, type ResolvedHeading } from "./heading-resolver";

export function headingOccurrenceIndex(
  headings: HeadingCache[] | undefined,
  resolved: ResolvedHeading
): number {
  const target = resolved.heading;
  if (!target || !headings?.length) return 0;
  const normalized = normalizeHeadingText(target.heading);
  let count = 0;
  for (const heading of headings) {
    if (heading.position.start.line === target.position.start.line) return count;
    if (
      heading.level === target.level &&
      normalizeHeadingText(heading.heading) === normalized
    ) {
      count++;
    }
  }
  return count;
}

export function headingLevelFromTag(el: HTMLElement): number | null {
  const tag = el.tagName.toLowerCase();
  if (tag.length !== 2 || tag[0] !== "h") return null;
  const n = parseInt(tag[1], 10);
  if (n < 1 || n > 6) return null;
  return n;
}

export function previewHeadingText(el: HTMLElement): string {
  const data = el.getAttribute("data-heading");
  if (data) return normalizeHeadingText(data);
  return normalizeHeadingText(el.textContent ?? "");
}

function asHTMLElement(node: Element | null): HTMLElement | null {
  if (!node) return null;
  const withInstance = node as Element & {
    instanceOf?: (type: typeof HTMLElement) => boolean;
  };
  if (
    typeof withInstance.instanceOf === "function" &&
    withInstance.instanceOf(HTMLElement)
  ) {
    return node as HTMLElement;
  }
  const win = node.ownerDocument.defaultView;
  if (win && node instanceof win.HTMLElement) return node as HTMLElement;
  return null;
}

export function findPreviewHeadingElement(
  preview: HTMLElement,
  resolved: ResolvedHeading,
  occurrenceIndex: number
): HTMLElement | null {
  const heading = resolved.heading;
  if (!heading) return null;
  const wanted = normalizeHeadingText(heading.heading);
  const level = heading.level;
  const matches: HTMLElement[] = [];
  const nodes = preview.querySelectorAll("h1, h2, h3, h4, h5, h6");
  for (let i = 0; i < nodes.length; i++) {
    const el = asHTMLElement(nodes[i]);
    if (!el) continue;
    if (headingLevelFromTag(el) !== level) continue;
    if (previewHeadingText(el) !== wanted) continue;
    matches.push(el);
  }
  if (!matches.length) return null;
  return matches[Math.min(occurrenceIndex, matches.length - 1)];
}

export function findPreviewBlockElement(
  preview: HTMLElement,
  blockId: string
): HTMLElement | null {
  const id = blockId.replace(/^\^/, "").trim();
  if (!id) return null;
  const tagged = asHTMLElement(
    preview.querySelector(`[data-block-id=${JSON.stringify(id)}]`)
  );
  if (tagged) return tagged;
  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(id)
      : null;
  if (!escaped) return null;
  return asHTMLElement(preview.querySelector(`#${escaped}`));
}

export { asHTMLElement };
