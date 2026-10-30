import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../styles/theme';

/**
 * Botón personalizado y reutilizable con soporte para variantes,
 * estados de deshabilitado (para control de validaciones en línea) y carga con spinner.
 */
export function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline' | 'success'
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const getVariantStyles = () => {
    if (disabled) {
      return { container: styles.disabledContainer, text: styles.disabledText };
    }
    switch (variant) {
      case 'secondary':
        return { container: styles.secondaryContainer, text: styles.secondaryText };
      case 'danger':
        return { container: styles.dangerContainer, text: styles.dangerText };
      case 'success':
        return { container: styles.successContainer, text: styles.successText };
      case 'outline':
        return { container: styles.outlineContainer, text: styles.outlineText };
      case 'primary':
      default:
        return { container: styles.primaryContainer, text: styles.primaryText };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[styles.baseButton, vStyles.container, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.baseText, vStyles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryContainer: {
    backgroundColor: colors.black,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryContainer: {
    backgroundColor: colors.borderLight,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  dangerContainer: {
    backgroundColor: colors.offline,
  },
  dangerText: {
    color: colors.white,
  },
  successContainer: {
    backgroundColor: colors.online,
  },
  successText: {
    color: colors.white,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  outlineText: {
    color: colors.black,
  },
  disabledContainer: {
    backgroundColor: colors.disabled,
  },
  disabledText: {
    color: '#8A8A8A',
  },
});

export default CustomButton;
