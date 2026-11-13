import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { getUser } from '../services/api';

export default function Sidebar({ mobileOpen, onClose }) {
  const user = getUser();

  const links = {
    admin: [
      { to: '/admin/services', label: 'Services',     emoji: '📋' },
      { to: '/admin/counters', label: 'Guichets',     emoji: '🏢' },
      { to: '/admin/agents',   label: 'Agents',       emoji: '👤' },
      { to: '/admin/stats',    label: 'Statistiques', emoji: '📊' },
    ],
    agent: [
      { to: '/agent/dashboard',   label: 'Mon guichet', emoji: '🎫' },
      { to: '/display/ma-banque', label: 'Écran TV',    emoji: '📺' },
    ],
  };

  const items = links[user?.role] || [];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-white">

      {/* Logo uniquement */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Logo size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-2">
          Navigation
        </div>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
            <span className="text-lg">{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer : version */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">
          QuickLine v1.0
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Sidebar mobile (overlay) */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <aside className="md:hidden fixed top-0 left-0 h-screen w-64 z-50">
            {content}
          </aside>
        </>
      )}
    </>
  );
}
