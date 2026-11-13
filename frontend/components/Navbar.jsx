import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { getUser, logout as doLogout } from '../services/api';

export default function Navbar({ variant = 'public' }) {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = async () => {
    await doLogout();
    navigate('/agent/login');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'text-red-600 bg-red-50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          <NavLink to="/c/ma-banque" className="flex items-center gap-2">
            <Logo size="md" />
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">

            {variant === 'public' && (
              <>
                <NavLink to="/c/ma-banque" className={linkClass}>Accueil</NavLink>
                <NavLink to="/display/ma-banque" className={linkClass}>Écran TV</NavLink>
                <NavLink to="/admin/register" className={linkClass}>Entreprise</NavLink>
              </>
            )}

            {variant === 'agent' && (
              <>
                <NavLink to="/agent/dashboard" className={linkClass}>Guichet</NavLink>
                <NavLink to="/display/ma-banque" className={linkClass}>Écran TV</NavLink>
              </>
            )}

            {variant === 'admin' && (
              <>
                <NavLink to="/admin/services" className={linkClass}>Services</NavLink>
                <NavLink to="/admin/counters" className={linkClass}>Guichets</NavLink>
                <NavLink to="/admin/agents" className={linkClass}>Agents</NavLink>
                <NavLink to="/admin/stats" className={linkClass}>Statistiques</NavLink>
              </>
            )}

          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold leading-tight">
                      {user.role}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    user.role === 'admin' ? 'bg-orange-500' : 'bg-green-600'
                  }`}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/agent/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Connexion
                </NavLink>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  En ligne
                </span>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
