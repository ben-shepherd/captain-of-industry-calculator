import { getResourceEntriesInPickerOrder } from '../data/resources';

/**
 * Resources whose label contains the query (case-insensitive), in picker order.
 */
export function matchResourcesForSearch(query: string): { id: string; label: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getResourceEntriesInPickerOrder().filter((e) =>
    e.label.toLowerCase().includes(q),
  );
}

export const TARGET_RESOURCE_PLACEHOLDER = 'Choose a resource';
