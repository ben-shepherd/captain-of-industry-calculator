type Props = {
  left: number;
  top: number;
  label: string;
  imageUrl?: string;
};

/** Semi-transparent preview at cursor while in placement mode. */
export function CanvasPlacementGhost({ left, top, label, imageUrl }: Props) {
  return (
    <div
      className="canvas-placement-ghost"
      style={{
        left,
        top,
      }}
      aria-hidden
    >
      {imageUrl ? (
        <img className="canvas-placement-ghost-icon" src={imageUrl} alt="" />
      ) : (
        <span className="canvas-placement-ghost-fallback">{label.slice(0, 1)}</span>
      )}
      <span className="canvas-placement-ghost-label">{label}</span>
    </div>
  );
}
