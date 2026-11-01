import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';

/**
 * Pantalla de Registro de Conductor con barra de navegación por pestañas superiores.
 * Permite alternar entre:
 * 1. Personal: Datos personales y foto de perfil.
 * 2. Vehículo: Datos del carro, placa colombiana y categoría.
 * 3. Documentos: Licencia, SOAT y condiciones.
 */
export function RegisterScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0); // 0: Personal, 1: Vehículo, 2: Documentos

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Registro de Conductor</Text>
          <Text style={styles.headerSubtitle}>
            Completa las 3 secciones requeridas para tu solicitud
          </Text>
        </View>

        {/* Barra de navegación por pestañas (Tab Bar) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 0 && styles.tabItemActive]}
            onPress={() => setActiveTab(0)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person"
              size={18}
              color={activeTab === 0 ? colors.black : colors.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === 0 && styles.tabLabelActive]}>
              1. Personal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 1 && styles.tabItemActive]}
            onPress={() => setActiveTab(1)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="car-sport"
              size={18}
              color={activeTab === 1 ? colors.black : colors.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === 1 && styles.tabLabelActive]}>
              2. Vehículo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 2 && styles.tabItemActive]}
            onPress={() => setActiveTab(2)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text"
              size={18}
              color={activeTab === 2 ? colors.black : colors.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === 2 && styles.tabLabelActive]}>
              3. Documentos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido según la pestaña activa */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 0 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="person-circle-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>1. Datos Personales</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Ingresa tus datos básicos de identificación, contacto y fotografía de perfil.
              </Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="create-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.placeholderCardText}>
                  Formulario de Datos Personales (Commit 14)
                </Text>
              </View>
            </View>
          )}

          {activeTab === 1 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="car-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>2. Información del Vehículo</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Registra la placa colombiana, modelo, año, categoría y capacidad del vehículo.
              </Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="speedometer-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.placeholderCardText}>
                  Formulario de Vehículo (Commit 16)
                </Text>
              </View>
            </View>
          )}

          {activeTab === 2 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>3. Documentación</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Carga de licencia de conducción, SOAT y revisión técnico-mecánica.
              </Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="document-attach-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.placeholderCardText}>
                  Módulo de Documentación y Términos
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  tabItemActive: {
    borderColor: colors.black,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.black,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  tabContentContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  placeholderCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  placeholderCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default RegisterScreen;
