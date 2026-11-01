import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, spacing } from '../../styles/theme';

/**
 * Pantalla contenedora principal del módulo de Registro de Conductor.
 * Estructura la experiencia en un flujo por pestañas:
 * - Pestaña 1: Datos Personales
 * - Pestaña 2: Vehículo
 * - Pestaña 3: Documentación
 */
export function RegisterScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0); // 0: Personal, 1: Vehículo, 2: Documentos

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Registro de Conductor</Text>
          <Text style={styles.subtitle}>
            Completa la información requerida para activar tu cuenta en la plataforma.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Contenedor base de las secciones del registro */}
          <View style={styles.placeholderCard}>
            <Text style={styles.stepIndicator}>
              Paso actual: {activeTab === 0 ? '1. Datos Personales' : activeTab === 1 ? '2. Vehículo' : '3. Documentos'}
            </Text>
            <Text style={styles.placeholderDescription}>
              Las secciones del formulario y la barra de navegación superior serán integradas en los siguientes pasos.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  placeholderDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default RegisterScreen;
