import { ResourceLabel } from './ResourceLabel';

export function ResourceTargetButton({
  id,
  label,
  currentResourceId,
  onSetTarget,
  className = 'production-row-target',
  extraClassName,
}: {
  id: string;
  label: string;
  currentResourceId: string;
  onSetTarget: (id: string) => void;
  className?: string;
  extraClassName?: string;
}) {
  const pressed = id === currentResourceId;
  const cls = [className, extraClassName].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      data-production-target={id}
      aria-pressed={pressed ? 'true' : 'false'}
      aria-label={`Set ${label} as target resource`}
      onClick={() => onSetTarget(id)}
    >
      <ResourceLabel id={id} label={label} />
    </button>
  );
}
