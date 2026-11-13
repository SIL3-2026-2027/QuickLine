import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { isAuthenticated, getUser } from '../../services/api';
import Navbar from '../../components/Navbar';

export default function AgentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('agent1@mabanque.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Si déjà connecté, redirige
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      navigate(user?.role === 'admin' ? '/admin/services' : '/agent/dashboard');
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('quickline_token', data.token);
      localStorage.setItem('quickline_user', JSON.stringify(data.user));
      navigate(data.user.role === 'admin' ? '/admin/services' : '/agent/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Identifiants invalides'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar variant="public" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5">

            {/* Panneau sombre à gauche */}
            <div className="md:col-span-2 bg-slate-900 text-white p-8 md:p-10 flex flex-col justify-between order-2 md:order-1">
              <div>
                <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center text-2xl font-black mb-6">
                  Q
                </div>
                <h2 className="text-xl font-bold leading-tight">Connexion</h2>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Agent ou administrateur — l'accès s'adapte à votre rôle.
                </p>
              </div>

              <div className="mt-8 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></span>
                  <span className="text-slate-300">Agent → tableau de bord guichet</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></span>
                  <span className="text-slate-300">Admin → configuration entreprise</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></span>
                  <span className="text-slate-300">Suivi temps réel des files</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-8">
                Propulsé par QuickLine
              </p>
            </div>

            {/* Formulaire à droite */}
            <div className="md:col-span-3 p-8 md:p-10 order-1 md:order-2">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Se connecter</h1>
              <p className="text-sm text-slate-500 mb-6">Entrez vos identifiants</p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-md transition-colors"
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Se connecter'}
                </button>

                <p className="text-xs text-slate-400 text-center pt-2">
                  Pas encore d'espace ?{' '}
                  <a href="/admin/register" className="text-red-600 font-semibold hover:underline">
                    Créer une entreprise
                  </a>
                </p>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                    Comptes de test
                  </p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div>Admin : <span className="font-mono text-slate-700">admin@mabanque.com</span></div>
                    <div>Agent : <span className="font-mono text-slate-700">agent1@mabanque.com</span></div>
                    <div>Mot de passe : <span className="font-mono text-slate-700">password123</span></div>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
