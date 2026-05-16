import { useState, useEffect } from 'react';
import { User, AlertCircle, CheckCircle } from 'lucide-react';

interface FaceData {
  id: string;
  name: string;
  status: 'known' | 'unknown';
  image: string;
  timestamp: string;
}

const FaceRecognition = () => {
  const [faces, setFaces] = useState<FaceData[]>([
    {
      id: '1',
      name: 'Inconnu',
      status: 'unknown',
      image: '/api/placeholder/face1',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jean Dupont',
      status: 'known',
      image: '/api/placeholder/face2',
      timestamp: new Date().toISOString()
    }
  ]);

  // Validation et sanitization des noms de visage
  const sanitizeFaceName = (name: string): string => {
    if (typeof name !== 'string') return 'Inconnu';
    // Suppression des caractères dangereux (XSS)
    return name.replace(/[<>"'&]/g, '').substring(0, 100);
  };

  // Validation du statut
  const isValidStatus = (status: string): status is 'known' | 'unknown' => {
    return status === 'known' || status === 'unknown';
  };

  return (
    <div className="bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] border border-cyan-900/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Reconnaissance faciale - En temps réel
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400">Actif</span>
        </div>
      </div>

      <div className="space-y-3">
        {faces.map((face) => (
          <div
            key={face.id}
            className={`p-3 rounded-lg border ${
              face.status === 'unknown'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-green-500/10 border-green-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden">
                {face.status === 'unknown' ? (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{sanitizeFaceName(face.name)}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      face.status === 'unknown'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {face.status === 'unknown' ? 'Nouveau' : 'Reconnu'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {face.status === 'unknown' ? 'Visage non reconnu' : 'Visage identifié'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(face.timestamp).toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-xs text-cyan-400">
          <span className="font-semibold">IA Active:</span> Analyse en cours avec précision de 98.5%
        </p>
      </div>
    </div>
  );
};

export default FaceRecognition;
