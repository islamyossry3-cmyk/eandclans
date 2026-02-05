import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, Upload, Download, AlertCircle, FolderOpen } from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../../utils/csvParser';
import { useToast } from '../../hooks/useToast';
import { listAssets, getAssetUrl, ASSET_FOLDERS } from '../../utils/storageSetup';
import type { Session, Question } from '../../types/session';
import { THEMES, ThemeType } from '../../constants/themes';
import { eandColors } from '../../constants/eandColors';

type Step = 'basic' | 'settings' | 'design' | 'questions' | 'review';

export function SessionBuilderPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createSession, updateSession, sessions } = useSessionStore();
  const { addToast, success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const team1IconInputRef = useRef<HTMLInputElement>(null);
  const team2IconInputRef = useRef<HTMLInputElement>(null);
  const postGameFileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [assetPickerOpen, setAssetPickerOpen] = useState<'team1' | 'team2' | null>(null);
  const [availableAssets, setAvailableAssets] = useState<Array<{ name: string; id: string }>>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploadingPostGameFile, setUploadingPostGameFile] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Session>>({
    name: '',
    description: '',
    type: 'team_battle',
    config: {
      duration: 1800,
      maxPlayersPerTeam: 10,
      hexGridSize: 6,
      timePerQuestion: 15,
      pointsPerCorrectAnswer: 10,
      allowSkip: false,
    },
    design: {
      team1: { name: 'Team 1', color: '#2D7A3E', icon: '🏰' },
      team2: { name: 'Team 2', color: '#D4AF37', icon: '🏯' },
      backgroundTheme: 'highland',
      theme: 'highland',
      brandingText: '',
    },
    questions: [],
    registrationFields: [
      { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
      { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
    ],
  });

  useEffect(() => {
    if (sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setFormData(session);
      }
    }
  }, [sessionId, sessions]);

  const steps: Step[] = ['basic', 'settings', 'design', 'questions', 'review'];
  const stepTitles = {
    basic: 'Basic Information',
    settings: 'Game Settings',
    design: formData.type === 'individual' ? 'Game Design' : 'Team Design',
    questions: 'Questions',
    review: 'Review & Save',
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = async (status: 'draft' | 'ready') => {
    if (!user?.adminId) return;

    const sessionData = { ...formData, status };

    if (sessionId) {
      const success = await updateSession(sessionId, sessionData);
      if (success) {
        navigate('/dashboard');
      }
    } else {
      const newSession = await createSession(user.adminId, sessionData);
      if (newSession) {
        navigate('/dashboard');
      }
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctAnswer: 'A',
    };
    setFormData({
      ...formData,
      questions: [...(formData.questions || []), newQuestion],
    });
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const questions = [...(formData.questions || [])];
    questions[index] = { ...questions[index], ...updates };
    setFormData({ ...formData, questions });
  };

  const deleteQuestion = (index: number) => {
    const questions = [...(formData.questions || [])];
    questions.splice(index, 1);
    setFormData({ ...formData, questions });
  };

  const handleMusicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      error('Please upload an audio file (MP3, WAV, or OGG)');
      return;
    }

    // Validate file size (20MB max for audio)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      error('Audio file must be less than 20MB');
      return;
    }

    setUploadingMusic(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      const fileName = `music/${crypto.randomUUID()}-${file.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('session-files')
        .getPublicUrl(data.path);

      setFormData({ ...formData, backgroundMusicUrl: publicUrl });
      success('Music uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      error('Failed to upload music');
    } finally {
      setUploadingMusic(false);
      if (musicFileInputRef.current) {
        musicFileInputRef.current.value = '';
      }
    }
  };

  const handlePostGameFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      error('Please upload a PDF file');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      error('File size must be less than 50MB');
      return;
    }

    setUploadingPostGameFile(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('session-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('session-files')
        .getPublicUrl(data.path);

      setFormData({ ...formData, postGameFileUrl: publicUrl });
      success('PDF uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      error('Failed to upload PDF');
    } finally {
      setUploadingPostGameFile(false);
      if (postGameFileInputRef.current) {
        postGameFileInputRef.current.value = '';
      }
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('CSV file selected:', file.name, 'Size:', file.size, 'bytes');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log('CSV content read, length:', content.length);
      console.log('First 200 characters:', content.substring(0, 200));

      const result = parseCSV(content);
      console.log('CSV parse result:', result);

      if (result.success && result.questions && result.questions.length > 0) {
        const previousCount = formData.questions?.length || 0;
        setFormData({
          ...formData,
          questions: [...(formData.questions || []), ...result.questions],
        });
        success(`Successfully imported ${result.questions.length} questions (Total: ${previousCount + result.questions.length})`);
        console.log('Questions added to form data');
      } else if (result.errors && result.errors.length > 0) {
        error(`Import failed: ${result.errors[0]}`);
        console.error('CSV Parse Errors:', result.errors);
      } else if (result.questions && result.questions.length > 0) {
        const previousCount = formData.questions?.length || 0;
        setFormData({
          ...formData,
          questions: [...(formData.questions || []), ...result.questions],
        });
        addToast(`Imported ${result.questions.length} questions with some warnings (Total: ${previousCount + result.questions.length})`, 'warning');
        if (result.errors) {
          console.warn('CSV Parse Warnings:', result.errors);
        }
      } else {
        error('No valid questions found in CSV file');
        console.error('CSV parsing returned no questions');
      }
    };

    reader.onerror = (err) => {
      error('Failed to read CSV file');
      console.error('FileReader error:', err);
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadSample = () => {
    downloadSampleCSV();
    success('Sample CSV downloaded');
  };

  const openAssetPicker = async (type: 'team1' | 'team2') => {
    setAssetPickerOpen(type);
    setLoadingAssets(true);

    const folder = ASSET_FOLDERS.ICONS;

    const result = await listAssets(folder);
    if (result.success && result.data) {
      setAvailableAssets(result.data);
    } else {
      error('Failed to load assets');
    }
    setLoadingAssets(false);
  };

  const selectAsset = (assetName: string) => {
    if (!assetPickerOpen) return;

    const folder = ASSET_FOLDERS.ICONS;
    const assetUrl = getAssetUrl(`${folder}/${assetName}`);

    setFormData({
      ...formData,
      design: {
        ...formData.design!,
        [assetPickerOpen]: { ...formData.design![assetPickerOpen], icon: assetUrl }
      }
    });
    success('Icon selected successfully');

    setAssetPickerOpen(null);
  };

  const handleIconUpload = (team: 'team1' | 'team2', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFormData({
        ...formData,
        design: {
          ...formData.design!,
          [team]: { ...formData.design![team], icon: dataUrl }
        }
      });
      success('Icon uploaded successfully');
    };

    reader.onerror = () => {
      error('Failed to upload icon');
    };

    reader.readAsDataURL(file);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <Input
              label="Session Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Medical Quiz Challenge"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': eandColors.red } as React.CSSProperties}
                rows={4}
                placeholder="Describe your session..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.type === 'team_battle'}
                    onChange={() => setFormData({ ...formData, type: 'team_battle' })}
                    className="w-4 h-4"
                  />
                  <span>Team Battle</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.type === 'individual'}
                    onChange={() => setFormData({ ...formData, type: 'individual' })}
                    className="w-4 h-4"
                  />
                  <span>Individual Challenge</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <Input
              label="Duration (seconds)"
              type="number"
              value={formData.config?.duration}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config!, duration: parseInt(e.target.value) }
              })}
            />
            {formData.type === 'team_battle' && (
              <Input
                label="Max Players Per Team"
                type="number"
                value={formData.config?.maxPlayersPerTeam}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, maxPlayersPerTeam: parseInt(e.target.value) }
                })}
              />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Territory Map Size
              </label>
              <select
                value={formData.config?.hexGridSize}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, hexGridSize: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': eandColors.red } as React.CSSProperties}
              >
                <option value={6}>Small - 6 Hexagons (1 Ring)</option>
                <option value={18}>Medium - 18 Hexagons (2 Rings)</option>
                <option value={36}>Large - 36 Hexagons (3 Rings)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the size of the hexagonal territory map for gameplay
              </p>
            </div>
            <Input
              label="Time Per Question (seconds)"
              type="number"
              value={formData.config?.timePerQuestion}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config!, timePerQuestion: parseInt(e.target.value) }
              })}
            />
            <Input
              label="Points Per Correct Answer"
              type="number"
              value={formData.config?.pointsPerCorrectAnswer}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config!, pointsPerCorrectAnswer: parseInt(e.target.value) }
              })}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.config?.allowSkip}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, allowSkip: e.target.checked }
                })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Allow Skip</span>
            </label>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Auto-Restart Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoRestart || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      autoRestart: e.target.checked,
                      restartDelay: e.target.checked ? (formData.restartDelay || 60) : undefined
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Automatically restart session after game ends</span>
                </label>

                {formData.autoRestart && (
                  <Input
                    label="Restart Delay (seconds)"
                    type="number"
                    min={10}
                    value={formData.restartDelay || 60}
                    onChange={(e) => setFormData({
                      ...formData,
                      restartDelay: Math.max(10, parseInt(e.target.value))
                    })}
                  />
                )}
              </div>
            </div>

            {/* Background Music Upload */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Music (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload an audio file (MP3, WAV, OGG - max 20MB) to play during the game. Leave empty to use default music.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                  onChange={handleMusicUpload}
                  ref={musicFileInputRef}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => musicFileInputRef.current?.click()}
                  className="flex items-center gap-2"
                  type="button"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingMusic ? 'Uploading...' : 'Upload Music'}
                </Button>
                {formData.backgroundMusicUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">✓ Music uploaded</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundMusicUrl: undefined })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post-Game PDF Upload */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post-Game Document (PDF)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload a PDF file (max 50MB) that will be shown after the game ends and winners are celebrated
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePostGameFileUpload}
                  ref={postGameFileInputRef}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => postGameFileInputRef.current?.click()}
                  className="flex items-center gap-2"
                  type="button"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingPostGameFile ? 'Uploading...' : 'Upload PDF'}
                </Button>
                {formData.postGameFileUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">✓ PDF uploaded</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, postGameFileUrl: undefined })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Choose Your Realm
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Select a faction to determine the battlefield and atmosphere
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(THEMES).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setFormData({
                      ...formData,
                      design: {
                        ...formData.design!,
                        theme: theme.id,
                        backgroundTheme: theme.id
                      }
                    })}
                    className={`group relative overflow-hidden rounded-[2rem] border-4 transition-all text-left ${
                      formData.design?.theme === theme.id
                        ? 'border-amber-500 shadow-2xl scale-105'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow-xl hover:scale-102'
                    }`}
                  >
                    {/* Background Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundImage: `url(${theme.backgroundImage})`,
                          filter: 'brightness(0.7)',
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to bottom, ${theme.colors.overlay}, transparent 50%, ${theme.colors.overlay})`,
                        }}
                      />

                      {/* Selected Badge */}
                      {formData.design?.theme === theme.id && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          <span>✓</span> SELECTED
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="relative p-5 bg-gradient-to-b from-gray-900/90 to-gray-800/95">
                      <h3 className="text-xl font-bold text-amber-300 mb-2 tracking-wide">
                        {theme.name}
                      </h3>
                      <p className="text-xs text-gray-400 italic mb-3">
                        {theme.faction}
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed mb-3">
                        {theme.description}
                      </p>

                      {/* Lore Text */}
                      <div className="border-t border-gray-700 pt-3 mt-3">
                        <p className="text-xs text-gray-400 italic leading-relaxed">
                          {theme.lore}
                        </p>
                      </div>

                      {/* Color Palette */}
                      <div className="flex gap-2 mt-4">
                        <div
                          className="w-8 h-8 rounded-md border-2 border-white/30 shadow-inner"
                          style={{ backgroundColor: theme.colors.primary }}
                          title="Primary Color"
                        />
                        <div
                          className="w-8 h-8 rounded-md border-2 border-white/30 shadow-inner"
                          style={{ backgroundColor: theme.colors.secondary }}
                          title="Secondary Color"
                        />
                        <div
                          className="w-8 h-8 rounded-md border-2 border-white/30 shadow-inner"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Accent Color"
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Teams Section - Only for Team Battle */}
            {formData.type === 'team_battle' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="bg-white border border-gray-200/50 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.design?.team1.color }} />
                  Team 1
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Team Name"
                    value={formData.design?.team1.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      design: {
                        ...formData.design!,
                        team1: { ...formData.design!.team1, name: e.target.value }
                      }
                    })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Color
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div
                          className="w-20 h-20 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: formData.design?.team1.color,
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                          }}
                          onClick={() => document.getElementById('team1-color-input')?.click()}
                        />
                        <input
                          id="team1-color-input"
                          type="color"
                          value={formData.design?.team1.color}
                          onChange={(e) => setFormData({
                            ...formData,
                            design: {
                              ...formData.design!,
                              team1: { ...formData.design!.team1, color: e.target.value }
                            }
                          })}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider transition-colors hover:text-gray-600">
                          {formData.design?.team1.color}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <div className="mb-3">
                      <div className="w-full aspect-[2/1] rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center overflow-hidden">
                        {formData.design?.team1.icon?.startsWith('data:') || formData.design?.team1.icon?.startsWith('http') ? (
                          <img src={formData.design.team1.icon} alt="Team 1 Icon" className="max-w-[70%] max-h-[70%] object-contain" />
                        ) : (
                          <span className="text-5xl">{formData.design?.team1.icon || '🏰'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => team1IconInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2"
                        size="sm"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openAssetPicker('team1')}
                        className="flex-1 flex items-center justify-center gap-2"
                        size="sm"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Assets
                      </Button>
                    </div>
                    <input
                      ref={team1IconInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={(e) => handleIconUpload('team1', e)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Team 2 */}
              <div className="bg-white border border-gray-200/50 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.design?.team2.color }} />
                  Team 2
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Team Name"
                    value={formData.design?.team2.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      design: {
                        ...formData.design!,
                        team2: { ...formData.design!.team2, name: e.target.value }
                      }
                    })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Color
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div
                          className="w-20 h-20 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: formData.design?.team2.color,
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                          }}
                          onClick={() => document.getElementById('team2-color-input')?.click()}
                        />
                        <input
                          id="team2-color-input"
                          type="color"
                          value={formData.design?.team2.color}
                          onChange={(e) => setFormData({
                            ...formData,
                            design: {
                              ...formData.design!,
                              team2: { ...formData.design!.team2, color: e.target.value }
                            }
                          })}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider transition-colors hover:text-gray-600">
                          {formData.design?.team2.color}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <div className="mb-3">
                      <div className="w-full aspect-[2/1] rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center overflow-hidden">
                        {formData.design?.team2.icon?.startsWith('data:') || formData.design?.team2.icon?.startsWith('http') ? (
                          <img src={formData.design.team2.icon} alt="Team 2 Icon" className="max-w-[70%] max-h-[70%] object-contain" />
                        ) : (
                          <span className="text-5xl">{formData.design?.team2.icon || '🏯'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => team2IconInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2"
                        size="sm"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openAssetPicker('team2')}
                        className="flex-1 flex items-center justify-center gap-2"
                        size="sm"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Assets
                      </Button>
                    </div>
                    <input
                      ref={team2IconInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={(e) => handleIconUpload('team2', e)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Individual Game Registration Configuration */}
            {formData.type === 'individual' && (
              <div className="rounded-3xl p-6" style={{ backgroundColor: `${eandColors.oceanBlue}10`, border: `1px solid ${eandColors.oceanBlue}30` }}>
                <h3 className="font-bold mb-2" style={{ color: eandColors.oceanBlue }}>Registration Form Fields</h3>
                <p className="text-sm mb-4" style={{ color: eandColors.oceanBlue, opacity: 0.8 }}>
                  Configure 3 registration fields. Customize labels, types, and whether they are required.
                </p>

                <div className="space-y-4 bg-white rounded-2xl p-4">
                  {(formData.registrationFields || [
                    { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
                    { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
                    { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
                  ]).map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Field {index + 1}</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const fields = [...(formData.registrationFields || [
                                { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
                                { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
                                { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
                              ])];
                              fields[index].required = e.target.checked;
                              setFormData({ ...formData, registrationFields: fields });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">Required</span>
                        </label>
                      </div>
                      <div className="space-y-3">
                        <Input
                          label="Field Label"
                          value={field.label}
                          onChange={(e) => {
                            const fields = [...(formData.registrationFields || [
                              { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
                              { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
                              { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
                            ])];
                            fields[index].label = e.target.value;
                            setFormData({ ...formData, registrationFields: fields });
                          }}
                          placeholder="e.g., Name, Email, Phone"
                        />
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const fields = [...(formData.registrationFields || [])];
                              fields[index].type = e.target.value;
                              setFormData({ ...formData, registrationFields: fields });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': eandColors.red } as React.CSSProperties}
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="number">Number</option>
                          </select>
                        </div>
                        <Input
                          label="Placeholder Text"
                          value={field.placeholder || ''}
                          onChange={(e) => {
                            const fields = [...(formData.registrationFields || [
                              { id: 'field1', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
                              { id: 'field2', label: 'Department', type: 'text', required: true, placeholder: 'Enter your department' },
                              { id: 'field3', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter your phone number' }
                            ])];
                            fields[index].placeholder = e.target.value;
                            setFormData({ ...formData, registrationFields: fields });
                          }}
                          placeholder="e.g., Enter your name"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Questions ({formData.questions?.length || 0})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Sample CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </Button>
                <Button onClick={addQuestion} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />

            <div className="space-y-3">
              <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: `${eandColors.oceanBlue}10`, border: `1px solid ${eandColors.oceanBlue}30` }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: eandColors.oceanBlue }} />
                <div className="text-sm" style={{ color: eandColors.oceanBlue }}>
                  <p className="font-semibold mb-1">CSV Format:</p>
                  <p>Your CSV should have 6 columns: question, option1, option2, option3, option4, correctAnswer (A/B/C/D)</p>
                  <p className="mt-1">Download the sample CSV to see the exact format.</p>
                </div>
              </div>

              {formData.questions && formData.questions.length > 0 && (
                <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: `${eandColors.brightGreen}15`, border: `1px solid ${eandColors.brightGreen}40` }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: eandColors.brightGreen }} />
                  <div className="text-sm" style={{ color: eandColors.darkGreen }}>
                    <p className="font-semibold">Remember to save your session!</p>
                    <p className="mt-1">Questions are added to your draft. Click "Next" to proceed to the Review step, then save your session to persist your changes.</p>
                  </div>
                </div>
              )}
            </div>

            {formData.questions?.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-600 mb-4">No questions yet. Import from CSV or add manually!</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </Button>
                  <Button onClick={addQuestion} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {formData.questions?.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      label="Question"
                      value={question.text}
                      onChange={(e) => updateQuestion(index, { text: e.target.value })}
                      placeholder="Enter your question"
                      className="mb-3"
                    />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {question.options.map((option) => (
                        <Input
                          key={option.id}
                          label={`Option ${option.id}`}
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = question.options.map((opt) =>
                              opt.id === option.id ? { ...opt, text: e.target.value } : opt
                            );
                            updateQuestion(index, { options: newOptions });
                          }}
                          placeholder={`Option ${option.id}`}
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer
                      </label>
                      <select
                        value={question.correctAnswer}
                        onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': eandColors.red } as React.CSSProperties}
                      >
                        {question.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Session Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">
                    {formData.type === 'team_battle' ? 'Team Battle' : 'Individual'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-semibold">{formData.questions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{formData.config?.duration} seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team 1:</span>
                  <span className="font-semibold">{formData.design?.team1.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team 2:</span>
                  <span className="font-semibold">{formData.design?.team2.name}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => handleSave('draft')}
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSave('ready')}
                className="flex-1"
              >
                Save & Mark Ready
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Modal
        isOpen={assetPickerOpen !== null}
        onClose={() => setAssetPickerOpen(null)}
        title={
          assetPickerOpen === 'background' ? 'Select Background Video' :
          assetPickerOpen === 'island' ? 'Select Island Image' :
          'Select Icon from Assets'
        }
      >
        <div className="p-4">
          {loadingAssets ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-600">Loading assets...</div>
            </div>
          ) : availableAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No {assetPickerOpen === 'background' ? 'videos' : assetPickerOpen === 'island' ? 'islands' : 'icons'} found in assets</p>
              <p className="text-sm text-gray-500">Upload {assetPickerOpen === 'background' ? 'videos' : assetPickerOpen === 'island' ? 'islands' : 'icons'} in the Asset Manager first</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {availableAssets.map((asset) => {
                let folder = ASSET_FOLDERS.ICONS;
                if (assetPickerOpen === 'background') folder = ASSET_FOLDERS.VIDEOS;
                if (assetPickerOpen === 'island') folder = ASSET_FOLDERS.ISLANDS;
                const assetUrl = getAssetUrl(`${folder}/${asset.name}`);
                const isVideo = assetPickerOpen === 'background' || asset.name.match(/\.(mp4|webm)$/i);

                return (
                  <button
                    key={asset.id}
                    onClick={() => selectAsset(asset.name)}
                    className="aspect-square rounded-2xl border-2 border-gray-200 transition-all overflow-hidden bg-white hover:shadow-lg group"
                    style={{ '--hover-border-color': eandColors.red } as React.CSSProperties}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = eandColors.red}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    {isVideo ? (
                      <video
                        src={assetUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={assetUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <div className="min-h-screen py-8" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 py-6" style={{ backgroundColor: eandColors.red }}>
            <h1 className="text-3xl font-bold text-white">
              {sessionId ? 'Edit Session' : 'Create New Session'}
            </h1>
          </div>

          <div className="flex border-b border-gray-200">
            {steps.map((step, index) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className="flex-1 px-4 py-4 text-sm font-semibold transition-all"
                style={
                  currentStep === step
                    ? { backgroundColor: `${eandColors.red}10`, color: eandColors.red, borderBottom: `2px solid ${eandColors.red}` }
                    : { color: eandColors.grey }
                }
              >
                <div>{index + 1}. {stepTitles[step]}</div>
              </button>
            ))}
          </div>

          <div className="p-8">
            {renderStepContent()}
          </div>

          <div className="border-t border-gray-200 px-8 py-4 flex justify-between">
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {currentStep !== 'basic' && (
                <Button variant="secondary" onClick={handleBack} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              {currentStep !== 'review' && (
                <Button variant="primary" onClick={handleNext} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}