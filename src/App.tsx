import { useCoiStore } from '../assets/js/app/coiExternalStore';
import { AppHeader } from './components/AppHeader';
import { Footer } from './components/Footer';
import { NetFlowChartSection } from './components/NetFlowChartSection';
import { PresetsSection } from './components/PresetsSection';
import { ProductionSection } from './components/ProductionSection';
import { RecentResources } from './components/RecentResources';
import { ResultsSection } from './components/ResultsSection';
import { TargetResourcePanel } from './components/TargetResourcePanel';
import { UserGuide } from './components/UserGuide';
import { useCalculation } from './hooks/useCalculation';

export function App() {
  const state = useCoiStore();
  const outcome = useCalculation(state);
  const chainTotals = outcome.ok && outcome.result ? outcome.result.totals : {};

  return (
    <>
      <AppHeader />
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
    </>
  );
}
