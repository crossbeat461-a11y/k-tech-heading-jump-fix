import type { App } from "obsidian";

export const INSTANT_SCROLL_BODY_CLASS = "heading-jump-fix-instant-scroll";

export function applyInstantScrollOverride(app: App, enabled: boolean): void {
  for (const doc of collectDocuments(app)) {
    doc.body.classList.toggle(INSTANT_SCROLL_BODY_CLASS, enabled);
  }
}

function collectDocuments(app: App): Document[] {
  const docs = new Set<Document>([document]);
  app.workspace.iterateAllLeaves((leaf) => {
    const win = leaf.view.containerEl.win;
    if (win?.document) docs.add(win.document);
  });
  return [...docs];
}
