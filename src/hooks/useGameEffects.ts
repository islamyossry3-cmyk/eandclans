import { useState, useCallback } from 'react';
import { useSoundEffects } from './useSoundEffects';
import type { AchievementType } from '../components/game/AchievementBadge';

interface ScorePopupState {
  isVisible: boolean;
  points: number;
  isCorrect: boolean;
}

interface GameEffectsState {
  scorePopup: ScorePopupState;
  streak: number;
  showConfetti: boolean;
  confettiType: 'territory' | 'victory' | 'achievement';
  achievements: AchievementType[];
  pendingAchievements: AchievementType[];
}

export function useGameEffects() {
  const sounds = useSoundEffects();
  
  const [state, setState] = useState<GameEffectsState>({
    scorePopup: { isVisible: false, points: 0, isCorrect: false },
    streak: 0,
    showConfetti: false,
    confettiType: 'territory',
    achievements: [],
    pendingAchievements: [],
  });

  const showScorePopup = useCallback((points: number, isCorrect: boolean) => {
    setState((prev) => ({
      ...prev,
      scorePopup: { isVisible: true, points, isCorrect },
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    if (isCorrect) {
      sounds.playCorrect();
      if (state.streak + 1 >= 3) {
        sounds.playStreak();
      }
    } else {
      sounds.playIncorrect();
    }
  }, [sounds, state.streak]);

  const hideScorePopup = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scorePopup: { ...prev.scorePopup, isVisible: false },
    }));
  }, []);

  const triggerConfetti = useCallback((type: 'territory' | 'victory' | 'achievement' = 'territory') => {
    setState((prev) => ({
      ...prev,
      showConfetti: true,
      confettiType: type,
    }));

    if (type === 'territory') {
      sounds.playTerritoryClaimed();
    } else if (type === 'victory') {
      sounds.playGameEnd();
    } else {
      sounds.playAchievement();
    }
  }, [sounds]);

  const hideConfetti = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showConfetti: false,
    }));
  }, []);

  const unlockAchievement = useCallback((type: AchievementType) => {
    setState((prev) => {
      if (prev.achievements.includes(type)) return prev;
      
      return {
        ...prev,
        achievements: [...prev.achievements, type],
        pendingAchievements: [...prev.pendingAchievements, type],
      };
    });
    
    sounds.playAchievement();
  }, [sounds]);

  const dismissAchievement = useCallback((type: AchievementType) => {
    setState((prev) => ({
      ...prev,
      pendingAchievements: prev.pendingAchievements.filter((a) => a !== type),
    }));
  }, []);

  const checkStreakAchievements = useCallback((streak: number) => {
    if (streak >= 3) unlockAchievement('streak_3');
    if (streak >= 5) unlockAchievement('streak_5');
    if (streak >= 10) unlockAchievement('streak_10');
  }, [unlockAchievement]);

  const onCorrectAnswer = useCallback((points: number, isFirstAnswer: boolean = false) => {
    showScorePopup(points, true);
    
    const newStreak = state.streak + 1;
    checkStreakAchievements(newStreak);
    
    if (isFirstAnswer) {
      unlockAchievement('first_answer');
    }
  }, [showScorePopup, state.streak, checkStreakAchievements, unlockAchievement]);

  const onIncorrectAnswer = useCallback(() => {
    showScorePopup(0, false);
  }, [showScorePopup]);

  const onTerritoryClaimed = useCallback((isFirst: boolean = false) => {
    triggerConfetti('territory');
    
    if (isFirst) {
      unlockAchievement('territory_claimed');
    }
  }, [triggerConfetti, unlockAchievement]);

  const onGameEnd = useCallback((isWinner: boolean, isMVP: boolean = false) => {
    if (isWinner) {
      triggerConfetti('victory');
      unlockAchievement('team_player');
    }
    
    if (isMVP) {
      unlockAchievement('mvp');
    }
  }, [triggerConfetti, unlockAchievement]);

  const resetStreak = useCallback(() => {
    setState((prev) => ({ ...prev, streak: 0 }));
  }, []);

  return {
    // State
    scorePopup: state.scorePopup,
    streak: state.streak,
    showConfetti: state.showConfetti,
    confettiType: state.confettiType,
    achievements: state.achievements,
    pendingAchievements: state.pendingAchievements,
    
    // Actions
    showScorePopup,
    hideScorePopup,
    triggerConfetti,
    hideConfetti,
    unlockAchievement,
    dismissAchievement,
    onCorrectAnswer,
    onIncorrectAnswer,
    onTerritoryClaimed,
    onGameEnd,
    resetStreak,
    
    // Sound controls
    setMuted: sounds.setMuted,
    playClick: sounds.playClick,
    playCountdown: sounds.playCountdown,
    playGameStart: sounds.playGameStart,
  };
}
