import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sessionService } from '../../services/sessionService';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { HelpModal } from '../../components/shared/HelpModal';
import { Gamepad2, Users, HelpCircle, AlertCircle, CheckCircle, Zap, Target, Trophy } from 'lucide-react';
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

  const floatingItems = [
    { Icon: Zap, x: '8%', y: '12%', delay: 0 },
    { Icon: Target, x: '88%', y: '18%', delay: 0.8 },
    { Icon: Trophy, x: '12%', y: '82%', delay: 1.6 },
    { Icon: Gamepad2, x: '85%', y: '78%', delay: 0.4 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden game-gradient-bg">
      <div className="absolute inset-0 game-grid-bg opacity-20" />

      {floatingItems.map(({ Icon, x, y, delay }, i) => (
        <motion.div
          key={i}
          className="absolute hidden sm:block"
          style={{ left: x, top: y }}
          animate={{ y: [-10, 10, -10], rotate: [-8, 8, -8] }}
          transition={{ duration: 5, repeat: Infinity, delay, ease: 'easeInOut' }}
        >
          <Icon className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.08)' }} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative px-6 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)` }}>
            <div className="absolute inset-0 game-grid-bg opacity-10" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)' }}>
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-extrabold text-white mb-1 relative z-10">Join the Battle</h1>
            <p className="text-sm text-white/70 relative z-10">Enter your PIN and get ready to play</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label htmlFor="pin" className="block text-sm font-semibold mb-1.5" style={{ color: eandColors.oceanBlue }}>Session PIN</label>
                <div className="relative">
                  <Input
                    id="pin"
                    type="text"
                    placeholder="XXXXXX"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 6) {
                        setPin(value);
                        if (value.length < 6) { setPinValid(null); setSession(null); }
                      }
                    }}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-[0.3em] pr-12"
                    autoComplete="off"
                  />
                  {pin.length === 6 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValidatingPin ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-5 w-5 border-2 rounded-full" style={{ borderColor: `${eandColors.oceanBlue}30`, borderTopColor: eandColors.red }} />
                      ) : pinValid === true ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                          <CheckCircle className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
                        </motion.div>
                      ) : pinValid === false ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <AlertCircle className="w-5 h-5" style={{ color: eandColors.red }} />
                        </motion.div>
                      ) : null}
                    </div>
                  )}
                </div>
                {pin.length === 6 && pinValid === false && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mt-1.5" style={{ color: eandColors.red }}>
                    Invalid PIN. Please check and try again.
                  </motion.p>
                )}
                {pin.length === 6 && pinValid === true && session && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-2 px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: `${eandColors.brightGreen}08`, border: `1px solid ${eandColors.brightGreen}20` }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: eandColors.brightGreen }} />
                    <span className="text-sm font-medium" style={{ color: eandColors.brightGreen }}>{session.name}</span>
                  </motion.div>
                )}
              </div>

              <div>
                <label htmlFor="playerName" className="block text-sm font-semibold mb-1.5" style={{ color: eandColors.oceanBlue }}>
                  Your Name {session?.registrationFields?.find(f => f.id === 'name')?.required !== false && <span style={{ color: eandColors.red }}>*</span>}
                </label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder={session?.registrationFields?.find(f => f.id === 'name')?.placeholder || "What should we call you?"}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {session?.registrationFields?.find(f => f.id === 'email')?.enabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label htmlFor="playerEmail" className="block text-sm font-semibold mb-1.5" style={{ color: eandColors.oceanBlue }}>
                    Email {session?.registrationFields?.find(f => f.id === 'email')?.required && <span style={{ color: eandColors.red }}>*</span>}
                  </label>
                  <Input id="playerEmail" type="email" placeholder={session?.registrationFields?.find(f => f.id === 'email')?.placeholder || "your.email@example.com"} value={playerEmail} onChange={(e) => setPlayerEmail(e.target.value)} autoComplete="email" />
                </motion.div>
              )}

              {session?.registrationFields?.find(f => f.id === 'organization')?.enabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label htmlFor="playerOrganization" className="block text-sm font-semibold mb-1.5" style={{ color: eandColors.oceanBlue }}>
                    Organization {session?.registrationFields?.find(f => f.id === 'organization')?.required && <span style={{ color: eandColors.red }}>*</span>}
                  </label>
                  <Input id="playerOrganization" type="text" placeholder={session?.registrationFields?.find(f => f.id === 'organization')?.placeholder || "Your company or school"} value={playerOrganization} onChange={(e) => setPlayerOrganization(e.target.value)} autoComplete="organization" />
                </motion.div>
              )}

              {session?.registrationFields?.filter(f => f.enabled && !['name', 'email', 'organization'].includes(f.id)).map(field => (
                <motion.div key={field.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label htmlFor={field.id} className="block text-sm font-semibold mb-1.5" style={{ color: eandColors.oceanBlue }}>
                    {field.label} {field.required && <span style={{ color: eandColors.red }}>*</span>}
                  </label>
                  <Input id={field.id} type={field.type} placeholder={field.placeholder} value={customFields[field.id] || ''} onChange={(e) => setCustomFields({ ...customFields, [field.id]: e.target.value })} />
                </motion.div>
              ))}

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl px-4 py-3 flex items-center gap-2"
                  style={{ backgroundColor: `${eandColors.red}08`, border: `1px solid ${eandColors.red}15` }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: eandColors.red }} />
                  <p className="text-sm" style={{ color: eandColors.red }}>{error}</p>
                </motion.div>
              )}

              <Button type="submit" size="lg" className="w-full" isLoading={isLoading} disabled={!pin.trim() || !playerName.trim()}>
                <Zap className="w-5 h-5" /> Join Game
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: `${eandColors.oceanBlue}08` }}>
              <p className="text-xs mb-3" style={{ color: eandColors.grey }}>
                No PIN? Ask your host or scan the QR code on screen
              </p>
              <button onClick={() => setShowHelp(true)} className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: eandColors.oceanBlue }}>
                <HelpCircle className="w-3.5 h-3.5" /> How to Play
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} role="player" />
    </div>
  );
}
