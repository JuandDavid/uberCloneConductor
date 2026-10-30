import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

/**
 * Componente de campo de texto reutilizable con soporte para etiquetas,
 * íconos y mensajes de error en línea (Inline Validation).
 * 
 * Regla académica obligatoria (Docente Paula Andrea Muñoz Correa):
 * "Los mensajes de error de los formularios deben aparecer debajo de cada campo en 
 * texto color rojo (#E11D48). NUNCA usar ventanas emergentes de Alert".
 */
export function InputWithValidation({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  iconName,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  autoCapitalize = 'none',
  editable = true,
}) {
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {Boolean(label) && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputWrapper,
          hasError && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {Boolean(iconName) && (
          <Ionicons
            name={iconName}
            size={20}
            color={hasError ? colors.errorText : colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, !editable && styles.inputDisabledText]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
      </View>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 4,
  },
  inputWrapperError: {
    borderColor: colors.errorText,
    backgroundColor: colors.errorBg,
  },
  inputWrapperDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabledText: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginLeft: 2,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    marginLeft: 2,
  },
});

export default InputWithValidation;
