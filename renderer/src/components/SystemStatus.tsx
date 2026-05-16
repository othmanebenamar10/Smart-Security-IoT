import { HardDrive, Thermometer, Zap, Wifi } from 'lucide-react';

interface SystemStatusProps {
  status: any;
}

const SystemStatus = () => {
  const systemData = {
    camera_connection: 'En ligne',
    storage_used: 67,
    temperature: 42,
    power_consumption: 18
  };

  // Validation des valeurs numériques - Sécurité
  const validatePercentage = (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };

  const validateTemperature = (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) return 20;
    return Math.max(-20, Math.min(100, value));
  };

  const validatePower = (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.max(0, Math.min(1000, value));
  };

  // Sanitization des chaînes
  const sanitizeString = (value: string): string => {
    if (typeof value !== 'string') return 'Inconnu';
    return value.replace(/[<>"'&]/g, '').substring(0, 50);
  };

  return (
    <div className="bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] border border-cyan-900/30 rounded-xl p-5 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Wifi className="w-5 h-5 text-cyan-400" />
        État du système
      </h2>

      <div className="space-y-4">
        {/* Camera Connection */}
        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Connexion caméra</span>
          </div>
          <span className="text-sm font-semibold text-green-400">{sanitizeString(systemData.camera_connection)}</span>
        </div>

        {/* Storage */}
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Stockage</span>
            </div>
            <span className="text-sm font-semibold text-cyan-400">{validatePercentage(systemData.storage_used)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${validatePercentage(systemData.storage_used)}%` }}
            ></div>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">Température</span>
          </div>
          <span className="text-sm font-semibold text-orange-400">{validateTemperature(systemData.temperature)}°C</span>
        </div>

        {/* Power Consumption */}
        <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">Consommation</span>
          </div>
          <span className="text-sm font-semibold text-yellow-400">{validatePower(systemData.power_consumption)}W</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-green-400">Tout fonctionne bien</span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
