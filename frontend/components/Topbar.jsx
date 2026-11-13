import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { getUser, logout as doLogout } from '../services/api';

const PAGE_TITLES = {
  '/admin/services': 'Services',
  '/admin/counters': 'Guichets',
  '/admin/agents':   'Agents',
  '/admin/stats':    'Statistiques',
  '/agent/dashboard':'Mon guichet',
};

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await doLogout();
    navigate('/agent/login');
  };

  const title = PAGE_TITLES[location.pathname] || 'Tableau de bord';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">

        {/* Gauche : burger mobile + titre */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-100"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
            <p className="text-xs text-slate-400 leading-tight hidden md:block">
              Bienvenue sur QuickLine
            </p>
          </div>
        </div>

        {/* Droite : badge utilisateur + menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</div>
              <div className={`text-[10px] uppercase tracking-wider font-bold leading-tight ${
                user?.role === 'admin' ? 'text-orange-600' : 'text-green-600'
              }`}>
                {user?.role}
              </div>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
              user?.role === 'admin' ? 'bg-orange-500' : 'bg-green-600'
            }`}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Menu déroulant */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                  <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${
                    user?.role === 'admin' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {user?.role}
                  </div>
                </div>

                <button
                  onClick={() => { setMenuOpen(false); navigate('/c/ma-banque'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <span>👁️</span>
                  <span>Vue client</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/display/ma-banque'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <span>📺</span>
                    <span>Écran TV</span>
                  </button>
                )}

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <span>🚪</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
