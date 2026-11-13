import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { echo } from '../../services/echo';
import Navbar from '../../components/Navbar';

export default function TicketView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await api.get(`/tickets/${id}`);
      setData(r.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const channel = echo.channel(`ticket.${id}`);
    channel.listen('.ticket.called', () => {
      load();
      // Vibration + son
      if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc.start();
        osc.stop(ctx.currentTime + 1);
      } catch { /* ignore */ }
    });
    const poll = setInterval(load, 30000);
    return () => {
      clearInterval(poll);
      echo.leave(`ticket.${id}`);
    };
  }, [id]);

  const cancelTicket = async () => {
    if (!confirm('Voulez-vous vraiment annuler ce ticket ?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Impossible d'annuler");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <span className="loading loading-spinner loading-lg text-red-600"></span>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar variant="public" />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="alert alert-error max-w-md shadow-lg">Ticket introuvable</div>
      </div>
    </div>
  );

  const t = data.ticket;
  const isWaiting   = t.status === 'EN_ATTENTE';
  const isCalled    = t.status === 'EN_COURS';
  const isDone      = t.status === 'TERMINE';
  const isAbsent    = t.status === 'ABSENT';
  const isCancelled = t.status === 'ANNULE';

  const numberColor =
    isCalled ? 'text-green-600' :
    isAbsent ? 'text-orange-500' :
    isCancelled ? 'text-red-600 line-through' :
    'text-slate-900';

  const statusBadge = {
    EN_ATTENTE: { label: 'En attente',       bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    EN_COURS:   { label: "C'est votre tour", bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300' },
    TERMINE:    { label: 'Terminé',          bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200' },
    ABSENT:     { label: 'Client absent',    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
    ANNULE:     { label: 'Annulé',           bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  }[t.status] || { label: t.status, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Barre tricolore */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-green-600"></div>

      <Navbar variant="public" />

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">

          {/* Carte principale */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* En-tête : service */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                {t.service?.name}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Ticket
              </span>
            </div>

            <div className="p-8 text-center">

              {/* Numéro */}
              <div className={`text-[5rem] leading-none font-black tracking-tight ${numberColor}`}>
                {t.number}
              </div>

              {/* Statut */}
              <div className="mt-4">
                <span className={`inline-block px-4 py-2 rounded-md font-semibold text-sm border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} ${isCalled ? 'animate-pulse' : ''}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* C'est votre tour : guichet */}
              {isCalled && (
                <div className="mt-6 p-5 rounded-lg border-2 border-green-500 bg-green-50">
                  <p className="text-xs text-green-700 uppercase tracking-wider font-bold">
                    Présentez-vous au
                  </p>
                  <p className="text-3xl font-black text-green-700 mt-1">
                    {t.counter?.name || 'Guichet'}
                  </p>
                </div>
              )}

              {/* Absent */}
              {isAbsent && (
                <div className="mt-6 p-5 rounded-lg border-2 border-orange-400 bg-orange-50">
                  <p className="text-sm text-orange-700 font-semibold">
                    Vous n'étiez pas présent lors de l'appel.
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    Si vous êtes toujours là, adressez-vous au guichet.
                  </p>
                </div>
              )}

              {/* En attente : positions */}
              {isWaiting && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Devant vous</div>
                    <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                      {data.people_ahead}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                    <div className="text-xs text-orange-700 uppercase font-semibold">Attente est.</div>
                    <div className="text-3xl font-black text-orange-600 mt-1 tabular-nums">
                      {data.estimated_wait_min}
                      <span className="text-sm font-bold ml-1">min</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ticket actuellement appelé (info secondaire) */}
              {isWaiting && data.current_called && (
                <div className="mt-4 text-xs text-slate-500 p-3 bg-slate-50 rounded-md border border-slate-100">
                  Actuellement appelé :{' '}
                  <b className="text-slate-900">{data.current_called.number}</b>
                  {data.current_called.counter && (
                    <span> → {data.current_called.counter.name}</span>
                  )}
                </div>
              )}

              {/* Bouton annuler */}
              {isWaiting && (
                <button
                  className="mt-6 w-full py-3 rounded-md border-2 border-red-600 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                  onClick={cancelTicket}
                >
                  Annuler mon ticket
                </button>
              )}

              {/* Bouton nouveau ticket */}
              {(isDone || isCancelled || isAbsent) && (
                <Link
                  to="/c/ma-banque"
                  className="mt-6 block w-full py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors text-center"
                >
                  Prendre un nouveau ticket
                </Link>
              )}
            </div>

            {/* Pied de carte */}
            <div className="bg-slate-50 text-center py-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-t border-slate-200">
              Propulsé par QuickLine
            </div>
          </div>

          {/* Note sous la carte */}
          <p className="text-xs text-slate-400 text-center mt-6 max-w-md mx-auto">
            💡 Gardez cette page ouverte. Vous serez alerté(e) automatiquement quand votre tour approche.
          </p>
        </div>
      </div>
    </div>
  );
}
