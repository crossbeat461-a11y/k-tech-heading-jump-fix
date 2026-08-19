const PREFIX = "[Heading Jump Fix]";

export function debugLog(
  enabled: boolean,
  message: string,
  extra?: unknown
): void {
  if (!enabled) return;
  if (extra !== undefined) {
    console.log(PREFIX, message, extra);
  } else {
    console.log(PREFIX, message);
  }
}
