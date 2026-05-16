import { useEffect, useState, useRef } from 'react';
import { Camera, Shield, Circle } from 'lucide-react';

const CameraStream = () => {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleString('fr-FR'));
  const [isLive, setIsLive] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date().toLocaleString('fr-FR')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        // Timeout de sécurité pour éviter le blocage
        timeoutId = setTimeout(() => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setIsLive(false);
            console.error('Camera access timeout');
          }
        }, 15000);

        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          }, 
          audio: false 
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Error accessing camera:', error);
        setIsLive(false);
      }
    };

    if (isLive) {
      startCamera();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLive]);

  return (
    <div className="space-y-4 rounded-xl border border-cyan-900/30 bg-gradient-to-br from-[#0d1525] to-[#0a0f1a] p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Caméra Jardin - En direct</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-400">En ligne</span>
          </div>
          <div className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded border border-red-500/30">
            <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500">REC</span>
          </div>
        </div>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden border-2 border-cyan-900/50 group">
        {isLive ? (
          <video
            ref={videoRef}
            className="w-full h-auto aspect-video object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-auto aspect-video bg-slate-950 flex items-center justify-center text-slate-600 font-mono">
            CAMÉRA OFFLINE
          </div>
        )}

        {/* Canvas for face detection overlay */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />

        {/* UI Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <div className="bg-black/70 px-3 py-1.5 rounded border border-cyan-500/30 backdrop-blur-md">
            <p className="text-[10px] font-mono text-cyan-400 leading-tight">
              CAMÉRA JARDEN<br/>
              {timestamp}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/70 px-2 py-1 rounded border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-green-400">IA ACTIVE</span>
          </div>
        </div>

        {/* Face detection boxes (simulated) */}
        <div className="absolute top-1/4 left-1/3 w-32 h-40 border-2 border-green-500 rounded-lg pointer-events-none">
          <div className="absolute -top-6 left-0 bg-green-500/90 px-2 py-0.5 rounded text-[10px] font-bold text-white">
            Connu
          </div>
        </div>

        <div className="absolute top-1/3 right-1/4 w-28 h-36 border-2 border-red-500 rounded-lg pointer-events-none">
          <div className="absolute -top-6 left-0 bg-red-500/90 px-2 py-0.5 rounded text-[10px] font-bold text-white">
            Inconnu
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            // Confirmation avant d'arrêter le flux
            if (isLive) {
              const confirmed = window.confirm('Êtes-vous sûr de vouloir arrêter le flux vidéo ?');
              if (!confirmed) return;
            }
            setIsLive(!isLive);
          }}
          className={`flex-1 rounded-lg px-4 py-2 font-bold tracking-tighter uppercase transition cursor-pointer ${
            isLive
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
          }`}
        >
          {isLive ? 'Arrêter Flux' : 'Démarrer Flux'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-cyan-900/30">
        <StatItem label="Statut" value={isLive ? 'EN LIGNE' : 'HORS LIGNE'} color={isLive ? 'text-green-400' : 'text-red-400'} />
        <StatItem label="Résolution" value="1280x720" />
        <StatItem label="Source" value="Webcam PC" />
      </div>
    </div>
  );
};

const StatItem = ({ label, value, color = 'text-white' }: { label: string, value: string, color?: string }) => (
  <div className="text-center">
    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{label}</p>
    <p className={`text-xs font-mono font-bold ${color}`}>{value}</p>
  </div>
);

export default CameraStream;
