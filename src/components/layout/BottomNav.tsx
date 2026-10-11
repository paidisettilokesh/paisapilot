import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_ROUTES } from '@/lib/constants';
import { getIcon } from '@/lib/icons';

export function BottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-navy-500"
      style={{
        background:
          'linear-gradient(0deg, rgba(11,16,32,0.98) 0%, rgba(11,16,32,0.92) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around h-16 px-1">
        {NAV_ROUTES.map((route) => {
          const Icon = getIcon(route.icon);
          return (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator-bottom"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald"
                    />
                  )}
                  <motion.span
                    animate={{
                      color: isActive ? '#10B981' : '#94A3B8',
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Icon size={20} />
                  </motion.span>
                  <motion.span
                    animate={{ color: isActive ? '#10B981' : '#94A3B8' }}
                    className="text-2xs font-medium"
                  >
                    {route.label}
                  </motion.span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
