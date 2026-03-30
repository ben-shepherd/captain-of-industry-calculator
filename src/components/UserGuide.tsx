import { useCoiStore } from '../../assets/js/app/coiExternalStore';
import { setUserGuideExpanded, setUserGuideVisible } from '../../assets/js/app/state';

export function UserGuide() {
  const state = useCoiStore();
  const visible = state.userGuideVisible;
  const expanded = state.userGuideExpanded;

  return (
    <section
      id="user-guide-panel"
      className="panel panel-user-guide"
      aria-label="How to use this calculator"
      hidden={!visible}
    >
      <details
        className="results-section"
        id="user-guide"
        open={expanded}
        onToggle={(e) => {
          const el = e.currentTarget;
          if (!state.userGuideVisible) return;
          setUserGuideExpanded(el.open);
        }}
      >
        <summary className="results-section-summary user-guide-summary">
          <span className="user-guide-summary-heading">How to use this calculator</span>
          <button
            type="button"
            id="user-guide-dismiss"
            className="btn btn-secondary user-guide-dismiss"
            aria-label="Dismiss user guide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUserGuideVisible(false);
            }}
          >
            Dismiss
          </button>
        </summary>
        <div className="results-section-body user-guide-body">
          <ul className="user-guide-list">
            <li>
              <strong>Target</strong> — Search or browse by category, then set your desired{' '}
              <strong>output rate per minute</strong>.
            </li>
            <li>
              <strong>Configuration</strong> — Under <strong>Your production</strong>, adjust chain
              rates, add extra resources, or clear rows. Use <strong>Presets</strong> to save, load,
              merge, or replace production setups.
            </li>
            <li>
              <strong>Results</strong> — <strong>Base resources required</strong>,{' '}
              <strong>Net flow</strong>, and <strong>Dependency tree</strong> show the breakdown;
              each block can be collapsed.
            </li>
            <li>
              <strong>Net flow chart</strong> — At the bottom of the page; pick a chart style from
              the dropdown above the chart.
            </li>
            <li>
              <strong>Export / Import / Reset</strong> — Use the header buttons to back up your saved
              settings, restore from a file, or clear stored data for this browser.
            </li>
          </ul>
        </div>
      </details>
    </section>
  );
}
