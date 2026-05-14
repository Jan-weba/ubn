'use client';
import { useTranslation } from 'react-i18next';
import { Bell, User, Menu } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

interface Props {
  branchName?: string;
  pharmacyName?: string;
  onMenuClick?: () => void;
}

export default function BranchTopbar({ branchName = 'Branch', pharmacyName = 'E-Vuze Pharmacy', onMenuClick }: Props) {
  const { t, i18n } = useTranslation();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={18} className="text-gray-600" />
        </button>
        <div>
          <p className="text-base font-semibold" style={{ color: '#2D9B8A' }}>{pharmacyName}</p>
          <p className="text-xs text-gray-500 hidden sm:block">{t('branch.portal')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1">
          {SUPPORTED_LANGUAGES.map((lang, i) => (
            <span key={lang.code} className="flex items-center">
              <button
                onClick={() => changeLanguage(lang.code)}
                className={`text-sm font-medium px-0.5 ${i18n.language === lang.code ? 'text-gray-900 font-semibold' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {lang.label}
              </button>
              {i < SUPPORTED_LANGUAGES.length - 1 && <span className="text-gray-300 mx-1">|</span>}
            </span>
          ))}
        </div>

        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell size={18} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: '#1E4D8C' }}>
            <User size={16} />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">{branchName}</p>
            <p className="text-xs text-gray-500">{t('topbar.branchManager')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
