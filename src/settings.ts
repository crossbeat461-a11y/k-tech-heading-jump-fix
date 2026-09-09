import {
  App,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem,
} from "obsidian";
import { FUNDING_URL } from "./constants";
import type HeadingJumpFixPlugin from "./main";

export interface HeadingJumpFixSettings {
  enabled: boolean;
  outlineFix: boolean;
  bodyLinkFix: boolean;
  linkPaneFix: boolean;
  readingViewFix: boolean;
  retryDelayMs: number;
  retryCount: number;
  scrollToCenter: boolean;
  overrideThemeScroll: boolean;
  debugLog: boolean;
}

export type HeadingJumpFixSettingKey = keyof HeadingJumpFixSettings;

export const DEFAULT_SETTINGS: HeadingJumpFixSettings = {
  enabled: true,
  outlineFix: true,
  bodyLinkFix: true,
  linkPaneFix: true,
  readingViewFix: true,
  retryDelayMs: 250,
  retryCount: 1,
  scrollToCenter: true,
  overrideThemeScroll: true,
  debugLog: false,
};

export class HeadingJumpFixSettingTab extends PluginSettingTab {
  plugin: HeadingJumpFixPlugin;

  constructor(app: App, plugin: HeadingJumpFixPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem<HeadingJumpFixSettingKey>[] {
    return [
      {
        name: "Enable plugin",
        desc: "Master switch for scroll correction.",
        control: {
          type: "toggle",
          key: "enabled",
          defaultValue: DEFAULT_SETTINGS.enabled,
        },
      },
      {
        name: "Outline click fix",
        desc: "Retry scroll after clicking a heading in the Outline sidebar.",
        control: {
          type: "toggle",
          key: "outlineFix",
          defaultValue: DEFAULT_SETTINGS.outlineFix,
        },
      },
      {
        name: "Wikilink click fix",
        desc: "Retry scroll after in-note [[wikilink#heading]] and [[note#^block]] clicks.",
        control: {
          type: "toggle",
          key: "bodyLinkFix",
          defaultValue: DEFAULT_SETTINGS.bodyLinkFix,
        },
      },
      {
        name: "Link pane click fix",
        desc: "Retry scroll after heading or block-reference clicks in Outgoing links / Backlinks.",
        control: {
          type: "toggle",
          key: "linkPaneFix",
          defaultValue: DEFAULT_SETTINGS.linkPaneFix,
        },
      },
      {
        name: "Reading view jump fix",
        desc: "Retry scroll in Reading view after Outline or heading-link jumps (including a split editor + Reading layout). Does not turn headings themselves into links.",
        control: {
          type: "toggle",
          key: "readingViewFix",
          defaultValue: DEFAULT_SETTINGS.readingViewFix,
        },
      },
      {
        name: "Retry delay (ms)",
        desc: "Wait before correcting scroll (default 250).",
        control: {
          type: "number",
          key: "retryDelayMs",
          min: 0,
          defaultValue: DEFAULT_SETTINGS.retryDelayMs,
        },
      },
      {
        name: "Retry count",
        desc: "Number of correction passes. Later passes wait longer (backoff).",
        control: {
          type: "number",
          key: "retryCount",
          min: 0,
          defaultValue: DEFAULT_SETTINGS.retryCount,
        },
      },
      {
        name: "Scroll heading to center",
        desc: "Place the heading near the middle of the editor. Off = align to the top.",
        control: {
          type: "toggle",
          key: "scrollToCenter",
          defaultValue: DEFAULT_SETTINGS.scrollToCenter,
        },
      },
      {
        name: "Override theme scroll-behavior",
        desc: "Force instant editor scrolling so theme smooth-scroll does not miss the heading.",
        control: {
          type: "toggle",
          key: "overrideThemeScroll",
          defaultValue: DEFAULT_SETTINGS.overrideThemeScroll,
        },
      },
      {
        type: "group",
        heading: "Support",
        items: [
          {
            name: "Buy Me a Coffee",
            desc: "Support K-Tech Studio development.",
            action: () => {
              window.open(FUNDING_URL, "_blank");
            },
          },
        ],
      },
    ];
  }

  getControlValue(key: string): unknown {
    return this.plugin.settings[key as HeadingJumpFixSettingKey];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    this.plugin.settings[key as HeadingJumpFixSettingKey] =
      value as HeadingJumpFixSettings[HeadingJumpFixSettingKey];
    await this.plugin.saveSettings();
  }

  /** Fallback for Obsidian versions older than 1.13.0. */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Enable plugin")
      .setDesc("Master switch for scroll correction.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabled)
          .onChange(async (value) => {
            this.plugin.settings.enabled = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Outline click fix")
      .setDesc("Retry scroll after clicking a heading in the Outline sidebar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.outlineFix)
          .onChange(async (value) => {
            this.plugin.settings.outlineFix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Wikilink click fix")
      .setDesc(
        "Retry scroll after in-note [[wikilink#heading]] and [[note#^block]] clicks."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.bodyLinkFix)
          .onChange(async (value) => {
            this.plugin.settings.bodyLinkFix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Link pane click fix")
      .setDesc(
        "Retry scroll after heading or block-reference clicks in Outgoing links / Backlinks."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.linkPaneFix)
          .onChange(async (value) => {
            this.plugin.settings.linkPaneFix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reading view jump fix")
      .setDesc(
        "Retry scroll in Reading view after Outline or heading-link jumps (including a split editor + Reading layout). Does not turn headings themselves into links."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.readingViewFix)
          .onChange(async (value) => {
            this.plugin.settings.readingViewFix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Retry delay (ms)")
      .setDesc("Wait before correcting scroll (default 250).")
      .addText((text) =>
        text
          .setPlaceholder("250")
          .setValue(String(this.plugin.settings.retryDelayMs))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            if (!Number.isFinite(parsed) || parsed < 0) return;
            this.plugin.settings.retryDelayMs = parsed;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Retry count")
      .setDesc("Number of correction passes. Later passes wait longer (backoff).")
      .addText((text) =>
        text
          .setPlaceholder("1")
          .setValue(String(this.plugin.settings.retryCount))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            if (!Number.isFinite(parsed) || parsed < 0) return;
            this.plugin.settings.retryCount = parsed;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Scroll heading to center")
      .setDesc(
        "Place the heading near the middle of the editor. Off = align to the top."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.scrollToCenter)
          .onChange(async (value) => {
            this.plugin.settings.scrollToCenter = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Override theme scroll-behavior")
      .setDesc(
        "Force instant editor scrolling so theme smooth-scroll does not miss the heading."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.overrideThemeScroll)
          .onChange(async (value) => {
            this.plugin.settings.overrideThemeScroll = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Support").setHeading();

    new Setting(containerEl)
      .setName("Buy Me a Coffee")
      .setDesc("Support K-Tech Studio development.")
      .addButton((button) =>
        button.setButtonText("Buy Me a Coffee").onClick(() => {
          window.open(FUNDING_URL, "_blank");
        })
      );
  }
}
