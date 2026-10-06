import type { App, Editor, HeadingCache, TFile } from "obsidian";
import { debugLog } from "./debug";
import { headingsForJump, type ResolvedHeading } from "./heading-resolver";
import {
  asHTMLElement,
  findPreviewHeadingElement,
  headingOccurrenceIndex,
} from "./preview-target";

interface CmLike {
  coordsAtPos?: (pos: number) => { top: number; bottom: number } | null;
  state?: { doc: { line: (n: number) => { from: number } } };
}

function getCm(editor: Editor): CmLike | null {
  const rec = editor as unknown as { cm?: CmLike };
  return rec.cm ?? null;
}

function coordsAtDocLine(editor: Editor, line: number): boolean | null {
  const cm = getCm(editor);
  if (!cm?.coordsAtPos || !cm.state?.doc) return null;
  try {
    const docLine = cm.state.doc.line(line + 1);
    return cm.coordsAtPos(docLine.from) !== null;
  } catch {
    return null;
  }
}

function headingsContainingLine(
  headings: HeadingCache[],
  line: number
): HeadingCache[] {
  const stack: HeadingCache[] = [];
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (heading.position.start.line > line) break;
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    stack.push(heading);
  }
  return stack;
}

function isEditorSectionFolded(editor: Editor, headingLine: number): boolean {
  if (headingLine >= editor.lastLine()) return false;
  if (coordsAtDocLine(editor, headingLine) !== true) return false;
  return coordsAtDocLine(editor, headingLine + 1) === false;
}

function unfoldEditorHeading(editor: Editor, headingLine: number): void {
  if (!isEditorSectionFolded(editor, headingLine)) return;
  editor.setCursor({ line: headingLine, ch: 0 });
  editor.exec("toggleFold");
}

export function unfoldJumpInEditor(
  app: App,
  editor: Editor,
  file: TFile | null,
  resolved: ResolvedHeading,
  debug: boolean
): void {
  const headings = headingsForJump(app, file, editor.getValue());
  const chain = headingsContainingLine(headings, resolved.line);
  debugLog(debug, "unfold editor", {
    line: resolved.line,
    chain: chain.map((h) => h.heading),
  });
  for (let i = 0; i < chain.length; i++) {
    unfoldEditorHeading(editor, chain[i].position.start.line);
  }
  if (chain.length === 0) {
    unfoldEditorHeading(editor, resolved.line);
  }
}

function unfoldPreviewCollapsed(el: HTMLElement): void {
  const collapsed = el.classList.contains("is-collapsed")
    ? el
    : asHTMLElement(el.closest(".is-collapsed"));
  if (!collapsed) return;
  const indicator = collapsed.querySelector(
    ".heading-collapse-indicator, .collapse-indicator"
  );
  const button = asHTMLElement(indicator);
  if (button) button.click();
}

export function unfoldJumpInPreview(
  app: App,
  preview: HTMLElement,
  file: TFile | null,
  resolved: ResolvedHeading,
  debug: boolean,
  sourceText?: string
): void {
  const headings = headingsForJump(app, file, sourceText);
  const chain = headingsContainingLine(headings, resolved.line);
  debugLog(debug, "unfold preview", {
    line: resolved.line,
    chain: chain.map((h) => h.heading),
  });
  for (let i = 0; i < chain.length; i++) {
    const heading = chain[i];
    const occurrence = headingOccurrenceIndex(headings, {
      line: heading.position.start.line,
      heading,
    });
    const el = findPreviewHeadingElement(
      preview,
      { line: heading.position.start.line, heading },
      occurrence
    );
    if (el) unfoldPreviewCollapsed(el);
  }
}
