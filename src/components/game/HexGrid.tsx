import { useState, useEffect } from 'react';
import type { HexTerritory } from '../../services/gameService';
import { TeamIcon } from '../shared/TeamIcon';

interface HexGridProps {
  gridSize: number;
  territories: HexTerritory[];
  team1Color: string;
  team2Color: string;
  team1Name: string;
  team2Name: string;
  team1Icon: string;
  team2Icon: string;
  team1Score: number;
  team2Score: number;
  timeRemaining: number;
  backgroundVideoUrl?: string;
  islandImageUrl?: string;
  onRestart?: () => void;
  showRestartButton?: boolean;
}

const hexPolygons = {
  center: "887.6 581.8 887.6 498.2 960 456.4 1032.4 498.2 1032.4 581.8 960 623.6",
  team1Large: "52.5 341.6 52.5 156.8 212.6 64.4 372.7 156.8 372.7 341.6 212.6 434",
  team2Large: "1547.3 341.6 1547.3 156.8 1707.4 64.4 1867.5 156.8 1867.5 341.6 1707.4 434",

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

export function HexGrid({
  gridSize,
  territories,
  team1Color,
  team2Color,
  team1Name,
  team2Name,
  team1Icon,
  team2Icon,
  team1Score,
  team2Score,
  timeRemaining,
  backgroundVideoUrl,
  islandImageUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRestart: _onRestart,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showRestartButton: _showRestartButton = false
}: HexGridProps) {
  const territoryMap = new Map(territories.map((t) => [t.hexId, t]));
  const [, setHoveredHex] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHexagonsForSize = () => {
    if (gridSize <= 6) {
      return hexPolygons.ring1;
    } else if (gridSize <= 18) {
      return [...hexPolygons.ring1, ...hexPolygons.ring2];
    } else {
      return [...hexPolygons.ring1, ...hexPolygons.ring2, ...hexPolygons.ring3];
    }
  };

  const getHexFill = (hexId: string) => {
    const territory = territoryMap.get(hexId);
    if (territory) {
      return territory.owner === 'team1' ? team1Color : team2Color;
    }
    return 'transparent';
  };

  const getHexStroke = () => {
    return '#ffffff';
  };

  const getStrokeWidth = () => {
    return 1;
  };

  const getHexOpacity = (hexId: string) => {
    const territory = territoryMap.get(hexId);
    return territory ? 0.85 : 0.12;
  };

  const hexagons = getHexagonsForSize();
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsMobilePortrait(window.innerWidth <= 768 && window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <div className="hex-territory-map">
      <style>{`
        /* Layer Structure: Background Video (z-index: -2) → Island (z-index: 1) → Hexagons (z-index: 2) */

        .hex-territory-map {
          position: relative;
          width: 100%;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        /* Background Video - Full Screen Stretch */
        .ocean-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -2;
        }

        /* Game Container - Maintains 1920x1080 aspect ratio */
        .game-container {
          position: relative;
          width: 100%;
          max-height: 85vh;
          aspect-ratio: 1920 / 1080;
          margin: 0 auto;
          transition: transform 0.3s ease;
        }

        /* Island Image - Maintains proportions at 100% height */
        .island-image {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          height: 100%;
          object-fit: contain;
          z-index: 1;
          pointer-events: none;
        }

        /* Hexagon Grid SVG - Perfectly overlays island */
        .hex-grid-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }

        /* Hex Polygons - Interactive territory hexagons */
        .hex-polygon {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .hex-polygon:hover {
          filter: brightness(1.2);
        }

        /* Center Hex - Reserved for game controls, never selectable */
        .center-hex {
          cursor: default;
          pointer-events: none;
          fill: none;
          stroke: transparent;
          stroke-width: 0;
        }

        /* Center Content - Positioned over center hexagon */
        .center-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          pointer-events: none;
        }

        /* Mobile Portrait - Square cropped view */
        @media screen and (max-width: 768px) and (orientation: portrait) {
          .game-container {
            aspect-ratio: 1 / 1;
            max-height: 90vh;
            max-width: 100vw;
          }

          .island-image {
            object-fit: cover;
            object-position: center;
            width: 100%;
            height: 100%;
          }

          .hex-grid-svg {
            width: 100%;
            height: 100%;
          }
        }

        /* Tablet Responsive */
        @media screen and (max-width: 768px) and (orientation: landscape) {
          .game-container {
            width: 95vw;
          }
        }

        /* Tablet Size */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
          .game-container {
            width: 95vw;
          }
        }

        /* Reduced Motion - Pause video */
        @media (prefers-reduced-motion: reduce) {
          .ocean-background {
            display: none;
          }
          .game-container {
            transition: none;
          }
          .hex-path {
            transition: none;
          }
        }
      `}</style>

      {backgroundVideoUrl && (
        <>
          {backgroundVideoUrl.includes('youtube.com') || backgroundVideoUrl.includes('youtu.be') ? (
            <iframe
              className="ocean-background"
              src={backgroundVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1'}
              allow="autoplay; fullscreen"
              style={{ border: 'none', pointerEvents: 'none' }}
              aria-label="Decorative ocean background video"
            />
          ) : (
            <video
              className="ocean-background"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label="Decorative ocean background animation"
              onError={(e) => {
                console.error('Video failed to load:', backgroundVideoUrl);
                e.currentTarget.style.display = 'none';
              }}
            >
              <source src={backgroundVideoUrl} type="video/mp4" />
            </video>
          )}
        </>
      )}

      <div className="game-container">
        <img
          className="island-image"
          src={islandImageUrl}
          alt="Island terrain"
          loading="lazy"
        />

        <svg
          className="hex-grid-svg"
          viewBox={isMobilePortrait ? "480 0 960 1080" : "0 0 1920 1080"}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Hexagonal territory map"
        >
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap');
                .svg-text-large { font-family: 'Black Ops One', 'Arial Black', sans-serif; font-size: 44.4px; font-weight: 800; fill: #fff; }
                .svg-text-small { font-family: 'Black Ops One', 'Arial Black', sans-serif; font-size: 22.7px; font-weight: 800; fill: #fff; }
                .team-hex { fill: none; stroke-width: 6; }
              `}
            </style>
          </defs>

          {/* Center Hex */}
          <polygon
            className="center-hex"
            points={hexPolygons.center}
            aria-label="Game control center - Reserved for game controls"
          />

          {/* Territory Hexagons */}
          {hexagons.map((hex) => {
            const territory = territoryMap.get(hex.id);
            return (
              <polygon
                key={hex.id}
                className="hex-polygon"
                points={hex.points}
                fill={territory ? getHexFill(hex.id) : '#ffffff'}
                fillOpacity={getHexOpacity(hex.id)}
                stroke={getHexStroke()}
                strokeWidth={getStrokeWidth()}
                strokeOpacity={0.6}
                style={territory ? { mixBlendMode: 'normal' } as React.CSSProperties : { mixBlendMode: 'overlay' } as React.CSSProperties}
                onMouseEnter={() => setHoveredHex(hex.id)}
                onMouseLeave={() => setHoveredHex(null)}
                aria-label={`Territory ${hex.id}${territoryMap.has(hex.id) ? ` - owned by ${territoryMap.get(hex.id)?.owner}` : ' - unclaimed'}`}
              />
            );
          })}

          {/* Timer Background - Transparent White Hexagon */}
          <polygon
            points={hexPolygons.center}
            fill="white"
            fillOpacity={0.8}
            stroke="white"
            strokeWidth={3}
            strokeOpacity={0.9}
          />

          {/* Timer Labels */}
          <text className="svg-text-small" x="960" y="522.5" textAnchor="middle" style={{fill: '#2C3E50'}}>TIME</text>
          <text className="svg-text-large" x="960" y="565" textAnchor="middle" style={{fill: '#2C3E50', fontSize: '48px', fontWeight: 900}}>{formatTime(timeRemaining)}</text>
        </svg>

        {/* Team 1 Card - Left Side */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '2%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          background: `linear-gradient(160deg, ${team1Color}ee 0%, ${team1Color}bb 60%, ${team1Color}88 100%)`,
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          padding: '20px 24px',
          minWidth: '180px',
          maxWidth: '200px',
          boxShadow: `0 0 30px ${team1Color}60, 0 8px 32px rgba(0,0,0,0.4)`,
          border: `3px solid rgba(255,255,255,0.4)`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '10px',
              marginBottom: '12px',
              display: 'inline-block',
            }}>
              <TeamIcon icon={team1Icon} size="xl" />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#fff',
              marginBottom: '4px',
              fontFamily: "'Black Ops One', 'Arial Black', sans-serif",
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>{team1Name}</h3>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '6px',
              fontWeight: 700,
              letterSpacing: '2px',
            }}>SCORE</p>
            <p style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              fontFamily: "'Black Ops One', 'Arial Black', sans-serif",
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}>{team1Score}</p>
          </div>
        </div>

        {/* Team 2 Card - Right Side */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '2%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          background: `linear-gradient(200deg, ${team2Color}ee 0%, ${team2Color}bb 60%, ${team2Color}88 100%)`,
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          padding: '20px 24px',
          minWidth: '180px',
          maxWidth: '200px',
          boxShadow: `0 0 30px ${team2Color}60, 0 8px 32px rgba(0,0,0,0.4)`,
          border: `3px solid rgba(255,255,255,0.4)`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '10px',
              marginBottom: '12px',
              display: 'inline-block',
            }}>
              <TeamIcon icon={team2Icon} size="xl" />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#fff',
              marginBottom: '4px',
              fontFamily: "'Black Ops One', 'Arial Black', sans-serif",
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>{team2Name}</h3>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '6px',
              fontWeight: 700,
              letterSpacing: '2px',
            }}>SCORE</p>
            <p style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              fontFamily: "'Black Ops One', 'Arial Black', sans-serif",
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}>{team2Score}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
