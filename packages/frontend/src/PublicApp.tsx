import { Toaster } from 'sonner';

import { ErrorBoundary } from './components/ErrorBoundary';
import { ProductionDashboard } from './components/ProductionDashboard';

export function PublicApp() {
  return (
    <ErrorBoundary>
      <ProductionDashboard />
      <Toaster position="top-right" richColors closeButton theme="system" />
    </ErrorBoundary>
  );
}
