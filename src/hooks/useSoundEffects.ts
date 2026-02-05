import { useCallback, useRef } from 'react';

type SoundType = 
  | 'correct'
  | 'incorrect'
  | 'territory_claimed'
  | 'achievement'
  | 'countdown'
  | 'game_start'
  | 'game_end'
  | 'click'
  | 'streak';

const SOUND_FREQUENCIES: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; pattern?: number[] }> = {
  correct: { frequency: 880, duration: 150, type: 'sine', pattern: [1, 0.8, 1.2] },
  incorrect: { frequency: 220, duration: 300, type: 'sawtooth' },
  territory_claimed: { frequency: 523, duration: 200, type: 'sine', pattern: [1, 1.25, 1.5] },
  achievement: { frequency: 659, duration: 100, type: 'sine', pattern: [1, 1.25, 1.5, 2] },
  countdown: { frequency: 440, duration: 100, type: 'square' },
  game_start: { frequency: 440, duration: 150, type: 'sine', pattern: [1, 1.5, 2] },
  game_end: { frequency: 880, duration: 200, type: 'sine', pattern: [2, 1.5, 1, 0.75] },
  click: { frequency: 1000, duration: 50, type: 'sine' },
  streak: { frequency: 660, duration: 100, type: 'sine', pattern: [1, 1.2, 1.4, 1.6, 2] },
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (isMutedRef.current) return;

    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Sound effect failed:', error);
    }
  }, [getAudioContext]);

  const playSound = useCallback((soundType: SoundType) => {
    if (isMutedRef.current) return;

    const config = SOUND_FREQUENCIES[soundType];
    if (!config) return;

    if (config.pattern) {
      config.pattern.forEach((multiplier, index) => {
        setTimeout(() => {
          playTone(config.frequency * multiplier, config.duration, config.type);
        }, index * (config.duration + 50));
      });
    } else {
      playTone(config.frequency, config.duration, config.type);
    }
  }, [playTone]);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
  }, []);

  const playCorrect = useCallback(() => playSound('correct'), [playSound]);
  const playIncorrect = useCallback(() => playSound('incorrect'), [playSound]);
  const playTerritoryClaimed = useCallback(() => playSound('territory_claimed'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playCountdown = useCallback(() => playSound('countdown'), [playSound]);
  const playGameStart = useCallback(() => playSound('game_start'), [playSound]);
  const playGameEnd = useCallback(() => playSound('game_end'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playStreak = useCallback(() => playSound('streak'), [playSound]);

  return {
    playSound,
    playCorrect,
    playIncorrect,
    playTerritoryClaimed,
    playAchievement,
    playCountdown,
    playGameStart,
    playGameEnd,
    playClick,
    playStreak,
    setMuted,
  };
}
