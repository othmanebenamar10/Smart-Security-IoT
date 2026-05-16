import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';

interface SecureState {
  system: string;
  version: string;
  env: string;
  timestamp: string;
  platform: string;
  relayConnected: boolean;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
}

const App = () => {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<SecureState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation de l'état système - Sécurité
  const validateSecureState = (payload: any): SecureState | null => {
    if (!payload || typeof payload !== 'object') return null;
    
    return {
      system: typeof payload.system === 'string' ? payload.system.substring(0, 100) : 'Unknown',
      version: typeof payload.version === 'string' ? payload.version.substring(0, 50) : '0.0.0',
      env: typeof payload.env === 'string' ? payload.env.substring(0, 50) : 'unknown',
      timestamp: typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
      platform: typeof payload.platform === 'string' ? payload.platform.substring(0, 50) : 'unknown',
      relayConnected: typeof payload.relayConnected === 'boolean' ? payload.relayConnected : false,
      uptime: typeof payload.uptime === 'number' && payload.uptime >= 0 ? payload.uptime : 0,
      cpuUsage: typeof payload.cpuUsage === 'number' && payload.cpuUsage >= 0 && payload.cpuUsage <= 100 ? payload.cpuUsage : 0,
      memoryUsage: typeof payload.memoryUsage === 'number' && payload.memoryUsage >= 0 && payload.memoryUsage <= 100 ? payload.memoryUsage : 0,
    };
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const connectWithTimeout = async () => {
      try {
        // Timeout de sécurité pour éviter le blocage
        timeoutId = setTimeout(() => {
          throw new Error('Connection timeout');
        }, 10000);

        const pingResult = await window.secureAPI?.send('secure:ping', {});
        
        if (timeoutId) clearTimeout(timeoutId);
        
        if (pingResult) {
          setConnected(true);
          
          timeoutId = setTimeout(() => {
            throw new Error('State fetch timeout');
          }, 5000);
          
          const statePayload = await window.secureAPI?.send('secure:fetch-state', {});
          
          if (timeoutId) clearTimeout(timeoutId);
          
          const validatedState = validateSecureState(statePayload);
          setState(validatedState);
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Connection error:', err);
        setConnected(false);
        setState(null);
        setError(err instanceof Error ? err.message : 'Connection error');
        
        // Retry automatique après délai
        setTimeout(() => {
          setError(null);
        }, 5000);
      }
    };

    connectWithTimeout();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a] text-white">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}
      <Dashboard connected={connected} state={state} />
    </div>
  );
};

export default App;
