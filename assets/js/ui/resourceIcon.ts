import { resources } from "../data/resources";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline &lt;img&gt; for a resource wiki icon, or empty string if none. */
export function resourceIconImgHtml(id: string): string {
  const url = resources[id]?.imageUrl;
  if (!url) return "";
  return (
    `<img class="resource-icon" src="${escapeHtml(url)}" alt="" width="20" height="20" `
    + `loading="lazy" decoding="async" />`
  );
}

/**
 * Label text with optional leading icon (for buttons / HTML tables).
 */
export function resourceLabelWithIconHtml(id: string, label: string): string {
  const icon = resourceIconImgHtml(id);
  const text = escapeHtml(label);
  if (!icon) return text;
  return `<span class="resource-label-with-icon">${icon}<span class="resource-label-text">${text}</span></span>`;
}

/** Updates a container used as an icon slot next to a &lt;select&gt; (decorative). */
export function setResourceIconSlot(slot: HTMLElement | null, resourceId: string): void {
  if (!slot) return;
  const url = resourceId && resources[resourceId]?.imageUrl;
  if (!url) {
    slot.innerHTML = "";
    slot.hidden = true;
    return;
  }
  slot.hidden = false;
  slot.innerHTML =
    `<img class="resource-icon" src="${escapeHtml(url)}" alt="" width="24" height="24" `
    + `loading="lazy" decoding="async" />`;
}

/** Wiki link under the target resource selector; hidden when no resource or no URL. */
export function setResourceWikiLink(wrap: HTMLElement | null, resourceId: string): void {
  if (!wrap) return;
  const url = resourceId && resources[resourceId]?.wikiUrl;
  if (!url) {
    wrap.innerHTML = "";
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  wrap.innerHTML =
    `<a class="resource-wiki-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View on wiki</a>`;
}
