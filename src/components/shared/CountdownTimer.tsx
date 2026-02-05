import { useEffect, useState } from 'react';
import { eandColors } from '../../constants/eandColors';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export function CountdownTimer({
  seconds,
  onComplete,
  size = 'md',
  showIcon = true,
  warningThreshold = 10,
  criticalThreshold = 5,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const isWarning = timeLeft <= warningThreshold && timeLeft > criticalThreshold;
  const isCritical = timeLeft <= criticalThreshold;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (isCritical) return eandColors.red;
    if (isWarning) return '#ff6b00';
    return eandColors.brightGreen;
  };

  const sizes = {
    sm: { text: 'text-lg', icon: 'w-4 h-4', padding: 'px-3 py-1.5' },
    md: { text: 'text-2xl', icon: 'w-5 h-5', padding: 'px-4 py-2' },
    lg: { text: 'text-4xl', icon: 'w-6 h-6', padding: 'px-6 py-3' },
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl font-mono font-bold ${sizes[size].padding} ${isCritical ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: `${getColor()}20`,
        color: getColor(),
        border: `2px solid ${getColor()}`,
      }}
    >
      {showIcon && <Clock className={sizes[size].icon} />}
      <span className={sizes[size].text}>{formatTime(timeLeft)}</span>
    </div>
  );
}

interface CircularCountdownProps {
  seconds: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  onComplete?: () => void;
}

export function CircularCountdown({
  seconds,
  totalSeconds,
  size = 80,
  strokeWidth = 6,
  onComplete,
}: CircularCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (timeLeft / totalSeconds) * 100;
  const offset = circumference - (progress / 100) * circumference;

  const isCritical = timeLeft <= 5;
  const isWarning = timeLeft <= 10;

  const getColor = () => {
    if (isCritical) return eandColors.red;
    if (isWarning) return '#ff6b00';
    return eandColors.brightGreen;
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${isCritical ? 'animate-pulse' : ''}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`${eandColors.oceanBlue}30`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-lg font-bold font-mono"
          style={{ color: getColor() }}
        >
          {timeLeft}
        </span>
      </div>
    </div>
  );
}

interface QuestionTimerProps {
  questionNumber: number;
  totalQuestions: number;
  timePerQuestion: number;
  onTimeUp?: () => void;
}

export function QuestionTimer({
  questionNumber,
  totalQuestions,
  timePerQuestion,
  onTimeUp,
}: QuestionTimerProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className="px-4 py-2 rounded-xl font-bold"
        style={{
          backgroundColor: `${eandColors.oceanBlue}20`,
          color: eandColors.oceanBlue,
        }}
      >
        Q{questionNumber}/{totalQuestions}
      </div>
      <CircularCountdown
        seconds={timePerQuestion}
        totalSeconds={timePerQuestion}
        onComplete={onTimeUp}
      />
    </div>
  );
}
