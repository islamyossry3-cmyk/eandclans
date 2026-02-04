import { useState, useEffect } from 'react';
import type { HexTerritory } from '../../services/gameService';

interface PlayerHexGridProps {
  gridSize: number;
  territories: HexTerritory[];
  team1Color: string;
  team2Color: string;
  backgroundVideoUrl?: string;
  islandImageUrl?: string;
  availableTerritories: string[];
  onHexClick?: (hexId: string) => void;
  myTeam: 'team1' | 'team2';
  newlyClaimedHex?: string | null;
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

export function PlayerHexGrid({
  gridSize,
  territories,
  team1Color,
  team2Color,
  backgroundVideoUrl,
  islandImageUrl,
  availableTerritories,
  onHexClick,
  myTeam,
  newlyClaimedHex
}: PlayerHexGridProps) {
  const territoryMap = new Map(territories.map((t) => [t.hexId, t]));
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);
  const myTeamColor = myTeam === 'team1' ? team1Color : team2Color;

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

  const getHexStroke = (hexId: string) => {
    if (newlyClaimedHex === hexId) {
      return myTeamColor;
    }
    if (availableTerritories.includes(hexId)) {
      return myTeamColor;
    }
    return '#ffffff';
  };

  const getStrokeWidth = (hexId: string) => {
    if (newlyClaimedHex === hexId) {
      return 6;
    }
    if (availableTerritories.includes(hexId)) {
      return 3;
    }
    return 1;
  };

  const getHexOpacity = (hexId: string) => {
    const territory = territoryMap.get(hexId);
    return territory ? 0.75 : 0.15;
  };

  const isClickable = (hexId: string) => {
    return availableTerritories.includes(hexId) && !territoryMap.has(hexId);
  };

  const handleHexClick = (hexId: string) => {
    if (isClickable(hexId) && onHexClick) {
      onHexClick(hexId);
    }
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
        .hex-territory-map {
          position: relative;
          width: 100%;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .ocean-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -2;
        }

        .game-container {
          position: relative;
          width: 100%;
          max-height: 85vh;
          aspect-ratio: 1920 / 1080;
          margin: 0 auto;
          transition: transform 0.3s ease;
        }

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

        .hex-grid-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }

        .hex-polygon {
          transition: all 0.3s ease;
        }

        .hex-polygon.clickable {
          cursor: pointer;
        }

        .hex-polygon.clickable:hover {
          filter: brightness(1.3) drop-shadow(0 0 10px currentColor);
        }

        .hex-polygon.newly-claimed {
          animation: claimPulse 1.2s ease-out;
        }

        @keyframes claimPulse {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.1);
            filter: brightness(1.5) drop-shadow(0 0 20px currentColor);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        .center-hex {
          stroke-dasharray: 10, 5;
          cursor: default;
          pointer-events: none;
          fill: none;
          stroke: rgba(0, 0, 0, 0.8);
          stroke-width: 4;
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

        @media screen and (max-width: 768px) and (orientation: landscape) {
          .game-container {
            width: 95vw;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ocean-background {
            display: none;
          }
          .game-container {
            transition: none;
          }
          .hex-polygon {
            transition: none;
            animation: none !important;
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
          <polygon
            className="center-hex"
            points={hexPolygons.center}
            aria-label="Game control center"
          />

          {hexagons.map((hex) => {
            const clickable = isClickable(hex.id);
            const territory = territoryMap.get(hex.id);
            return (
              <polygon
                key={hex.id}
                className={`hex-polygon ${clickable ? 'clickable' : ''} ${newlyClaimedHex === hex.id ? 'newly-claimed' : ''}`}
                points={hex.points}
                fill={territory ? getHexFill(hex.id) : '#ffffff'}
                fillOpacity={getHexOpacity(hex.id)}
                stroke={getHexStroke(hex.id)}
                strokeWidth={getStrokeWidth(hex.id)}
                strokeOpacity={availableTerritories.includes(hex.id) ? 1 : 0.6}
                onMouseEnter={() => clickable && setHoveredHex(hex.id)}
                onMouseLeave={() => setHoveredHex(null)}
                onClick={() => handleHexClick(hex.id)}
                aria-label={`Territory ${hex.id}${territoryMap.has(hex.id) ? ` - owned by ${territoryMap.get(hex.id)?.owner}` : availableTerritories.includes(hex.id) ? ' - available to claim' : ' - unclaimed'}`}
                style={{
                  cursor: clickable ? 'pointer' : 'default',
                  mixBlendMode: territory ? 'screen' : 'normal'
                }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
