import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', slug: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/admin/register', form);
      alert('Entreprise créée !');
      navigate('/admin/services');
    } catch (err) {
      setError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar variant="public" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-5">

            {/* ===== COLONNE GAUCHE : PANNEAU SOMBRE ===== */}
            <div className="md:col-span-2 bg-slate-900 text-white p-8 md:p-10 flex flex-col justify-between order-2 md:order-1">
              <div>
                <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center text-2xl font-black mb-6">
                  Q
                </div>
                <h2 className="text-xl font-bold leading-tight">QuickLine</h2>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Gérez la file d'attente de votre entreprise en temps réel.
                </p>
              </div>

              <div className="mt-8 p-4 bg-slate-800 rounded-lg">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                  URL publique
                </div>
                <div className="text-sm font-mono text-green-400 break-all">
                  quickline.app/c/<span className="text-white font-bold">{form.slug || 'votre-slug'}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-8">
                Propulsé par QuickLine
              </p>
            </div>

            {/* ===== COLONNE DROITE : FORMULAIRE ===== */}
            <div className="md:col-span-3 p-8 md:p-10 order-1 md:order-2">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Créer votre espace</h1>
              <p className="text-sm text-slate-500 mb-6">Configuration initiale de l'entreprise</p>

              <form onSubmit={submit} className="space-y-4">
                {[
                  ['name',     "Nom de l'entreprise", 'text',     'Ma Banque'],
                  ['slug',     'Slug URL',             'text',     'ma-banque'],
                  ['email',    'Email administrateur', 'email',    'admin@mabanque.com'],
                  ['password', 'Mot de passe',         'password', '••••••••'],
                ].map(([key, label, type, placeholder]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      required
                    />
                  </div>
                ))}

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
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Créer mon espace'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
