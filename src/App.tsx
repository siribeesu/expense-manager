import { FinanceProvider } from './context/FinanceContext';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
  return (
    <FinanceProvider>
      <AppLayout />
    </FinanceProvider>
  );
}

export default App;
