import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
            color={hasError ? '#E11D48' : '#6B6B6B'}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, !editable && styles.inputDisabledText]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
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
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
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
    color: '#1E1E1E',
  },
  inputDisabledText: {
    color: '#9E9E9E',
  },
  errorText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  helperText: {
    color: '#6B6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default InputWithValidation;
