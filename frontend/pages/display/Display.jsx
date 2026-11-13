import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { echo } from '../../services/echo';
import Navbar from '../../components/Navbar';

export default function Display() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [lastCalledAt, setLastCalledAt] = useState(null);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1108, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.start(start); osc.stop(start + 0.8);
      });
    } catch { /* ignore */ }
  };

  const load = async () => {
    try {
      // Charge l'écran TV
      const { data: displayData } = await api.get(`/display/${slug}`);
      setData(displayData);

      // Récupère le company_id (une seule fois)
      if (!companyId) {
        const { data: companyData } = await api.get(`/companies/${slug}`);
        setCompanyId(companyData.company.id);
      }

      // Carillon sur nouvel appel
      if (displayData.last?.called_at && displayData.last.called_at !== lastCalledAt) {
        playChime();
        setLastCalledAt(displayData.last.called_at);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, [slug]);

  // WebSocket : dès qu'on connaît le company_id
  useEffect(() => {
    if (!companyId) return;
    const channel = echo.channel(`company.${companyId}.queue`);
    channel.listen('.ticket.called', () => load());
    return () => echo.leave(`company.${companyId}.queue`);
  }, [companyId]);

  if (!data) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-white"></span>
    </div>
  );

  const last = data.last;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar variant="agent" />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
        <div className="lg:col-span-2 bg-white text-slate-900 rounded-2xl flex flex-col items-center justify-center p-10">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold mb-4">
            Ticket appelé
          </div>
          {last ? (
            <>
              <div className="text-[10rem] lg:text-[14rem] leading-none font-black tracking-tighter text-red-600">
                {last.number}
              </div>
              <div className="mt-6 px-8 py-4 rounded-xl bg-green-600 text-white text-3xl font-black uppercase tracking-wide">
                {last.counter?.name || 'Guichet'}
              </div>
            </>
          ) : (
            <div className="text-8xl text-slate-200 my-16">—</div>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">
            Derniers appels
          </h2>
          <div className="space-y-2 flex-1">
            {data.history?.slice(0, 6).map((t, i) => (
              <div key={t.id} className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                i === 0 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-100'
              }`}>
                <span className="text-2xl font-black tabular-nums">{t.number}</span>
                <span className="text-sm font-semibold opacity-90">{t.counter?.name}</span>
              </div>
            ))}
            {(!data.history || data.history.length === 0) && (
              <div className="text-slate-500 text-center py-8 text-sm">Aucun appel</div>
            )}
          </div>
        </div>
      </main>

      <footer className="px-8 py-4 border-t border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.waitingByService?.map((s) => (
            <div key={s.service} className="bg-slate-800 rounded-lg px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold truncate">
                {s.service}
              </div>
              <div className="text-3xl font-black text-orange-400 tabular-nums mt-1">{s.waiting}</div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
