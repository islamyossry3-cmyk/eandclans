import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useEffect } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all text-white font-semibold"
      aria-label="Switch Language"
    >
      <Globe className="w-5 h-5" />
      <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
