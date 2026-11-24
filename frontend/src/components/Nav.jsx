import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Menu, X } from 'lucide-react';

function formatLastSynced(date) {
  if (!date) return null;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function Nav({ basePath = '' }) {
  const { hasApiKey, syncing, lastSynced, triggerSync, isOwnerOrAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-indigo-500 text-white'
        : 'border-transparent text-slate-400 hover:text-slate-200'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  return (
    <nav className="bg-slate-900/90 border-b border-slate-700/50 sticky top-[52px] z-10">
      <div className="px-6 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex">
          <NavLink to={`${basePath}/`} end className={linkClass}>Overview</NavLink>
          <NavLink to={`${basePath}/assets`} className={linkClass}>Asset Health</NavLink>
          <NavLink to={`${basePath}/pm-planner`} className={linkClass}>PM Planner</NavLink>
          {isOwnerOrAdmin && (
            <NavLink to={`${basePath}/settings`} className={linkClass}>Settings</NavLink>
          )}
          <NavLink to={`${basePath}/help`} className={linkClass}>Help</NavLink>
        </div>

        {hasApiKey && (
          <div className="flex items-center gap-2">
            {lastSynced && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Synced {formatLastSynced(lastSynced)}
              </span>
            )}
            <button
              onClick={() => triggerSync()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                syncing
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : 'bg-slate-800 text-slate-300 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-slate-900">
          <NavLink to={`${basePath}/`} end className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
            Overview
          </NavLink>
          <NavLink to={`${basePath}/assets`} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
            Asset Health
          </NavLink>
          <NavLink to={`${basePath}/pm-planner`} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
            PM Planner
          </NavLink>
          {isOwnerOrAdmin && (
            <NavLink to={`${basePath}/settings`} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
              Settings
            </NavLink>
          )}
          <NavLink to={`${basePath}/help`} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
            Help
          </NavLink>
        </div>
      )}
    </nav>
  );
}
