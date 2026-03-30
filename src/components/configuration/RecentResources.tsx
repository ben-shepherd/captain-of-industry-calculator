import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setResourceId } from '../../../assets/js/app/state';
import { resources } from '../../../assets/js/data/resources';
import { ResourceLabel } from '../shared/ResourceLabel';

export function RecentResources() {
  const state = useCoiStore();
  const ids = state.recentTargetResourceIds;
  const current = state.resourceId;

  if (ids.length === 0) {
    return (
      <section className="recent-resources-section" aria-label="Recent resources">
        <h2 className="recent-resources-heading">Recent resources</h2>
        <div id="recent-resources" className="recent-resources" aria-live="polite">
          <p className="recent-resources-empty">No recent resources yet — pick a resource below.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="recent-resources-section" aria-label="Recent resources">
      <h2 className="recent-resources-heading">Recent resources</h2>
      <div id="recent-resources" className="recent-resources" aria-live="polite">
        <ul className="recent-resources-list" role="list">
          {ids.map((id) => {
            const def = resources[id];
            const label = def?.label ?? id;
            const pressed = id === current ? 'true' : 'false';
            return (
              <li key={id} className="recent-resources-item" role="none">
                <button
                  type="button"
                  className="recent-resource-chip production-row-target"
                  data-production-target={id}
                  aria-pressed={pressed}
                  aria-label={`Set ${label} as target resource`}
                  onClick={() => setResourceId(id)}
                >
                  <ResourceLabel id={id} label={label} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
