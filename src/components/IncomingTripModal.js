import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { formatCOP } from '../config/pricing';

const { width } = Dimensions.get('window');
const DEFAULT_TIMEOUT = 15; // 15 segundos para aceptar o rechazar

/**
 * Modal de Solicitud de Viaje Entrante (IncomingTripModal)
 * Despliega la tarjeta interactiva de solicitud de viaje con cuenta regresiva.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Cero popups de Alert.alert(); las acciones de aceptar y rechazar son fluidas y visuales.
 * 2. Visualización clara de la ruta: origen, destino, distancia y tiempo estimado.
 * 3. Transparencia financiera: muestra el valor estimado de ganancia para el conductor y la forma de pago.
 * 4. Temporizador de expiración automática para simular el comportamiento real de Uber Driver.
 */
export function IncomingTripModal({
  visible = false,
  trip = null,
  onAccept,
  onDecline,
  timeoutSeconds = DEFAULT_TIMEOUT,
}) {
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Manejo del temporizador regresivo
  useEffect(() => {
    if (!visible || !trip) {
      setSecondsLeft(timeoutSeconds);
      progressAnim.setValue(1);
      return;
    }

    setSecondsLeft(timeoutSeconds);
    progressAnim.setValue(1);

    // Animación fluida de la barra de progreso
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: timeoutSeconds * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onDecline) onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      progressAnim.stopAnimation();
    };
  }, [visible, trip, timeoutSeconds, onDecline, progressAnim]);

  if (!visible || !trip) return null;

  const passengerName = trip.passenger?.name || 'Pasajero';
  const passengerRating = trip.passenger?.rating ? Number(trip.passenger.rating).toFixed(1) : '5.0';
  const paymentMethod = trip.paymentMethod || 'Efectivo';
  const categoryName = (trip.category || 'economy').toUpperCase();

  const driverEarnings = trip.formattedEarnings || (trip.driverEarnings ? formatCOP(trip.driverEarnings) : '$ 0');
  const totalFare = trip.formattedTotal || (trip.totalFare ? formatCOP(trip.totalFare) : '$ 0');

  const pickupAddress = trip.pickup?.address || 'Dirección de recogida';
  const dropoffAddress = trip.dropoff?.address || 'Dirección de destino';
  const distanceKm = trip.distanceKm ? `${trip.distanceKm} km` : '6.8 km';
  const durationMin = trip.durationMinutes ? `${trip.durationMinutes} min` : '18 min';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* BARRA DE TEMPORIZADOR REGRESIVO */}
          <View style={styles.timerTrack}>
            <Animated.View style={[styles.timerProgress, { width: progressWidth }]} />
          </View>

          {/* CABECERA: TÍTULO, CATEGORÍA Y TIEMPO RESTANTE */}
          <View style={styles.headerRow}>
            <View style={styles.categoryPill}>
              <Ionicons name="car-sport" size={14} color={colors.white} />
              <Text style={styles.categoryPillText}>{categoryName}</Text>
            </View>

            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={15} color="#DC2626" />
              <Text style={styles.timerText}>{secondsLeft}s</Text>
            </View>
          </View>

          {/* TARJETA FINANCIERA DESTACADA */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsTextWrap}>
              <Text style={styles.earningsLabel}>Tu ganancia estimada</Text>
              <Text style={styles.earningsValue}>{driverEarnings}</Text>
            </View>
            <View style={styles.fareMetaWrap}>
              <View style={styles.paymentMethodPill}>
                <Ionicons
                  name={paymentMethod.toLowerCase().includes('tarjeta') ? 'card-outline' : 'cash-outline'}
                  size={13}
                  color="#15803D"
                />
                <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
              </View>
              <Text style={styles.totalFareSubtext}>Total cliente: {totalFare}</Text>
            </View>
          </View>

          {/* DETALLES DEL PASAJERO */}
          <View style={styles.passengerRow}>
            <View style={styles.passengerAvatar}>
              <Ionicons name="person" size={20} color="#1E293B" />
            </View>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName} numberOfLines={1}>
                {passengerName}
              </Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color="#EAB308" />
                <Text style={styles.ratingText}>{passengerRating}</Text>
                <Text style={styles.verifiedDot}>•</Text>
                <Text style={styles.passengerMetaSub}>Usuario verificado</Text>
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeKm}>{distanceKm}</Text>
              <Text style={styles.distanceBadgeMin}>{durationMin}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* RUTA: RECOGIDA Y DESTINO */}
          <View style={styles.routeContainer}>
            {/* Punto de recogida */}
            <View style={styles.routeStep}>
              <View style={styles.routeIconColumn}>
                <View style={styles.pickupDot} />
                <View style={styles.routeDashedLine} />
              </View>
              <View style={styles.routeTextColumn}>
                <Text style={styles.routeStepLabel}>PUNTO DE RECOGIDA</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {pickupAddress}
                </Text>
              </View>
            </View>

            {/* Punto de destino */}
            <View style={styles.routeStep}>
              <View style={styles.routeIconColumn}>
                <View style={styles.dropoffSquare} />
              </View>
              <View style={styles.routeTextColumn}>
                <Text style={styles.routeStepLabel}>DESTINO FINAL</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {dropoffAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* BOTONES DE ACCIÓN: ACEPTAR O RECHAZAR */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.acceptButtonText}>ACEPTAR VIAJE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.declineButtonText}>Rechazar solicitud</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + 10 : spacing.lg,
    elevation: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  timerTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#05A357',
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  earningsCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  earningsTextWrap: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14532D',
    marginTop: 2,
  },
  fareMetaWrap: {
    alignItems: 'flex-end',
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 4,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  totalFareSubtext: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  verifiedDot: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  passengerMetaSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  distanceBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceBadgeKm: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  distanceBadgeMin: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.sm,
  },
  routeContainer: {
    marginBottom: spacing.md,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 40,
  },
  routeIconColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: 3,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#05A357',
  },
  routeDashedLine: {
    width: 2,
    height: 28,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  dropoffSquare: {
    width: 10,
    height: 10,
    backgroundColor: colors.black,
    borderRadius: 2,
  },
  routeTextColumn: {
    flex: 1,
    paddingLeft: spacing.xs,
  },
  routeStepLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 1,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  acceptButton: {
    backgroundColor: '#05A357',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: '#05A357',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.8,
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
});
