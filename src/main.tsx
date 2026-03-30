import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initGoogleAnalytics } from '../assets/js/analytics';
import { initCoiApp } from '../assets/js/app/coiExternalStore';
import '../assets/css/styles.css';
import { App } from './App';

initGoogleAnalytics();
initCoiApp();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
