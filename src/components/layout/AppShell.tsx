import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

/**
 * Root application shell.
 * - Desktop: fixed sidebar left + sticky top header + scrollable content
 * - Mobile:  sticky top header + full-width content + sticky bottom nav
 * Pages are rendered via <Outlet /> with a subtle page-transition animation.
 */
export function AppShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh bg-navy-900">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 px-4 pt-5 pb-24 lg:px-8 lg:pt-8 lg:pb-10 max-w-6xl w-full mx-auto"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
