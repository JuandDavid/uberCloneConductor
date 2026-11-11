import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

/**
 * Pantalla de Perfil del Conductor (ProfileScreen)
 * Permite visualizar y administrar la cuenta del conductor, datos del vehículo y sesión.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Arquitectura desacoplada con useAuth().
 * 2. Cero popups de Alert.alert().
 * 3. Botón para simulación docente de estado de aprobación.
 */
export function ProfileScreen({ navigation }) {
  const { driver, logout, toggleApprovalStatus, isApproved } = useAuth();

  const driverName = driver?.fullName || 'Conductor';
  const driverEmail = driver?.email || 'conductor@uberclone.com';
  const driverPhone = driver?.phone || '3001234567';
  const plate = driver?.vehicle?.plate || 'ABC123';
  const vehicleName = `${driver?.vehicle?.makeModel || 'Vehículo registrado'} (${driver?.vehicle?.year || '2022'})`;
  const category = (driver?.vehicle?.category || 'economy').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation?.navigate?.('PendingApproval')}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#15803D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TARJETA DE PERFIL */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>
              {driverName}
            </Text>
            <Text style={styles.profileEmail}>{driverEmail}</Text>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusBadge, isApproved ? styles.badgeApproved : styles.badgePending]}>
                <Text style={[styles.statusBadgeText, isApproved ? styles.textApproved : styles.textPending]}>
                  {isApproved ? 'CONDUCTOR APROBADO' : 'EN REVISIÓN'}
                </Text>
              </View>
              <Text style={styles.ratingBadge}>⭐ 5.0</Text>
            </View>
          </View>
        </View>

        {/* TARJETA DE VEHÍCULO */}
        <Text style={styles.sectionTitle}>VEHÍCULO ASIGNADO</Text>
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeaderRow}>
            <View style={styles.vehicleIconBox}>
              <Ionicons name="car-sport" size={24} color={colors.white} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleTitle}>{vehicleName}</Text>
              <Text style={styles.vehicleCategory}>Categoría: {category}</Text>
            </View>
            <View style={styles.plateTag}>
              <Text style={styles.plateTagText}>{plate}</Text>
            </View>
          </View>
        </View>

        {/* MÓDULO DOCENTE: ALTERNAR APROBACIÓN */}
        <Text style={styles.sectionTitle}>DEMOSTRACIÓN DOCENTE</Text>
        <TouchableOpacity
          style={styles.demoToggleCard}
          onPress={toggleApprovalStatus}
          activeOpacity={0.8}
        >
          <View style={styles.demoIconBox}>
            <Ionicons name="swap-horizontal" size={20} color="#D97706" />
          </View>
          <View style={styles.demoTextWrap}>
            <Text style={styles.demoTitle}>Alternar Aprobación de Cuenta</Text>
            <Text style={styles.demoSubtitle}>
              Estado actual: {isApproved ? 'Aprobado (Conducir)' : 'En Revisión (PendingApproval)'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* BOTÓN DE CIERRE DE SESIÓN */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
  },
  profileEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeApproved: {
    backgroundColor: '#14532D',
  },
  badgePending: {
    backgroundColor: '#78350F',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textApproved: {
    color: '#4ADE80',
  },
  textPending: {
    color: '#FDE047',
  },
  ratingBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  vehicleCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  vehicleCategory: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  plateTag: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plateTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.black,
  },
  demoToggleCard: {
    backgroundColor: '#1E1B18',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#78350F',
  },
  demoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#451A03',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  demoTextWrap: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDE047',
  },
  demoSubtitle: {
    fontSize: 11,
    color: '#D4D4D8',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
});

export default ProfileScreen;
