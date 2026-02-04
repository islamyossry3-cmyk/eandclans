import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { eandColors, eandGradients } from '../../constants/eandColors';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signIn, isLoading, error } = useAuthStore();
  const { t } = useTranslation();

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
      navigate('/dashboard');
    } catch {
      setErrors({ form: 'Login failed' });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        background: eandGradients.hero
      }}
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <img
                src="https://www.eand.com.eg/portal/images/logo/etisalat_logo.svg"
                alt="e& logo"
                className="h-16 mb-2"
                style={{ maxHeight: '64px' }}
              />
            </div>
            <p style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>{t('app.subtitle')}</p>
          </div>

          <h2
            className="text-2xl font-bold mb-6 text-center pb-3 border-b-2"
            style={{ color: eandColors.oceanBlue, borderColor: eandColors.red }}
          >
            {t('auth.adminPortal')}
          </h2>

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
              <div
                className="border-2 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: `${eandColors.red}10`,
                  borderColor: eandColors.red,
                  color: eandColors.red
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>
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

          {/* Footer Branding */}
          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: eandColors.mediumGrey }}>
            <p className="text-sm" style={{ color: eandColors.oceanBlue, opacity: 0.6 }}>{t('app.tagline')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
