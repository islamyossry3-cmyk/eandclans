import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, Download, Trophy, ArrowLeft, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Confetti } from '../../components/shared/Confetti';
import { Loading } from '../../components/shared/Loading';
import { IndividualResultsHexGrid } from '../../components/game/IndividualResultsHexGrid';
import { sessionService } from '../../services/sessionService';
import { getTheme } from '../../constants/themes';
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

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
        {theme.backgroundImage && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${theme.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.7)',
                transform: 'scale(1.1)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: theme.gradients.lobby,
                opacity: 0.85,
              }}
            />
          </>
        )}

        <div className="relative z-10 w-full">
          <div className="max-w-2xl mx-auto">
            <div className="mb-4">
              <Button onClick={() => navigate('/join')} variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Join
              </Button>
            </div>
            <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-gray-900 rounded-[2rem] border-4 border-amber-600 shadow-2xl p-8">
              <h1 className="text-5xl font-bold text-amber-300 mb-4 text-center drop-shadow-lg">
                {session.name}
              </h1>
              <p className="text-amber-100 text-center mb-8 text-lg">
                {session.description || 'Answer Questions. Conquer Your Island. Claim Your Glory.'}
              </p>

              <div className="bg-stone-900/50 rounded-3xl p-6 mb-8 border-2 border-amber-700/30">
                <h2 className="text-xl font-bold text-amber-200 mb-4 text-center">Game Info</h2>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-stone-800/50 rounded-2xl p-4">
                    <div className="text-3xl font-bold text-amber-400">{session.questions.length}</div>
                    <div className="text-sm text-amber-200">Questions</div>
                  </div>
                  <div className="bg-stone-800/50 rounded-2xl p-4">
                    <div className="text-3xl font-bold text-amber-400">{session.config.timePerQuestion}s</div>
                    <div className="text-sm text-amber-200">Per Question</div>
                  </div>
                </div>
              </div>

              <Button onClick={() => setScreen('registration')} size="lg" className="w-full">
                Enter the Challenge
              </Button>
            </div>
          </div>
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
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
        {theme.backgroundImage && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${theme.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.7)',
                transform: 'scale(1.1)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: theme.gradients.lobby,
                opacity: 0.85,
              }}
            />
          </>
        )}

        <div className="relative z-10 max-w-md w-full">
          <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-gray-900 rounded-[2rem] border-4 border-amber-600 shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-amber-300 mb-6 text-center">
              Register to Play
            </h2>

            <div className="space-y-4">
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
                <Button onClick={() => setScreen('welcome')} variant="secondary" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={handleStartGame} className="flex-1">
                  Begin Quest
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'countdown') {
    const registrationFields = session?.registrationFields || [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' }
    ];
    const playerName = fieldValues['field1'] || fieldValues[registrationFields[0]?.id] || 'Player';

    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        {theme.backgroundImage && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${theme.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.5)',
            }}
          />
        )}

        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-bold text-amber-200 mb-8">
            Prepare yourself, {playerName}!
          </h2>
          <div className="text-9xl font-bold text-amber-400 animate-pulse drop-shadow-2xl">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'quiz') {
    const currentQuestion = session.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

    return (
      <div className="relative min-h-screen overflow-hidden">
        {theme.backgroundImage && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${theme.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.6)',
            }}
          />
        )}

        <div className="relative z-10 min-h-screen flex flex-col p-4">
          <div className="bg-stone-900/90 backdrop-blur-sm rounded-3xl shadow-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <div className="bg-amber-600 text-white px-4 py-2 rounded-2xl font-bold">
                  Score: {score}
                </div>
                <div className="text-amber-200">
                  Question {currentQuestionIndex + 1} of {session.questions.length}
                </div>
              </div>

              <div className={`text-3xl font-bold px-6 py-2 rounded-2xl ${
                timeLeft <= 5 ? 'bg-red-600 text-white animate-pulse' :
                timeLeft <= 10 ? 'bg-orange-500 text-white' :
                'bg-amber-600 text-white'
              }`}>
                {timeLeft}s
              </div>
            </div>

            <div className="bg-stone-800 rounded-2xl h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
            <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-gray-900 rounded-[2rem] border-4 border-amber-600 shadow-2xl p-8 w-full mb-6">
              <h3 className="text-2xl font-bold text-amber-200 mb-6 text-center">
                {currentQuestion.text}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const isCorrect = option.id === currentQuestion.correctAnswer;
                const showResult = answerLocked;

                let buttonClass = 'bg-stone-800 border-stone-600 hover:border-amber-500 text-amber-100';

                if (showResult && isSelected && isCorrect) {
                  buttonClass = 'bg-green-600 border-green-400 text-white';
                } else if (showResult && isSelected && !isCorrect) {
                  buttonClass = 'bg-red-600 border-red-400 text-white';
                } else if (showResult && isCorrect) {
                  buttonClass = 'bg-green-600 border-green-400 text-white';
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={answerLocked}
                    className={`p-6 rounded-3xl border-4 transition-all text-lg font-bold ${buttonClass} disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>

            {session.config.allowSkip && !answerLocked && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSkipQuestion}
                  variant="secondary"
                  className="bg-stone-700 hover:bg-stone-600 text-amber-200 border-2 border-stone-500"
                >
                  Skip Question
                </Button>
              </div>
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

    return (
      <div className="relative min-h-screen overflow-hidden p-4">
        <Confetti active={showConfetti} duration={5000} />

        {theme.backgroundImage && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${theme.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.7)',
                transform: 'scale(1.1)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: theme.gradients.lobby,
                opacity: 0.85,
              }}
            />
          </>
        )}

        <div className="relative z-10 max-w-5xl mx-auto">
          <div ref={resultRef} className="bg-gradient-to-br from-stone-800 via-stone-900 to-gray-900 rounded-[2rem] border-4 border-amber-600 shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-amber-300 mb-4 drop-shadow-lg">
                Quest Complete!
              </h1>
              <div className="text-6xl font-bold text-amber-400 mb-2">{score} Points</div>
              <div className="text-amber-200">
                {correctCount} correct · {wrongCount} wrong
                {skippedCount > 0 && <> · {skippedCount} skipped</>}
                {timeoutCount > 0 && <> · {timeoutCount} timeout</>}
              </div>
            </div>

            <div className="mb-8">
              <IndividualResultsHexGrid
                score={score}
                maxScore={maxScore}
                theme={theme}
                playerName={playerName}
                photoUrl={photoDataUrl}
              />
            </div>

            {!photoDataUrl && (
              <div className="mb-6">
                <div className="bg-stone-900/50 rounded-3xl p-4 border-2 border-amber-700/30 text-center">
                  <p className="text-amber-200 mb-4">Add your photo to personalize your result!</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={startPhotoCapture} size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button onClick={() => document.getElementById('photo-upload-input')?.click()} size="sm" variant="secondary">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={saveAsImage} size="lg" className="flex-1">
                <Download className="w-5 h-5 mr-2" />
                Save My Conquest
              </Button>
              <Button onClick={viewLeaderboard} size="lg" variant="secondary" className="flex-1">
                <Trophy className="w-5 h-5 mr-2" />
                View Leaderboard
              </Button>
            </div>
          </div>
        </div>

        {showPhotoCapture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stone-900 rounded-[2rem] border-4 border-amber-600 p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-amber-300 mb-4 text-center">Take Photo</h3>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-3xl mb-4"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                <Button onClick={stopCamera} variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          </div>
        )}
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
      <div className="relative min-h-screen overflow-hidden p-4">
        {theme.backgroundImage && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${theme.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.7)',
                transform: 'scale(1.1)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: theme.gradients.lobby,
                opacity: 0.85,
              }}
            />
          </>
        )}

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-gray-900 rounded-[2rem] border-4 border-amber-600 shadow-2xl p-8">
            <h1 className="text-4xl font-bold text-amber-300 mb-8 text-center drop-shadow-lg">
              <Trophy className="w-10 h-10 inline-block mr-3" />
              Hall of Champions
            </h1>

            {currentPlayerRank > 0 && (
              <div className="bg-stone-900/50 rounded-3xl p-6 border-2 border-amber-700/30 mb-6">
                <div className="flex items-center gap-4 p-4 bg-amber-600/20 rounded-2xl">
                  {photoDataUrl && (
                    <div className="w-16 h-16 rounded-full border-4 border-amber-600 overflow-hidden">
                      <img src={photoDataUrl} alt="You" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-amber-200 font-bold text-xl">{playerName} (You)</div>
                    <div className="text-amber-300">Score: {score} points · Rank: #{currentPlayerRank}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-stone-900/50 rounded-3xl p-4 border-2 border-amber-700/30 mb-6 max-h-[500px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="text-center text-amber-200 py-8">
                  <p className="text-lg mb-2">Loading leaderboard...</p>
                  <p className="text-sm text-amber-300">Fetching all player scores</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((player, index) => {
                    const isCurrentPlayer = player.playerName === playerName && Math.abs(player.finalScore - score) < 0.01;
                    const rank = index + 1;
                    const getRankIcon = (rank: number) => {
                      if (rank === 1) return '🥇';
                      if (rank === 2) return '🥈';
                      if (rank === 3) return '🥉';
                      return rank;
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                          isCurrentPlayer
                            ? 'bg-amber-600/30 border-2 border-amber-500'
                            : 'bg-stone-800/50 border border-amber-700/20'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
                          {getRankIcon(rank)}
                        </div>
                        {player.photoUrl && (
                          <div className="w-12 h-12 rounded-full border-2 border-amber-600 overflow-hidden">
                            <img src={player.photoUrl} alt={player.playerName} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-amber-200 font-bold text-lg flex items-center gap-2">
                            {player.playerName}
                            {isCurrentPlayer && <span className="text-xs bg-amber-600 px-2 py-1 rounded-full">You</span>}
                          </div>
                          <div className="text-sm text-amber-300 flex items-center gap-3">
                            <span>{player.correctCount} correct</span>
                            <span>·</span>
                            <span>{player.wrongCount} wrong</span>
                            <span>·</span>
                            <span>{player.totalTime.toFixed(0)}s</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-amber-400">{player.finalScore}</div>
                          <div className="text-xs text-amber-300">points</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button onClick={() => setScreen('results')} size="lg" className="w-full">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Return to Results
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
