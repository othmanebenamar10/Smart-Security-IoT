import { AlertTriangle, Camera, Clock } from 'lucide-react';

interface RecentAlertsProps {
  alerts: any[];
}

const RecentAlerts = ({ alerts = [] }: RecentAlertsProps) => {
  const defaultAlerts = [
    {
      id: 1,
      type: 'unknown',
      message: 'Visage inconnu détecté',
      camera: 'Caméra Jardin',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      image: '/api/placeholder/alert1'
    },
    {
      id: 2,
      type: 'unknown',
      message: 'Visage inconnu détecté',
      camera: 'Caméra Jardin',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      image: '/api/placeholder/alert2'
    }
  ];

  // Sanitization XSS pour les messages d'alerte
  const sanitizeAlertMessage = (message: string): string => {
    if (typeof message !== 'string') return 'Alerte inconnue';
    return message.replace(/[<>"'&]/g, '').substring(0, 500);
  };

  // Sanitization pour les noms de caméra
  const sanitizeCameraName = (camera: string): string => {
    if (typeof camera !== 'string') return 'Caméra inconnue';
    return camera.replace(/[<>"'&]/g, '').substring(0, 100);
  };

  // Validation des alertes
  const validateAlert = (alert: any): boolean => {
    return alert &&
           typeof alert.id === 'number' &&
           typeof alert.message === 'string' &&
           typeof alert.camera === 'string' &&
           typeof alert.timestamp === 'string';
  };

  const displayAlerts = alerts.length > 0 ? alerts.filter(validateAlert) : defaultAlerts;

  return (
    <div className="bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] border border-cyan-900/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Alertes récentes
        </h2>
        <span className="text-xs text-gray-400">{displayAlerts.length} alertes</span>
      </div>

      <div className="space-y-3">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:border-red-500/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{sanitizeAlertMessage(alert.message)}</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {sanitizeCameraName(alert.camera || 'Caméra Jardin')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayAlerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucune alerte récente</p>
        </div>
      )}
    </div>
  );
};

export default RecentAlerts;
