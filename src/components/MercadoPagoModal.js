import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { formatCOP } from '../config/pricing';
import {
  SANDBOX_TEST_CARDS,
  createPaymentPreference,
  processSandboxPayment,
  formatPaymentStatusBadge,
} from '../services/mercadoPagoService';

/**
 * Modal Interactivo de Pasarela Mercado Pago Checkout Pro (MercadoPagoModal.js)
 * Estructurado según las directrices académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Simulación y procesamiento real en modo Sandbox de Mercado Pago Colombia.
 * 2. Cero popups de Alert.alert(); estados de error o aprobación visuales inline.
 * 3. Selector de tarjetas de prueba oficiales (Visa aprobada, Mastercard aprobada, Fondos insuficientes).
 * 4. Devuelve el paymentId y paymentStatus para actualizar Firestore a status: 'paid'.
 */
export function MercadoPagoModal({
  visible = false,
  trip = null,
  onPaymentSuccess,
  onClose,
}) {
  const [selectedCard, setSelectedCard] = useState(SANDBOX_TEST_CARDS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!visible || !trip) return null;

  const totalAmount = trip.totalFare || 18500;
  const formattedAmount = formatCOP(totalAmount);
  const passengerName = trip.passenger?.name || trip.passengerName || 'Pasajero';

  const handlePay = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // 1. Crear preferencia de pago
      const preference = await createPaymentPreference({
        tripId: trip.id,
        amount: totalAmount,
        description: `Carrera UberClone: ${trip.pickup?.address || 'Origen'} -> ${trip.dropoff?.address || 'Destino'}`,
        payerEmail: trip.passenger?.email || 'pasajero.prueba@mercadopago.com',
      });

      // 2. Procesar pago en Sandbox con la tarjeta seleccionada
      const result = await processSandboxPayment({
        preferenceId: preference.preferenceId,
        card: selectedCard,
        amount: totalAmount,
      });

      setPaymentResult(result);

      if (result.success) {
        // Notificar al componente padre después de mostrar la animación de éxito
        setTimeout(() => {
          if (onPaymentSuccess) {
            onPaymentSuccess(result);
          }
        }, 1200);
      } else {
        setErrorMessage(result.statusMessage || 'Transacción rechazada por el banco emisor.');
      }
    } catch (err) {
      setErrorMessage('Error al comunicar con la pasarela de Mercado Pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = paymentResult ? formatPaymentStatusBadge(paymentResult.paymentStatus) : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* CABECERA OFICIAL MERCADO PAGO */}
          <View style={styles.header}>
            <View style={styles.mpLogoContainer}>
              <Ionicons name="card" size={24} color="#009EE3" />
              <View>
                <Text style={styles.mpTitle}>Mercado Pago</Text>
                <Text style={styles.mpSubtitle}>Checkout Pro • Modo Sandbox</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Cerrar pasarela de pago"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* RESUMEN DE COBRO */}
            <View style={styles.chargeSummaryCard}>
              <Text style={styles.chargeLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.chargeAmount}>{formattedAmount}</Text>
              <Text style={styles.chargeDetail}>
                Pasajero: <Text style={{ fontWeight: '700' }}>{passengerName}</Text>
              </Text>
            </View>

            {/* RESULTADO DEL PAGO (SI YA FUE PROCESADO) */}
            {paymentResult && (
              <View
                style={[
                  styles.resultBox,
                  { backgroundColor: statusBadge.bgColor, borderColor: statusBadge.borderColor },
                ]}
              >
                <Ionicons name={statusBadge.icon} size={28} color={statusBadge.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultTitle, { color: statusBadge.color }]}>
                    {paymentResult.success ? '¡Pago Acreditado!' : 'Pago No Procesado'}
                  </Text>
                  <Text style={styles.resultText}>{paymentResult.statusMessage}</Text>
                  <Text style={styles.resultMeta}>ID Transacción: {paymentResult.paymentId}</Text>
                </View>
              </View>
            )}

            {/* MENSAJE DE ERROR INLINE */}
            {errorMessage && !paymentResult?.success && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* SELECTOR DE TARJETAS DE PRUEBA OFICIALES */}
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#009EE3" />
              <Text style={styles.sectionTitle}>Tarjetas de Prueba Disponibles</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Selecciona una tarjeta Sandbox para simular la respuesta del banco:
            </Text>

            {SANDBOX_TEST_CARDS.map((card) => {
              const isSelected = selectedCard.id === card.id;
              const isApprovedCard = card.expectedStatus === 'approved';

              return (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.cardItem, isSelected && styles.cardItemSelected]}
                  onPress={() => {
                    setSelectedCard(card);
                    setPaymentResult(null);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Tarjeta ${card.brand} terminada en ${card.rawNumber.slice(-4)}`}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardBrandBadge}>
                      <Ionicons
                        name="card-outline"
                        size={18}
                        color={isApprovedCard ? '#15803D' : '#DC2626'}
                      />
                      <Text style={styles.cardBrandText}>{card.brand}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isApprovedCard ? styles.statusPillApproved : styles.statusPillRejected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isApprovedCard ? styles.statusPillTextApproved : styles.statusPillTextRejected,
                        ]}
                      >
                        {isApprovedCard ? 'APROBARÁ' : 'RECHAZARÁ'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardNumber}>{card.number}</Text>
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.cardMeta}>Titular: {card.holderName}</Text>
                    <Text style={styles.cardMeta}>Vence: {card.expiry}</Text>
                  </View>
                  <Text style={styles.cardDesc}>{card.statusDescription}</Text>
                </TouchableOpacity>
              );
            })}

            {/* BOTÓN PRINCIPAL DE PAGO CON MERCADO PAGO */}
            <TouchableOpacity
              style={[
                styles.payButton,
                isProcessing && styles.payButtonDisabled,
                paymentResult?.success && styles.payButtonSuccess,
              ]}
              onPress={handlePay}
              disabled={isProcessing || paymentResult?.success}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Confirmar y pagar con Mercado Pago"
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.white} />
              ) : paymentResult?.success ? (
                <>
                  <Ionicons name="checkmark-done" size={20} color={colors.white} />
                  <Text style={styles.payButtonText}>TRANSACCIÓN CONFIRMADA</Text>
                </>
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color={colors.white} />
                  <Text style={styles.payButtonText}>
                    PAGAR CON MERCADO PAGO ({formattedAmount})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.securityFooter}>
              <Ionicons name="shield-half-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.securityText}>
                Transacción encriptada bajo estándares PCI-DSS en entorno Sandbox
              </Text>
            </View>
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
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingTop: spacing.md,
    elevation: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mpLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mpTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#009EE3',
  },
  mpSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  chargeSummaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chargeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  chargeAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  chargeDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  resultText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  resultMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  cardItemSelected: {
    borderColor: '#009EE3',
    backgroundColor: '#F8FAFC',
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBrandText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPillRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextApproved: {
    color: '#15803D',
  },
  statusPillTextRejected: {
    color: '#B91C1C',
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1.2,
    marginVertical: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: '#009EE3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    gap: 8,
    marginTop: spacing.md,
    elevation: 3,
    shadowColor: '#009EE3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  payButtonDisabled: {
    opacity: 0.65,
  },
  payButtonSuccess: {
    backgroundColor: '#16A34A',
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.6,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  securityText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MercadoPagoModal;
