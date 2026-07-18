// Austrian Economics Dashboard - Cypherpunk/Bitcoiner Design
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TrustedSnapshotPanel } from './components/TrustedSnapshotPanel';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950">
        <TrustedSnapshotPanel />
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
