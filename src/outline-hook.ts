import { MarkdownView, Plugin, type App, type TFile } from "obsidian";
import type { HeadingJumpFixSettings } from "./settings";
import {
  countPriorMatchingHeadings,
  getOutlineItemLevel,
  getOutlineItemText,
  resolveHeading,
} from "./heading-resolver";
import { jumpOptionsFromSettings, reliableJump } from "./jump-engine";
import { debugLog } from "./debug";

export const OUTLINE_SELECTORS = {
  leaf: '.workspace-leaf-content[data-type="outline"]',
  treeItem: ".tree-item",
  treeItemSelf: ".tree-item-self",
  treeItemInner: ".tree-item-inner",
} as const;

export class OutlineHook {
  private handler: ((event: MouseEvent) => void) | null = null;
  private pendingTimer: ReturnType<typeof window.setTimeout> | null = null;
  private attached = new Set<Document>();

  constructor(
    private app: App,
    private getSettings: () => HeadingJumpFixSettings
  ) {}

  register(plugin: Plugin): void {
    this.handler = (event: MouseEvent) => {
      void this.onClick(event);
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
    this.handler = null;
    this.clearPending();
  }

  private attach(doc: Document): void {
    if (!this.handler || this.attached.has(doc)) return;
    doc.addEventListener("click", this.handler, true);
    this.attached.add(doc);
  }

  private detach(doc: Document): void {
    if (!this.handler || !this.attached.has(doc)) return;
    doc.removeEventListener("click", this.handler, true);
    this.attached.delete(doc);
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
    debugLog(settings.debugLog, "outline click", {
      headingText,
      level,
      occurrenceIndex,
      file: file.path,
      delayMs: settings.retryDelayMs,
    });
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

    await reliableJump(
      editor,
      resolved,
      jumpOptionsFromSettings(settings)
    );
  }
}
