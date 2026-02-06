import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { tournamentService, defaultTournamentDesign } from '../../services/tournamentService';
import type { TournamentQuestion, TournamentDesign } from '../../services/tournamentService';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { eandColors } from '../../constants/eandColors';
import { cairoToUTC } from '../../utils/cairoTime';
import {
  parseTournamentCSV, mergeArabicCSV,
  generateSampleEnglishCSV, generateSampleArabicCSV, downloadCSV,
} from '../../utils/tournamentCsvParser';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/shared/Toast';
import {
  Trophy, Calendar, Clock, Users, ArrowLeft, ArrowRight, Save,
  Palette, HelpCircle, Plus, Trash2, Check, FileText,
  Upload, Download, Music, AlertCircle, Volume2
} from 'lucide-react';

type Step = 'basic' | 'schedule' | 'players' | 'design' | 'questions' | 'review';

const THEME_OPTIONS = [
  { value: 'win-together', label: 'Win Together', emoji: '🤝', group: 'Unite as One&' },
  { value: 'build-capabilities', label: 'Build Capabilities', emoji: '🤝', group: 'Unite as One&' },
  { value: 'push-boundaries', label: 'Push Boundaries', emoji: '�', group: 'Dare to be Bold' },
  { value: 'champion-innovation', label: 'Champion Innovation', emoji: '💎', group: 'Dare to be Bold' },
  { value: 'leverage-data-ai', label: 'Leverage Data & AI', emoji: '🎯', group: 'Be Customer Obsessed' },
  { value: 'exceed-expectations', label: 'Exceed Expectations', emoji: '🎯', group: 'Be Customer Obsessed' },
];

const ICON_OPTIONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🏰', '🏯', '⚔️', '🛡️', '🦁', '🦅', '🐉', '🔥', '⚡', '💎', '👑'];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TournamentBuilderPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const arabicCsvInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    sessionDuration: 8,
    breakDuration: 2,
    maxPlayersPerSession: 50,
    maxPlayersPerTeam: 25,
    activeHoursStart: '09:00',
    activeHoursEnd: '17:00',
    useActiveHours: false,
    excludedDays: [] as number[],
  });

  const [design, setDesign] = useState<TournamentDesign>({ ...defaultTournamentDesign });
  const [questions, setQuestions] = useState<TournamentQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<TournamentQuestion | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // CSV handlers
  const handleEnglishCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseTournamentCSV(content);
      if (result.success && result.questions && result.questions.length > 0) {
        setQuestions(prev => [...prev, ...result.questions!]);
        toastSuccess(`Imported ${result.questions.length} questions`);
      } else if (result.errors?.length) {
        toastError(`Import failed: ${result.errors[0]}`);
      } else {
        toastError('No valid questions found in CSV');
      }
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleArabicCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (questions.length === 0) {
      toastError('Import English questions first, then add Arabic translations');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = mergeArabicCSV(content, questions);
      if (result.questions) {
        setQuestions(result.questions);
        toastSuccess('Arabic translations merged successfully');
        if (result.errors?.length) {
          toastError(result.errors[0]);
        }
      } else if (result.errors?.length) {
        toastError(`Import failed: ${result.errors[0]}`);
      }
    };
    reader.readAsText(file);
    if (arabicCsvInputRef.current) arabicCsvInputRef.current.value = '';
  };

  // Music upload handler
  const handleMusicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toastError('Please upload an audio file (MP3, WAV, or OGG)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toastError('Audio file must be less than 20MB');
      return;
    }
    setUploadingMusic(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const fileName = `music/${crypto.randomUUID()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('game-assets')
        .getPublicUrl(data.path);
      setDesign(prev => ({ ...prev, backgroundMusicUrl: publicUrl }));
      toastSuccess('Music uploaded successfully');
    } catch {
      toastError('Failed to upload music');
    } finally {
      setUploadingMusic(false);
      if (musicInputRef.current) musicInputRef.current.value = '';
    }
  };

  // Background image upload handler
  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toastError('Please upload an image file (PNG, JPG, or WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('Image must be less than 10MB');
      return;
    }
    setUploadingBackground(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const fileName = `backgrounds/${crypto.randomUUID()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('game-assets')
        .getPublicUrl(data.path);
      setDesign(prev => ({ ...prev, customBackgroundUrl: publicUrl }));
      toastSuccess('Background image uploaded');
    } catch {
      toastError('Failed to upload background image');
    } finally {
      setUploadingBackground(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    }
  };

  const toggleExcludedDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      excludedDays: prev.excludedDays.includes(day)
        ? prev.excludedDays.filter(d => d !== day)
        : [...prev.excludedDays, day],
    }));
  };

  const steps: Step[] = ['basic', 'schedule', 'players', 'design', 'questions', 'review'];
  const stepLabels: Record<Step, string> = {
    basic: 'Basic Info',
    schedule: 'Schedule',
    players: 'Players',
    design: 'Design',
    questions: 'Questions',
    review: 'Review',
  };

  const stepIcons: Record<Step, React.ReactNode> = {
    basic: <Trophy className="w-4 h-4" />,
    schedule: <Calendar className="w-4 h-4" />,
    players: <Users className="w-4 h-4" />,
    design: <Palette className="w-4 h-4" />,
    questions: <HelpCircle className="w-4 h-4" />,
    review: <Check className="w-4 h-4" />,
  };

  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const createEmptyQuestion = (): TournamentQuestion => ({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: '',
    timeLimit: design.timePerQuestion,
    points: design.pointsPerCorrectAnswer,
  });

  const handleAddQuestion = () => {
    setEditingQuestion(createEmptyQuestion());
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.text.trim() || !editingQuestion.correctAnswer) return;

    const existing = questions.findIndex(q => q.id === editingQuestion.id);
    if (existing >= 0) {
      const updated = [...questions];
      updated[existing] = editingQuestion;
      setQuestions(updated);
    } else {
      setQuestions([...questions, editingQuestion]);
    }
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = async () => {
    setError('');

    if (!user) {
      setError('You must be logged in to create a tournament');
      return;
    }

    if (!formData.name.trim()) {
      setError('Tournament name is required');
      setCurrentStep('basic');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      setCurrentStep('schedule');
      return;
    }

    if (formData.startDate < todayStr) {
      setError('Start date cannot be in the past');
      setCurrentStep('schedule');
      return;
    }

    if (questions.length === 0) {
      setError('Add at least one question');
      setCurrentStep('questions');
      return;
    }

    const startDateUTC = cairoToUTC(formData.startDate, formData.startTime);
    const endDateUTC = cairoToUTC(formData.endDate, formData.endTime);

    if (new Date(endDateUTC) <= new Date(startDateUTC)) {
      setError('End date must be after start date');
      setCurrentStep('schedule');
      return;
    }

    setIsLoading(true);

    const tournament = await tournamentService.createTournament({
      adminId: user.adminId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      startDate: startDateUTC,
      endDate: endDateUTC,
      sessionDurationSeconds: formData.sessionDuration * 60,
      breakDurationSeconds: formData.breakDuration * 60,
      maxPlayersPerSession: formData.maxPlayersPerSession,
      maxPlayersPerTeam: formData.maxPlayersPerTeam,
      activeHoursStart: formData.useActiveHours ? formData.activeHoursStart : undefined,
      activeHoursEnd: formData.useActiveHours ? formData.activeHoursEnd : undefined,
      excludedDays: formData.excludedDays.length > 0 ? formData.excludedDays : undefined,
      questions,
      design,
    });

    setIsLoading(false);

    if (tournament) {
      navigate(`/admin/tournaments/${tournament.id}`);
    } else {
      setError('Failed to create tournament. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <button
            onClick={() => setCurrentStep(step)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              index === currentStepIndex
                ? 'bg-white shadow-lg'
                : index < currentStepIndex
                ? 'bg-white/50'
                : 'bg-transparent'
            }`}
            style={{
              color: index <= currentStepIndex ? eandColors.oceanBlue : eandColors.mediumGrey,
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
              style={{
                backgroundColor: index < currentStepIndex
                  ? eandColors.brightGreen
                  : index === currentStepIndex
                  ? eandColors.oceanBlue
                  : eandColors.mediumGrey,
              }}
            >
              {index < currentStepIndex ? <Check className="w-3 h-3" /> : stepIcons[step]}
            </span>
            <span className="hidden md:inline">{stepLabels[step]}</span>
          </button>
          {index < steps.length - 1 && (
            <div
              className="w-4 h-0.5 mx-1"
              style={{
                backgroundColor: index < currentStepIndex ? eandColors.brightGreen : eandColors.mediumGrey,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderBasicStep = () => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.red}15` }}>
          <Trophy className="w-5 h-5" style={{ color: eandColors.red }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>Tournament Details</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Tournament Name *</label>
          <Input
            type="text"
            placeholder="e.g., Q1 Knowledge Challenge 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Description</label>
          <textarea
            className="w-full px-4 py-3 border-2 rounded-xl bg-white transition-all focus:outline-none focus:ring-4 resize-none"
            style={{ borderColor: `${eandColors.oceanBlue}15`, color: eandColors.oceanBlue }}
            rows={3}
            placeholder="Describe your tournament..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderScheduleStep = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.brightGreen}15` }}>
            <Calendar className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>Schedule</h2>
            <p className="text-xs" style={{ color: eandColors.grey }}>All times in Cairo time (GMT+2)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Start Date *</label>
            <Input type="date" min={todayStr} value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Start Time *</label>
            <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>End Date *</label>
            <Input type="date" min={formData.startDate || todayStr} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>End Time *</label>
            <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.oceanBlue}15` }}>
            <Clock className="w-5 h-5" style={{ color: eandColors.oceanBlue }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>Session Timing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Session Duration (minutes)</label>
            <Input
              type="number" min={1} max={120}
              value={formData.sessionDuration}
              onChange={(e) => setFormData({ ...formData, sessionDuration: parseInt(e.target.value) || 8 })}
            />
            <p className="text-xs mt-1" style={{ color: eandColors.grey }}>How long each battle session lasts</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Break Duration (minutes)</label>
            <Input
              type="number" min={0} max={60}
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 2 })}
            />
            <p className="text-xs mt-1" style={{ color: eandColors.grey }}>Break between sessions</p>
          </div>
        </div>
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: `${eandColors.brightGreen}10`, border: `1px solid ${eandColors.brightGreen}30` }}>
          <p className="text-sm font-medium" style={{ color: eandColors.darkGreen }}>
            Sessions auto-cycle every {formData.sessionDuration + formData.breakDuration} min ({formData.sessionDuration} min battle + {formData.breakDuration} min break)
          </p>
        </div>
      </div>

      {/* Active Hours Window */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.mauve}15` }}>
              <Clock className="w-5 h-5" style={{ color: eandColors.mauve }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: eandColors.oceanBlue }}>Daily Active Hours</h2>
              <p className="text-xs" style={{ color: eandColors.grey }}>Restrict sessions to specific hours each day</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.useActiveHours}
              onChange={(e) => setFormData({ ...formData, useActiveHours: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-semibold" style={{ color: eandColors.oceanBlue }}>Enable</span>
          </label>
        </div>
        {formData.useActiveHours && (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 rounded-xl" style={{ backgroundColor: `${eandColors.oceanBlue}05` }}>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Start Hour (Cairo)</label>
              <Input type="time" value={formData.activeHoursStart} onChange={(e) => setFormData({ ...formData, activeHoursStart: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>End Hour (Cairo)</label>
              <Input type="time" value={formData.activeHoursEnd} onChange={(e) => setFormData({ ...formData, activeHoursEnd: e.target.value })} />
            </div>
            <p className="col-span-2 text-xs" style={{ color: eandColors.grey }}>
              Sessions will only run between {formData.activeHoursStart} and {formData.activeHoursEnd} Cairo time each day
            </p>
          </div>
        )}
      </div>

      {/* Excluded Days */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.sandRed}15` }}>
            <Calendar className="w-5 h-5" style={{ color: eandColors.sandRed }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: eandColors.oceanBlue }}>Excluded Days</h2>
            <p className="text-xs" style={{ color: eandColors.grey }}>Skip sessions on specific days of the week</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map((name, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleExcludedDay(index)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: formData.excludedDays.includes(index) ? `${eandColors.red}15` : eandColors.lightGrey,
                color: formData.excludedDays.includes(index) ? eandColors.red : eandColors.oceanBlue,
                border: formData.excludedDays.includes(index) ? `2px solid ${eandColors.red}` : '2px solid transparent',
              }}
            >
              {name}
            </button>
          ))}
        </div>
        {formData.excludedDays.length > 0 && (
          <p className="text-xs mt-3" style={{ color: eandColors.grey }}>
            No sessions will run on: {formData.excludedDays.map(d => DAY_NAMES[d]).join(', ')}
          </p>
        )}
      </div>
    </div>
  );

  const renderPlayersStep = () => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.mauve}15` }}>
          <Users className="w-5 h-5" style={{ color: eandColors.mauve }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>Player Settings</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Max Players Per Session</label>
          <Input
            type="number" min={2} max={500}
            value={formData.maxPlayersPerSession}
            onChange={(e) => setFormData({ ...formData, maxPlayersPerSession: parseInt(e.target.value) || 50 })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Max Players Per Team</label>
          <Input
            type="number" min={1} max={250}
            value={formData.maxPlayersPerTeam}
            onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: parseInt(e.target.value) || 25 })}
          />
        </div>
      </div>
    </div>
  );

  const renderDesignStep = () => (
    <div className="space-y-6">
      {/* Team 1 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4" style={{ color: eandColors.oceanBlue }}>Team 1</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Team Name</label>
            <Input
              type="text" placeholder="e.g., Eagles"
              value={design.team1.name}
              onChange={(e) => setDesign({ ...design, team1: { ...design.team1, name: e.target.value } })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color" value={design.team1.color}
                onChange={(e) => setDesign({ ...design, team1: { ...design.team1, color: e.target.value } })}
                className="w-12 h-12 rounded-xl border-2 cursor-pointer" style={{ borderColor: `${eandColors.oceanBlue}15` }}
              />
              <span className="text-sm font-mono" style={{ color: eandColors.grey }}>{design.team1.color}</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(icon => (
              <button key={icon} type="button"
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${design.team1.icon === icon ? 'ring-2 scale-110' : 'hover:scale-105'}`}
                style={{
                  backgroundColor: design.team1.icon === icon ? `${design.team1.color}20` : eandColors.lightGrey,
                  outlineColor: design.team1.icon === icon ? design.team1.color : undefined,
                }}
                onClick={() => setDesign({ ...design, team1: { ...design.team1, icon } })}
              >{icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Team 2 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4" style={{ color: eandColors.oceanBlue }}>Team 2</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Team Name</label>
            <Input
              type="text" placeholder="e.g., Lions"
              value={design.team2.name}
              onChange={(e) => setDesign({ ...design, team2: { ...design.team2, name: e.target.value } })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color" value={design.team2.color}
                onChange={(e) => setDesign({ ...design, team2: { ...design.team2, color: e.target.value } })}
                className="w-12 h-12 rounded-xl border-2 cursor-pointer" style={{ borderColor: `${eandColors.oceanBlue}15` }}
              />
              <span className="text-sm font-mono" style={{ color: eandColors.grey }}>{design.team2.color}</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(icon => (
              <button key={icon} type="button"
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${design.team2.icon === icon ? 'ring-2 scale-110' : 'hover:scale-105'}`}
                style={{
                  backgroundColor: design.team2.icon === icon ? `${design.team2.color}20` : eandColors.lightGrey,
                  outlineColor: design.team2.icon === icon ? design.team2.color : undefined,
                }}
                onClick={() => setDesign({ ...design, team2: { ...design.team2, icon } })}
              >{icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme & Game Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4" style={{ color: eandColors.oceanBlue }}>Theme & Game Settings</h3>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Background Theme</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {THEME_OPTIONS.map(theme => (
              <button key={theme.value} type="button"
                className={`p-3 rounded-xl text-sm font-semibold transition-all ${design.backgroundTheme === theme.value ? 'ring-2' : 'hover:scale-105'}`}
                style={{
                  backgroundColor: design.backgroundTheme === theme.value ? `${eandColors.oceanBlue}15` : eandColors.lightGrey,
                  color: eandColors.oceanBlue,
                  outlineColor: design.backgroundTheme === theme.value ? eandColors.oceanBlue : undefined,
                }}
                onClick={() => setDesign({ ...design, backgroundTheme: theme.value })}
              >
                <span className="text-lg mr-1">{theme.emoji}</span> {theme.label}
                <span className="block text-xs opacity-60">{theme.group}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Background Image */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
            Custom Background Image (optional — overrides theme background)
          </label>
          {design.customBackgroundUrl ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-lg overflow-hidden border-2" style={{ borderColor: `${eandColors.oceanBlue}30` }}>
                <img src={design.customBackgroundUrl} alt="Custom background" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm truncate mb-2" style={{ color: eandColors.grey }}>Custom background uploaded</p>
                <button type="button"
                  className="text-sm px-3 py-1 rounded-lg"
                  style={{ color: eandColors.red, backgroundColor: `${eandColors.red}10` }}
                  onClick={() => setDesign(prev => ({ ...prev, customBackgroundUrl: undefined }))}
                >
                  <Trash2 className="w-3 h-3 inline mr-1" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBackgroundUpload} />
              <button type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: eandColors.lightGrey, color: eandColors.oceanBlue }}
                onClick={() => backgroundInputRef.current?.click()}
                disabled={uploadingBackground}
              >
                <Upload className="w-4 h-4" />
                {uploadingBackground ? 'Uploading...' : 'Upload Background Image'}
              </button>
              <p className="text-xs mt-1" style={{ color: eandColors.grey }}>PNG, JPG, or WebP — max 10MB</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Points Per Correct Answer</label>
            <Input
              type="number" min={1} max={100} value={design.pointsPerCorrectAnswer}
              onChange={(e) => setDesign({ ...design, pointsPerCorrectAnswer: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Time Per Question (sec)</label>
            <Input
              type="number" min={5} max={120} value={design.timePerQuestion}
              onChange={(e) => setDesign({ ...design, timePerQuestion: parseInt(e.target.value) || 15 })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Hex Grid Size</label>
            <Input
              type="number" min={6} max={37} value={design.hexGridSize}
              onChange={(e) => setDesign({ ...design, hexGridSize: parseInt(e.target.value) || 18 })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Branding Text (optional)</label>
          <Input
            type="text" placeholder="e.g., Powered by e&"
            value={design.brandingText || ''}
            onChange={(e) => setDesign({ ...design, brandingText: e.target.value })}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4" style={{ color: eandColors.oceanBlue }}>Preview</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2" style={{ backgroundColor: `${design.team1.color}20`, border: `3px solid ${design.team1.color}` }}>
              {design.team1.icon}
            </div>
            <p className="font-bold text-sm" style={{ color: design.team1.color }}>{design.team1.name}</p>
          </div>
          <span className="text-2xl font-bold" style={{ color: eandColors.grey }}>VS</span>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2" style={{ backgroundColor: `${design.team2.color}20`, border: `3px solid ${design.team2.color}` }}>
              {design.team2.icon}
            </div>
            <p className="font-bold text-sm" style={{ color: design.team2.color }}>{design.team2.name}</p>
          </div>
        </div>
      </div>

      {/* Background Music */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.burgundy}15` }}>
            <Music className="w-5 h-5" style={{ color: eandColors.burgundy }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: eandColors.oceanBlue }}>Background Music</h3>
            <p className="text-xs" style={{ color: eandColors.grey }}>MP3, WAV, or OGG (max 20MB)</p>
          </div>
        </div>
        <input type="file" accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg" onChange={handleMusicUpload} ref={musicInputRef} className="hidden" />
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => musicInputRef.current?.click()} disabled={uploadingMusic}>
            <Upload className="w-4 h-4" /> {uploadingMusic ? 'Uploading...' : 'Upload Music'}
          </Button>
          {design.backgroundMusicUrl && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" style={{ color: eandColors.brightGreen }} />
              <span className="text-sm" style={{ color: eandColors.brightGreen }}>Music uploaded</span>
              <button type="button" onClick={() => setDesign(prev => ({ ...prev, backgroundMusicUrl: undefined }))} className="p-1 rounded hover:bg-red-50">
                <Trash2 className="w-4 h-4" style={{ color: eandColors.red }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuestionsStep = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eandColors.brightGreen}15` }}>
              <HelpCircle className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>Questions</h2>
              <p className="text-xs" style={{ color: eandColors.grey }}>{questions.length} question{questions.length !== 1 ? 's' : ''} added</p>
            </div>
          </div>
          <Button onClick={handleAddQuestion} size="sm" variant="success" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {/* CSV Import Section */}
        <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: `${eandColors.oceanBlue}06`, border: `1px solid ${eandColors.oceanBlue}15` }}>
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: eandColors.oceanBlue }} />
            <div className="text-sm" style={{ color: eandColors.oceanBlue }}>
              <p className="font-semibold mb-1">Import from CSV</p>
              <p>Upload English questions CSV, then optionally upload an Arabic translations CSV (matched by row order).</p>
            </div>
          </div>
          <input ref={csvInputRef} type="file" accept=".csv" onChange={handleEnglishCSVUpload} className="hidden" />
          <input ref={arabicCsvInputRef} type="file" accept=".csv" onChange={handleArabicCSVUpload} className="hidden" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => csvInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> English CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => arabicCsvInputRef.current?.click()} disabled={questions.length === 0}>
              <Upload className="w-3.5 h-3.5" /> Arabic CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV(generateSampleEnglishCSV(), 'sample-questions-en.csv')}>
              <Download className="w-3.5 h-3.5" /> Sample EN
            </Button>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV(generateSampleArabicCSV(), 'sample-questions-ar.csv')}>
              <Download className="w-3.5 h-3.5" /> Sample AR
            </Button>
          </div>
          {questions.length > 0 && questions.some(q => q.textAr) && (
            <p className="text-xs mt-2" style={{ color: eandColors.brightGreen }}>
              ✓ Arabic translations loaded for {questions.filter(q => q.textAr).length}/{questions.length} questions
            </p>
          )}
        </div>

        {questions.length === 0 && !editingQuestion && (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: eandColors.mediumGrey }} />
            <p className="font-semibold" style={{ color: eandColors.oceanBlue }}>No questions yet</p>
            <p className="text-sm mt-1" style={{ color: eandColors.grey }}>Add questions that players will answer during battles</p>
          </div>
        )}

        {/* Question List */}
        {questions.map((q, index) => (
          <div key={q.id} className="border-2 rounded-xl p-4 mb-3" style={{ borderColor: `${eandColors.oceanBlue}10` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold" style={{ color: eandColors.oceanBlue }}>
                  <span className="text-xs px-2 py-0.5 rounded-full mr-2" style={{ backgroundColor: `${eandColors.oceanBlue}10`, color: eandColors.oceanBlue }}>Q{index + 1}</span>
                  {q.text}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {q.options.map(opt => (
                    <p key={opt.id} className="text-xs flex items-center gap-1" style={{ color: opt.id === q.correctAnswer ? eandColors.brightGreen : eandColors.grey }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: opt.id === q.correctAnswer ? eandColors.brightGreen : eandColors.mediumGrey }}
                      >{opt.id}</span>
                      {opt.text}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setEditingQuestion(q)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Palette className="w-4 h-4" style={{ color: eandColors.oceanBlue }} />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" style={{ color: eandColors.red }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Question Editor */}
      {editingQuestion && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2" style={{ borderColor: eandColors.brightGreen }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: eandColors.oceanBlue }}>
            {questions.find(q => q.id === editingQuestion.id) ? 'Edit Question' : 'New Question'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>Question Text *</label>
              <textarea
                className="w-full px-4 py-3 border-2 rounded-xl bg-white focus:outline-none resize-none"
                style={{ borderColor: `${eandColors.oceanBlue}15`, color: eandColors.oceanBlue }}
                rows={2}
                placeholder="Enter your question..."
                value={editingQuestion.text}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
              />
            </div>
            {editingQuestion.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt.id })}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: editingQuestion.correctAnswer === opt.id ? eandColors.brightGreen : eandColors.mediumGrey,
                  }}
                >{opt.id}</button>
                <Input
                  type="text"
                  placeholder={`Option ${opt.id}`}
                  value={opt.text}
                  onChange={(e) => {
                    const newOptions = [...editingQuestion.options];
                    newOptions[i] = { ...opt, text: e.target.value };
                    setEditingQuestion({ ...editingQuestion, options: newOptions });
                  }}
                />
              </div>
            ))}
            <p className="text-xs" style={{ color: eandColors.grey }}>Click a letter to mark the correct answer</p>
            <div className="flex gap-3">
              <Button onClick={handleSaveQuestion} variant="success" size="sm"
                disabled={!editingQuestion.text.trim() || !editingQuestion.correctAnswer || editingQuestion.options.some(o => !o.text.trim())}
              >
                <Check className="w-4 h-4 mr-1" /> Save Question
              </Button>
              <Button onClick={() => setEditingQuestion(null)} variant="ghost" size="sm">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => {
    const sessionCount = formData.startDate && formData.endDate
      ? Math.floor(
          (new Date(cairoToUTC(formData.endDate, formData.endTime)).getTime() - new Date(cairoToUTC(formData.startDate, formData.startTime)).getTime()) /
          ((formData.sessionDuration + formData.breakDuration) * 60 * 1000)
        )
      : 0;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-6" style={{ color: eandColors.oceanBlue }}>Review Tournament</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: eandColors.grey }}>Name</p>
              <p className="font-bold" style={{ color: eandColors.oceanBlue }}>{formData.name || '—'}</p>
            </div>

            {formData.description && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
                <p className="text-xs font-semibold uppercase mb-1" style={{ color: eandColors.grey }}>Description</p>
                <p style={{ color: eandColors.oceanBlue }}>{formData.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
                <p className="text-xs font-semibold uppercase mb-1" style={{ color: eandColors.grey }}>Start (Cairo)</p>
                <p className="font-bold" style={{ color: eandColors.oceanBlue }}>{formData.startDate} {formData.startTime}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
                <p className="text-xs font-semibold uppercase mb-1" style={{ color: eandColors.grey }}>End (Cairo)</p>
                <p className="font-bold" style={{ color: eandColors.oceanBlue }}>{formData.endDate} {formData.endTime}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: eandColors.lightGrey }}>
                <p className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{formData.sessionDuration}m</p>
                <p className="text-xs" style={{ color: eandColors.grey }}>Session</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: eandColors.lightGrey }}>
                <p className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{formData.breakDuration}m</p>
                <p className="text-xs" style={{ color: eandColors.grey }}>Break</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${eandColors.brightGreen}15` }}>
                <p className="text-2xl font-bold" style={{ color: eandColors.brightGreen }}>~{sessionCount}</p>
                <p className="text-xs" style={{ color: eandColors.grey }}>Sessions</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 p-4 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
              <div className="text-center">
                <div className="text-2xl mb-1">{design.team1.icon}</div>
                <p className="font-bold text-sm" style={{ color: design.team1.color }}>{design.team1.name}</p>
              </div>
              <span className="font-bold" style={{ color: eandColors.grey }}>VS</span>
              <div className="text-center">
                <div className="text-2xl mb-1">{design.team2.icon}</div>
                <p className="font-bold text-sm" style={{ color: design.team2.color }}>{design.team2.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: `${eandColors.brightGreen}10` }}>
              <p className="text-sm font-semibold" style={{ color: eandColors.darkGreen }}>
                {questions.length} question{questions.length !== 1 ? 's' : ''} | {design.pointsPerCorrectAnswer} pts/answer | {design.timePerQuestion}s/question
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-4" style={{ backgroundColor: `${eandColors.red}10`, border: `1px solid ${eandColors.red}30` }}>
            <p className="text-sm font-medium" style={{ color: eandColors.red }}>{error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: eandColors.lightGrey }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/50 transition-colors">
            <ArrowLeft className="w-6 h-6" style={{ color: eandColors.oceanBlue }} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: eandColors.oceanBlue }}>Create Tournament</h1>
            <p style={{ color: eandColors.grey }}>Multi-day auto-cycling battle tournament</p>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {currentStep === 'basic' && renderBasicStep()}
        {currentStep === 'schedule' && renderScheduleStep()}
        {currentStep === 'players' && renderPlayersStep()}
        {currentStep === 'design' && renderDesignStep()}
        {currentStep === 'questions' && renderQuestionsStep()}
        {currentStep === 'review' && renderReviewStep()}

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          {currentStepIndex > 0 && (
            <Button type="button" variant="ghost" size="lg" className="flex items-center gap-2" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {currentStep === 'review' ? (
            <Button size="lg" className="flex items-center gap-2" onClick={handleSubmit} disabled={isLoading}>
              <Save className="w-5 h-5" />
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="flex items-center gap-2" onClick={handleNext}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
