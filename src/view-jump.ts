import { MarkdownView, type App, type TFile } from "obsidian";
import { debugLog } from "./debug";
import type { ResolvedHeading } from "./heading-resolver";
import {
  asHTMLElement,
  findPreviewBlockElement,
  findPreviewHeadingElement,
  headingOccurrenceIndex,
} from "./preview-target";
import {
  jumpOptionsFromSettings,
  reliableJump,
  type JumpOptions,
  type JumpResult,
} from "./jump-engine";
import type { HeadingJumpFixSettings } from "./settings";

export function collectMarkdownViews(app: App, file: TFile): MarkdownView[] {
  const views: MarkdownView[] = [];
  app.workspace.iterateAllLeaves((leaf) => {
    const view = leaf.view;
    if (view instanceof MarkdownView && view.file?.path === file.path) {
      views.push(view);
    }
  });
  return views;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function backoffMs(baseMs: number, extraPassIndex: number): number {
  return baseMs * Math.pow(2, extraPassIndex);
}

function previewScrollEl(view: MarkdownView): HTMLElement | null {
  return asHTMLElement(view.contentEl.querySelector(".markdown-preview-view"));
}

function isVisibleIn(el: HTMLElement, container: HTMLElement): boolean {
  const box = el.getBoundingClientRect();
  const frame = container.getBoundingClientRect();
  const margin = 8;
  return box.top >= frame.top - margin && box.bottom <= frame.bottom + margin;
}

function resolvePreviewTarget(
  app: App,
  file: TFile,
  preview: HTMLElement,
  resolved: ResolvedHeading
): HTMLElement | null {
  if (resolved.heading) {
    const cache = app.metadataCache.getFileCache(file);
    const occurrence = headingOccurrenceIndex(cache?.headings, resolved);
    return findPreviewHeadingElement(preview, resolved, occurrence);
  }
  if (resolved.label?.startsWith("^")) {
    return findPreviewBlockElement(preview, resolved.label);
  }
  return null;
}

export async function reliableJumpReading(
  app: App,
  view: MarkdownView,
  file: TFile,
  resolved: ResolvedHeading | null,
  options: JumpOptions
): Promise<JumpResult> {
  const log = !!options.debugLog;
  const center = options.scrollToCenter !== false;

  if (!resolved) {
    const result: JumpResult = {
      ok: false,
      line: -1,
      retries: 0,
      reason: "not-found",
    };
    debugLog(log, "reading jump failed", result);
    return result;
  }

  const preview = previewScrollEl(view);
  if (!preview) {
    const result: JumpResult = {
      ok: false,
      line: resolved.line,
      retries: 0,
      reason: "no-editor",
    };
    debugLog(log, "reading jump failed", result);
    return result;
  }

  const passes = Math.max(1, options.retryCount + 1);
  let visible: boolean | null = null;

  for (let i = 0; i < passes; i++) {
    if (i > 0 && options.retryDelayMs > 0) {
      await delay(backoffMs(options.retryDelayMs, i - 1));
    }
    const target = resolvePreviewTarget(app, file, preview, resolved);
    debugLog(log, "reading scroll pass", {
      line: resolved.line,
      heading: resolved.heading?.heading ?? resolved.label ?? "",
      pass: i + 1,
      of: passes,
      found: !!target,
      center,
    });
    if (!target) {
      visible = false;
      continue;
    }
    target.scrollIntoView({
      block: center ? "center" : "start",
      behavior: "auto",
    });
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });
    visible = isVisibleIn(target, preview);
    debugLog(log, "reading viewport check", { line: resolved.line, visible });
    if (visible === true) break;
  }

  const result: JumpResult = {
    ok: true,
    line: resolved.line,
    retries: Math.max(0, passes - 1),
    visible,
  };
  debugLog(log, "reading jump result", result);
  return result;
}

export async function jumpResolvedInOpenViews(
  app: App,
  file: TFile,
  resolved: ResolvedHeading | null,
  settings: HeadingJumpFixSettings
): Promise<void> {
  if (!resolved) return;
  const options = jumpOptionsFromSettings(settings);
  const views = collectMarkdownViews(app, file);
  if (views.length === 0) return;

  for (const view of views) {
    if (view.getMode() === "preview") {
      if (settings.readingViewFix) {
        await reliableJumpReading(app, view, file, resolved, options);
      }
      continue;
    }
    const editor = view.editor;
    if (editor) {
      await reliableJump(editor, resolved, options);
    }
  }
}
