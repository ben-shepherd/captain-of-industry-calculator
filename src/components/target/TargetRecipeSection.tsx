import type { Recipe } from '../../../assets/js/contracts';
import { resources } from '../../../assets/js/data/resources';
import { perMinute } from '../../../assets/js/ui/recipeDiagram';

function formatRate(n: number): string {
  if (!isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function ItemStack({
  resourceId,
  cycleQty,
  durationSec,
}: {
  resourceId: string;
  cycleQty: number;
  durationSec: number;
}) {
  const def = resources[resourceId];
  const label = def?.label ?? resourceId;
  const rate = perMinute(cycleQty, durationSec);
  const url = def?.imageUrl;
  const top = formatRate(cycleQty);
  const bottom = formatRate(rate);
  return (
    <div className="recipe-item-stack" title={label}>
      <span className="recipe-item-qty">{top}</span>
      {url ? (
        <img
          className="resource-icon"
          src={url}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="recipe-item-icon-fallback" aria-hidden="true"></span>
      )}
      <span className="recipe-item-rate">{bottom}</span>
    </div>
  );
}

function RecipeCard({
  resourceId,
  recipe,
  recipeIdx,
  selected,
  onSelectRecipe,
}: {
  resourceId: string;
  recipe: Recipe;
  recipeIdx: number;
  selected: boolean;
  onSelectRecipe: (idx: number) => void;
}) {
  const { durationSec, inputs, outputs, building, name } = recipe;
  const outQty = outputs[resourceId] ?? 0;
  const outRate = perMinute(outQty, durationSec);

  const inputIds = Object.keys(inputs).sort((a, b) => {
    const la = resources[a]?.label ?? a;
    const lb = resources[b]?.label ?? b;
    return la.localeCompare(lb, 'en');
  });

  const outputIds = Object.keys(outputs).sort((a, b) => {
    const la = resources[a]?.label ?? a;
    const lb = resources[b]?.label ?? b;
    return la.localeCompare(lb, 'en');
  });

  const durationStr = formatRate(durationSec);
  const durationLabel = `${durationStr} s`;
  const ariaLabel = `Use recipe: ${name} (${building})`;

  const clockSvg = (
    <svg
      className="recipe-clock-svg"
      viewBox="0 0 16 16"
      width={11}
      height={11}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 4.5V8l2.5 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );

  const machineSvg = (
    <svg
      className="recipe-machine-svg"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10h4v8H4zM10 6h4v12h-4zM16 4h4v14h-4z" />
    </svg>
  );

  return (
    <li className="recipe-card-item" role="none">
      <button
        type="button"
        className="recipe-card"
        data-recipe-idx={recipeIdx}
        aria-pressed={selected ? 'true' : 'false'}
        aria-label={ariaLabel}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelectRecipe(recipeIdx);
        }}
      >
        <div className="recipe-machine">
          <span className="recipe-machine-icon" aria-hidden="true">
            {machineSvg}
          </span>
          <span className="recipe-machine-sep">:</span>
          <span className="recipe-building-name">{building}</span>
        </div>
        <div className="recipe-io recipe-inputs">
          {inputIds.length === 0 ? (
            <span className="recipe-no-inputs" aria-label="No inputs">
              —
            </span>
          ) : (
            inputIds.map((id, i) => (
              <span key={id} className="recipe-io-chunk">
                {i > 0 && (
                  <span className="recipe-plus" aria-hidden="true">
                    +
                  </span>
                )}
                <ItemStack
                  resourceId={id}
                  cycleQty={inputs[id] ?? 0}
                  durationSec={durationSec}
                />
              </span>
            ))
          )}
        </div>
        <div className="recipe-arrow-block">
          <div className="recipe-time-primary">
            <span className="recipe-time-val">{durationLabel}</span>
            {clockSvg}
          </div>
          <div className="recipe-arrow" aria-hidden="true">
            |||&gt;&gt;
          </div>
          <div className="recipe-time-secondary">
            <span className="recipe-out-rate">{formatRate(outRate)}</span>
            {clockSvg}
            <span className="recipe-out-rate-suffix">/min</span>
          </div>
        </div>
        <div className="recipe-io recipe-outputs">
          {outputIds.map((id, i) => (
            <span key={id} className="recipe-io-chunk">
              {i > 0 && (
                <span className="recipe-plus" aria-hidden="true">
                  +
                </span>
              )}
              <ItemStack
                resourceId={id}
                cycleQty={outputs[id] ?? 0}
                durationSec={durationSec}
              />
            </span>
          ))}
        </div>
      </button>
    </li>
  );
}

export function TargetRecipeSection({
  resourceId,
  selectedRecipeIdx,
  onSelectRecipe,
}: {
  resourceId: string;
  selectedRecipeIdx: number;
  onSelectRecipe: (idx: number) => void;
}) {
  if (!resourceId) {
    return null;
  }

  const def = resources[resourceId];
  if (!def) {
    return null;
  }

  const cards: { recipe: Recipe; idx: number }[] = [];
  for (let i = 0; i < def.recipes.length; i++) {
    const r = def.recipes[i];
    if (!r || (r.outputs[resourceId] ?? 0) <= 0) continue;
    cards.push({ recipe: r, idx: i });
  }

  if (cards.length === 0) {
    return (
      <details className="results-section recipe-diagram-section" id="target-recipe-section" open>
        <summary className="results-section-summary">Production recipes</summary>
        <div className="results-section-body recipe-diagram-section-body">
          <div id="target-recipe-diagram" className="target-recipe-diagram" aria-live="polite">
            <p className="recipe-diagram-empty">No production recipes for this resource.</p>
          </div>
        </div>
      </details>
    );
  }

  return (
    <details className="results-section recipe-diagram-section" id="target-recipe-section" open>
      <summary className="results-section-summary">Production recipes</summary>
      <div className="results-section-body recipe-diagram-section-body">
        <div id="target-recipe-diagram" className="target-recipe-diagram" aria-live="polite">
          <p className="recipe-diagram-hint">
            Cycle amounts (top), per minute for one machine (bottom).{' '}
            <span className="recipe-diagram-accent">Click a recipe</span> to drive base requirements,
            the dependency tree, and net flow.
          </p>
          <ul className="recipe-card-list" role="list">
            {cards.map(({ recipe, idx }) => (
              <RecipeCard
                key={idx}
                resourceId={resourceId}
                recipe={recipe}
                recipeIdx={idx}
                selected={idx === selectedRecipeIdx}
                onSelectRecipe={onSelectRecipe}
              />
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
