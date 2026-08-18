import { App, Modal } from "obsidian";
import { FUNDING_URL, PLUGIN_NAME } from "./constants";

export class FundingModal extends Modal {
  constructor(
    app: App,
    private readonly kind: "install" | "update",
    private readonly version: string
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    titleEl.setText(PLUGIN_NAME);

    const heading =
      this.kind === "install"
        ? "Thanks for installing!"
        : `Updated to ${this.version}`;
    contentEl.createEl("h3", { text: heading });

    contentEl.createEl("p", {
      text:
        this.kind === "install"
          ? "Heading Jump Fix auto-corrects scroll after outline clicks. If it saves you a second click, consider supporting development."
          : "Thanks for updating. New versions keep outline jumps reliable. If this plugin helps your workflow, consider supporting development.",
    });

    const actions = contentEl.createDiv({ cls: "modal-button-container" });

    const coffeeBtn = actions.createEl("button", {
      cls: "mod-cta",
      text: "Buy Me a Coffee",
    });
    coffeeBtn.addEventListener("click", () => {
      window.open(FUNDING_URL, "_blank");
      this.close();
    });

    const laterBtn = actions.createEl("button", { text: "Maybe later" });
    laterBtn.addEventListener("click", () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export function openFundingModal(
  app: App,
  kind: "install" | "update",
  version: string
): void {
  new FundingModal(app, kind, version).open();
}
