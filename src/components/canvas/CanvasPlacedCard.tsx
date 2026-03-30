import type { ResourceDef } from '../../../assets/js/contracts';
import { CANVAS_PLACE_DEFAULT_RATE } from '../../utils/canvasPlacement';

type Props = {
  resourceId: string;
  def: ResourceDef | undefined;
  label: string;
  style: React.CSSProperties;
};

export function CanvasPlacedCard({ resourceId, def, label, style }: Props) {
  const url = def?.imageUrl;
  return (
    <div
      className="canvas-placed-card"
      style={style}
      data-resource-id={resourceId}
      aria-label={label}
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
      <div className="canvas-placed-card-footer">
        <span className="canvas-placed-card-rate">{CANVAS_PLACE_DEFAULT_RATE}/min</span>
      </div>
    </div>
  );
}
