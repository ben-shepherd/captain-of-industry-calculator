import { resources } from '../../../assets/js/data/resources';

export function ResourceLabel({ id, label }: { id: string; label: string }) {
  const url = resources[id]?.imageUrl;
  if (!url) return <>{label}</>;
  return (
    <span className="resource-label-with-icon">
      <img
        className="resource-icon"
        src={url}
        alt=""
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
      />
      <span className="resource-label-text">{label}</span>
    </span>
  );
}
