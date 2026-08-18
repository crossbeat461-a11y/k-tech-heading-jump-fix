import type { Editor } from "obsidian";
import type { ResolvedHeading } from "./heading-resolver";

export interface JumpOptions {
  retryCount: number;
  retryDelayMs: number;
}

export interface JumpResult {
  ok: boolean;
  line: number;
  retries: number;
  reason?: "not-found" | "no-editor";
}

function scrollLineIntoView(editor: Editor, line: number): void {
  const pos = { line, ch: 0 };
  editor.setCursor(pos);
  editor.scrollIntoView({ from: pos, to: pos }, true);
}

function doubleRafScroll(editor: Editor, line: number): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollLineIntoView(editor, line);
        resolve();
      });
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function reliableJump(
  editor: Editor,
  resolved: ResolvedHeading | null,
  options: JumpOptions
): Promise<JumpResult> {
  if (!editor) {
    return { ok: false, line: -1, retries: 0, reason: "no-editor" };
  }
  if (!resolved) {
    return { ok: false, line: -1, retries: 0, reason: "not-found" };
  }

  const { line } = resolved;
  const passes = Math.max(1, options.retryCount + 1);

  for (let i = 0; i < passes; i++) {
    if (i > 0 && options.retryDelayMs > 0) {
      await delay(options.retryDelayMs);
    }
    scrollLineIntoView(editor, line);
    await doubleRafScroll(editor, line);
  }

  return { ok: true, line, retries: Math.max(0, passes - 1) };
}
