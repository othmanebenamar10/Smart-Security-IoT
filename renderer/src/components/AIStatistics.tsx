import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AIStatistics = () => {
  const donutData = [
    { name: 'Visages connus', value: 65, color: '#10b981' },
    { name: 'Visages inconnus', value: 35, color: '#ef4444' }
  ];

  const histogramData = [
    { day: 'Lun', detections: 12 },
    { day: 'Mar', detections: 19 },
    { day: 'Mer', detections: 8 },
    { day: 'Jeu', detections: 15 },
    { day: 'Ven', detections: 22 },
    { day: 'Sam', detections: 10 },
    { day: 'Dim', detections: 7 }
  ];

  // Validation des données statistiques - Sécurité
  const validateNumber = (value: any, min: number = 0, max: number = 1000): number => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.max(min, Math.min(max, value));
  };

  // Sanitization des labels
  const sanitizeLabel = (label: string): string => {
    if (typeof label !== 'string') return 'Inconnu';
    return label.replace(/[<>"'&]/g, '').substring(0, 50);
  };

  // Validation des couleurs hex
  const validateColor = (color: string): string => {
    if (typeof color !== 'string') return '#10b981';
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color) ? color : '#10b981';
  };

  // Données validées
  const validatedDonutData = donutData.map(item => ({
    name: sanitizeLabel(item.name),
    value: validateNumber(item.value, 0, 100),
    color: validateColor(item.color)
  }));

  const validatedHistogramData = histogramData.map(item => ({
    day: sanitizeLabel(item.day),
    detections: validateNumber(item.detections, 0, 1000)
  }));

  return (
    <div className="bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] border border-cyan-900/30 rounded-xl p-5 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-white mb-4">Statistiques IA</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Répartition des détections</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validatedDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {validatedDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1525',
                    border: '1px solid #0891b2',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {validatedDonutData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Histogram */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Historique des détections</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={validatedHistogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1525',
                    border: '1px solid #0891b2',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="detections" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStatistics;
