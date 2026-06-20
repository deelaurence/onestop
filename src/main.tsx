import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { initPerformanceProfile } from './lib/performance';
import './index.css';

initPerformanceProfile();

const App = lazy(() => import('./App.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>,
);
