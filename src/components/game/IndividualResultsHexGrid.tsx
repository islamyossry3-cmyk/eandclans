import { useState, useRef } from 'react';
import { X, Move, RotateCcw } from 'lucide-react';
import type { ThemeConfig } from '../../constants/themes';

interface IndividualResultsHexGridProps {
  score: number;
  maxScore: number;
  theme: ThemeConfig;
  playerName: string;
  photoUrl?: string | null;
  onPhotoDelete?: () => void;
}

const hexPolygons = {
  center: "887.6 581.8 887.6 498.2 960 456.4 1032.4 498.2 1032.4 581.8 960 623.6",

  ring1: [
    { id: "hex-1-1", points: "963 451.2 963 367.5 1035.4 325.7 1107.9 367.5 1107.9 451.2 1035.4 493" },
    { id: "hex-1-2", points: "1038.4 581.8 1038.4 498.2 1110.9 456.4 1183.3 498.2 1183.3 581.8 1110.9 623.6" },
    { id: "hex-1-3", points: "963 712.5 963 628.8 1035.4 587 1107.9 628.8 1107.9 712.5 1035.4 754.3" },
    { id: "hex-1-4", points: "812.1 712.5 812.1 628.8 884.6 587 957 628.8 957 712.5 884.6 754.3" },
    { id: "hex-1-5", points: "736.8 581.6 736.8 498 809.2 456.2 881.7 498 881.7 581.6 809.2 623.5" },
    { id: "hex-1-6", points: "812.1 451.2 812.1 367.5 884.6 325.7 957 367.5 957 451.2 884.6 493" }
  ],

  ring2: [
    { id: "hex-2-1", points: "887.6 320.5 887.6 236.9 960 195 1032.4 236.9 1032.4 320.5 960 362.3" },
    { id: "hex-2-2", points: "1038.4 320.5 1038.4 236.9 1110.9 195 1183.3 236.9 1183.3 320.5 1110.9 362.3" },
    { id: "hex-2-3", points: "1113.9 451.2 1113.9 367.5 1186.3 325.7 1258.7 367.5 1258.7 451.2 1186.3 493" },
    { id: "hex-2-4", points: "1189.3 581.8 1189.3 498.2 1261.7 456.4 1334.2 498.2 1334.2 581.8 1261.7 623.6" },
    { id: "hex-2-5", points: "1113.9 712.5 1113.9 628.8 1186.3 587 1258.7 628.8 1258.7 712.5 1186.3 754.3" },
    { id: "hex-2-6", points: "1038.4 843.1 1038.4 759.5 1110.9 717.7 1183.3 759.5 1183.3 843.1 1110.9 885" },
    { id: "hex-2-7", points: "887.6 843.1 887.6 759.5 960 717.7 1032.4 759.5 1032.4 843.1 960 885" },
    { id: "hex-2-8", points: "736.7 843.1 736.7 759.5 809.1 717.7 881.6 759.5 881.6 843.1 809.1 885" },
    { id: "hex-2-9", points: "661.3 712.5 661.3 628.8 733.7 587 806.1 628.8 806.1 712.5 733.7 754.3" },
    { id: "hex-2-10", points: "585.8 581.8 585.8 498.2 658.3 456.4 730.7 498.2 730.7 581.8 658.3 623.6" },
    { id: "hex-2-11", points: "661.3 451.2 661.3 367.5 733.7 325.7 806.1 367.5 806.1 451.2 733.7 493" },
    { id: "hex-2-12", points: "736.7 320.5 736.7 236.9 809.1 195 881.6 236.9 881.6 320.5 809.1 362.3" }
  ],

  ring3: [
    { id: "hex-3-1", points: "661.3 189.8 661.3 106.2 733.7 64.4 806.1 106.2 806.1 189.8 733.7 231.7" },
    { id: "hex-3-2", points: "812.1 189.8 812.1 106.2 884.6 64.4 957 106.2 957 189.8 884.6 231.7" },
    { id: "hex-3-3", points: "963 189.8 963 106.2 1035.4 64.4 1107.9 106.2 1107.9 189.8 1035.4 231.7" },
    { id: "hex-3-4", points: "1113.9 189.8 1113.9 106.2 1186.3 64.4 1258.7 106.2 1258.7 189.8 1186.3 231.7" },
    { id: "hex-3-5", points: "1189.3 320.5 1189.3 236.9 1261.7 195 1334.2 236.9 1334.2 320.5 1261.7 362.3" },
    { id: "hex-3-6", points: "1264.7 451.2 1264.7 367.5 1337.2 325.7 1409.6 367.5 1409.6 451.2 1337.2 493" },
    { id: "hex-3-7", points: "1340.2 581.8 1340.2 498.2 1412.6 456.4 1485 498.2 1485 581.8 1412.6 623.6" },
    { id: "hex-3-8", points: "1264.7 712.5 1264.7 628.8 1337.2 587 1409.6 628.8 1409.6 712.5 1337.2 754.3" },
    { id: "hex-3-9", points: "1189.3 843.1 1189.3 759.5 1261.7 717.7 1334.2 759.5 1334.2 843.1 1261.7 885" },
    { id: "hex-3-10", points: "1113.9 973.8 1113.9 890.2 1186.3 848.3 1258.7 890.2 1258.7 973.8 1186.3 1015.6" },
    { id: "hex-3-11", points: "963 973.8 963 890.2 1035.4 848.3 1107.9 890.2 1107.9 973.8 1035.4 1015.6" },
    { id: "hex-3-12", points: "812.1 973.8 812.1 890.2 884.6 848.3 957 890.2 957 973.8 884.6 1015.6" },
    { id: "hex-3-13", points: "661.3 973.8 661.3 890.2 733.7 848.3 806.1 890.2 806.1 973.8 733.7 1015.6" },
    { id: "hex-3-14", points: "585.8 843.1 585.8 759.5 658.3 717.7 730.7 759.5 730.7 843.1 658.3 885" },
    { id: "hex-3-15", points: "510.4 712.5 510.4 628.8 582.8 587 655.3 628.8 655.3 712.5 582.8 754.3" },
    { id: "hex-3-16", points: "435 581.8 435 498.2 507.4 456.4 579.8 498.2 579.8 581.8 507.4 623.6" },
    { id: "hex-3-17", points: "510.4 451.2 510.4 367.5 582.8 325.7 655.3 367.5 655.3 451.2 582.8 493" },
    { id: "hex-3-18", points: "585.8 320.5 585.8 236.9 658.3 195 730.7 236.9 730.7 320.5 658.3 362.3" }
  ]
};

export function IndividualResultsHexGrid({ score, maxScore, theme, playerName, photoUrl, onPhotoDelete }: IndividualResultsHexGridProps) {
  const allHexagons = [...hexPolygons.ring1, ...hexPolygons.ring2, ...hexPolygons.ring3];
  const capturedCount = Math.round((score / maxScore) * allHexagons.length);
  const capturedPercentage = Math.round((capturedCount / allHexagons.length) * 100);

  const [photoPosition, setPhotoPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [photoScale, setPhotoScale] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - photoPosition.x,
      y: e.clientY - photoPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, containerRect.width - 288));
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, containerRect.height - 288));

    setPhotoPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetPosition = () => {
    setPhotoPosition({ x: 16, y: 16 });
    setPhotoScale(1);
  };

  const handleDelete = () => {
    if (onPhotoDelete) {
      onPhotoDelete();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border-4 border-amber-700"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <style>{`
        .individual-results-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .island-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }

        .hex-overlay-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }

        .player-info-overlay {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
        }

        .player-photo-overlay {
          position: absolute;
          z-index: 4;
          transition: transform 0.1s ease;
        }

        .player-photo-overlay.dragging {
          cursor: grabbing !important;
          transform: scale(1.05);
        }

        .player-photo-overlay:not(.dragging) {
          cursor: grab;
        }

        .photo-controls {
          position: absolute;
          top: -12px;
          right: -12px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .player-photo-overlay:hover .photo-controls {
          opacity: 1;
        }
      `}</style>

      <div className="individual-results-container">
        <img
          src={theme.backgroundImage}
          alt="Island"
          className="island-backdrop"
          crossOrigin="anonymous"
        />

        <svg
          className="hex-overlay-svg"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points={hexPolygons.center}
            fill="none"
            stroke="rgba(0, 0, 0, 0.5)"
            strokeWidth="4"
            strokeDasharray="10, 5"
          />

          {allHexagons.map((hex, index) => {
            const isCaptured = index < capturedCount;
            return (
              <polygon
                key={hex.id}
                points={hex.points}
                fill={isCaptured ? theme.colors.accent : 'rgba(128, 128, 128, 0.2)'}
                fillOpacity={isCaptured ? 0.75 : 0.15}
                stroke={isCaptured ? theme.colors.primary : '#666'}
                strokeWidth={isCaptured ? 2 : 1}
                strokeOpacity={isCaptured ? 0.8 : 0.4}
                style={{ mixBlendMode: isCaptured ? 'screen' : 'normal' }}
              />
            );
          })}
        </svg>

        {photoUrl && (
          <div
            className={`player-photo-overlay ${isDragging ? 'dragging' : ''}`}
            style={{
              left: `${photoPosition.x}px`,
              top: `${photoPosition.y}px`,
              transform: `scale(${photoScale})`,
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="relative">
              <div className="w-72 h-72 rounded-full border-8 border-amber-600 overflow-hidden shadow-2xl bg-white">
                <img
                  src={photoUrl}
                  alt="Player"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  draggable={false}
                />
              </div>

              <div className="photo-controls">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPosition();
                  }}
                  className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                  title="Reset Position"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoScale((s) => Math.max(0.5, s - 0.1));
                  }}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 font-bold"
                  title="Shrink"
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoScale((s) => Math.min(1.5, s + 0.1));
                  }}
                  className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 font-bold"
                  title="Enlarge"
                >
                  +
                </button>
                {onPhotoDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this photo?')) {
                        handleDelete();
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                    title="Delete Photo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-cyan-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <Move className="w-3 h-3 inline mr-1" />
                Drag to Move
              </div>
            </div>
          </div>
        )}

        <div className="player-info-overlay bg-stone-900/90 backdrop-blur-sm rounded-3xl px-6 py-3 border-2 border-amber-600">
          <div className="text-amber-300 font-bold text-2xl text-center">{playerName}</div>
          <div className="text-amber-200 text-sm text-center">{capturedPercentage}% Conquered</div>
        </div>
      </div>
    </div>
  );
}
