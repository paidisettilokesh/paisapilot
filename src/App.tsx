import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinancialProvider } from '@/context/FinancialContext';
import { AppShell } from '@/components/layout/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { MoneyLabPage } from '@/pages/MoneyLabPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { HealthPage } from '@/pages/HealthPage';

/**
 * PaisaPilot Master Application Component
 * Providing full routing, shared financial state, and animated shell.
 */
export default function App() {
  return (
    <BrowserRouter>
      <FinancialProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/lab" element={<MoneyLabPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </FinancialProvider>
    </BrowserRouter>
  );
}
