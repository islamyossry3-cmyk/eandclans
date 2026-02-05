import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Download, Trophy, ArrowLeft, Volume2, VolumeX, Zap, Target, CheckCircle, XCircle, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Confetti } from '../../components/shared/Confetti';
import { Loading } from '../../components/shared/Loading';
import { IndividualResultsHexGrid } from '../../components/game/IndividualResultsHexGrid';
import { sessionService } from '../../services/sessionService';
import { getTheme } from '../../constants/themes';
import { eandColors } from '../../constants/eandColors';
import { supabase } from '../../lib/supabase';
import type { Session, Question } from '../../types/session';

type GameScreen = 'welcome' | 'registration' | 'countdown' | 'quiz' | 'results' | 'leaderboard';

interface PlayerAnswer {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  timeSpent: number;
  skipped?: boolean;
}

interface PlayerResult {
  playerName: string;
  finalScore: number;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
  totalTime: number;
  photoUrl: string | null;
  completedAt: string;
}

export function IndividualGamePage() {
  const { sessionPin } = useParams<{ sessionPin: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<GameScreen>('welcome');

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [answers, setAnswers] = useState<PlayerAnswer[]>([]);
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pdfRedirectCountdown, setPdfRedirectCountdown] = useState<number | null>(null);
  const hasStartedPdfRedirectRef = useRef(false);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [leaderboard, setLeaderboard] = useState<PlayerResult[]>([]);
  const [gameStartTime] = useState(Date.now());

  useEffect(() => {
    loadSession();
  }, [sessionPin]);

  useEffect(() => {
    if (screen === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (screen === 'countdown' && countdown === 0) {
      startQuiz();
    }
  }, [countdown, screen]);

  useEffect(() => {
    if (screen === 'quiz' && !answerLocked && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (screen === 'quiz' && timeLeft === 0 && !answerLocked) {
      handleTimeout();
    }
  }, [timeLeft, screen, answerLocked]);

  // Background music control
  useEffect(() => {
    if (!session) return;

    const musicUrl = session.backgroundMusicUrl || '/assets/eandd.mp3';
    
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    const audio = audioRef.current;

    if ((screen === 'quiz' || screen === 'countdown') && !isMuted) {
      audio.play().catch(() => {
        // Autoplay was prevented
      });
    } else if (screen === 'results' || screen === 'leaderboard') {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [screen, isMuted, session]);

  // Update audio mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const loadSession = async () => {
    if (!sessionPin) return;

    const foundSession = await sessionService.getSessionByPin(sessionPin);
    if (!foundSession || foundSession.type !== 'individual') {
      navigate('/');
      return;
    }

    setSession(foundSession);
    setIsLoading(false);
  };

  const handleStartGame = () => {
    let hasError = false;

    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
      { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
    ];

    const newFieldErrors: Record<string, string> = {};

    registrationFields.forEach(field => {
      const value = fieldValues[field.id] || '';

      if (field.required && !value.trim()) {
        newFieldErrors[field.id] = `${field.label} is required`;
        hasError = true;
      } else if (value.trim() && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newFieldErrors[field.id] = 'Please enter a valid email address';
        hasError = true;
      }
    });

    setFieldErrors(newFieldErrors);

    if (hasError) return;

    setScreen('countdown');
  };

  const startQuiz = () => {
    setScreen('quiz');
    setQuestionStartTime(Date.now());
    setTimeLeft(session?.config.timePerQuestion || 30);
  };

  const handleAnswerSelect = (answerId: string) => {
    if (answerLocked || !session) return;

    setSelectedAnswer(answerId);
    setAnswerLocked(true);

    const currentQuestion = session.questions[currentQuestionIndex];
    const isCorrect = answerId === currentQuestion.correctAnswer;
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    const newAnswer: PlayerAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answerId,
      isCorrect,
      timeSpent,
    };

    setAnswers([...answers, newAnswer]);

    const pointsPerCorrect = session.config.pointsPerCorrectAnswer || 1;
    const newScore = score + (isCorrect ? pointsPerCorrect : 0);
    setScore(newScore);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const handleTimeout = () => {
    if (answerLocked || !session) return;

    setAnswerLocked(true);

    const currentQuestion = session.questions[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    const newAnswer: PlayerAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: null,
      isCorrect: false,
      timeSpent,
    };

    setAnswers([...answers, newAnswer]);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const handleSkipQuestion = () => {
    if (answerLocked || !session) return;

    setAnswerLocked(true);

    const currentQuestion = session.questions[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    const newAnswer: PlayerAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: null,
      isCorrect: false,
      timeSpent,
      skipped: true,
    };

    setAnswers([...answers, newAnswer]);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1000);
  };

  const moveToNextQuestion = () => {
    if (!session) return;

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswerLocked(false);
      setTimeLeft(session.config.timePerQuestion || 30);
      setQuestionStartTime(Date.now());
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (score > session!.questions.length * 0.7) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    await saveGameEntry();
    setScreen('results');
  };

  const saveGameEntry = async () => {
    if (!session) return;

    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect && a.selectedAnswer !== null).length;
    const skippedCount = answers.filter(a => a.skipped).length;
    const timeoutCount = answers.filter(a => a.selectedAnswer === null && !a.skipped).length;
    const totalTime = (Date.now() - gameStartTime) / 1000;

    const registrationFields = session.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
      { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
    ];

    const playerName = fieldValues['field1'] || fieldValues[registrationFields[0]?.id] || 'Anonymous';

    try {
      const { error } = await supabase.from('individual_game_entries').insert({
        session_id: session.id,
        player_name: playerName,
        player_email: null,
        player_organization: null,
        custom_fields: fieldValues,
        score: score,
        correct_count: correctCount,
        wrong_count: wrongCount,
        skipped_count: skippedCount,
        timeout_count: timeoutCount,
        total_time: totalTime,
        photo_url: photoDataUrl || null,
        completed_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error saving game entry:', error);
      }
    } catch (error) {
      console.error('Error saving game entry:', error);
    }
  };

  const startPhotoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setShowPhotoCapture(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access denied. Please use the upload option.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      context.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowPhotoCapture(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveAsImage = async () => {
    if (!resultRef.current) return;

    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' }
    ];
    const playerName = fieldValues['field1'] || fieldValues[registrationFields[0]?.id] || 'Player';

    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: '#1a1a1a',
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        removeContainer: true,
      });

      const link = document.createElement('a');
      link.download = `penramaj_${playerName}_${score}pts.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to save image:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const viewLeaderboard = async () => {
    setScreen('leaderboard');
    await loadLeaderboard();
  };

  const loadLeaderboard = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('individual_game_entries')
        .select('*')
        .eq('session_id', session.id)
        .order('score', { ascending: false })
        .order('total_time', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }

      if (data) {
        setLeaderboard(data.map(entry => ({
          playerName: entry.player_name,
          finalScore: entry.score,
          correctCount: entry.correct_count,
          wrongCount: entry.wrong_count,
          timeoutCount: entry.timeout_count,
          totalTime: Number(entry.total_time),
          photoUrl: entry.photo_url,
          completedAt: entry.completed_at,
        })));
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  if (isLoading || !session) {
    return <Loading message="Loading game..." />;
  }

  const theme = getTheme(session.design.backgroundTheme);
  const maxScore = session.questions.length;
  const capturedHexagons = Math.round((score / maxScore) * 100);

  if (screen === 'welcome') {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />
        <div className="relative z-10 w-full max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4">
              <Button onClick={() => navigate('/join')} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)` }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
                  <Target className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-extrabold text-white mb-1">{session.name}</h1>
                <p className="text-sm text-white/70">
                  {session.description || 'Answer Questions. Conquer Your Island. Claim Your Glory.'}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-xl p-4 text-center" style={{ background: `${eandColors.oceanBlue}05`, border: `1px solid ${eandColors.oceanBlue}08` }}>
                    <p className="text-2xl font-extrabold" style={{ color: eandColors.red }}>{session.questions.length}</p>
                    <p className="text-xs font-medium" style={{ color: eandColors.grey }}>Questions</p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ background: `${eandColors.oceanBlue}05`, border: `1px solid ${eandColors.oceanBlue}08` }}>
                    <p className="text-2xl font-extrabold" style={{ color: eandColors.red }}>{session.config.timePerQuestion}s</p>
                    <p className="text-xs font-medium" style={{ color: eandColors.grey }}>Per Question</p>
                  </div>
                </div>
                <Button onClick={() => setScreen('registration')} size="lg" className="w-full">
                  <Zap className="w-5 h-5" /> Enter the Challenge
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (screen === 'registration') {
    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
      { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
    ];

    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center" style={{ background: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, ${eandColors.darkGreen} 100%)` }}>
              <h2 className="text-xl font-extrabold text-white">Register to Play</h2>
            </div>
            <div className="p-6 space-y-4">
              {registrationFields.map(field => (
                <Input
                  key={field.id}
                  label={field.required ? field.label : `${field.label} (Optional)`}
                  type={field.type || 'text'}
                  placeholder={field.placeholder || ''}
                  value={fieldValues[field.id] || ''}
                  onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
                  error={fieldErrors[field.id]}
                  required={field.required}
                />
              ))}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setScreen('welcome')} variant="ghost" className="flex-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleStartGame} className="flex-1">
                  <Zap className="w-4 h-4" /> Begin Quest
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === 'countdown') {
    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' }
    ];
    const playerName = fieldValues['field1'] || fieldValues[registrationFields[0]?.id] || 'Player';

    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />
        <div className="relative z-10 text-center">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-extrabold text-white mb-8">
            Prepare yourself, {playerName}!
          </motion.h2>
          <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl sm:text-9xl font-extrabold game-text-glow" style={{ color: eandColors.red }}>
            {countdown > 0 ? countdown : 'GO!'}
          </motion.div>
        </div>
      </div>
    );
  }

  if (screen === 'quiz') {
    const currentQuestion = session.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

    return (
      <div className="relative min-h-screen overflow-hidden game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-10" />
        <div className="relative z-10 min-h-screen flex flex-col p-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-3 mb-4 game-surface">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${eandColors.red}, #c00700)` }}>
                  {score} pts
                </div>
                <span className="text-xs text-white/60">Q{currentQuestionIndex + 1}/{session.questions.length}</span>
                <button onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors mobile-touch">
                  {isMuted ? <VolumeX className="w-4 h-4 text-white/60" /> : <Volume2 className="w-4 h-4 text-white/60" />}
                </button>
              </div>
              <div className={`px-3 py-1.5 rounded-xl font-extrabold font-mono text-white text-lg ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
                style={{ background: timeLeft <= 5 ? `${eandColors.red}40` : timeLeft <= 10 ? 'rgba(255,107,0,0.3)' : `${eandColors.brightGreen}30` }}>
                <Clock className="w-4 h-4 inline mr-1" />{timeLeft}s
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
              <motion.div className="h-full rounded-full" animate={{ width: `${progress}%` }}
                style={{ background: `linear-gradient(90deg, ${eandColors.brightGreen}, ${eandColors.red})` }} />
            </div>
          </motion.div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full mb-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-center mb-1" style={{ color: eandColors.oceanBlue }}>
                {currentQuestion.text}
              </h3>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {currentQuestion.options.map((option: any, idx: number) => {
                const isSelected = selectedAnswer === option.id;
                const isCorrect = option.id === currentQuestion.correctAnswer;
                const showResult = answerLocked;

                let bg = 'white';
                let borderColor = `${eandColors.oceanBlue}12`;
                let textColor = eandColors.oceanBlue;

                if (showResult && isSelected && isCorrect) {
                  bg = `${eandColors.brightGreen}15`; borderColor = eandColors.brightGreen; textColor = eandColors.brightGreen;
                } else if (showResult && isSelected && !isCorrect) {
                  bg = `${eandColors.red}10`; borderColor = eandColors.red; textColor = eandColors.red;
                } else if (showResult && isCorrect) {
                  bg = `${eandColors.brightGreen}15`; borderColor = eandColors.brightGreen; textColor = eandColors.brightGreen;
                } else if (isSelected) {
                  bg = `${eandColors.red}08`; borderColor = eandColors.red;
                }

                return (
                  <motion.button key={option.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    whileTap={answerLocked ? undefined : { scale: 0.97 }}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={answerLocked}
                    className="p-4 sm:p-5 rounded-xl text-left transition-all mobile-touch disabled:cursor-not-allowed"
                    style={{ background: bg, border: `2px solid ${borderColor}` }}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: showResult && isCorrect ? eandColors.brightGreen : showResult && isSelected ? eandColors.red : isSelected ? eandColors.red : `${eandColors.oceanBlue}10`,
                          color: (showResult && (isCorrect || isSelected)) || isSelected ? 'white' : eandColors.oceanBlue,
                        }}>
                        {showResult && isCorrect ? <CheckCircle className="w-5 h-5" /> : showResult && isSelected && !isCorrect ? <XCircle className="w-5 h-5" /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-medium" style={{ color: textColor }}>{option.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {session.config.allowSkip && !answerLocked && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <Button onClick={handleSkipQuestion} variant="ghost" size="sm">Skip Question</Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'results') {
    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' }
    ];
    const playerName = fieldValues['field1'] || fieldValues[registrationFields[0]?.id] || 'Player';

    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect && a.selectedAnswer !== null).length;
    const skippedCount = answers.filter(a => a.skipped).length;
    const timeoutCount = answers.filter(a => a.selectedAnswer === null && !a.skipped).length;

    // Start countdown for PDF redirect if available
    if (session?.postGameFileUrl && !hasStartedPdfRedirectRef.current) {
      hasStartedPdfRedirectRef.current = true;
      setPdfRedirectCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setPdfRedirectCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            window.open(session.postGameFileUrl, '_blank');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return (
      <div className="relative min-h-screen overflow-hidden p-4 game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />
        <Confetti active={showConfetti} duration={5000} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg mx-auto pt-4">
          <div ref={resultRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-8 pb-6 text-center"
              style={{ background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)` }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Quest Complete!</h1>
              <p className="text-4xl font-extrabold text-white mt-2">{score} Points</p>
              <p className="text-sm text-white/70 mt-1">
                {correctCount} correct · {wrongCount} wrong
                {skippedCount > 0 && <> · {skippedCount} skipped</>}
                {timeoutCount > 0 && <> · {timeoutCount} timeout</>}
              </p>
            </div>

            <div className="p-6">
              {pdfRedirectCountdown !== null && (
                <div className="mb-4 px-4 py-2.5 rounded-xl" style={{ background: `${eandColors.brightGreen}08`, border: `1px solid ${eandColors.brightGreen}20` }}>
                  <p className="text-sm font-medium" style={{ color: eandColors.brightGreen }}>Opening document in {pdfRedirectCountdown}...</p>
                </div>
              )}
              {pdfRedirectCountdown === null && session?.postGameFileUrl && (
                <div className="mb-4 px-4 py-2.5 rounded-xl" style={{ background: `${eandColors.brightGreen}08`, border: `1px solid ${eandColors.brightGreen}20` }}>
                  <p className="text-sm font-medium" style={{ color: eandColors.brightGreen }}>Document opened in new tab</p>
                </div>
              )}

              <div className="mb-6">
                <IndividualResultsHexGrid score={score} maxScore={maxScore} theme={theme} playerName={playerName} photoUrl={photoDataUrl} />
              </div>

              {!photoDataUrl && (
                <div className="mb-5 p-4 rounded-xl text-center" style={{ background: `${eandColors.oceanBlue}04`, border: `1px solid ${eandColors.oceanBlue}08` }}>
                  <p className="text-sm mb-3" style={{ color: eandColors.grey }}>Add your photo to personalize!</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={startPhotoCapture} size="sm">
                      <Camera className="w-4 h-4" /> Take Photo
                    </Button>
                    <Button onClick={() => document.getElementById('photo-upload-input')?.click()} size="sm" variant="ghost">
                      <Upload className="w-4 h-4" /> Upload
                    </Button>
                    <input id="photo-upload-input" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={saveAsImage} size="lg" className="flex-1">
                  <Download className="w-5 h-5" /> Save Result
                </Button>
                <Button onClick={viewLeaderboard} size="lg" variant="ghost" className="flex-1">
                  <Trophy className="w-5 h-5" /> Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showPhotoCapture && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-extrabold mb-4 text-center" style={{ color: eandColors.oceanBlue }}>Take Photo</h3>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-4" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-3">
                  <Button onClick={stopCamera} variant="ghost" className="flex-1">Cancel</Button>
                  <Button onClick={capturePhoto} className="flex-1"><Camera className="w-4 h-4" /> Capture</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (screen === 'leaderboard') {
    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' }
    ];
    const playerName = fieldValues['field1'] || fieldValues[registrationFields[0]?.id] || 'Player';
    const currentPlayerRank = leaderboard.findIndex(p => p.playerName === playerName && Math.abs(p.finalScore - score) < 0.01) + 1;

    return (
      <div className="relative min-h-screen overflow-hidden p-4 game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg mx-auto pt-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center"
              style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0c0828 100%)` }}>
              <Trophy className="w-8 h-8 mx-auto mb-2 text-white" />
              <h1 className="text-xl font-extrabold text-white">Hall of Champions</h1>
            </div>

            <div className="p-5">
              {currentPlayerRank > 0 && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-3"
                  style={{ background: `${eandColors.red}06`, border: `1px solid ${eandColors.red}15` }}>
                  {photoDataUrl && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${eandColors.red}` }}>
                      <img src={photoDataUrl} alt="You" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: eandColors.oceanBlue }}>{playerName} (You)</p>
                    <p className="text-xs" style={{ color: eandColors.grey }}>{score} pts · Rank #{currentPlayerRank}</p>
                  </div>
                </div>
              )}

              <div className="max-h-[420px] overflow-y-auto space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Loading size="sm" />
                    <p className="text-sm mt-2" style={{ color: eandColors.grey }}>Loading leaderboard...</p>
                  </div>
                ) : leaderboard.map((player, index) => {
                  const isCurrentPlayer = player.playerName === playerName && Math.abs(player.finalScore - score) < 0.01;
                  const rank = index + 1;

                  return (
                    <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: isCurrentPlayer ? `${eandColors.red}06` : `${eandColors.oceanBlue}03`,
                        border: `1px solid ${isCurrentPlayer ? eandColors.red + '20' : eandColors.oceanBlue + '06'}`,
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: rank <= 3 ? `linear-gradient(135deg, ${eandColors.red}, #c00700)` : eandColors.grey }}>
                        {rank}
                      </div>
                      {player.photoUrl && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${eandColors.oceanBlue}15` }}>
                          <img src={player.photoUrl} alt={player.playerName} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate flex items-center gap-1" style={{ color: eandColors.oceanBlue }}>
                          {player.playerName}
                          {isCurrentPlayer && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: eandColors.red }}>You</span>}
                        </p>
                        <p className="text-[11px]" style={{ color: eandColors.grey }}>
                          {player.correctCount} correct · {player.totalTime.toFixed(0)}s
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-extrabold" style={{ color: eandColors.red }}>{player.finalScore}</p>
                        <p className="text-[10px]" style={{ color: eandColors.grey }}>pts</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-4">
                <Button onClick={() => setScreen('results')} size="lg" className="w-full" variant="ghost">
                  <ArrowLeft className="w-5 h-5" /> Return to Results
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
