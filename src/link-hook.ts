import {
  MarkdownView,
  parseLinktext,
  Plugin,
  type App,
  type TFile,
} from "obsidian";
import type { HeadingJumpFixSettings } from "./settings";
import { resolveHeadingByText } from "./heading-resolver";
import { jumpOptionsFromSettings, reliableJump } from "./jump-engine";
import { debugLog } from "./debug";

const LINK_PANE_LEAF =
  '.workspace-leaf-content[data-type="outgoing-link"], .workspace-leaf-content[data-type="backlink"]';
const OUTLINE_LEAF = '.workspace-leaf-content[data-type="outline"]';

export class LinkHook {
  private handler: ((event: MouseEvent) => void) | null = null;
  private pendingTimer: ReturnType<typeof window.setTimeout> | null = null;
  private attached = new Set<Document>();

  constructor(
    private app: App,
    private getSettings: () => HeadingJumpFixSettings
  ) {}

  register(plugin: Plugin): void {
    this.handler = (event: MouseEvent) => {
      this.onClick(event);
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
    if (!settings.enabled) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(OUTLINE_LEAF)) return;

    const inPane = !!target.closest(LINK_PANE_LEAF);
    if (inPane && !settings.linkPaneFix) return;
    if (!inPane && !settings.bodyLinkFix) return;

    const href = findInternalHeadingHref(target);
    if (!href) return;

    const parsed = parseLinktext(href);
    const headingText = headingFromSubpath(parsed.subpath);
    if (!headingText) return;

    const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";
    this.clearPending();
    debugLog(settings.debugLog, inPane ? "link pane click" : "wikilink click", {
      href,
      path: parsed.path,
      headingText,
      delayMs: settings.retryDelayMs,
    });
    this.pendingTimer = window.setTimeout(() => {
      this.pendingTimer = null;
      void this.performJump(parsed.path, headingText, sourcePath);
    }, settings.retryDelayMs);
  }

  private async performJump(
    linkpath: string,
    headingText: string,
    sourcePath: string
  ): Promise<void> {
    const settings = this.getSettings();
    const file = resolveDestFile(this.app, linkpath, sourcePath);
    if (!file) return;

    const markdownView = findMarkdownView(this.app, file);
    const editor = markdownView?.editor;
    if (!editor) return;

    const resolved = resolveHeadingByText(this.app, file, headingText);
    await reliableJump(editor, resolved, jumpOptionsFromSettings(settings));
  }
}

function headingFromSubpath(subpath: string): string | null {
  if (!subpath || subpath.startsWith("#^")) return null;
  const raw = subpath.startsWith("#") ? subpath.slice(1) : subpath;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function findInternalHeadingHref(start: Element): string | null {
  let cur: Element | null = start;
  for (let i = 0; i < 10 && cur; i++) {
    const dataHref = cur.getAttribute("data-href");
    if (dataHref && dataHref.includes("#") && !dataHref.includes("#^")) {
      return dataHref;
    }
    const href = cur.getAttribute("href");
    if (
      href &&
      href.includes("#") &&
      !href.includes("#^") &&
      (cur.classList.contains("internal-link") ||
        cur.getAttribute("data-href") !== null)
    ) {
      return href;
    }
    cur = cur.parentElement;
  }
  return null;
}

function resolveDestFile(
  app: App,
  linkpath: string,
  sourcePath: string
): TFile | null {
  if (!linkpath) return app.workspace.getActiveFile();
  return (
    app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath) ??
    app.workspace.getActiveFile()
  );
}

function findMarkdownView(app: App, file: TFile): MarkdownView | null {
  const leaves = app.workspace.getLeavesOfType("markdown");
  for (const leaf of leaves) {
    const view = leaf.view;
    if (view instanceof MarkdownView && view.file?.path === file.path) {
      return view;
    }
  }
  const active = app.workspace.getActiveViewOfType(MarkdownView);
  if (active?.file?.path === file.path) return active;
  return active;
}
