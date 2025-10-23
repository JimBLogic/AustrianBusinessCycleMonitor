// Austrian Economics Dashboard - Cypherpunk/Bitcoiner Design
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <EnhancedDashboard />
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
    </>
  );
}

export default App
