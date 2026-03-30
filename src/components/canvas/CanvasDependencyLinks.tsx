import { useId } from 'react';
import type { CanvasDependencyEdge } from '../../utils/canvasPlacement';
import { CANVAS_CARD_HEIGHT_PX, CANVAS_CARD_WIDTH_PX } from '../../utils/canvasPlacement';

type Props = {
  width: number;
  height: number;
  edges: CanvasDependencyEdge[];
  nodePositions: Map<string, { x: number; y: number }>;
};

export function CanvasDependencyLinks({ width, height, edges, nodePositions }: Props) {
  const uid = useId().replace(/:/g, '');
  const markerId = `canvas-arrowhead-${uid}`;

  if (width <= 0 || height <= 0) return null;

  return (
    <svg
      className="canvas-dependency-links"
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <marker
          id={markerId}
          markerUnits="strokeWidth"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <polygon
            className="canvas-dependency-links-arrowhead"
            points="0 0, 7 3.5, 0 7"
          />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const from = nodePositions.get(e.fromKey);
        const to = nodePositions.get(e.toKey);
        if (!from || !to) return null;
        const x1 = from.x + CANVAS_CARD_WIDTH_PX / 2;
        const y1 = from.y + CANVAS_CARD_HEIGHT_PX / 2;
        const x2 = to.x + CANVAS_CARD_WIDTH_PX / 2;
        const y2 = to.y + CANVAS_CARD_HEIGHT_PX / 2;
        return (
          <line
            key={`${e.fromKey}-${e.toKey}-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="canvas-dependency-links-line"
            markerEnd={`url(#${markerId})`}
          />
        );
      })}
    </svg>
  );
}
