import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ service_id: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.service_id) params.service_id = filters.service_id;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const { data } = await api.get('/admin/stats', { params });
      setStats(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  useEffect(() => {
    api.get('/admin/services').then((r) => setServices(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pt-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Statistiques</h1>
        <p className="text-sm text-slate-500 mb-6">Pilotez l'accueil de votre entreprise</p>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Service</label>
            <select value={filters.service_id}
              onChange={(e) => setFilters({ ...filters, service_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="">Tous les services</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Du</label>
            <input type="date" value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Au</label>
            <input type="date" value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <span className="loading loading-spinner loading-lg text-red-600"></span>
          </div>
        ) : stats ? (
          <>
            {/* Chiffres clés */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Stat label="Total"      value={stats.total} />
              <Stat label="Terminés"   value={stats.terminated} color="text-green-600" />
              <Stat label="Absents"    value={stats.absent}     color="text-orange-600" />
              <Stat label="Annulés"    value={stats.cancelled}  color="text-red-600" />
              <Stat label="En attente" value={stats.waiting}    color="text-slate-600" />
            </div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">
                  Temps moyen de traitement
                </div>
                <div className="text-4xl font-black text-slate-900">
                  {stats.avg_duration_s ? `${stats.avg_duration_s}s` : '—'}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">
                  Taux d'absentéisme
                </div>
                <div className="text-4xl font-black text-orange-600">
                  {stats.absent_rate}%
                </div>
              </div>
            </div>

            {/* Par service */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Par service</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Service</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Préfixe</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_service?.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-900 text-white font-bold text-xs">
                          {s.ticket_prefix}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                        {s.tickets_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 py-12 text-sm">
            Aucune donnée disponible
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs uppercase text-slate-500 font-semibold">{label}</div>
      <div className={`text-3xl font-black mt-1 tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
