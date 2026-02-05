const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

export const GameSounds = {
  correctAnswer: () => {
    playTone(523.25, 0.1, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.25), 200); // G5
  },

  wrongAnswer: () => {
    playTone(200, 0.15, 'square', 0.15);
    setTimeout(() => playTone(150, 0.2, 'square', 0.1), 150);
  },

  streak: (level: number) => {
    const baseFreq = 400 + (level * 50);
    playTone(baseFreq, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(baseFreq * 1.25, 0.1, 'sine', 0.2), 80);
    setTimeout(() => playTone(baseFreq * 1.5, 0.15, 'sine', 0.25), 160);
  },

  countdown: () => {
    playTone(440, 0.08, 'sine', 0.15);
  },

  countdownEnd: () => {
    playTone(880, 0.2, 'sine', 0.3);
  },

  buttonClick: () => {
    playTone(600, 0.05, 'sine', 0.1);
  },

  gameStart: () => {
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 100);
    });
  },

  gameEnd: () => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 150);
    });
  },

  victory: () => {
    const melody = [
      { freq: 523.25, dur: 0.15 }, // C5
      { freq: 523.25, dur: 0.15 }, // C5
      { freq: 523.25, dur: 0.15 }, // C5
      { freq: 523.25, dur: 0.4 },  // C5
      { freq: 415.30, dur: 0.4 },  // Ab4
      { freq: 466.16, dur: 0.4 },  // Bb4
      { freq: 523.25, dur: 0.15 }, // C5
      { freq: 466.16, dur: 0.1 },  // Bb4
      { freq: 523.25, dur: 0.5 },  // C5
    ];
    let time = 0;
    melody.forEach(({ freq, dur }) => {
      setTimeout(() => playTone(freq, dur, 'sine', 0.25), time * 1000);
      time += dur;
    });
  },

  territoryCapture: () => {
    playTone(440, 0.1, 'triangle', 0.2);
    setTimeout(() => playTone(554.37, 0.1, 'triangle', 0.2), 100);
    setTimeout(() => playTone(659.25, 0.15, 'triangle', 0.25), 200);
  },

  notification: () => {
    playTone(800, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(1000, 0.15, 'sine', 0.2), 100);
  },

  tick: () => {
    playTone(1000, 0.03, 'sine', 0.08);
  },

  powerUp: () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(400 + (i * 100), 0.08, 'sine', 0.15), i * 50);
    }
  },
};

export const Haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },

  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20]);
    }
  },

  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  pattern: (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },
};

export function playFeedback(type: 'correct' | 'wrong' | 'click' | 'start' | 'end' | 'victory' | 'capture') {
  switch (type) {
    case 'correct':
      GameSounds.correctAnswer();
      Haptics.success();
      break;
    case 'wrong':
      GameSounds.wrongAnswer();
      Haptics.error();
      break;
    case 'click':
      GameSounds.buttonClick();
      Haptics.light();
      break;
    case 'start':
      GameSounds.gameStart();
      Haptics.medium();
      break;
    case 'end':
      GameSounds.gameEnd();
      Haptics.heavy();
      break;
    case 'victory':
      GameSounds.victory();
      Haptics.pattern([50, 100, 50, 100, 100]);
      break;
    case 'capture':
      GameSounds.territoryCapture();
      Haptics.medium();
      break;
  }
}

let soundEnabled = true;
let hapticEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function setHapticEnabled(enabled: boolean) {
  hapticEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function isHapticEnabled() {
  return hapticEnabled;
}
