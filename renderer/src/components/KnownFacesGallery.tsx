import { useState } from 'react';
import { User, Trash2 } from 'lucide-react';

interface KnownFacesGalleryProps {
  faces: any[];
}

const KnownFacesGallery = ({ faces = [] }: KnownFacesGalleryProps) => {
  const defaultFaces = [
    { id: 1, name: 'Jean Dupont', image: '/api/placeholder/face1' },
    { id: 2, name: 'Marie Martin', image: '/api/placeholder/face2' },
    { id: 3, name: 'Pierre Bernard', image: '/api/placeholder/face3' },
    { id: 4, name: 'Sophie Petit', image: '/api/placeholder/face4' },
    { id: 5, name: 'Lucas Robert', image: '/api/placeholder/face5' }
  ];

  const displayFaces = faces.length > 0 ? faces : defaultFaces;
  const [localFaces, setLocalFaces] = useState(displayFaces);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDeleteFace = async (faceId: number) => {
    try {
      // Confirmation sécurisée
      const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce visage ?');
      if (!confirmed) return;

      // Appel API sécurisé avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://localhost:5000/api/known_faces/${faceId}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to delete face');

      // Mise à jour locale
      setLocalFaces(localFaces.filter((face: any) => face.id !== faceId));
    } catch (error) {
      console.error('Error deleting face:', error);
      alert('Erreur lors de la suppression du visage');
    }
  };

  const handleAddFace = () => {
    setShowAddModal(true);
  };

  return (
    <div className="bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] border border-cyan-900/30 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Visages connus
        </h2>
        <span className="text-xs text-gray-400">{displayFaces.length} visages</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {displayFaces.map((face) => (
          <div
            key={face.id}
            className="bg-gradient-to-br from-[#1a2332] to-[#0d1525] border border-cyan-900/30 rounded-lg p-3 hover:border-cyan-500/50 transition-all group"
          >
            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center mb-2 overflow-hidden">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-white text-center truncate">{face.name}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFace(face.id);
              }}
              className="w-full mt-2 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          </div>
        ))}

        {/* Add new face button */}
        <div 
          onClick={handleAddFace}
          className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-3 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col items-center justify-center"
        >
          <div className="w-full aspect-square rounded-lg bg-cyan-500/20 flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-cyan-400 text-center">Ajouter</p>
        </div>
      </div>
    </div>
  );
};

export default KnownFacesGallery;
