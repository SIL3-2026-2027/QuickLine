import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

export default function ClientHome() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    api.get(`/companies/${slug}`)
      .then((r) => setData(r.data))
      .catch(() => setError('Impossible de charger les services'))
      .finally(() => setLoading(false));
  }, [slug]);

  const takeTicket = async (serviceId) => {
    const phone = prompt('Téléphone pour notification (optionnel) :') || null;
    setCreating(serviceId);
    try {
      const { data: ticket } = await api.post('/tickets', {
        company_id: data.company.id,
        service_id: serviceId,
        phone,
      });
      navigate(`/ticket/${ticket.id}`);
    } catch {
      alert("Erreur lors de la création du ticket");
    } finally { setCreating(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <span className="loading loading-spinner loading-lg text-red-600"></span>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar variant="public" />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="alert alert-error max-w-md shadow-lg">{error}</div>
      </div>
    </div>
  );

  const totalWaiting = data.services.reduce((s, x) => s + x.waiting_count, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar variant="public" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-5">

            {/* Colonne gauche — Services */}
            <div className="md:col-span-3 p-8 md:p-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                Prendre un ticket
              </h1>
              <p className="text-sm text-slate-500 mb-6">
                Choisissez un service ci-dessous
              </p>

              <div className="space-y-3">
                {data.services.map((s) => {
                  const isFast = s.estimated_wait_min <= 10;
                  const isMedium = s.estimated_wait_min > 10 && s.estimated_wait_min <= 30;

                  return (
                    <div
                      key={s.id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                          {s.ticket_prefix}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{s.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {s.estimated_time_min} min / personne
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-slate-900">{s.waiting_count}</div>
                            <div className="text-[10px] uppercase text-slate-400 font-semibold">En attente</div>
                          </div>
                          <div>
                            <div className={`text-xl font-bold ${
                              isFast ? 'text-green-600' :
                              isMedium ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {s.estimated_wait_min}′
                            </div>
                            <div className="text-[10px] uppercase text-slate-400 font-semibold">Attente</div>
                          </div>
                        </div>

                        <button
                          onClick={() => takeTicket(s.id)}
                          disabled={creating === s.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-sm shrink-0 transition-colors"
                        >
                          {creating === s.id
                            ? <span className="loading loading-spinner loading-sm"></span>
                            : 'Prendre'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {data.services.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Aucun service disponible
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite — Infos */}
            <div className="md:col-span-2 bg-slate-50 p-8 md:p-10 border-l border-slate-200">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-red-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {data.company.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{data.company.name}</h2>
                <p className="text-xs text-slate-500 mt-1">Service de file d'attente</p>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Personnes en attente</span>
                  <span className="font-bold text-slate-900">{totalWaiting}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Services disponibles</span>
                  <span className="font-bold text-slate-900">{data.services.length}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-500">Statut</span>
                  <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    En ligne
                  </span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 leading-relaxed">
                  💡 Votre ticket s'affichera sur l'écran principal.
                  Gardez la page ouverte pour suivre votre position en direct.
                </p>
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-wider">
                Propulsé par QuickLine
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
