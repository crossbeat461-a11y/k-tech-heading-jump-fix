import type { Editor } from "obsidian";
import { debugLog } from "./debug";
import type { ResolvedHeading } from "./heading-resolver";

export interface JumpOptions {
  retryCount: number;
  retryDelayMs: number;
  debugLog?: boolean;
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
  const log = !!options.debugLog;

  if (!editor) {
    const result: JumpResult = {
      ok: false,
      line: -1,
      retries: 0,
      reason: "no-editor",
    };
    debugLog(log, "jump failed", result);
    return result;
  }
  if (!resolved) {
    const result: JumpResult = {
      ok: false,
      line: -1,
      retries: 0,
      reason: "not-found",
    };
    debugLog(log, "jump failed", result);
    return result;
  }

  const { line } = resolved;
  const passes = Math.max(1, options.retryCount + 1);

  for (let i = 0; i < passes; i++) {
    if (i > 0 && options.retryDelayMs > 0) {
      await delay(options.retryDelayMs);
    }
    debugLog(log, "scroll pass", {
      line,
      heading: resolved.heading.heading,
      pass: i + 1,
      of: passes,
    });
    scrollLineIntoView(editor, line);
    await doubleRafScroll(editor, line);
  }

  const result: JumpResult = {
    ok: true,
    line,
    retries: Math.max(0, passes - 1),
  };
  debugLog(log, "jump result", result);
  return result;
}
