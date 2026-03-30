const STORAGE_KEY = 'coi-canvas-sidebar-expanded';

/** Level indices used in {@link RESOURCE_SEGMENTS} (natural → waste). */
const LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;

function defaultExpandedMap(): Record<number, boolean> {
  return Object.fromEntries(LEVELS.map((level) => [level, true])) as Record<number, boolean>;
}

export function loadCanvasSidebarExpanded(): Record<number, boolean> {
  const defaults = defaultExpandedMap();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out = { ...defaults };
    for (const level of LEVELS) {
      const v = parsed[String(level)];
      if (typeof v === 'boolean') out[level] = v;
    }
    return out;
  } catch {
    return defaults;
  }
}

export function saveCanvasSidebarExpanded(map: Record<number, boolean>): void {
  try {
    const payload: Record<string, boolean> = {};
    for (const level of LEVELS) {
      payload[String(level)] = map[level] ?? true;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}
