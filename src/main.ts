import { Plugin } from "obsidian";
import { openFundingModal } from "./funding";
import {
  DEFAULT_SETTINGS,
  HeadingJumpFixSettingTab,
  type HeadingJumpFixSettings,
} from "./settings";
import { findHeadingAtLine } from "./heading-resolver";
import { reliableJump } from "./jump-engine";
import { OutlineHook } from "./outline-hook";
import { parseStorage, toStorage } from "./storage";

export default class HeadingJumpFixPlugin extends Plugin {
  settings: HeadingJumpFixSettings = DEFAULT_SETTINGS;
  private lastSeenVersion?: string;
  private outlineHook: OutlineHook | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.outlineHook = new OutlineHook(this.app, () => this.settings);
    this.outlineHook.register();

    this.addSettingTab(new HeadingJumpFixSettingTab(this.app, this));

    this.addCommand({
      id: "jump-to-heading-at-cursor",
      name: "Jump to heading at cursor line reliably",
      editorCallback: (editor, view) => {
        void this.jumpAtCursor(editor, view.file);
      },
    });

    await this.maybeShowFundingModal();
  }

  onunload(): void {
    this.outlineHook?.unregister();
    this.outlineHook = null;
  }

  async loadSettings(): Promise<void> {
    const storage = parseStorage(await this.loadData());
    this.settings = storage.settings;
    this.lastSeenVersion = storage.lastSeenVersion;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(toStorage(this.settings, this.lastSeenVersion));
  }

  private async maybeShowFundingModal(): Promise<void> {
    const currentVersion = this.manifest.version;
    if (this.lastSeenVersion === currentVersion) return;

    const kind = this.lastSeenVersion ? "update" : "install";
    window.setTimeout(() => {
      openFundingModal(this.app, kind, currentVersion);
    }, 800);

    this.lastSeenVersion = currentVersion;
    await this.saveSettings();
  }

  private async jumpAtCursor(
    editor: import("obsidian").Editor,
    file: import("obsidian").TFile | null
  ): Promise<void> {
    if (!this.settings.enabled || !file) return;

    const cursor = editor.getCursor();
    const resolved = findHeadingAtLine(this.app, file, cursor.line);
    await reliableJump(editor, resolved, {
      retryCount: this.settings.retryCount,
      retryDelayMs: this.settings.retryDelayMs,
    });
  }
}
