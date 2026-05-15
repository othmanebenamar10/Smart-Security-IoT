import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const sampleAccess = [
  { name: '00:00', authorized: 8, unauthorized: 2 },
  { name: '03:00', authorized: 5, unauthorized: 1 },
  { name: '06:00', authorized: 12, unauthorized: 0 },
  { name: '09:00', authorized: 20, unauthorized: 2 },
  { name: '12:00', authorized: 18, unauthorized: 1 }
];

const Dashboard = () => {
  const [lastEvent, setLastEvent] = useState<string>('En attente de données de sécurité.');

  useEffect(() => {
    const unsubscribe = window.secureAPI.receive('face-event', (data) => {
      if (typeof data === 'object' && data !== null) {
        setLastEvent(`Événement: ${JSON.stringify(data)}`);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/10">
        <h2 className="text-xl font-semibold mb-4">Panneau de contrôle</h2>
        <div className="space-y-4 text-slate-300">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">État automate</p>
            <p className="text-3xl mt-3 text-accent">En ligne</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">État lumière</p>
            <p className="text-3xl mt-3 text-emerald-400">Activée</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Flux RTSP</p>
            <p className="text-3xl mt-3 text-slate-200">Connexion active</p>
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/10">
            <h3 className="text-lg font-semibold mb-4">Statistiques d’accès</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sampleAccess}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="authorized" stroke="#22c55e" strokeWidth={3} />
                <Line type="monotone" dataKey="unauthorized" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/10">
            <h3 className="text-lg font-semibold mb-4">Alertes</h3>
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Intrusion récente</p>
                <p className="mt-2 text-slate-200">Visage inconnu détecté à 14:22</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Temps de réponse</p>
                <p className="mt-2 text-slate-200">Automate réactif - 200ms</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold mb-4">Historique et logs</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Dernier événement</p>
              <p className="mt-3 text-slate-200 break-words">{lastEvent}</p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Monitoring système</p>
              <p className="mt-3 text-slate-200">CPU 23% · Mémoire 41% · Réseau isolé</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
