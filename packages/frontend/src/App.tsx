import { Toaster } from 'sonner';

import { ErrorBoundary } from './components/ErrorBoundary';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { ProductionDashboard } from './components/ProductionDashboard';

function App() {
  return (
    <ErrorBoundary>
      <ProductionDashboard />
      <div hidden aria-hidden="true">
        <EnhancedDashboard />
      </div>
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme="system"
        toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          className: 'toast-custom',
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
