import type { Recipe } from "../contracts";
import { resources } from "../data/resources";
import { escapeHtml, resourceIconImgHtml } from "./resourceIcon";

/** Per-minute throughput for one quantity over a recipe cycle of `durationSec` seconds. */
export function perMinute(qty: number, durationSec: number): number {
  if (durationSec <= 0 || !isFinite(durationSec)) return 0;
  return (qty * 60) / durationSec;
}

function formatRate(n: number): string {
  if (!isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function itemStackHtml(
  resourceId: string,
  cycleQty: number,
  durationSec: number,
): string {
  const def = resources[resourceId];
  const label = def?.label ?? resourceId;
  const rate = perMinute(cycleQty, durationSec);
  const icon = resourceIconImgHtml(resourceId);
  const top = formatRate(cycleQty);
  const bottom = formatRate(rate);
  const iconCell = icon
    ? icon
    : `<span class="recipe-item-icon-fallback" aria-hidden="true"></span>`;
  return (
    `<div class="recipe-item-stack" title="${escapeHtml(label)}">`
    + `<span class="recipe-item-qty">${escapeHtml(top)}</span>`
    + iconCell
    + `<span class="recipe-item-rate">${escapeHtml(bottom)}</span>`
    + `</div>`
  );
}

function recipeCardHtml(resourceId: string, recipe: Recipe): string {
  const { durationSec, inputs, outputs, building } = recipe;
  const outQty = outputs[resourceId] ?? 0;
  const outRate = perMinute(outQty, durationSec);

  const inputIds = Object.keys(inputs).sort((a, b) => {
    const la = resources[a]?.label ?? a;
    const lb = resources[b]?.label ?? b;
    return la.localeCompare(lb, "en");
  });

  const inputParts = inputIds.map((id) =>
    itemStackHtml(id, inputs[id] ?? 0, durationSec),
  );

  const outputIds = Object.keys(outputs).sort((a, b) => {
    const la = resources[a]?.label ?? a;
    const lb = resources[b]?.label ?? b;
    return la.localeCompare(lb, "en");
  });

  const outputParts = outputIds.map((id) =>
    itemStackHtml(id, outputs[id] ?? 0, durationSec),
  );

  const inputsJoined = inputParts.length > 0
    ? inputParts.join(`<span class="recipe-plus" aria-hidden="true">+</span>`)
    : `<span class="recipe-no-inputs" aria-label="No inputs">—</span>`;
  const outputsJoined = outputParts.join(
    `<span class="recipe-plus" aria-hidden="true">+</span>`,
  );

  const durationStr = formatRate(durationSec);
  const durationLabel = `${durationStr} s`;

  const clockSvg =
    `<svg class="recipe-clock-svg" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">`
    + `<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2"/>`
    + `<path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`
    + `</svg>`;

  return (
    `<li class="recipe-card">`
    + `<div class="recipe-machine">`
    + `<span class="recipe-machine-icon" aria-hidden="true">`
    + `<svg class="recipe-machine-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="M4 10h4v8H4zM10 6h4v12h-4zM16 4h4v14h-4z"/>`
    + `</svg>`
    + `</span>`
    + `<span class="recipe-machine-sep">:</span>`
    + `<span class="recipe-building-name">${escapeHtml(building)}</span>`
    + `</div>`
    + `<div class="recipe-io recipe-inputs">${inputsJoined}</div>`
    + `<div class="recipe-arrow-block">`
    + `<div class="recipe-time-primary"><span class="recipe-time-val">${escapeHtml(durationLabel)}</span>${clockSvg}</div>`
    + `<div class="recipe-arrow" aria-hidden="true">|||&gt;&gt;</div>`
    + `<div class="recipe-time-secondary"><span class="recipe-out-rate">${escapeHtml(formatRate(outRate))}</span>${clockSvg}<span class="recipe-out-rate-suffix">/min</span></div>`
    + `</div>`
    + `<div class="recipe-io recipe-outputs">${outputsJoined}</div>`
    + `</li>`
  );
}

function openRecipeSection(sectionEl: HTMLElement): void {
  if (sectionEl instanceof HTMLDetailsElement) {
    sectionEl.open = true;
  }
}

/**
 * Fills the inner #target-recipe-diagram inside the section, or clears the section.
 */
export function renderTargetRecipeDiagram(
  sectionEl: HTMLElement | null,
  resourceId: string,
): void {
  if (!sectionEl) return;
  const body = sectionEl.querySelector("#target-recipe-diagram");
  if (!(body instanceof HTMLElement)) return;

  if (!resourceId) {
    body.innerHTML = "";
    sectionEl.hidden = true;
    return;
  }

  const def = resources[resourceId];
  if (!def) {
    body.innerHTML = "";
    sectionEl.hidden = true;
    return;
  }

  const recipes = def.recipes.filter(
    (r) => (r.outputs[resourceId] ?? 0) > 0,
  );

  if (recipes.length === 0) {
    body.innerHTML =
      `<p class="recipe-diagram-empty">No production recipes for this resource.</p>`;
    sectionEl.hidden = false;
    openRecipeSection(sectionEl);
    return;
  }

  const cards = recipes.map((r) => recipeCardHtml(resourceId, r)).join("");

  body.innerHTML =
    `<p class="recipe-diagram-hint">Cycle amounts (top), per minute for one machine (bottom). Calculator uses the <span class="recipe-diagram-accent">first</span> recipe.</p>`
    + `<ul class="recipe-card-list" role="list">${cards}</ul>`;
  sectionEl.hidden = false;
  openRecipeSection(sectionEl);
}
