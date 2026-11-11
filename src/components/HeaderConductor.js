import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

/**
 * Componente Cabecera del Conductor (HeaderConductor)
 * Despliega la información operativa, balance diario y calificación en vivo sobre el mapa.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Arquitectura desacoplada: componente modular reutilizable en vistas principales.
 * 2. Visualización financiera con modo privacidad (ocultar saldo con ícono de ojo para seguridad en el carro).
 * 3. Indicador de estado en tiempo real (ONLINE / OFFLINE) y rating del conductor.
 */
export function HeaderConductor({
  driver,
  isOnline = false,
  dailyEarnings = 0,
  formattedDailyEarnings = '$ 0',
  completedTripsCount = 0,
  onProfilePress,
}) {
  const [hideEarnings, setHideEarnings] = useState(false);

  const rating = driver?.rating ? Number(driver.rating).toFixed(1) : '5.0';
  const plate = driver?.vehicle?.plate || 'ABC123';
  const category = (driver?.vehicle?.category || 'economy').toUpperCase();
  const driverName = driver?.fullName || 'Conductor';

  return (
    <View style={styles.container}>
      {/* Fila Superior: Perfil, Nombre y Píldora de Conexión */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.profileTouchArea}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          {driver?.photoUri ? (
            <Image
              source={{ uri: driver.photoUri }}
              style={[styles.avatarImage, isOnline ? styles.avatarOnline : styles.avatarOffline]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, isOnline ? styles.avatarOnline : styles.avatarOffline]}>
              <Ionicons name="person" size={18} color={isOnline ? '#15803D' : colors.textSecondary} />
            </View>
          )}

          <View style={styles.driverInfoTextWrap}>
            <Text style={styles.driverName} numberOfLines={1}>
              {driverName}
            </Text>
            <View style={styles.vehiclePillRow}>
              <View style={styles.plateTagSmall}>
                <Text style={styles.plateTagTextSmall}>{plate}</Text>
              </View>
              <Text style={styles.categorySubtext}>• {category}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Píldora de Disponibilidad */}
        <View style={[styles.statusPill, isOnline ? styles.statusPillOnline : styles.statusPillOffline]}>
          <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
          <Text style={[styles.statusPillText, isOnline ? styles.statusPillTextOnline : styles.statusPillTextOffline]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Fila Inferior: Ganancias de Hoy y Calificación */}
      <View style={styles.bottomRow}>
        {/* Bloque Financiero con Modo Privacidad */}
        <View style={styles.earningsBlock}>
          <View style={styles.earningsLabelRow}>
            <Text style={styles.earningsLabel}>Ganancias de Hoy</Text>
            <TouchableOpacity
              onPress={() => setHideEarnings(!hideEarnings)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hideEarnings ? 'eye-off-outline' : 'eye-outline'}
                size={15}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsValue}>
            {hideEarnings ? '••••••' : formattedDailyEarnings}
          </Text>
        </View>

        {/* Bloque de Métricas Operativas */}
        <View style={styles.metricsBlock}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#EAB308" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          <View style={styles.tripsCountBadge}>
            <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.tripsCountText}>
              {completedTripsCount} {completedTripsCount === 1 ? 'viaje' : 'viajes'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 18,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarOnline: {
    borderColor: '#16A34A',
  },
  avatarOffline: {
    borderColor: '#D1D5DB',
  },
  driverInfoTextWrap: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  vehiclePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  plateTagSmall: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#CA8A04',
  },
  plateTagTextSmall: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 0.5,
  },
  categorySubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  statusPillOnline: {
    backgroundColor: '#DCFCE7',
  },
  statusPillOffline: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: '#16A34A',
  },
  statusDotOffline: {
    backgroundColor: '#6B7280',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextOnline: {
    color: '#15803D',
  },
  statusPillTextOffline: {
    color: '#4B5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: spacing.xs + 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsBlock: {
    flex: 1,
  },
  earningsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  metricsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },
  tripsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tripsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default HeaderConductor;
