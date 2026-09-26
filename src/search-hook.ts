import { Plugin, TFile, type App } from "obsidian";
import type { HeadingJumpFixSettings } from "./settings";
import {
  normalizeHeadingText,
  resolveAtLine,
  resolveHeadingByText,
  type ResolvedHeading,
} from "./heading-resolver";
import { debugLog } from "./debug";
import { collectMarkdownViews, jumpResolvedInOpenViews } from "./view-jump";

export const SEARCH_SELECTORS = {
  leaf: '.workspace-leaf-content[data-type="search"]',
  match: ".search-result-file-match",
  result: ".search-result",
  fileTitle: ".search-result-file-title",
  ignore:
    ".collapse-icon, .tree-item-icon, .clickable-icon, .search-input-container",
} as const;

export class SearchHook {
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
    if (!settings.enabled || !settings.searchFix) return;
    if (event.button !== 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(SEARCH_SELECTORS.ignore)) return;
    if (!target.closest(SEARCH_SELECTORS.leaf)) return;

    const match = target.closest(SEARCH_SELECTORS.match);
    if (!match) return;

    const file = resolveFileFromSearchMatch(this.app, match);
    if (!file) return;

    const snippet = matchSnippet(match);
    this.clearPending();
    debugLog(settings.debugLog, "search click", {
      file: file.path,
      snippet,
      delayMs: settings.retryDelayMs,
    });
    this.pendingTimer = window.setTimeout(() => {
      this.pendingTimer = null;
      void this.performJump(file, snippet);
    }, settings.retryDelayMs);
  }

  private async performJump(file: TFile, snippet: string): Promise<void> {
    const settings = this.getSettings();
    const resolved = await resolveSearchJump(this.app, file, snippet);
    await jumpResolvedInOpenViews(this.app, file, resolved, settings);
  }
}

function matchSnippet(match: Element): string {
  return normalizeHeadingText(match.textContent ?? "").replace(/…/g, "");
}

function pathFromElement(el: Element): string | null {
  let cur: Element | null = el;
  for (let i = 0; i < 12 && cur; i++) {
    const path = cur.getAttribute("data-path");
    if (path) return path;
    cur = cur.parentElement;
  }
  return null;
}

export function resolveFileFromSearchMatch(
  app: App,
  match: Element
): TFile | null {
  const path = pathFromElement(match);
  if (path) {
    const byPath = app.vault.getAbstractFileByPath(path);
    if (byPath instanceof TFile) return byPath;
  }

  const result = match.closest(SEARCH_SELECTORS.result);
  const title = result?.querySelector(SEARCH_SELECTORS.fileTitle);
  const label = normalizeHeadingText(title?.textContent ?? "");
  if (label) {
    const dest = app.metadataCache.getFirstLinkpathDest(label, "");
    if (dest) return dest;
  }

  return app.workspace.getActiveFile();
}

function editorLineForFile(app: App, file: TFile): number | null {
  const views = collectMarkdownViews(app, file);
  for (const view of views) {
    if (view.getMode() === "preview") continue;
    const editor = view.editor;
    if (!editor) continue;
    return editor.getCursor().line;
  }
  return null;
}

function lineMatchesSnippet(lineText: string, snippet: string): boolean {
  const needle = normalizeHeadingText(snippet);
  const plain = normalizeHeadingText(lineText.replace(/^#+\s+/, ""));
  if (needle.length < 2 || !plain) return false;
  return plain.includes(needle) || needle.includes(plain);
}

function findUniqueLineForSnippet(
  content: string,
  snippet: string
): number | null {
  const needle = normalizeHeadingText(snippet);
  if (needle.length < 2) return null;

  const lines = content.split("\n");
  const hits: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const plain = normalizeHeadingText(lines[i].replace(/^#+\s+/, ""));
    if (!plain) continue;
    if (plain.includes(needle)) {
      hits.push(i);
      continue;
    }
    if (plain.length >= 12 && needle.includes(plain)) {
      hits.push(i);
    }
  }
  if (hits.length === 1) return hits[0];
  return null;
}

async function resolveSearchJump(
  app: App,
  file: TFile,
  snippet: string
): Promise<ResolvedHeading | null> {
  const cursorLine = editorLineForFile(app, file);
  if (cursorLine !== null) {
    const views = collectMarkdownViews(app, file);
    for (const view of views) {
      if (view.getMode() === "preview") continue;
      const editor = view.editor;
      if (!editor) continue;
      if (lineMatchesSnippet(editor.getLine(cursorLine), snippet)) {
        return resolveAtLine(app, file, cursorLine);
      }
      break;
    }
  }

  const heading = resolveHeadingByText(app, file, snippet);
  if (heading) return heading;

  const content = await app.vault.cachedRead(file);
  const line = findUniqueLineForSnippet(content, snippet);
  if (line !== null) return resolveAtLine(app, file, line);

  if (cursorLine !== null) return resolveAtLine(app, file, cursorLine);
  return null;
}
