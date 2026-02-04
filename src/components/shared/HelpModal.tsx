import { Modal } from './Modal';
import { HelpCircle, Play, Users, Target, Trophy } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'player';
}

export function HelpModal({ isOpen, onClose, role }: HelpModalProps) {
  if (role === 'admin') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="How to Use Trivia Titans" size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Play className="w-5 h-5 text-sky-500" />
              Getting Started
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Create a new session by clicking the Create Session button</li>
              <li>Customize your teams with names, colors, and icons</li>
              <li>Add questions to your session or import existing ones</li>
              <li>Set game configuration like duration and team sizes</li>
              <li>Launch the session when ready</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Running a Game
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Share the QR code or PIN with players to join</li>
              <li>Wait for players to join and select their teams</li>
              <li>Start the game when all players are ready</li>
              <li>Monitor progress on the territory map or leaderboard</li>
              <li>End the game manually or let it finish automatically</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              After the Game
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>View detailed results and player statistics</li>
              <li>Export game data as CSV for analysis</li>
              <li>Duplicate successful sessions for future use</li>
            </ul>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Play" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            Joining the Game
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Scan the QR code or enter the game PIN</li>
            <li>Enter your name</li>
            <li>Choose your team</li>
            <li>Wait for the host to start the game</li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Playing the Game
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click Get Question to receive a question</li>
            <li>Read carefully and select your answer</li>
            <li>Submit your answer before time runs out</li>
            <li>If correct, choose a territory to claim for your team</li>
            <li>Answer more questions to claim more territories</li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Winning the Game
          </h3>
          <p className="text-gray-700">
            The team with the most territories claimed at the end of the game wins! Work together with your teammates to answer questions correctly and dominate the map.
          </p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Your stats are tracked throughout the game. Try to maintain a high accuracy rate while claiming as many territories as possible!
          </p>
        </div>
      </div>
    </Modal>
  );
}
