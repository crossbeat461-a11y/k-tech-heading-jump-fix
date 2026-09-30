import {
  MarkdownView,
  parseLinktext,
  Plugin,
  type App,
  type Editor,
  type TFile,
  type Workspace,
} from "obsidian";
import type { HeadingJumpFixSettings } from "./settings";
import { resolveBlockById, resolveHeadingByText } from "./heading-resolver";
import { debugLog } from "./debug";
import { jumpResolvedInOpenViews } from "./view-jump";
import { isConfirmKey, isTypingTarget } from "./keyboard";

const LINK_PANE_LEAF =
  '.workspace-leaf-content[data-type="outgoing-link"], .workspace-leaf-content[data-type="backlink"]';
const OUTLINE_LEAF = '.workspace-leaf-content[data-type="outline"]';
const SEARCH_LEAF = '.workspace-leaf-content[data-type="search"]';

export class LinkHook {
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private originalOpenLinkText: Workspace["openLinkText"] | null = null;
  private pendingTimer: ReturnType<typeof window.setTimeout> | null = null;
  private attached = new Set<Document>();

  constructor(
    private app: App,
    private getSettings: () => HeadingJumpFixSettings
  ) {}

  register(plugin: Plugin): void {
    this.clickHandler = (event: MouseEvent) => {
      this.scheduleFromDom(event.target, false);
    };
    this.keyHandler = (event: KeyboardEvent) => {
      if (!isConfirmKey(event)) return;
      if (isTypingTarget(event.target)) return;
      this.scheduleFromDom(event.target, true);
      this.scheduleFromEditorCursor(event);
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
    this.wrapOpenLinkText();
  }

  unregister(): void {
    this.unwrapOpenLinkText();
    for (const doc of [...this.attached]) {
      this.detach(doc);
    }
    this.clickHandler = null;
    this.keyHandler = null;
    this.clearPending();
  }

  private wrapOpenLinkText(): void {
    if (this.originalOpenLinkText) return;
    const workspace = this.app.workspace;
    const original = workspace.openLinkText.bind(workspace);
    this.originalOpenLinkText = original;
    workspace.openLinkText = (
      linktext: string,
      sourcePath: string,
      newLeaf?: Parameters<Workspace["openLinkText"]>[2],
      openViewState?: Parameters<Workspace["openLinkText"]>[3]
    ) => {
      const result = original(
        linktext,
        sourcePath,
        newLeaf,
        openViewState
      );
      void Promise.resolve(result).then(() => {
        this.scheduleFromLinktext(linktext, sourcePath, "follow link");
      });
      return result;
    };
  }

  private unwrapOpenLinkText(): void {
    if (!this.originalOpenLinkText) return;
    this.app.workspace.openLinkText = this.originalOpenLinkText;
    this.originalOpenLinkText = null;
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

  private scheduleFromDom(
    rawTarget: EventTarget | null,
    fromKeyboard: boolean
  ): void {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const target = rawTarget;
    if (!(target instanceof Element)) return;
    if (target.closest(OUTLINE_LEAF)) return;
    if (target.closest(SEARCH_LEAF)) return;

    const inPane = !!target.closest(LINK_PANE_LEAF);
    if (inPane && !settings.linkPaneFix) return;
    if (!inPane && !settings.bodyLinkFix) return;

    const href = findInternalJumpHref(target);
    if (!href) return;

    const parsed = parseLinktext(href);
    this.queueParsedJump(
      parsed.path,
      parsed.subpath,
      this.app.workspace.getActiveFile()?.path ?? "",
      inPane ? "link pane" : fromKeyboard ? "wikilink key" : "wikilink click"
    );
  }

  private scheduleFromEditorCursor(event: KeyboardEvent): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.bodyLinkFix) return;
    if (!event.altKey && !event.ctrlKey && !event.metaKey) return;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.getMode() === "preview") return;
    const editor = view.editor;
    if (!editor) return;

    const href = linktextAtCursor(editor);
    if (!href) return;

    const parsed = parseLinktext(href);
    const sourcePath = view.file?.path ?? "";
    this.queueParsedJump(parsed.path, parsed.subpath, sourcePath, "editor follow");
  }

  private scheduleFromLinktext(
    linktext: string,
    sourcePath: string,
    logLabel: string
  ): void {
    const settings = this.getSettings();
    if (!settings.enabled) return;
    if (!settings.bodyLinkFix && !settings.linkPaneFix) return;

    const parsed = parseLinktext(linktext);
    this.queueParsedJump(parsed.path, parsed.subpath, sourcePath, logLabel);
  }

  private queueParsedJump(
    path: string,
    subpath: string,
    sourcePath: string,
    logLabel: string
  ): void {
    const jump = parseJumpSubpath(subpath);
    if (!jump) return;

    const settings = this.getSettings();
    this.clearPending();
    debugLog(settings.debugLog, logLabel, {
      path,
      kind: jump.kind,
      target: jump.text,
      delayMs: settings.retryDelayMs,
    });
    this.pendingTimer = window.setTimeout(() => {
      this.pendingTimer = null;
      void this.performJump(path, jump, sourcePath);
    }, settings.retryDelayMs);
  }

  private async performJump(
    linkpath: string,
    jump: JumpSubpath,
    sourcePath: string
  ): Promise<void> {
    const settings = this.getSettings();
    const file = resolveDestFile(this.app, linkpath, sourcePath);
    if (!file) return;

    const resolved =
      jump.kind === "block"
        ? resolveBlockById(this.app, file, jump.text)
        : resolveHeadingByText(this.app, file, jump.text);
    await jumpResolvedInOpenViews(this.app, file, resolved, settings);
  }
}

interface JumpSubpath {
  kind: "heading" | "block";
  text: string;
}

function decodeSubpath(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function parseJumpSubpath(subpath: string): JumpSubpath | null {
  if (!subpath) return null;
  const body = subpath.startsWith("#") ? subpath.slice(1) : subpath;
  if (!body) return null;
  if (body.startsWith("^")) {
    const id = decodeSubpath(body.slice(1));
    if (!id) return null;
    return { kind: "block", text: id };
  }
  const text = decodeSubpath(body);
  if (!text) return null;
  return { kind: "heading", text };
}

function findInternalJumpHref(start: Element): string | null {
  let cur: Element | null = start;
  for (let i = 0; i < 10 && cur; i++) {
    const dataHref = cur.getAttribute("data-href");
    if (dataHref && dataHref.includes("#")) {
      return dataHref;
    }
    const href = cur.getAttribute("href");
    if (
      href &&
      href.includes("#") &&
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

function linktextAtCursor(editor: Editor): string | null {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const ch = cursor.ch;
  return wikiTargetAtCh(line, ch) ?? markdownHrefAtCh(line, ch);
}

function wikiTargetAtCh(line: string, ch: number): string | null {
  const re = /\[\[([^\]\n]+?)\]\]/g;
  let match = re.exec(line);
  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    if (ch >= start && ch <= end) {
      const inner = match[1];
      const pipe = inner.indexOf("|");
      const target = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
      if (target.includes("#")) return target;
      return null;
    }
    match = re.exec(line);
  }
  return null;
}

function markdownHrefAtCh(line: string, ch: number): string | null {
  const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
  let match = re.exec(line);
  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    if (ch >= start && ch <= end) {
      const href = match[1];
      if (href.includes("#")) return href;
      return null;
    }
    match = re.exec(line);
  }
  return null;
}
