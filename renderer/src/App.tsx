import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Dashboard from './components/Dashboard';

const App = () => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    window.secureAPI.send('secure:ping').then(() => setConnected(true)).catch(() => setConnected(false));
  }, []);

  return (
    <div className="min-h-screen bg-cyber text-white">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold">Smart Secure Access IoT System</h1>
              <p className="text-slate-300 mt-1">Dashboard SOC sécurisé pour contrôle d’accès industriel.</p>
            </div>
            <div className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200">
              Statut système : <span className={connected ? 'text-emerald-400' : 'text-rose-400'}>{connected ? 'En ligne' : 'Déconnecté'}</span>
            </div>
          </div>
        </motion.header>

        <Dashboard />
      </div>
    </div>
  );
};

export default App;
