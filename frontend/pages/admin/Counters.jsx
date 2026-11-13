import { useEffect, useState } from 'react';
import api from '../../services/api';

const COMPANY_ID = '01a0fb16-4e14-70d0-8925-9cde57c775b6';

export default function AdminCounters() {
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', number: 1, service_ids: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.get('/admin/counters', { params: { company_id: COMPANY_ID } }),
        api.get('/admin/services', { params: { company_id: COMPANY_ID } }),
      ]);
      setCounters(c.data);
      setServices(s.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', number: counters.length + 1, service_ids: [] });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const toggleService = (id) => {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter((x) => x !== id)
        : [...f.service_ids, id],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/admin/counters', { ...form, company_id: COMPANY_ID });
      await load();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || 'Erreur');
    } finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (!confirm(`Supprimer "${c.name}" ?`)) return;
    try {
      await api.delete(`/admin/counters/${c.id}`);
      await load();
    } catch { alert('Erreur lors de la suppression'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pt-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Guichets</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les guichets physiques et leurs services associés
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors"
          >
            + Ajouter un guichet
          </button>
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <span className="loading loading-spinner loading-lg text-red-600"></span>
            </div>
          ) : counters.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-300 text-5xl mb-3">—</div>
              <p className="text-sm text-slate-500 mb-4">Aucun guichet pour le moment</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold"
              >
                Créer le premier guichet
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Services</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {counters.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-slate-900 text-white font-bold text-xs">
                        {c.number}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.services?.length === 0 && (
                          <span className="text-xs text-slate-400">Aucun</span>
                        )}
                        {c.services?.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.is_paused ? (
                        <span className="inline-flex items-center gap-1.5 text-orange-600 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          En pause
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(c)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modale */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={save}>
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Nouveau guichet</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nom du guichet
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    placeholder="ex: Guichet 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Numéro
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Services gérés par ce guichet
                  </label>
                  {services.length === 0 ? (
                    <p className="text-xs text-slate-400">Créez d'abord des services</p>
                  ) : (
                    <div className="space-y-2">
                      {services.map((s) => (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                            form.service_ids.includes(s.id)
                              ? 'border-red-600 bg-red-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.service_ids.includes(s.id)}
                            onChange={() => toggleService(s.id)}
                            className="checkbox checkbox-sm checkbox-error"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-slate-900">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.estimated_time_min} min</div>
                          </div>
                          <span className="text-xs font-mono px-2 py-1 bg-slate-900 text-white rounded">
                            {s.ticket_prefix}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                    {error}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md"
                >
                  {saving ? <span className="loading loading-spinner loading-xs"></span> : 'Créer le guichet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
