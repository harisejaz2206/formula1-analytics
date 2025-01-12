import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Flag, Menu, X, Timer, Users, MapPin, TrendingUp } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/live', label: 'Race Tracker', icon: Timer },
    { path: '/profiles', label: 'Drivers & Teams', icon: Users },
    { path: '/tracks', label: 'Track Insights', icon: MapPin },
    { path: '/season', label: 'Season Overview', icon: TrendingUp },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
          ? 'bg-f1-black/95 backdrop-blur-md shadow-lg'
          : 'bg-gradient-to-b from-f1-black to-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 flex items-center space-x-3 group"
            >
              <Flag className="h-8 w-8 text-f1-red transform group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-f1-display text-2xl font-bold text-white">
                F1 Tracker
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2
                    ${isActive
                      ? 'bg-f1-red text-white shadow-md'
                      : 'text-gray-300 hover:bg-f1-gray/30 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 
                         hover:text-white hover:bg-f1-gray/30 focus:outline-none transition-colors duration-300"
              >
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${isOpen
            ? 'max-h-screen opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none'
            }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-f1-black/95 backdrop-blur-md shadow-lg">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-base font-medium transition-all duration-300
                  flex items-center space-x-3
                  ${isActive
                    ? 'bg-f1-red text-white shadow-md'
                    : 'text-gray-300 hover:bg-f1-gray/30 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      {/* Spacer div to prevent content overlap */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;