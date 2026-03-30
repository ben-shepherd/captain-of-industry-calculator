import { useCoiStore } from '../assets/js/app/coiExternalStore';
import { NetFlowChartSection } from './components/charts/NetFlowChartSection';
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
  const state = useCoiStore();
  const outcome = useCalculation(state);
  const chainTotals = outcome.ok && outcome.result ? outcome.result.totals : {};

  return (
    <>
      <AppHeader />
      <div className="app-page">
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
    </>
  );
}
