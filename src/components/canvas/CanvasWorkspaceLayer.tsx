import { useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { CanvasDependencyEdge } from '../../utils/canvasPlacement';
import { CANVAS_CARD_HEIGHT_PX, CANVAS_CARD_WIDTH_PX } from '../../utils/canvasPlacement';

type Props = {
  width: number;
  height: number;
  edges: CanvasDependencyEdge[];
  nodePositions: Map<string, { x: number; y: number }>;
};

const ARROW_HEAD_PX = 7;
const LINE_WIDTH_PX = 2;

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fillStyle: string,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const ux = dx / len;
  const uy = dy / len;
  const bx = x2 - ux * ARROW_HEAD_PX;
  const by = y2 - uy * ARROW_HEAD_PX;
  const perpX = -uy * (ARROW_HEAD_PX * 0.5);
  const perpY = ux * (ARROW_HEAD_PX * 0.5);

  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(bx + perpX, by + perpY);
  ctx.lineTo(bx - perpX, by - perpY);
  ctx.closePath();
  ctx.fill();
}

export function CanvasWorkspaceLayer({ width, height, edges, nodePositions }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineSampleRef = useRef<SVGLineElement>(null);
  const arrowSampleRef = useRef<SVGPolygonElement>(null);
  const [resizeVersion, bumpResize] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    window.addEventListener('resize', bumpResize);
    return () => window.removeEventListener('resize', bumpResize);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const lineEl = lineSampleRef.current;
    const arrowEl = arrowSampleRef.current;
    let strokeStyle = 'color-mix(in srgb, #ff9d00 55%, #666)';
    let fillStyle = 'color-mix(in srgb, #ff9d00 45%, #555)';
    if (lineEl && arrowEl) {
      const ls = getComputedStyle(lineEl);
      const fs = getComputedStyle(arrowEl);
      const s = ls.stroke;
      const f = fs.fill;
      if (s && s !== 'none') strokeStyle = s;
      if (f && f !== 'none') fillStyle = f;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = LINE_WIDTH_PX;
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeStyle;

    for (const e of edges) {
      const from = nodePositions.get(e.fromKey);
      const to = nodePositions.get(e.toKey);
      if (!from || !to) continue;
      const x1 = from.x + CANVAS_CARD_WIDTH_PX / 2;
      const y1 = from.y + CANVAS_CARD_HEIGHT_PX / 2;
      const x2 = to.x + CANVAS_CARD_WIDTH_PX / 2;
      const y2 = to.y + CANVAS_CARD_HEIGHT_PX / 2;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const ux = dx / len;
      const uy = dy / len;
      const x2Line = x2 - ux * ARROW_HEAD_PX;
      const y2Line = y2 - uy * ARROW_HEAD_PX;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2Line, y2Line);
      ctx.stroke();

      drawArrowhead(ctx, x1, y1, x2, y2, fillStyle);
    }
  }, [width, height, edges, nodePositions, resizeVersion]);

  if (width <= 0 || height <= 0) return null;

  return (
    <>
      <canvas ref={canvasRef} className="canvas-workspace-paint" aria-hidden />
      <svg
        className="canvas-workspace-paint-samples"
        aria-hidden
        width={0}
        height={0}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          pointerEvents: 'none',
        }}
      >
        <line
          ref={lineSampleRef}
          className="canvas-dependency-links-line"
          x1={0}
          y1={0}
          x2={1}
          y2={0}
        />
        <polygon ref={arrowSampleRef} className="canvas-dependency-links-arrowhead" points="0,0 1,0 0,1" />
      </svg>
    </>
  );
}
