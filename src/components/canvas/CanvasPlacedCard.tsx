import type { ResourceDef } from '../../../assets/js/contracts';

const RATE_STEP = 1;
/** Larger step sizes shown as quick-add buttons (−100 … +100). */
const BULK_STEPS = [100, 10, 5] as const;

/** Parse user text to a number; adjust by delta; return a compact string for the input. */
function adjustRateString(current: string, delta: number): string {
  const trimmed = String(current).trim().replace(',', '.');
  const n = parseFloat(trimmed);
  const base = Number.isFinite(n) ? n : 0;
  const next = base + delta;
  if (!Number.isFinite(next)) return '';
  if (Number.isInteger(next)) return String(next);
  const rounded = Math.round(next * 1000) / 1000;
  return String(rounded);
}

function RateBulkRow({
  applyDelta,
  label,
  kind,
}: {
  applyDelta: (delta: number) => void;
  label: string;
  kind: 'production' | 'consumption';
}) {
  return (
    <div
      className="canvas-placed-card-flow-bulk"
      role="group"
      aria-label={`${label} ${kind} quick steps`}
    >
      {BULK_STEPS.map((s) => (
        <button
          key={`sub-${s}`}
          type="button"
          className="canvas-placed-card-flow-bulk-btn"
          onClick={(e) => {
            e.preventDefault();
            applyDelta(-s);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Decrease ${label} ${kind} by ${s} per minute`}
        >
          −{s}
        </button>
      ))}
      {BULK_STEPS.map((s) => (
        <button
          key={`add-${s}`}
          type="button"
          className="canvas-placed-card-flow-bulk-btn"
          onClick={(e) => {
            e.preventDefault();
            applyDelta(s);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Increase ${label} ${kind} by ${s} per minute`}
        >
          +{s}
        </button>
      ))}
    </div>
  );
}

type Props = {
  canvasNodeKey: string;
  resourceId: string;
  def: ResourceDef | undefined;
  label: string;
  batchId: number;
  productionPerMin: string;
  consumptionPerMin: string;
  onProductionChange: (key: string, value: string) => void;
  onConsumptionChange: (key: string, value: string) => void;
  style: React.CSSProperties;
  onBatchPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function CanvasPlacedCard({
  canvasNodeKey,
  resourceId,
  def,
  label,
  batchId,
  productionPerMin,
  consumptionPerMin,
  onProductionChange,
  onConsumptionChange,
  style,
  onBatchPointerDown,
}: Props) {
  const url = def?.imageUrl;
  const prodId = `canvas-placed-prod-${canvasNodeKey}`;
  const consId = `canvas-placed-cons-${canvasNodeKey}`;

  return (
    <div
      className="canvas-placed-card"
      style={style}
      data-resource-id={resourceId}
      data-batch-id={String(batchId)}
      aria-label={label}
      onPointerDown={onBatchPointerDown}
    >
      <div className="canvas-placed-card-header">
        <span className="canvas-placed-card-title">{label}</span>
      </div>
      <div className="canvas-placed-card-body">
        {url ? (
          <img className="canvas-placed-card-icon" src={url} alt="" aria-hidden />
        ) : (
          <span className="canvas-placed-card-fallback" aria-hidden>
            {label.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="canvas-placed-card-flows">
        <div className="canvas-placed-card-flow-row">
          <label className="canvas-placed-card-flow-label" htmlFor={prodId}>
            Production
          </label>
          <div className="canvas-placed-card-flow-input-wrap">
            <button
              type="button"
              className="canvas-placed-card-flow-step-btn"
              aria-label={`Decrease ${label} production`}
              onClick={(e) => {
                e.preventDefault();
                onProductionChange(canvasNodeKey, adjustRateString(productionPerMin, -RATE_STEP));
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              −
            </button>
            <input
              id={prodId}
              type="text"
              inputMode="decimal"
              className="canvas-placed-card-flow-input"
              value={productionPerMin}
              onChange={(e) => onProductionChange(canvasNodeKey, e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="0"
              autoComplete="off"
              aria-label={`${label} production per minute`}
            />
            <button
              type="button"
              className="canvas-placed-card-flow-step-btn"
              aria-label={`Increase ${label} production`}
              onClick={(e) => {
                e.preventDefault();
                onProductionChange(canvasNodeKey, adjustRateString(productionPerMin, RATE_STEP));
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              +
            </button>
            <span className="canvas-placed-card-flow-unit" aria-hidden>
              /min
            </span>
          </div>
          <RateBulkRow
            label={label}
            kind="production"
            applyDelta={(delta) =>
              onProductionChange(canvasNodeKey, adjustRateString(productionPerMin, delta))
            }
          />
        </div>
        <div className="canvas-placed-card-flow-row">
          <label className="canvas-placed-card-flow-label" htmlFor={consId}>
            Consumption
          </label>
          <div className="canvas-placed-card-flow-input-wrap">
            <button
              type="button"
              className="canvas-placed-card-flow-step-btn"
              aria-label={`Decrease ${label} consumption`}
              onClick={(e) => {
                e.preventDefault();
                onConsumptionChange(canvasNodeKey, adjustRateString(consumptionPerMin, -RATE_STEP));
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              −
            </button>
            <input
              id={consId}
              type="text"
              inputMode="decimal"
              className="canvas-placed-card-flow-input"
              value={consumptionPerMin}
              onChange={(e) => onConsumptionChange(canvasNodeKey, e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="0"
              autoComplete="off"
              aria-label={`${label} consumption per minute`}
            />
            <button
              type="button"
              className="canvas-placed-card-flow-step-btn"
              aria-label={`Increase ${label} consumption`}
              onClick={(e) => {
                e.preventDefault();
                onConsumptionChange(canvasNodeKey, adjustRateString(consumptionPerMin, RATE_STEP));
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              +
            </button>
            <span className="canvas-placed-card-flow-unit" aria-hidden>
              /min
            </span>
          </div>
          <RateBulkRow
            label={label}
            kind="consumption"
            applyDelta={(delta) =>
              onConsumptionChange(canvasNodeKey, adjustRateString(consumptionPerMin, delta))
            }
          />
        </div>
      </div>
    </div>
  );
}
