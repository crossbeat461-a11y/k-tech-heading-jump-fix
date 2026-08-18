import { App, PluginSettingTab, Setting } from "obsidian";
import { FUNDING_URL } from "./constants";
import type HeadingJumpFixPlugin from "./main";

export interface HeadingJumpFixSettings {
  enabled: boolean;
  outlineFix: boolean;
  retryDelayMs: number;
  retryCount: number;
}

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

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Heading Jump Fix" });

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

    containerEl.createEl("h3", { text: "Support" });

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
