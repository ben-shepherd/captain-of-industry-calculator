import type { AppView } from '../../appView';

export type HomeViewProps = {
  onChoose: (view: Exclude<AppView, 'home'>) => void;
};

export function HomeView({ onChoose }: HomeViewProps) {
  return (
    <div className="app-page app-home" id="app-main-view">
      <main className="app-home-main" aria-label="Choose a view">
        <div className="app-home-card">
          <h2 className="app-home-title">Choose your view</h2>
          <p className="app-home-subtitle">
            You can switch views at anytime
          </p>
          <div className="app-home-actions">
            <button
              type="button"
              className="btn btn-secondary app-home-action"
              onClick={() => onChoose('calculator')}
            >
              <span className="app-home-action-title">Calculator</span>
              <span className="app-home-action-subtitle">
                Production chains, base resources, and net flow
              </span>
            </button>
            <button
              type="button"
              className="btn btn-secondary app-home-action"
              onClick={() => onChoose('canvas')}
            >
              <span className="app-home-action-title">Canvas</span>
              <span className="app-home-action-subtitle">
                Blueprint canvas layout
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

