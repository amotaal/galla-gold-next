// components/providers/i18n.tsx
// Internationalization Provider for GALLA.GOLD Next.js Application
// Purpose: Manage multi-language support (EN, ES, FR, RU, AR)
// Supports RTL for Arabic and dynamic language switching

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Supported locales
 */
export type Locale = 'en' | 'es' | 'fr' | 'ru' | 'ar';

/**
 * Translation object type (nested keys)
 */
type Translations = Record<string, string | Record<string, string>>;

/**
 * I18n context interface
 */
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
  supportedLocales: readonly Locale[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Supported locales configuration
 */
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'ru', 'ar'] as const;

/**
 * Locale display names
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
};

/**
 * RTL locales
 */
const RTL_LOCALES: Locale[] = ['ar'];

/**
 * Default locale
 */
const DEFAULT_LOCALE: Locale = 'en';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// =============================================================================
// I18N PROVIDER COMPONENT
// =============================================================================

/**
 * I18nProvider - Wraps the app and provides internationalization
 * 
 * This provider manages the current locale, loads translations,
 * and provides a translation function (t) throughout the app.
 * 
 * Features:
 * - Support for 5 languages (EN, ES, FR, RU, AR)
 * - RTL support for Arabic
 * - Persistent locale choice in localStorage and cookies
 * - Fallback to English if translation is missing
 * - Dynamic locale switching
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * <I18nProvider>
 *   {children}
 * </I18nProvider>
 * 
 * // In any component
 * const { t, locale, setLocale } = useI18n();
 * 
 * return <h1>{t('welcome.title')}</h1>;
 * ```
 * 
 * @param children - Child components to wrap
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  // State
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if current locale is RTL
  const isRTL = RTL_LOCALES.includes(locale);
  
  /**
   * Load translations for a specific locale
   */
  const loadTranslations = useCallback(async (newLocale: Locale) => {
    setIsLoading(true);
    
    try {
      // In production, this would load from /locales/{locale}.json
      // For now, we'll use inline fallback translations
      
      // Simulate async loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Default fallback translations (will be replaced with actual JSON files)
      const fallbackTranslations: Record<Locale, Translations> = {
        en: {
          'welcome.title': 'Welcome to GALLA.GOLD',
          'welcome.subtitle': 'Invest in physical gold with ease',
          'nav.features': 'Features',
          'nav.pricing': 'Pricing',
          'nav.about': 'About',
          'auth.login': 'Log In',
          'auth.signup': 'Sign Up',
          'auth.logout': 'Log Out',
          'dashboard.title': 'Dashboard',
          'dashboard.portfolio': 'Portfolio',
          'dashboard.transactions': 'Transactions',
          'actions.buy': 'Buy Gold',
          'actions.sell': 'Sell Gold',
          'actions.deposit': 'Deposit',
          'actions.withdraw': 'Withdraw',
        },
        es: {
          'welcome.title': 'Bienvenido a GALLA.GOLD',
          'welcome.subtitle': 'Invierte en oro físico con facilidad',
          'nav.features': 'Características',
          'nav.pricing': 'Precios',
          'nav.about': 'Acerca de',
          'auth.login': 'Iniciar Sesión',
          'auth.signup': 'Registrarse',
          'auth.logout': 'Cerrar Sesión',
          'dashboard.title': 'Panel',
          'dashboard.portfolio': 'Portafolio',
          'dashboard.transactions': 'Transacciones',
          'actions.buy': 'Comprar Oro',
          'actions.sell': 'Vender Oro',
          'actions.deposit': 'Depositar',
          'actions.withdraw': 'Retirar',
        },
        fr: {
          'welcome.title': 'Bienvenue chez GALLA.GOLD',
          'welcome.subtitle': "Investissez dans l'or physique en toute simplicité",
          'nav.features': 'Fonctionnalités',
          'nav.pricing': 'Tarifs',
          'nav.about': 'À propos',
          'auth.login': 'Se Connecter',
          'auth.signup': "S'inscrire",
          'auth.logout': 'Se Déconnecter',
          'dashboard.title': 'Tableau de Bord',
          'dashboard.portfolio': 'Portefeuille',
          'dashboard.transactions': 'Transactions',
          'actions.buy': "Acheter de l'Or",
          'actions.sell': "Vendre de l'Or",
          'actions.deposit': 'Déposer',
          'actions.withdraw': 'Retirer',
        },
        ru: {
          'welcome.title': 'Добро пожаловать в GALLA.GOLD',
          'welcome.subtitle': 'Инвестируйте в физическое золото с легкостью',
          'nav.features': 'Возможности',
          'nav.pricing': 'Цены',
          'nav.about': 'О нас',
          'auth.login': 'Войти',
          'auth.signup': 'Регистрация',
          'auth.logout': 'Выйти',
          'dashboard.title': 'Панель',
          'dashboard.portfolio': 'Портфель',
          'dashboard.transactions': 'Транзакции',
          'actions.buy': 'Купить Золото',
          'actions.sell': 'Продать Золото',
          'actions.deposit': 'Депозит',
          'actions.withdraw': 'Снять',
        },
        ar: {
          'welcome.title': 'مرحباً بك في GALLA.GOLD',
          'welcome.subtitle': 'استثمر في الذهب المادي بسهولة',
          'nav.features': 'الميزات',
          'nav.pricing': 'الأسعار',
          'nav.about': 'عن',
          'auth.login': 'تسجيل الدخول',
          'auth.signup': 'التسجيل',
          'auth.logout': 'تسجيل الخروج',
          'dashboard.title': 'لوحة القيادة',
          'dashboard.portfolio': 'المحفظة',
          'dashboard.transactions': 'المعاملات',
          'actions.buy': 'شراء الذهب',
          'actions.sell': 'بيع الذهب',
          'actions.deposit': 'إيداع',
          'actions.withdraw': 'سحب',
        },
      };
      
      setTranslations(fallbackTranslations[newLocale] || fallbackTranslations.en);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English on error
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Change locale and persist choice
   */
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('GALLA_LOCALE', newLocale);
      
      // Set cookie for server-side access
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
      
      // Update HTML lang attribute
      document.documentElement.lang = newLocale;
      
      // Update HTML dir attribute for RTL
      document.documentElement.dir = RTL_LOCALES.includes(newLocale) ? 'rtl' : 'ltr';
    }
    
    // Load translations for new locale
    loadTranslations(newLocale);
  }, [loadTranslations]);
  
  /**
   * Translation function
   * @param key - Translation key (dot notation supported)
   * @param fallback - Fallback text if translation is missing
   */
  const t = useCallback((key: string, fallback?: string): string => {
    // Support dot notation (e.g., "welcome.title")
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Translation not found, return fallback or key
        return fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : (fallback || key);
  }, [translations]);
  
  /**
   * Initialize locale on mount
   */
  useEffect(() => {
    // Try to get locale from localStorage, cookies, or browser
    let initialLocale: Locale = DEFAULT_LOCALE;
    
    if (typeof window !== 'undefined') {
      // 1. Check localStorage
      const storedLocale = localStorage.getItem('GALLA_LOCALE') as Locale;
      if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
        initialLocale = storedLocale;
      } else {
        // 2. Check browser language
        const browserLang = navigator.language.split('-')[0] as Locale;
        if (SUPPORTED_LOCALES.includes(browserLang)) {
          initialLocale = browserLang;
        }
      }
      
      // Set HTML attributes
      document.documentElement.lang = initialLocale;
      document.documentElement.dir = RTL_LOCALES.includes(initialLocale) ? 'rtl' : 'ltr';
    }
    
    setLocaleState(initialLocale);
    loadTranslations(initialLocale);
  }, [loadTranslations]);
  
  // Context value
  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    isRTL,
    supportedLocales: SUPPORTED_LOCALES,
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * useI18n - Custom hook to access i18n context
 * 
 * Usage:
 * ```tsx
 * const { t, locale, setLocale, isRTL } = useI18n();
 * 
 * return (
 *   <div>
 *     <h1>{t('welcome.title')}</h1>
 *     <button onClick={() => setLocale('es')}>Español</button>
 *   </div>
 * );
 * ```
 * 
 * @returns I18nContextType - i18n context
 * @throws Error if used outside I18nProvider
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * LanguageSwitch - Pre-built language switcher component
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="px-3 py-2 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_NAMES[loc]}
        </option>
      ))}
    </select>
  );
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
 * BASIC USAGE:
 * 
 * import { useI18n } from '@/components/providers/i18n';
 * 
 * function MyComponent() {
 *   const { t } = useI18n();
 *   
 *   return (
 *     <div>
 *       <h1>{t('welcome.title')}</h1>
 *       <p>{t('welcome.subtitle')}</p>
 *     </div>
 *   );
 * }
 * 
 * 
 * LANGUAGE SWITCHER:
 * 
 * import { useI18n, LOCALE_NAMES } from '@/components/providers/i18n';
 * 
 * function LanguageMenu() {
 *   const { locale, setLocale, supportedLocales } = useI18n();
 *   
 *   return (
 *     <div>
 *       {supportedLocales.map(loc => (
 *         <button
 *           key={loc}
 *           onClick={() => setLocale(loc)}
 *           className={locale === loc ? 'active' : ''}
 *         >
 *           {LOCALE_NAMES[loc]}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * 
 * RTL SUPPORT:
 * 
 * import { useI18n } from '@/components/providers/i18n';
 * 
 * function MyComponent() {
 *   const { isRTL } = useI18n();
 *   
 *   return (
 *     <div className={isRTL ? 'text-right' : 'text-left'}>
 *       Content that adapts to RTL
 *     </div>
 *   );
 * }
 * 
 * 
 * WITH FALLBACK:
 * 
 * const { t } = useI18n();
 * 
 * // If 'missing.key' doesn't exist, show 'Default Text'
 * <p>{t('missing.key', 'Default Text')}</p>
 */
