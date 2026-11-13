import { useEffect, useState } from 'react';
import api from '../../services/api';

const COMPANY_ID = '01a0fb16-4e14-70d0-8925-9cde57c775b6';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', ticket_prefix: '', estimated_time_min: 10 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/services', { params: { company_id: COMPANY_ID } });
      setServices(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', ticket_prefix: '', estimated_time_min: 10 });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      ticket_prefix: s.ticket_prefix,
      estimated_time_min: s.estimated_time_min,
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setError(null);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/admin/services/${editing.id}`, form);
      } else {
        await api.post('/admin/services', { ...form, company_id: COMPANY_ID });
      }
      await load();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || 'Erreur');
    } finally { setSaving(false); }
  };

  const remove = async (s) => {
    if (!confirm(`Supprimer le service "${s.name}" ?`)) return;
    try {
      await api.delete(`/admin/services/${s.id}`);
      await load();
    } catch { alert('Erreur lors de la suppression'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pt-6">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Services</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les services proposés à vos clients
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors"
          >
            + Ajouter un service
          </button>
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <span className="loading loading-spinner loading-lg text-red-600"></span>
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-300 text-5xl mb-3">—</div>
              <p className="text-sm text-slate-500 mb-4">Aucun service pour le moment</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold"
              >
                Créer le premier service
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Préfixe</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Durée</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-slate-900 text-white font-bold text-xs">
                        {s.ticket_prefix}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.estimated_time_min} min</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => remove(s)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <form onSubmit={save}>
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  {editing ? 'Modifier le service' : 'Nouveau service'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nom du service
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    placeholder="ex: Service Après-Vente"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Préfixe du ticket
                  </label>
                  <input
                    type="text"
                    value={form.ticket_prefix}
                    onChange={(e) => setForm({ ...form, ticket_prefix: e.target.value.toUpperCase() })}
                    maxLength={5}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm font-mono"
                    placeholder="ex: R"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Ex : <b>R</b> → tickets R-001, R-002...
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Durée allouée (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.estimated_time_min}
                    onChange={(e) => setForm({ ...form, estimated_time_min: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-md focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 text-sm"
                    required
                  />
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
                  {saving ? <span className="loading loading-spinner loading-xs"></span> : (editing ? 'Enregistrer' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
