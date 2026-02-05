import { useState, useEffect, useCallback } from 'react';
import { eandColors } from '../../constants/eandColors';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  eandColors.red,
  eandColors.brightGreen,
  eandColors.oceanBlue,
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
];

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 100,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const createPieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 4,
        speedY: 2 + Math.random() * 4,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    return newPieces;
  }, [pieceCount, colors]);

  useEffect(() => {
    if (isActive) {
      setPieces(createPieces());

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration, createPieces, onComplete]);

  useEffect(() => {
    if (pieces.length === 0) return;

    const interval = setInterval(() => {
      setPieces((prevPieces) =>
        prevPieces
          .map((piece) => ({
            ...piece,
            x: piece.x + piece.speedX * 0.1,
            y: piece.y + piece.speedY * 0.3,
            rotation: piece.rotation + piece.rotationSpeed,
          }))
          .filter((piece) => piece.y < 110)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [pieces.length]);

  if (!isActive && pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}

interface CelebrationProps {
  type: 'territory' | 'victory' | 'achievement';
  isActive: boolean;
  onComplete?: () => void;
}

export function Celebration({ type, isActive, onComplete }: CelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowConfetti(true);
      setShowBurst(true);

      const burstTimer = setTimeout(() => setShowBurst(false), 500);
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
        onComplete?.();
      }, 3000);

      return () => {
        clearTimeout(burstTimer);
        clearTimeout(confettiTimer);
      };
    }
  }, [isActive, onComplete]);

  const getConfig = () => {
    switch (type) {
      case 'victory':
        return { pieceCount: 200, duration: 5000, colors: ['#FFD700', '#FFA500', '#FF6347', eandColors.brightGreen] };
      case 'territory':
        return { pieceCount: 50, duration: 2000 };
      case 'achievement':
        return { pieceCount: 80, duration: 2500, colors: ['#FFD700', '#FFA500', '#FF69B4'] };
      default:
        return {};
    }
  };

  return (
    <>
      <Confetti isActive={showConfetti} {...getConfig()} />
      {showBurst && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div
            className="w-32 h-32 rounded-full"
            style={{
              background: `radial-gradient(circle, ${eandColors.brightGreen}80 0%, transparent 70%)`,
              animation: 'celebrationBurst 0.5s ease-out forwards',
            }}
          />
          <style>{`
            @keyframes celebrationBurst {
              0% {
                transform: scale(0);
                opacity: 1;
              }
              100% {
                transform: scale(10);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
