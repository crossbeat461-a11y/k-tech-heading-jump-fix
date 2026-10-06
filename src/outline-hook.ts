import { MarkdownView, Plugin, type App, type TFile } from "obsidian";
import type { HeadingJumpFixSettings } from "./settings";
import {
  countPriorMatchingHeadings,
  getOutlineItemLevel,
  getOutlineItemText,
  resolveHeading,
  resolveHeadingInSource,
} from "./heading-resolver";
import { debugLog } from "./debug";
import { jumpResolvedInOpenViews } from "./view-jump";
import {
  OUTLINE_KEYBOARD_IGNORE,
  isConfirmKey,
  isTypingTarget,
} from "./keyboard";

export const OUTLINE_SELECTORS = {
  leaf: '.workspace-leaf-content[data-type="outline"]',
  treeItem: ".tree-item",
  treeItemSelf: ".tree-item-self",
  treeItemInner: ".tree-item-inner",
} as const;

export class OutlineHook {
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private pendingTimer: ReturnType<typeof window.setTimeout> | null = null;
  private attached = new Set<Document>();

  constructor(
    private app: App,
    private getSettings: () => HeadingJumpFixSettings
  ) {}

  register(plugin: Plugin): void {
    this.clickHandler = (event: MouseEvent) => {
      this.scheduleFromTarget(event.target, "outline click");
    };
    this.keyHandler = (event: KeyboardEvent) => {
      if (!isConfirmKey(event)) return;
      if (isTypingTarget(event.target)) return;
      this.scheduleFromTarget(event.target, "outline key");
    };
    this.attach(document);
    plugin.registerEvent(
      this.app.workspace.on("window-open", (_win, window) => {
        this.attach(window.document);
      })
    );
    plugin.registerEvent(
      this.app.workspace.on("window-close", (_win, window) => {
        this.detach(window.document);
      })
    );
  }

  unregister(): void {
    for (const doc of [...this.attached]) {
      this.detach(doc);
    }
    this.clickHandler = null;
    this.keyHandler = null;
    this.clearPending();
  }

  private attach(doc: Document): void {
    if (!this.clickHandler || !this.keyHandler || this.attached.has(doc)) {
      return;
    }
    doc.addEventListener("click", this.clickHandler, true);
    doc.addEventListener("keydown", this.keyHandler, true);
    this.attached.add(doc);
  }

  private detach(doc: Document): void {
    if (!this.clickHandler || !this.keyHandler || !this.attached.has(doc)) {
      return;
    }
    doc.removeEventListener("click", this.clickHandler, true);
    doc.removeEventListener("keydown", this.keyHandler, true);
    this.attached.delete(doc);
  }

  private clearPending(): void {
    if (this.pendingTimer !== null) {
      window.clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  private scheduleFromTarget(
    rawTarget: EventTarget | null,
    logLabel: string
  ): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.outlineFix) return;

    const target = rawTarget;
    if (!(target instanceof Element)) return;
    if (target.closest(OUTLINE_KEYBOARD_IGNORE)) return;

    const outlineLeaf = target.closest(OUTLINE_SELECTORS.leaf);
    if (!outlineLeaf) return;

    const treeItemSelf = target.closest(OUTLINE_SELECTORS.treeItemSelf);
    if (!treeItemSelf) return;

    const treeItem = treeItemSelf.closest(OUTLINE_SELECTORS.treeItem);
    if (!treeItem?.instanceOf(HTMLElement)) return;

    const headingText = getOutlineItemText(treeItem);
    if (!headingText) return;

    const level = getOutlineItemLevel(treeItem);
    const occurrenceIndex = countPriorMatchingHeadings(
      treeItem,
      headingText,
      level,
      outlineLeaf
    );

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const file = view.file;

    this.clearPending();
    debugLog(settings.debugLog, logLabel, {
      headingText,
      level,
      occurrenceIndex,
      file: file?.path ?? "(outside vault)",
      delayMs: settings.retryDelayMs,
    });
    this.pendingTimer = window.setTimeout(() => {
      this.pendingTimer = null;
      void this.performJump(view, file, headingText, level, occurrenceIndex);
    }, settings.retryDelayMs);
  }

  private async performJump(
    view: MarkdownView,
    file: TFile | null,
    headingText: string,
    level: number,
    occurrenceIndex: number
  ): Promise<void> {
    const settings = this.getSettings();
    const sourceText = markdownSource(view);
    const resolved = file
      ? resolveHeading(
          this.app,
          { file, headingText, level, occurrenceIndex },
          sourceText
        )
      : resolveHeadingInSource(sourceText, headingText, level, occurrenceIndex);
    await jumpResolvedInOpenViews(this.app, file, resolved, settings);
  }
}

function markdownSource(view: MarkdownView): string {
  try {
    if (view.editor) return view.editor.getValue();
  } catch {
    /* Reading view may still expose getViewData */
  }
  return view.getViewData();
}
