import { useState, useEffect } from 'react';
import { eandColors } from '../../constants/eandColors';

interface ScorePopupProps {
  points: number;
  isCorrect: boolean;
  onComplete?: () => void;
}

export function ScorePopup({ points, isCorrect, onComplete }: ScorePopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      style={{ animation: 'scorePopupFadeIn 0.3s ease-out' }}
    >
      <div
        className="text-center transform"
        style={{
          animation: 'scorePopupScale 1.5s ease-out forwards',
        }}
      >
        <div
          className="text-6xl md:text-8xl font-black drop-shadow-2xl"
          style={{
            color: isCorrect ? eandColors.brightGreen : eandColors.red,
            textShadow: `0 0 30px ${isCorrect ? eandColors.brightGreen : eandColors.red}80`,
          }}
        >
          {isCorrect ? `+${points}` : '✗'}
        </div>
        <div
          className="text-2xl md:text-3xl font-bold mt-2"
          style={{
            color: isCorrect ? eandColors.brightGreen : eandColors.red,
          }}
        >
          {isCorrect ? 'Correct!' : 'Wrong!'}
        </div>
      </div>

      <style>{`
        @keyframes scorePopupFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scorePopupScale {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          20% {
            transform: scale(1.2);
            opacity: 1;
          }
          40% {
            transform: scale(1);
          }
          80% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

interface ScoreStreakProps {
  streak: number;
}

export function ScoreStreak({ streak }: ScoreStreakProps) {
  if (streak < 2) return null;

  const getStreakEmoji = () => {
    if (streak >= 10) return '🔥🔥🔥';
    if (streak >= 5) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '⚡';
  };

  const getStreakMessage = () => {
    if (streak >= 10) return 'UNSTOPPABLE!';
    if (streak >= 7) return 'ON FIRE!';
    if (streak >= 5) return 'INCREDIBLE!';
    if (streak >= 3) return 'STREAK!';
    return 'Nice!';
  };

  return (
    <div
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none"
      style={{ animation: 'streakBounce 0.5s ease-out' }}
    >
      <div
        className="px-6 py-3 rounded-full font-bold text-white text-lg md:text-xl shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${eandColors.red} 0%, ${eandColors.burgundy} 100%)`,
          boxShadow: `0 0 30px ${eandColors.red}60`,
        }}
      >
        {getStreakEmoji()} {streak}x {getStreakMessage()}
      </div>

      <style>{`
        @keyframes streakBounce {
          0% {
            transform: translateX(-50%) scale(0) rotate(-10deg);
          }
          50% {
            transform: translateX(-50%) scale(1.2) rotate(5deg);
          }
          100% {
            transform: translateX(-50%) scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
