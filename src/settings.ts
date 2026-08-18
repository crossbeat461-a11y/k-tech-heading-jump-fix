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
  retryDelayMs: number;
  retryCount: number;
}

export type HeadingJumpFixSettingKey = keyof HeadingJumpFixSettings;

export const DEFAULT_SETTINGS: HeadingJumpFixSettings = {
  enabled: true,
  outlineFix: true,
  retryDelayMs: 250,
  retryCount: 1,
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
        type: "group",
        heading: "Heading Jump Fix",
        items: [
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
            desc: "Number of correction passes after outline click (default 1).",
            control: {
              type: "number",
              key: "retryCount",
              min: 0,
              defaultValue: DEFAULT_SETTINGS.retryCount,
            },
          },
        ],
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

    new Setting(containerEl).setName("Heading Jump Fix").setHeading();

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
      .setDesc("Number of correction passes after outline click (default 1).")
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
