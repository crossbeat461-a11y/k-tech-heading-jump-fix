import type { Editor } from "obsidian";
import { debugLog } from "./debug";
import type { ResolvedHeading } from "./heading-resolver";
import type { HeadingJumpFixSettings } from "./settings";

export interface JumpOptions {
  retryCount: number;
  retryDelayMs: number;
  debugLog?: boolean;
  scrollToCenter?: boolean;
}

export interface JumpResult {
  ok: boolean;
  line: number;
  retries: number;
  visible?: boolean | null;
  reason?: "not-found" | "no-editor";
}

interface CmLike {
  coordsAtPos?: (
    pos: number
  ) => { top: number; bottom: number } | null;
  scrollDOM?: HTMLElement;
  state?: { doc: { line: (n: number) => { from: number } } };
}

export function jumpOptionsFromSettings(
  settings: HeadingJumpFixSettings
): JumpOptions {
  return {
    retryCount: settings.retryCount,
    retryDelayMs: settings.retryDelayMs,
    debugLog: settings.debugLog,
    scrollToCenter: settings.scrollToCenter,
  };
}

function getCm(editor: Editor): CmLike | null {
  const rec = editor as unknown as { cm?: CmLike };
  return rec.cm ?? null;
}

/** true = on screen, false = missing/off-screen, null = cannot measure */
export function isHeadingVisible(editor: Editor, line: number): boolean | null {
  const cm = getCm(editor);
  if (!cm?.coordsAtPos || !cm.state?.doc || !cm.scrollDOM) return null;
  try {
    const docLine = cm.state.doc.line(line + 1);
    const coords = cm.coordsAtPos(docLine.from);
    if (!coords) return false;
    const box = cm.scrollDOM.getBoundingClientRect();
    const margin = 8;
    return (
      coords.top >= box.top - margin && coords.bottom <= box.bottom + margin
    );
  } catch {
    return null;
  }
}

function scrollLineIntoView(
  editor: Editor,
  line: number,
  center: boolean
): void {
  const pos = { line, ch: 0 };
  editor.setCursor(pos);
  editor.scrollIntoView({ from: pos, to: pos }, center);
}

function doubleRafScroll(
  editor: Editor,
  line: number,
  center: boolean
): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollLineIntoView(editor, line, center);
        resolve();
      });
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function backoffMs(baseMs: number, extraPassIndex: number): number {
  return baseMs * Math.pow(2, extraPassIndex);
}

export async function reliableJump(
  editor: Editor,
  resolved: ResolvedHeading | null,
  options: JumpOptions
): Promise<JumpResult> {
  const log = !!options.debugLog;
  const center = options.scrollToCenter !== false;

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
  let visible: boolean | null = null;

  for (let i = 0; i < passes; i++) {
    if (i > 0 && options.retryDelayMs > 0) {
      await delay(backoffMs(options.retryDelayMs, i - 1));
    }
    debugLog(log, "scroll pass", {
      line,
      heading: resolved.heading.heading,
      pass: i + 1,
      of: passes,
      center,
    });
    scrollLineIntoView(editor, line, center);
    await doubleRafScroll(editor, line, center);
    visible = isHeadingVisible(editor, line);
    debugLog(log, "viewport check", { line, visible });
    if (visible === true) break;
  }

  const result: JumpResult = {
    ok: true,
    line,
    retries: Math.max(0, passes - 1),
    visible,
  };
  debugLog(log, "jump result", result);
  return result;
}
