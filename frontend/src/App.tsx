import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider } from './context/FinanceContext';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <AppLayout />
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default App;
