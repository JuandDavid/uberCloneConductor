import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from './translations';

/**
 * Hook de internacionalización para componentes de la aplicación.
 * Consume el idioma actual ('es' | 'en') persistido en AuthContext
 * y provee la función helper `t(path, params)`.
 */
export function useTranslation() {
  const { language = 'es', changeLanguage } = useAuth();

  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath || typeof keyPath !== 'string') return '';

      const keys = keyPath.split('.');
      const langDict = translations[language] || translations.es;

      let value = langDict;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Fallback a español si la clave no existe en el idioma actual
          let fallbackVal = translations.es;
          for (const fbK of keys) {
            if (fallbackVal && typeof fallbackVal === 'object' && fbK in fallbackVal) {
              fallbackVal = fallbackVal[fbK];
            } else {
              fallbackVal = keyPath;
              break;
            }
          }
          value = fallbackVal;
          break;
        }
      }

      if (typeof value !== 'string') {
        return keyPath;
      }

      // Reemplazo dinámico de parámetros {nombreParam}
      let result = value;
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });

      return result;
    },
    [language]
  );

  return {
    t,
    language,
    changeLanguage,
    isSpanish: language === 'es',
    isEnglish: language === 'en',
  };
}

export default useTranslation;
