import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { formatCOP } from '../config/pricing';

const QUICK_TAGS = ['Muy puntual', 'Amable y educado', 'Ruta clara', 'Excelente usuario'];

/**
 * Modal de Liquidación de Tarifa y Recibo de Viaje (TripReceiptModal)
 * Despliega el resumen financiero de cobro, desglose de comisión y calificación del usuario.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Desglose transparente: Tarifa base, distancia, tiempo, comisión Uber y ganancia neta.
 * 2. Cero alertas nativas (Alert.alert()); la experiencia de cobro es fluida en pantalla.
 * 3. Selector interactivo de calificación para el pasajero (1 a 5 estrellas).
 * 4. Actualización en tiempo real del saldo del conductor.
 */
export function TripReceiptModal({
  visible = false,
  trip = null,
  onConfirmPayment,
}) {
  const [passengerRating, setPassengerRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Muy puntual']);

  if (!visible || !trip) return null;

  const totalFare = trip.formattedTotal || formatCOP(trip.totalFare || 18500);
  const driverEarnings = trip.formattedEarnings || formatCOP(trip.driverEarnings || 14800);
  const platformFee = trip.platformFee ? formatCOP(trip.platformFee) : formatCOP(2700);
  const paymentMethod = trip.paymentMethod || 'Efectivo';
  const isCash = paymentMethod.toLowerCase().includes('efectivo');

  const passengerName = trip.passenger?.name || 'Pasajero';
  const distanceKm = trip.distanceKm ? `${trip.distanceKm} km` : '6.8 km';
  const durationMin = trip.durationMinutes ? `${trip.durationMinutes} min` : '18 min';

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ENCABEZADO DE CELEBRACIÓN */}
            <View style={styles.headerBox}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
              </View>
              <Text style={styles.title}>¡Viaje Finalizado!</Text>
              <Text style={styles.subtitle}>
                Has completado la ruta con {passengerName}.
              </Text>
            </View>

            {/* TARJETA DE COBRO AL CLIENTE */}
            <View style={[styles.paymentCard, isCash ? styles.paymentCardCash : styles.paymentCardDigital]}>
              <View style={styles.paymentMethodHeader}>
                <Ionicons
                  name={isCash ? 'cash-outline' : 'card-outline'}
                  size={18}
                  color={isCash ? '#15803D' : '#1D4ED8'}
                />
                <Text style={[styles.paymentMethodLabel, isCash ? styles.labelCash : styles.labelDigital]}>
                  {isCash ? 'COBRO EN EFECTIVO' : 'PAGO DIGITAL EN LÍNEA'}
                </Text>
              </View>

              <Text style={styles.totalFareAmount}>{totalFare}</Text>
              <Text style={styles.paymentInstruction}>
                {isCash
                  ? 'Recibe este monto directamente en efectivo del pasajero.'
                  : 'El valor ya fue debitado automáticamente de la tarjeta del usuario.'}
              </Text>
            </View>

            {/* CAJA DE GANANCIA NETA DEL CONDUCTOR */}
            <View style={styles.earningsSummaryBox}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Tu Ganancia Acreditada</Text>
                <Text style={styles.earningsHighlight}>+{driverEarnings}</Text>
              </View>
              <Text style={styles.earningsSubtext}>
                Este saldo se sumará inmediatamente a tu balance disponible.
              </Text>
            </View>

            {/* DESGLOSE DETALLADO DE LIQUIDACIÓN */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>DESGLOSE DE TARIFA</Text>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Distancia recorrida ({distanceKm})</Text>
                <Text style={styles.breakdownItemValue}>Incluido</Text>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Tiempo de viaje ({durationMin})</Text>
                <Text style={styles.breakdownItemValue}>Incluido</Text>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Total facturado al pasajero</Text>
                <Text style={styles.breakdownItemValueBold}>{totalFare}</Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownFeeLabel}>Comisión de la plataforma (15%)</Text>
                <Text style={styles.breakdownFeeValue}>-{platformFee}</Text>
              </View>
            </View>

            {/* CALIFICACIÓN DEL PASAJERO */}
            <View style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>¿Cómo estuvo tu experiencia con {passengerName}?</Text>
              
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setPassengerRating(star)}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= passengerRating ? 'star' : 'star-outline'}
                      size={32}
                      color="#EAB308"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Etiquetas Rápidas */}
              <View style={styles.tagsContainer}>
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* BOTÓN DE ACCIÓN FINAL */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirmPayment}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done" size={22} color={colors.white} />
              <Text style={styles.confirmButtonText}>
                {isCash ? 'CONFIRMAR PAGO RECIBIDO' : 'CONTINUAR'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: spacing.md,
    elevation: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkCircle: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  paymentCard: {
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  paymentCardCash: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  paymentCardDigital: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  labelCash: {
    color: '#15803D',
  },
  labelDigital: {
    color: '#1D4ED8',
  },
  totalFareAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  paymentInstruction: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  earningsSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  earningsHighlight: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803D',
  },
  earningsSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  breakdownItemLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdownItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breakdownItemValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.xs + 2,
  },
  breakdownFeeLabel: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  breakdownFeeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  ratingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  tagPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tagPillSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  tagTextSelected: {
    color: colors.white,
  },
  confirmButton: {
    backgroundColor: '#05A357',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#05A357',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.8,
  },
});

export default TripReceiptModal;
