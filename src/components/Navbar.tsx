import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ActivitySquare,
  BookOpen,
  CheckCircle,
  Home,
  Info,
  MapPin,
  Menu,
  Timer,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { config } from '../config/env';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from './ui/ThemeToggle';
import BrandLogo from './ui/BrandLogo';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/live', label: 'Race Tracker', icon: Timer },
  { path: '/profiles', label: 'Drivers & Teams', icon: Users },
  { path: '/tracks', label: 'Track Insights', icon: MapPin },
  { path: '/season', label: 'Storyline Lab', icon: TrendingUp },
  { path: '/guide', label: 'F1 Guide', icon: BookOpen },
  { path: '/about', label: 'About', icon: Info },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const activeLabel = useMemo(() => {
    const currentNavItem = navItems.find((item) => item.path === location.pathname);
    return currentNavItem?.label ?? 'Dashboard';
  }, [location.pathname]);

  const activeModuleCode = useMemo(() => {
    const activeIndex = navItems.findIndex((item) => item.path === location.pathname);
    if (activeIndex === -1) return '--';
    return String(activeIndex + 1).padStart(2, '0');
  }, [location.pathname]);

  return (
    <>
      <header className="app-topbar md:hidden">
        <button
          type="button"
          className="f1-icon-button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="app-logo-mark">
          <BrandLogo compact />
        </Link>

        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <aside className="app-sidebar hidden md:flex">
        <div className="app-sidebar-glow" aria-hidden="true" />

        <div className="app-brand">
          <Link to="/" className="app-logo-mark">
            <BrandLogo />
          </Link>
          <div className="app-brand-meta">
            <span className="app-brand-pulse" aria-hidden="true" />
            <span>Realtime analytics engine online</span>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-f1-muted">Navigation</p>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-f1-muted">Modules</span>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ path, label, icon: Icon }, index) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `group app-nav-item ${isActive ? 'app-nav-item-active' : 'app-nav-item-idle'}`
              }
            >
              <span className="app-nav-icon">
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              <span className="app-nav-text">{label}</span>
              <span className="app-nav-index">{String(index + 1).padStart(2, '0')}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <div className="app-sidebar-status">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.16em] text-f1-muted">Mode</span>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-f1-muted">Active Module</p>
                <p className="text-sm font-medium text-f1-text">{activeLabel}</p>
              </div>
              <span className="app-module-code">{activeModuleCode}</span>
            </div>
          </div>

          {config.f1.showDataSourceBadge && (
            <div className="app-sidebar-badge">
              <div className="mb-1 flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span>Live Data Source</span>
              </div>
              <p className="text-xs text-f1-muted">Powered by Jolpica API</p>
            </div>
          )}
        </div>
      </aside>

      <div
        className={`app-mobile-overlay ${isOpen ? 'app-mobile-overlay-open' : ''}`}
        onClick={() => setIsOpen(false)}
      >
        <div className="app-mobile-drawer" onClick={(event) => event.stopPropagation()}>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-f1-muted">Navigate</p>
            <button type="button" className="f1-icon-button" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ path, label, icon: Icon }, index) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `group app-nav-item ${isActive ? 'app-nav-item-active' : 'app-nav-item-idle'}`
                }
              >
                <span className="app-nav-icon">
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span className="app-nav-text">{label}</span>
                <span className="app-nav-index">{String(index + 1).padStart(2, '0')}</span>
              </NavLink>
            ))}
          </nav>

          {config.f1.showDataSourceBadge && (
            <div className="mt-6 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <div className="mb-1 flex items-center gap-2">
                <ActivitySquare className="h-4 w-4" />
                <span>Jolpica Data Active</span>
              </div>
              <p className="text-xs text-emerald-200/80">Telemetry and race feeds available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
