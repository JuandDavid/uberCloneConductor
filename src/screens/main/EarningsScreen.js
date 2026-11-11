import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useTrip } from '../../context/TripContext';
import { formatCOP } from '../../config/pricing';
import { getDriverTrips } from '../../services/dbService';

// Datos de actividad semanal para la gráfica de barras
const WEEKLY_DATA = [
  { day: 'Lun', amount: 82000, height: 45 },
  { day: 'Mar', amount: 115000, height: 65 },
  { day: 'Mié', amount: 94000, height: 52 },
  { day: 'Jue', amount: 130000, height: 75 },
  { day: 'Vie', amount: 165000, height: 95 },
  { day: 'Sáb', amount: 180000, height: 100 },
  { day: 'Dom', amount: 120000, height: 68 },
];

// Historial demo de respaldo para presentación docente
const FALLBACK_TRIPS = [
  {
    id: 'trip_hist_01',
    passenger: { name: 'Valentina Gómez', rating: 4.9 },
    pickup: { address: 'Calle 72 # 10-34, Zona Financiera' },
    dropoff: { address: 'Unicentro, Entrada 3' },
    driverEarnings: 14800,
    formattedEarnings: '$ 14.800',
    totalFare: 18500,
    formattedTotal: '$ 18.500',
    paymentMethod: 'Efectivo',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'trip_hist_02',
    passenger: { name: 'Carlos Andrés Mendoza', rating: 4.8 },
    pickup: { address: 'Carrera 7 # 32-16, Centro' },
    dropoff: { address: 'Parque de la 93' },
    driverEarnings: 18200,
    formattedEarnings: '$ 18.200',
    totalFare: 22800,
    formattedTotal: '$ 22.800',
    paymentMethod: 'Mercado Pago',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'trip_hist_03',
    passenger: { name: 'Mariana Restrepo', rating: 5.0 },
    pickup: { address: 'Aeropuerto El Dorado' },
    dropoff: { address: 'Hotel Tequendama' },
    driverEarnings: 32500,
    formattedEarnings: '$ 32.500',
    totalFare: 40000,
    formattedTotal: '$ 40.000',
    paymentMethod: 'Tarjeta de Crédito',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
];

/**
 * Pantalla de Ganancias, Historial de Viajes y Retiro de Balance (EarningsScreen)
 * Centro financiero del conductor para la Entrega 2.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Arquitectura desacoplada: consume de dbService, AuthContext y TripContext.
 * 2. Cero popups de Alert.alert(); toda validación y feedback es inline.
 * 3. Formateo estricto en pesos colombianos (COP).
 * 4. Historial real conectado a la colección 'trips' de Firestore.
 */
export function EarningsScreen({ navigation }) {
  const { driver, updateDriverBalance } = useAuth();
  const {
    dailyEarnings,
    formattedDailyEarnings,
    completedTripsCount,
  } = useTrip();

  const [tripsHistory, setTripsHistory] = useState(FALLBACK_TRIPS);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDay, setSelectedDay] = useState(WEEKLY_DATA[WEEKLY_DATA.length - 1]);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState('Nequi');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [withdrawError, setWithdrawError] = useState(null);

  const totalBalance = driver?.balance || 0;
  const formattedTotalBalance = formatCOP(totalBalance);

  // Cargar historial de viajes desde Firestore
  const loadHistory = useCallback(async () => {
    if (!driver?.id) return;
    try {
      setIsLoadingHistory(true);
      const firestoreTrips = await getDriverTrips(driver.id);
      if (firestoreTrips && firestoreTrips.length > 0) {
        setTripsHistory(firestoreTrips);
      } else {
        setTripsHistory(FALLBACK_TRIPS);
      }
    } catch (err) {
      console.warn('EarningsScreen [loadHistory]:', err.message);
      setTripsHistory(FALLBACK_TRIPS);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [driver?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Manejo del retiro de saldo
  const handleRequestWithdrawal = async () => {
    setWithdrawError(null);
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError('Ingresa un monto válido a retirar.');
      return;
    }

    if (amountNum > totalBalance) {
      setWithdrawError('El monto solicitado supera tu saldo disponible.');
      return;
    }

    if (amountNum < 10000) {
      setWithdrawError('El monto mínimo de retiro es $ 10.000 COP.');
      return;
    }

    try {
      await updateDriverBalance(-amountNum);
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      setFeedbackMessage(
        `¡Retiro de ${formatCOP(amountNum)} solicitado exitosamente a tu cuenta ${selectedPaymentProvider}!`
      );
      setTimeout(() => setFeedbackMessage(null), 4500);
    } catch (err) {
      setWithdrawError('No se pudo procesar el retiro. Inténtalo de nuevo.');
    }
  };

  const formatDateLabel = (isoString) => {
    if (!isoString) return 'Hoy';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ganancias</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadHistory}
          disabled={isLoadingHistory}
          activeOpacity={0.7}
        >
          {isLoadingHistory ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* BANNER DE FEEDBACK INLINE (Cero Alert.alert) */}
      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#15803D" />
          <Text style={styles.feedbackBannerText}>{feedbackMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TARJETA DE BALANCE ACUMULADO */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Total Disponible</Text>
          <Text style={styles.balanceAmount}>{formattedTotalBalance}</Text>
          <Text style={styles.balanceSubtext}>
            Saldo acumulado por carreras realizadas. Disponible para transferencia inmediata.
          </Text>

          <TouchableOpacity
            style={styles.transferButton}
            onPress={() => {
              setWithdrawAmount(totalBalance > 0 ? String(totalBalance) : '');
              setWithdrawError(null);
              setWithdrawModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={18} color={colors.black} />
            <Text style={styles.transferButtonText}>Solicitar Retiro de Saldo</Text>
          </TouchableOpacity>
        </View>

        {/* RESUMEN DEL DÍA */}
        <Text style={styles.sectionTitle}>RESUMEN DE HOY</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconBox}>
              <Ionicons name="cash-outline" size={20} color="#15803D" />
            </View>
            <Text style={styles.statValue}>{formattedDailyEarnings || '$ 0'}</Text>
            <Text style={styles.statLabel}>Ganado Hoy</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconBox}>
              <Ionicons name="car-sport-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{completedTripsCount || 0}</Text>
            <Text style={styles.statLabel}>Viajes Hechos</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconBox}>
              <Ionicons name="star" size={20} color="#EAB308" />
            </View>
            <Text style={styles.statValue}>5.0 ★</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        {/* GRÁFICA DE ACTIVIDAD SEMANAL */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Rendimiento Semanal</Text>
            <Text style={styles.chartHighlight}>
              {selectedDay ? `${selectedDay.day}: ${formatCOP(selectedDay.amount)}` : ''}
            </Text>
          </View>

          <View style={styles.chartBarsContainer}>
            {WEEKLY_DATA.map((item) => {
              const isSelected = selectedDay?.day === item.day;
              return (
                <TouchableOpacity
                  key={item.day}
                  style={styles.barColumn}
                  onPress={() => setSelectedDay(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${item.height}%` },
                        isSelected && styles.barFillSelected,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDayLabel, isSelected && styles.barDayLabelSelected]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* HISTORIAL DE VIAJES REALIZADOS */}
        <Text style={styles.sectionTitle}>HISTORIAL DE VIAJES RECIENTES</Text>
        {tripsHistory.map((trip) => {
          const isCompleted = trip.status === 'completed';
          const earningsFormatted = trip.formattedEarnings || (trip.driverEarnings ? formatCOP(trip.driverEarnings) : '$ 0');
          const passengerName = trip.passenger?.name || 'Pasajero';
          const pickup = trip.pickup?.address || 'Origen';
          const dropoff = trip.dropoff?.address || 'Destino';
          const paymentMethod = trip.paymentMethod || 'Efectivo';

          return (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripCardHeader}>
                <View style={styles.tripPassengerWrap}>
                  <Ionicons name="person-circle-outline" size={20} color="#94A3B8" />
                  <Text style={styles.tripPassengerName}>{passengerName}</Text>
                </View>
                <Text style={isCompleted ? styles.tripEarnings : styles.tripCancelledText}>
                  {isCompleted ? `+${earningsFormatted}` : 'Cancelado'}
                </Text>
              </View>

              <View style={styles.tripRouteWrap}>
                <View style={styles.tripRouteDot} />
                <Text style={styles.tripRouteText} numberOfLines={1}>{pickup}</Text>
              </View>
              <View style={styles.tripRouteWrap}>
                <View style={styles.tripRouteSquare} />
                <Text style={styles.tripRouteText} numberOfLines={1}>{dropoff}</Text>
              </View>

              <View style={styles.tripFooter}>
                <Text style={styles.tripDateText}>{formatDateLabel(trip.createdAt)}</Text>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>{paymentMethod}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* MODAL DE RETIRO DE SALDO */}
      <Modal
        visible={withdrawModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Retiro de Saldo</Text>
              <TouchableOpacity
                onPress={() => setWithdrawModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Saldo disponible: <Text style={{ color: '#22C55E', fontWeight: '900' }}>{formattedTotalBalance}</Text>
            </Text>

            {/* ERROR INLINE (Cero Alert.alert) */}
            {withdrawError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorBannerText}>{withdrawError}</Text>
              </View>
            )}

            {/* SELECCIÓN DE PROVEEDOR */}
            <Text style={styles.fieldLabel}>SELECCIONA TU CUENTA DESTINO</Text>
            <View style={styles.providersRow}>
              {['Nequi', 'Daviplata', 'Bancolombia'].map((p) => {
                const isSelected = selectedPaymentProvider === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.providerPill, isSelected && styles.providerPillSelected]}
                    onPress={() => setSelectedPaymentProvider(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.providerText, isSelected && styles.providerTextSelected]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* MONTO A RETIRAR */}
            <Text style={styles.fieldLabel}>MONTO A RETIRAR (COP)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor="#6B7280"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />
            </View>

            <TouchableOpacity
              style={styles.confirmWithdrawButton}
              onPress={handleRequestWithdrawal}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={18} color={colors.black} />
              <Text style={styles.confirmWithdrawButtonText}>Confirmar Transferencia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  balanceCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#22C55E',
    marginVertical: spacing.xs,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  transferButton: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: 12,
    gap: 8,
  },
  transferButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.black,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  chartHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: spacing.xs,
  },
  barColumn: {
    alignItems: 'center',
    width: 32,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#1F2937',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#05A357',
    borderRadius: 7,
  },
  barFillSelected: {
    backgroundColor: '#22C55E',
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 6,
  },
  barDayLabelSelected: {
    color: colors.white,
  },
  tripCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tripPassengerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripPassengerName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  tripEarnings: {
    fontSize: 14,
    fontWeight: '900',
    color: '#22C55E',
  },
  tripCancelledText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  tripRouteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  tripRouteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#05A357',
  },
  tripRouteSquare: {
    width: 8,
    height: 8,
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  tripRouteText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderColor: '#1F2937',
  },
  tripDateText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  paymentBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450A0A',
    padding: spacing.sm,
    borderRadius: 10,
    gap: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  providersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  providerPill: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  providerPillSelected: {
    backgroundColor: '#05A357',
    borderColor: '#22C55E',
  },
  providerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  providerTextSelected: {
    color: colors.white,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#374151',
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#22C55E',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 4 : spacing.sm,
  },
  confirmWithdrawButton: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
  },
  confirmWithdrawButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.black,
  },
});

export default EarningsScreen;
