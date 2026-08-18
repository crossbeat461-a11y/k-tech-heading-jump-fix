import { MarkdownView, type App, type TFile } from "obsidian";
import type { HeadingJumpFixSettings } from "./settings";
import {
  countPriorMatchingHeadings,
  getOutlineItemLevel,
  getOutlineItemText,
  resolveHeading,
} from "./heading-resolver";
import { reliableJump } from "./jump-engine";

export const OUTLINE_SELECTORS = {
  leaf: '.workspace-leaf-content[data-type="outline"]',
  treeItem: ".tree-item",
  treeItemSelf: ".tree-item-self",
  treeItemInner: ".tree-item-inner",
} as const;

export class OutlineHook {
  private handler: ((event: MouseEvent) => void) | null = null;
  private pendingTimer: ReturnType<typeof window.setTimeout> | null = null;

  constructor(
    private app: App,
    private getSettings: () => HeadingJumpFixSettings
  ) {}

  register(): void {
    this.handler = (event: MouseEvent) => {
      void this.onClick(event);
    };
    document.addEventListener("click", this.handler, true);
  }

  unregister(): void {
    if (this.handler) {
      document.removeEventListener("click", this.handler, true);
      this.handler = null;
    }
    this.clearPending();
  }

  private clearPending(): void {
    if (this.pendingTimer !== null) {
      window.clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  private onClick(event: MouseEvent): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.outlineFix) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

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

    const file = this.app.workspace.getActiveFile();
    if (!file) return;

    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView?.editor) return;

    this.clearPending();
    this.pendingTimer = window.setTimeout(() => {
      this.pendingTimer = null;
      void this.performJump(file, headingText, level, occurrenceIndex);
    }, settings.retryDelayMs);
  }

  private async performJump(
    file: TFile,
    headingText: string,
    level: number,
    occurrenceIndex: number
  ): Promise<void> {
    const settings = this.getSettings();
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = markdownView?.editor;
    if (!editor) return;

    const resolved = resolveHeading(this.app, {
      file,
      headingText,
      level,
      occurrenceIndex,
    });

    await reliableJump(editor, resolved, {
      retryCount: settings.retryCount,
      retryDelayMs: settings.retryDelayMs,
    });
  }
}
