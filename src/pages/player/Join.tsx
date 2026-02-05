import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { HelpModal } from '../../components/shared/HelpModal';
import { Gamepad2, Users, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';
import type { Session } from '../../types/session';

export function PlayerJoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerOrganization, setPlayerOrganization] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingPin, setIsValidatingPin] = useState(false);
  const [pinValid, setPinValid] = useState<boolean | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (pin.trim().length === 6) {
      loadSessionData();
    }
  }, [pin]);

  const loadSessionData = async () => {
    setIsValidatingPin(true);
    setPinValid(null);
    const foundSession = await sessionService.getSessionByPin(pin.trim().toUpperCase());
    setSession(foundSession);
    setPinValid(!!foundSession);
    setIsValidatingPin(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('Please enter a session PIN');
      return;
    }

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }

    const registrationFields = session?.registrationFields || [];

    const emailField = registrationFields.find(f => f.id === 'email');
    if (emailField?.enabled && emailField.required && !playerEmail.trim()) {
      setError('Email is required');
      return;
    } else if (playerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    const orgField = registrationFields.find(f => f.id === 'organization');
    if (orgField?.enabled && orgField.required && !playerOrganization.trim()) {
      setError('Organization is required');
      return;
    }

    for (const field of registrationFields) {
      if (field.enabled && field.required && !['name', 'email', 'organization'].includes(field.id)) {
        if (!customFields[field.id]?.trim()) {
          setError(`${field.label} is required`);
          return;
        }
      }
    }

    setIsLoading(true);

    const foundSession = await sessionService.getSessionByPin(pin.trim().toUpperCase());

    if (!foundSession) {
      setError('Invalid session PIN. Please check and try again.');
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams({ name: playerName.trim() });
    if (playerEmail.trim()) params.append('email', playerEmail.trim());
    if (playerOrganization.trim()) params.append('organization', playerOrganization.trim());
    Object.entries(customFields).forEach(([key, value]) => {
      if (value.trim()) params.append(key, value.trim());
    });

    if (foundSession.type === 'individual') {
      navigate(`/individual/${foundSession.sessionPin}?${params.toString()}`);
    } else {
      navigate(`/play/${foundSession.sessionPin}?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2rem] shadow-2xl p-8">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ background: `linear-gradient(135deg, ${eandColors.red} 0%, ${eandColors.oceanBlue} 100%)` }}
            >
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: eandColors.oceanBlue }}>
              Join the Battle
            </h1>
            <p style={{ color: eandColors.grey }}>
              Enter your session PIN and name to start playing
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                Session PIN
              </label>
              <div className="relative">
                <Input
                  id="pin"
                  type="text"
                  placeholder="Enter 6-digit PIN"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length <= 6) {
                      setPin(value);
                      if (value.length < 6) {
                        setPinValid(null);
                        setSession(null);
                      }
                    }
                  }}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest pr-12"
                  autoComplete="off"
                />
                {pin.length === 6 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isValidatingPin ? (
                      <div className="animate-spin h-6 w-6 border-2 rounded-full" style={{ borderColor: `${eandColors.oceanBlue}30`, borderTopColor: eandColors.red }} />
                    ) : pinValid === true ? (
                      <CheckCircle className="w-6 h-6" style={{ color: eandColors.brightGreen }} />
                    ) : pinValid === false ? (
                      <AlertCircle className="w-6 h-6" style={{ color: eandColors.red }} />
                    ) : null}
                  </div>
                )}
              </div>
              {pin.length === 6 && pinValid === false && (
                <p className="text-sm mt-2" style={{ color: eandColors.red }}>Invalid PIN. Please check and try again.</p>
              )}
              {pin.length === 6 && pinValid === true && session && (
                <p className="text-sm mt-2 font-medium" style={{ color: eandColors.brightGreen }}>
                  ✓ Found: {session.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                Your Name {session?.registrationFields?.find(f => f.id === 'name')?.required !== false && <span style={{ color: eandColors.red }}>*</span>}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: eandColors.mediumGrey }} />
                <Input
                  id="playerName"
                  type="text"
                  placeholder={session?.registrationFields?.find(f => f.id === 'name')?.placeholder || "Enter your name"}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            {session?.registrationFields?.find(f => f.id === 'email')?.enabled && (
              <div>
                <label htmlFor="playerEmail" className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Email {session?.registrationFields?.find(f => f.id === 'email')?.required && <span style={{ color: eandColors.red }}>*</span>}
                </label>
                <Input
                  id="playerEmail"
                  type="email"
                  placeholder={session?.registrationFields?.find(f => f.id === 'email')?.placeholder || "your.email@example.com"}
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}

            {session?.registrationFields?.find(f => f.id === 'organization')?.enabled && (
              <div>
                <label htmlFor="playerOrganization" className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Organization {session?.registrationFields?.find(f => f.id === 'organization')?.required && <span style={{ color: eandColors.red }}>*</span>}
                </label>
                <Input
                  id="playerOrganization"
                  type="text"
                  placeholder={session?.registrationFields?.find(f => f.id === 'organization')?.placeholder || "Your company or school"}
                  value={playerOrganization}
                  onChange={(e) => setPlayerOrganization(e.target.value)}
                  autoComplete="organization"
                />
              </div>
            )}

            {session?.registrationFields?.filter(f => f.enabled && !['name', 'email', 'organization'].includes(f.id)).map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  {field.label} {field.required && <span style={{ color: eandColors.red }}>*</span>}
                </label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={customFields[field.id] || ''}
                  onChange={(e) => setCustomFields({ ...customFields, [field.id]: e.target.value })}
                />
              </div>
            ))}

            {error && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: `${eandColors.red}10`, border: `1px solid ${eandColors.red}30` }}>
                <p className="text-sm" style={{ color: eandColors.red }}>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || !pin.trim() || !playerName.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t" style={{ borderColor: eandColors.mediumGrey }}>
            <p className="text-center text-sm mb-4" style={{ color: eandColors.grey }}>
              Don't have a PIN? Ask your game host or scan the QR code displayed on screen.
            </p>
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 text-sm mx-auto transition-opacity hover:opacity-70"
              style={{ color: eandColors.oceanBlue }}
            >
              <HelpCircle className="w-4 h-4" />
              How to Play
            </button>
          </div>
        </div>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} role="player" />
    </div>
  );
}
