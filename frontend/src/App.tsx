import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary level="root">
      <ThemeProvider>
        <FinanceProvider>
          <AppLayout />
        </FinanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
