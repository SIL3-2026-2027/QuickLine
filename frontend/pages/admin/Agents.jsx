import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/agents');
      setAgents(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', email: '', password: '' });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setError(null); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/admin/agents', form);
      await load();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || 'Erreur');
    } finally { setSaving(false); }
  };

  const deactivate = async (agent) => {
    if (!confirm(`Désactiver ${agent.name} ?`)) return;
    try {
      await api.delete(`/admin/agents/${agent.id}`);
      await load();
    } catch { alert('Erreur lors de la désactivation'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
            <p className="text-sm text-slate-500 mt-1">Gérez les comptes agents de votre entreprise</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors">
            + Ajouter un agent
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <span className="loading loading-spinner loading-lg text-red-600"></span>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-300 text-5xl mb-3">—</div>
              <p className="text-sm text-slate-500 mb-4">Aucun agent pour le moment</p>
              <button onClick={openCreate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold">
                Créer le premier agent
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.email}</td>
                    <td className="px-4 py-3">
                      {a.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.is_active && (
                        <button onClick={() => deactivate(a)} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50">
                          Désactiver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <form onSubmit={save}>
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Nouvel agent</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Nom complet</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    placeholder="ex: Marie Dupont" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    placeholder="agent@mabanque.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Mot de passe</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    placeholder="8 caractères minimum" minLength={8} required />
                </div>
                {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md">
                  {saving ? <span className="loading loading-spinner loading-xs"></span> : "Créer l'agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
