import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { eandColors } from '../../constants/eandColors';
import { Gamepad2, Shield, Zap, Target } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signIn, isLoading, error, user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = t('auth.email') + ' ' + t('common.required').toLowerCase();
    if (!password) newErrors.password = t('auth.password') + ' ' + t('common.required').toLowerCase();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error is already set in authStore
    }
  };

  const floatingIcons = [
    { Icon: Gamepad2, x: '10%', y: '15%', delay: 0, size: 28 },
    { Icon: Target, x: '85%', y: '20%', delay: 0.5, size: 24 },
    { Icon: Zap, x: '15%', y: '75%', delay: 1, size: 22 },
    { Icon: Shield, x: '80%', y: '80%', delay: 1.5, size: 26 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden game-gradient-bg">
      <div className="absolute inset-0 game-grid-bg opacity-30" />

      {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{ left: x, top: y }}
          animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
        >
          <Icon style={{ width: size, height: size, color: `${eandColors.red}30` }} />
        </motion.div>
      ))}

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div
            className="px-8 pt-8 pb-6 text-center relative"
            style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)` }}
          >
            <div className="absolute inset-0 game-grid-bg opacity-10" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative z-10"
            >
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`, boxShadow: '0 8px 24px rgba(224, 8, 0, 0.3)' }}
              >
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-xl font-bold text-white mb-1 relative z-10">
              {t('auth.adminPortal')}
            </h1>
            <p className="text-sm text-white/60 relative z-10">{t('app.subtitle')}</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="admin@eand.com.eg"
                autoComplete="email"
              />

              <Input
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: `${eandColors.red}08`, border: `1px solid ${eandColors.red}20`, color: eandColors.red }}
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
                {t('auth.login')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: eandColors.grey }}>
                {t('auth.dontHaveAccount')}{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="font-bold transition-colors hover:opacity-80"
                  style={{ color: eandColors.brightGreen }}
                >
                  {t('auth.signup')}
                </button>
              </p>
            </div>

            <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: `${eandColors.oceanBlue}08` }}>
              <img
                src="https://www.eand.com.eg/portal/images/logo/etisalat_logo.svg"
                alt="e& logo"
                className="h-8 mx-auto opacity-40"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
