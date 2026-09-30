export const OUTLINE_KEYBOARD_IGNORE =
  ".collapse-icon, .tree-item-icon, .clickable-icon";

export function isConfirmKey(event: KeyboardEvent): boolean {
  if (event.isComposing || event.repeat) return false;
  return event.key === "Enter";
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest("input, textarea, select");
}
