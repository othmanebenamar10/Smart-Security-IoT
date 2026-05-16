import { Home, Camera, User, AlertTriangle, History, Settings, Server, Shield } from 'lucide-react';

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

const Sidebar = ({ activeItem = 'dashboard', onItemClick }: SidebarProps) => {
  // Whitelist des items de menu autorisés - Sécurité
  const allowedMenuItems = ['dashboard', 'camera', 'recognition', 'alerts', 'history', 'settings', 'system'];
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'camera', label: 'Caméra Jardin', icon: Camera },
    { id: 'recognition', label: 'Reconnaissance', icon: User },
    { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'settings', label: 'Paramètres', icon: Settings },
    { id: 'system', label: 'Système', icon: Server },
  ];

  // Handler sécurisé avec validation
  const handleItemClick = (itemId: string) => {
    // Validation stricte - whitelist
    if (!allowedMenuItems.includes(itemId)) {
      console.error('Tentative de navigation vers un item non autorisé:', itemId);
      return;
    }
    
    // Sanitization de l'input
    const sanitizedItemId = itemId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    if (onItemClick) {
      onItemClick(sanitizedItemId);
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0d1525] to-[#0a0f1a] border-r border-cyan-900/30 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-cyan-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Smart Security IoT</h1>
            <p className="text-xs text-gray-400">Tableau de bord</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Card */}
      <div className="p-4 border-t border-cyan-900/30">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-400">Système sécurisé</span>
          </div>
          <p className="text-xs text-gray-400">Tout fonctionne bien</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
