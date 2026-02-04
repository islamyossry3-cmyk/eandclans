export interface Question {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer: string;
  timeLimit?: number;
  points?: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface SessionConfig {
  duration: number;
  maxPlayersPerTeam: number;
  hexGridSize: number;
  timePerQuestion: number;
  pointsPerCorrectAnswer: number;
  allowSkip: boolean;
}

export interface TeamDesign {
  name: string;
  color: string;
  icon: string;
}

export interface RegistrationField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
  enabled: boolean;
  validation?: string;
}

export interface SessionDesign {
  team1: TeamDesign;
  team2: TeamDesign;
  backgroundTheme: 'highland' | 'desert' | 'frost' | 'shadow';
  theme?: 'highland' | 'desert' | 'frost' | 'shadow';
  backgroundVideoUrl?: string;
  islandImageUrl?: string;
  backgroundAssets?: {
    videoUrl?: string;
    imageUrl?: string;
  };
  logoUrl?: string;
  brandingText?: string;
}

export interface Session {
  id: string;
  adminId: string;
  name: string;
  description?: string;
  type: 'team_battle' | 'individual';
  status: 'draft' | 'ready' | 'live' | 'completed';
  sessionPin: string;
  qrCodeData?: string;
  config: SessionConfig;
  design: SessionDesign;
  questions: Question[];
  registrationFields?: RegistrationField[];
  createdAt: string;
  updatedAt: string;
}

export interface IndividualGameEntry {
  id: string;
  sessionId: string;
  playerName: string;
  playerEmail?: string;
  playerOrganization?: string;
  customFields?: Record<string, string>;
  score: number;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
  totalTime: number;
  photoUrl?: string;
  completedAt: string;
  createdAt: string;
}

export interface SessionPlayer {
  id: string;
  name: string;
  team: 'team1' | 'team2' | null;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  territoriesClaimed: number;
  joinedAt: string;
  connected: boolean;
  lastActive: string;
}

export interface GameState {
  sessionId: string;
  status: 'lobby' | 'playing' | 'ended';
  startedAt?: string;
  endsAt?: string;
  hexGrid: Record<string, HexState>;
  scores: {
    team1: number;
    team2: number;
  };
  players: Record<string, SessionPlayer>;
}

export interface HexState {
  hexId: string;
  owner: null | 'team1' | 'team2';
  claimedBy?: string;
  claimedAt?: string;
}
