import { useEffect, useState } from 'react';

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
  active: boolean;
  duration?: number;
}

export function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
    const newPieces: ConfettiPiece[] = [];

    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 2 + 1,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    setPieces(newPieces);

    const interval = setInterval(() => {
      setPieces((prev) =>
        prev.map((piece) => ({
          ...piece,
          x: piece.x + piece.speedX,
          y: piece.y + piece.speedY,
          rotation: piece.rotation + piece.rotationSpeed,
        }))
      );
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPieces([]);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, duration]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            transition: 'all 0.05s linear',
          }}
        />
      ))}
    </div>
  );
}
