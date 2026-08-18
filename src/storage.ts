import { DEFAULT_SETTINGS, type HeadingJumpFixSettings } from "./settings";

export interface PluginStorage {
  settings: HeadingJumpFixSettings;
  lastSeenVersion?: string;
}

export function parseStorage(raw: unknown): PluginStorage {
  if (!raw || typeof raw !== "object") {
    return { settings: { ...DEFAULT_SETTINGS } };
  }

  const data = raw as Record<string, unknown>;

  if ("settings" in data && data.settings && typeof data.settings === "object") {
    return {
      settings: Object.assign({}, DEFAULT_SETTINGS, data.settings),
      lastSeenVersion:
        typeof data.lastSeenVersion === "string"
          ? data.lastSeenVersion
          : undefined,
    };
  }

  return {
    settings: Object.assign({}, DEFAULT_SETTINGS, data),
    lastSeenVersion: undefined,
  };
}

export function toStorage(
  settings: HeadingJumpFixSettings,
  lastSeenVersion?: string
): PluginStorage {
  return { settings, lastSeenVersion };
}
