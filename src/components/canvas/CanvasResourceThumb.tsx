import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ResourceDef } from '../../../assets/js/contracts';
import {
  buildCanvasResourceTooltipModel,
  canvasResourceAriaSummary,
  type CanvasResourceTooltipContext,
} from '../../utils/canvasResourceTooltip';

type Props = {
  resourceId: string;
  def: ResourceDef;
  category: CanvasResourceTooltipContext;
  isSelected: boolean;
  onSelect: (resourceId: string) => void;
};

export function CanvasResourceThumb({ resourceId, def, category, isSelected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const model = buildCanvasResourceTooltipModel(resourceId, def, category);

  function showAt(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(
      12,
      Math.min(centerX, window.innerWidth - 12),
    );
    const top = rect.bottom + 8;
    setPos({ left, top });
    setOpen(true);
  }

  function onOpen(e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) {
    showAt(e.currentTarget);
  }

  function onClose() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const url = def.imageUrl;
  const ariaLabel = canvasResourceAriaSummary(model);

  return (
    <>
      <button
        type="button"
        className="canvas-resource-thumb"
        role="listitem"
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        onFocus={onOpen}
        onBlur={onClose}
        onClick={() => onSelect(resourceId)}
      >
        {url ? (
          <img
            className="resource-icon canvas-resource-icon"
            src={url}
            alt=""
            aria-hidden
          />
        ) : (
          <span className="canvas-resource-fallback" aria-hidden>
            {def.label.slice(0, 1)}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <div
            className="canvas-tooltip"
            role="tooltip"
            aria-hidden
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              transform: 'translateX(-50%)',
              zIndex: 100,
            }}
          >
            <div className="canvas-tooltip-title">{model.label}</div>
            <div className="canvas-tooltip-id" title={model.resourceId}>
              {model.resourceId}
            </div>
            <div className="canvas-tooltip-line canvas-tooltip-line--accent">{model.recipeLine}</div>
            <div className="canvas-tooltip-line">{model.unitLine}</div>
            <div className="canvas-tooltip-line">{model.categoryLine}</div>
            {model.buildingsLine ? (
              <div className="canvas-tooltip-block">
                <div className="canvas-tooltip-k">Buildings</div>
                <div className="canvas-tooltip-buildings">{model.buildingsLine}</div>
              </div>
            ) : null}
          </div>,
          document.body,
        )}
    </>
  );
}
