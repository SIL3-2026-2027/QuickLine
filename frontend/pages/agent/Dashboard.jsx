import { useEffect, useMemo, useRef, useState } from 'react';
import api, { getUser } from '../../services/api';
import { echo } from '../../services/echo';

export default function AgentDashboard() {
  const user = getUser();
  const [counters, setCounters] = useState([]);
  const [counterId, setCounterId] = useState(localStorage.getItem('quickline_counter_id') || '');
  const [ticket, setTicket] = useState(null);
  const [queue, setQueue] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  // Charge les guichets disponibles (route dédiée agent)
  useEffect(() => {
    api.get('/agent/counters')
      .then((r) => {
        setCounters(r.data);
        if (!counterId && r.data.length > 0) {
          setCounterId(r.data[0].id);
          localStorage.setItem('quickline_counter_id', r.data[0].id);
        }
      })
      .catch((e) => console.error('Erreur chargement counters', e));
  }, []);

  const loadQueue = async () => {
    if (!counterId) return;
    try {
      const { data } = await api.get('/agent/queue', { params: { counter_id: counterId } });
      setQueue(data.by_service || []);
      setPaused(data.counter?.is_paused || false);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!counterId) return;
    loadQueue();
    const poll = setInterval(loadQueue, 10000);
    return () => clearInterval(poll);
  }, [counterId]);

  useEffect(() => {
    if (!user?.company_id) return;
    const ch = echo.channel(`company.${user.company_id}.queue`);
    ch.listen('.ticket.called', () => loadQueue());
    return () => echo.leave(`company.${user.company_id}.queue`);
  }, [user?.company_id]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (ticket?.called_at) {
      const duration = (ticket.service?.estimated_time_min || 15) * 60;
      const start = new Date(ticket.called_at).getTime();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000) - duration);
      }, 1000);
    } else setElapsed(0);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [ticket]);

  const changeCounter = (id) => {
    setCounterId(id);
    localStorage.setItem('quickline_counter_id', id);
    setTicket(null);
  };

  const callNext = async () => {
    if (!counterId) return alert('Sélectionnez un guichet.');
    setLoading(true);
    try {
      const { data, status } = await api.post('/agent/call-next', { counter_id: counterId });
      if (status === 204 || !data) alert('Aucun ticket en attente');
      else { setTicket(data); loadQueue(); }
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  const finish = async () => {
    if (!ticket) return;
    await api.post(`/agent/tickets/${ticket.id}/finish`);
    setTicket(null); loadQueue();
  };
  const recall = async () => {
    if (!ticket) return;
    await api.post(`/agent/tickets/${ticket.id}/recall`);
    alert(`Rappel envoyé pour ${ticket.number}`);
  };
  const absent = async () => {
    if (!ticket) return;
    if (!confirm('Marquer ce client comme absent ?')) return;
    await api.post(`/agent/tickets/${ticket.id}/absent`);
    setTicket(null); loadQueue();
  };
  const togglePause = async () => {
    if (!counterId) return;
    try {
      const { data } = await api.post('/agent/counter/pause', { counter_id: counterId });
      setPaused(data.is_paused);
    } catch { /* ignore */ }
  };

  const timeLabel = useMemo(() => {
    if (!ticket) return '--:--';
    const abs = Math.abs(elapsed);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${elapsed > 0 ? '+' : '-'}${m}:${s.toString().padStart(2, '0')}`;
  }, [elapsed, ticket]);

  const totalWaiting = queue.reduce((sum, s) => sum + (s.tickets_count || 0), 0);
  const isOver = elapsed > 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket en cours</h2>
              <select
                value={counterId}
                onChange={(e) => changeCounter(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 font-semibold"
              >
                <option value="">Choisir un guichet</option>
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePause}
                disabled={!counterId}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                  paused
                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {paused ? '▶ Reprendre' : '⏸ Pause'}
              </button>
              {ticket && (
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {isOver ? 'Temps dépassé' : 'Dans les temps'}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center">
            {ticket ? (
              <>
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">
                  {ticket.service?.name}
                </div>
                <div className="text-7xl md:text-8xl font-black text-slate-900 tracking-tight leading-none">
                  {ticket.number}
                </div>
                <div className={`mt-5 px-5 py-3 rounded-lg border-2 font-mono text-2xl font-bold tabular-nums ${
                  isOver
                    ? 'border-red-500 text-red-600 bg-red-50 animate-pulse'
                    : 'border-green-500 text-green-600 bg-green-50'
                }`}>
                  {timeLabel}
                </div>
                <div className="text-xs text-slate-500 mt-3">
                  Durée allouée : {ticket.service?.estimated_time_min} min
                </div>

                <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-8">
                  <button onClick={finish} className="py-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors">
                    ✓ Terminer
                  </button>
                  <button onClick={recall} className="py-3 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors">
                    🔔 Rappeler
                  </button>
                  <button onClick={absent} className="py-3 rounded-md bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm transition-colors">
                    ✕ Absent
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-slate-300">
                <div className="text-5xl mb-3">—</div>
                <div className="text-sm text-slate-500">
                  {counterId ? 'Aucun ticket en cours' : 'Sélectionnez un guichet pour commencer'}
                </div>
              </div>
            )}

            <button
              onClick={callNext}
              disabled={loading || paused || !counterId}
              className="mt-10 w-full max-w-md py-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg tracking-wide transition-colors"
            >
              {loading ? <span className="loading loading-spinner loading-md"></span> : '📢 APPELER LE SUIVANT'}
            </button>

            {!counterId && (
              <p className="text-xs text-orange-600 mt-3 font-semibold">
                Sélectionnez d'abord un guichet
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
          <div className="px-6 py-3 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">File d'attente</h2>
          </div>

          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">Aucun service</div>
            ) : (
              queue.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.estimated_time_min} min / pers.</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-2xl font-black text-slate-900 tabular-nums">{s.tickets_count}</div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">en attente</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
              <span className="text-2xl font-black text-red-600 tabular-nums">{totalWaiting}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
