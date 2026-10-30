/**
 * Tema visual de la aplicación UberClone Conductor
 * Inspirado en el diseño minimalista y de alto contraste de Uber Driver.
 * 
 * Regla académica (Docente Paula Andrea Muñoz Correa):
 * Color de validación de error en línea: #E11D48.
 */

export const colors = {
  black: '#000000',
  dark: '#121212',
  cardDark: '#1E1E1E',
  white: '#FFFFFF',
  background: '#F6F6F6',
  surface: '#FFFFFF',
  textPrimary: '#1E1E1E',
  textSecondary: '#6B6B6B',
  textMuted: '#9E9E9E',
  border: '#E2E2E2',
  borderLight: '#F0F0F0',
  primary: '#000000',
  primaryLight: '#2C2C2C',

  // Estados del conductor
  online: '#05A357',
  onlineLight: '#E8F5E9',
  offline: '#E11900',
  offlineLight: '#FFEBEE',
  warning: '#F5A623',
  warningLight: '#FFF8E1',
  info: '#276EF1',
  infoLight: '#EBF2FF',

  // Controles y botones
  disabled: '#CCCCCC',
  errorText: '#E11D48', // Color obligatorio de error en línea
  errorBg: '#FFF1F2',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    color: colors.textMuted,
  },
};

export default { colors, spacing, typography };
