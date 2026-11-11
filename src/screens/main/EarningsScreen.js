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
import { useTrip } from '../../context/TripContext';
import { formatCOP } from '../../config/pricing';

/**
 * Pantalla de Ganancias y Balance del Conductor (EarningsScreen)
 * Permite visualizar el acumulado de ingresos, viajes realizados y métricas financieras.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Arquitectura desacoplada: consume de AuthContext y TripContext.
 * 2. Cero popups de Alert.alert().
 * 3. Visualización financiera clara en pesos colombianos (COP).
 */
export function EarningsScreen({ navigation }) {
  const { driver } = useAuth();
  const {
    dailyEarnings,
    formattedDailyEarnings,
    completedTripsCount,
  } = useTrip();

  const totalBalance = driver?.balance || 0;
  const formattedTotalBalance = formatCOP(totalBalance);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ganancias</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TARJETA DE BALANCE ACUMULADO */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Total Disponible</Text>
          <Text style={styles.balanceAmount}>{formattedTotalBalance}</Text>
          <Text style={styles.balanceSubtext}>
            Saldo acumulado listo para transferencia o retiro a Nequi / Bancolombia.
          </Text>

          <TouchableOpacity style={styles.transferButton} activeOpacity={0.85}>
            <Ionicons name="wallet-outline" size={18} color={colors.black} />
            <Text style={styles.transferButtonText}>Solicitar Retiro de Saldo</Text>
          </TouchableOpacity>
        </View>

        {/* RESUMEN DEL DÍA */}
        <Text style={styles.sectionTitle}>ACTIVIDAD DE HOY</Text>
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

        {/* BANNER INFORMATIVO */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#60A5FA" />
          <Text style={styles.infoBannerText}>
            Tus ganancias se acreditan inmediatamente al finalizar cada carrera. La comisión de plataforma es del 15%.
          </Text>
        </View>
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
  helpButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#172554',
    padding: spacing.md,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 18,
    flex: 1,
  },
});

export default EarningsScreen;
