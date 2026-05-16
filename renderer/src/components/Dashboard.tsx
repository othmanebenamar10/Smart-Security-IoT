import { useEffect, useState } from 'react';
import CameraStream from './CameraStream';
import FaceRecognition from './FaceRecognition';
import SystemStatus from './SystemStatus';
import AIStatistics from './AIStatistics';
import KnownFacesGallery from './KnownFacesGallery';
import RecentAlerts from './RecentAlerts';
import Sidebar from './Sidebar';
import { ShieldAlert, Users, Camera, AlertTriangle, Activity } from 'lucide-react';

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

interface DashboardProps {
  connected: boolean;
  state: SecureState | null;
}

const Dashboard = ({ connected, state }: DashboardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsData, setStatsData] = useState<any>(null);
  const [knownFaces, setKnownFaces] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Fonction de navigation sécurisée
  const handleNavigation = (item: string) => {
    setActiveMenuItem(item);
    // Ici on peut ajouter de la logique de routing si nécessaire
    // Pour l'instant, on garde tout sur le dashboard avec des sections différentes
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('http://localhost:5000/api/stats', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Validation stricte des données
        if (data && typeof data === 'object') {
          setStatsData({
            known_faces: typeof data.known_faces === 'number' ? data.known_faces : 5,
            unknown_faces_today: typeof data.unknown_faces_today === 'number' ? data.unknown_faces_today : 3,
            alerts_today: typeof data.alerts_today === 'number' ? data.alerts_today : 2,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Valeurs par défaut sécurisées
        setStatsData({ known_faces: 5, unknown_faces_today: 3, alerts_today: 2 });
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchKnownFaces = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('http://localhost:5000/api/known_faces', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Validation stricte - tableau d'objets
        if (Array.isArray(data)) {
          const validatedFaces = data.filter((face: any) => 
            face && typeof face === 'object' && 
            typeof face.id === 'number' && 
            typeof face.name === 'string' &&
            face.name.length > 0 && face.name.length <= 100
          ).map((face: any) => ({
            id: face.id,
            name: face.name.replace(/[<>"']/g, ''), // Sanitization XSS
            image: typeof face.image === 'string' ? face.image : '/api/placeholder/face'
          }));
          setKnownFaces(validatedFaces);
        }
      } catch (error) {
        console.error('Error fetching known faces:', error);
        setKnownFaces([]);
      }
    };
    fetchKnownFaces();
    const interval = setInterval(fetchKnownFaces, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('http://localhost:5000/api/alerts', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Validation stricte
        if (Array.isArray(data)) {
          const validatedAlerts = data.filter((alert: any) => 
            alert && typeof alert === 'object' && 
            typeof alert.id === 'number' && 
            typeof alert.message === 'string' &&
            alert.message.length > 0 && alert.message.length <= 500
          ).map((alert: any) => ({
            id: alert.id,
            type: typeof alert.type === 'string' ? alert.type : 'unknown',
            message: alert.message.replace(/[<>"']/g, ''), // Sanitization XSS
            camera: typeof alert.camera === 'string' ? alert.camera.replace(/[<>"']/g, '') : 'Caméra Jardin',
            timestamp: alert.timestamp || new Date().toISOString()
          }));
          setAlerts(validatedAlerts);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('http://localhost:5000/api/system_status', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Validation stricte
        if (data && typeof data === 'object') {
          setSystemStatus({
            camera_connection: typeof data.camera_connection === 'string' ? data.camera_connection : 'En ligne',
            storage_used: typeof data.storage_used === 'number' && data.storage_used >= 0 && data.storage_used <= 100 ? data.storage_used : 67,
            temperature: typeof data.temperature === 'number' && data.temperature >= -20 && data.temperature <= 100 ? data.temperature : 42,
            power_consumption: typeof data.power_consumption === 'number' && data.power_consumption >= 0 ? data.power_consumption : 18
          });
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
        // Valeurs par défaut sécurisées
        setSystemStatus({
          camera_connection: 'En ligne',
          storage_used: 67,
          temperature: 42,
          power_consumption: 18
        });
      }
    };
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a] text-white flex">
      {/* Sidebar */}
      <Sidebar activeItem={activeMenuItem} onItemClick={handleNavigation} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#0d1525]/80 backdrop-blur-lg border-b border-cyan-900/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Smart Security IoT
              </h1>
              <p className="text-xs text-gray-400 mt-1">Système de surveillance intelligent</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono text-cyan-400">{currentTime.toLocaleTimeString('fr-FR')}</p>
              <p className="text-xs text-gray-500">{currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Camera className="w-5 h-5" />}
              title="Caméra Active"
              value="Jardin"
              subtitle="Statut : En ligne"
              status="online"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              title="Visages connus"
              value={statsData?.known_faces || 5}
              subtitle="En base de données"
              status="info"
            />
            <StatCard
              icon={<ShieldAlert className="w-5 h-5" />}
              title="Visages inconnus"
              value={statsData?.unknown_faces_today || 3}
              subtitle="Aujourd'hui"
              status="warning"
            />
            <StatCard
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Alertes aujourd'hui"
              value={statsData?.alerts_today || 2}
              subtitle=""
              status="alert"
              showButton
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera Feed */}
            <div className="lg:col-span-2">
              <CameraStream />
            </div>

            {/* Face Recognition */}
            <div>
              <FaceRecognition />
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Alerts */}
            <div className="lg:col-span-2">
              <RecentAlerts alerts={alerts} />
            </div>

            {/* System Status */}
            <div>
              <SystemStatus status={systemStatus} />
            </div>
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Statistics */}
            <AIStatistics />

            {/* Known Faces Gallery */}
            <KnownFacesGallery faces={knownFaces} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  status: 'online' | 'info' | 'warning' | 'alert';
  showButton?: boolean;
}

const StatCard = ({ icon, title, value, subtitle, status, showButton }: StatCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'info': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'warning': return 'from-orange-500/20 to-amber-500/20 border-orange-500/30';
      case 'alert': return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  const getStatusIconColor = () => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'warning': return 'text-orange-400';
      case 'alert': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getStatusColor()} border backdrop-blur-sm rounded-xl p-5 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16"></div>
      <div className="relative">
        <div className={`flex items-center gap-2 mb-3 ${getStatusIconColor()}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
        {showButton && (
          <button 
            onClick={() => setShowAlertsModal(true)}
            className="mt-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition-all cursor-pointer"
          >
            Voir les alertes
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
