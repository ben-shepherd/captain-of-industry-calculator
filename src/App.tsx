import { useState } from 'react';
import { useCoiStore } from '../assets/js/app/coiExternalStore';
import type { AppView } from './appView';
import { NetFlowChartSection } from './components/charts/NetFlowChartSection';
import { CanvasView } from './components/canvas/CanvasView';
import { ProductionSection } from './components/configuration/ProductionSection';
import { PresetsSection } from './components/configuration/PresetsSection';
import { RecentResources } from './components/configuration/RecentResources';
import { AppHeader } from './components/layout/AppHeader';
import { Footer } from './components/layout/Footer';
import { UserGuide } from './components/layout/UserGuide';
import { ResultsSection } from './components/results/ResultsSection';
import { TargetResourcePanel } from './components/target/TargetResourcePanel';
import { useCalculation } from './hooks/useCalculation';

export function App() {
  const [view, setView] = useState<AppView>('calculator');
  const state = useCoiStore();
  const outcome = useCalculation(state);
  const chainTotals = outcome.ok && outcome.result ? outcome.result.totals : {};

  return (
    <div className="app-root">
      <AppHeader activeView={view} onViewChange={setView} />
      {view === 'calculator' ? (
        <div className="app-page" id="app-main-view">
          <UserGuide />
          <RecentResources />
          <TargetResourcePanel />
          <main className="app-main">
            <section className="panel panel-inputs">
              <h2>Configuration</h2>
              <ProductionSection chainTotals={chainTotals} />
              <PresetsSection />
            </section>
            <ResultsSection outcome={outcome} />
          </main>
          <NetFlowChartSection outcome={outcome} />
          <Footer />
        </div>
      ) : (
        <CanvasView />
      )}
    </div>
  );
}
