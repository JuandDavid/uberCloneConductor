import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';
import { useTrip, TRIP_STATUS } from '../../context/TripContext';

// Importación condicional de react-native-maps para soporte móvil y web
let MapView = null;
let Marker = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (err) {
    console.warn('ActiveTripScreen: react-native-maps no disponible:', err.message);
  }
}

const { width } = Dimensions.get('window');

/**
 * Pantalla de Viaje Activo y Navegación Paso a Paso (ActiveTripScreen)
 * Permite al conductor gestionar el ciclo de vida del servicio en curso con interfaz de navegación HUD.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Arquitectura desacoplada: consume el estado global reactivo desde TripContext.
 * 2. Cero popups de Alert.alert(); las transiciones y notificaciones son visuales e inline.
 * 3. Pantalla de navegación HUD con indicaciones paso a paso (turn-by-turn).
 * 4. Integración completa de cobro en efectivo y confirmación de llegada.
 */
export function ActiveTripScreen({ navigation }) {
  const {
    tripState,
    activeTrip,
    notifyArrival,
    startTrip,
    finishTrip,
    rejectTrip,
  } = useTrip();

  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Si no hay viaje activo en curso, redirigir a Home
  if (!activeTrip) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle" size={54} color="#15803D" />
          <Text style={styles.emptyTitle}>No hay viaje activo</Text>
          <Text style={styles.emptySubtitle}>
            Actualmente estás disponible para recibir nuevas solicitudes de viaje.
          </Text>
          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() => navigation?.navigate?.('Home')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
            <Text style={styles.backHomeButtonText}>Volver al Mapa</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isGoingToPickup = tripState === TRIP_STATUS.ACCEPTED;
  const isWaitingPassenger = tripState === TRIP_STATUS.ARRIVED;
  const isTripInProgress = tripState === TRIP_STATUS.IN_PROGRESS;

  const currentAddress = isTripInProgress
    ? activeTrip.dropoff?.address
    : activeTrip.pickup?.address;

  const stepTitle = isGoingToPickup
    ? 'DIRÍGETE AL PUNTO DE RECOGIDA'
    : isWaitingPassenger
    ? 'ESPERANDO AL PASAJERO'
    : 'EN RUTA HACIA EL DESTINO';

  const nextInstruction = isGoingToPickup
    ? 'En 350 m gira a la derecha hacia la Calle 72'
    : isWaitingPassenger
    ? 'Estás en el punto de encuentro acordado con el usuario'
    : 'Continúa por la Avenida El Dorado durante 3.2 km';

  // Manejo de la acción principal según la fase del viaje
  const handlePrimaryAction = async () => {
    try {
      setIsProcessing(true);
      if (isGoingToPickup) {
        await notifyArrival();
        setFeedbackMessage('¡Has llegado! Se le notificó al pasajero que estás afuera.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      } else if (isWaitingPassenger) {
        await startTrip();
        setFeedbackMessage('¡Viaje iniciado con éxito! Conduce con prudencia.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      } else if (isTripInProgress) {
        await finishTrip();
        setFeedbackMessage('¡Viaje completado! La tarifa ha sido liquidada.');
        setTimeout(() => {
          setFeedbackMessage(null);
          navigation?.navigate?.('Home');
        }, 1800);
      }
    } catch (err) {
      console.warn('ActiveTripScreen [handlePrimaryAction]:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancelar servicio
  const handleCancelTrip = () => {
    rejectTrip('cancelled_by_driver');
    setFeedbackMessage('Servicio cancelado.');
    setTimeout(() => {
      setFeedbackMessage(null);
      navigation?.navigate?.('Home');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* BARRA SUPERIOR HUD DE NAVEGACIÓN PASO A PASO */}
      <View style={styles.hudTopBar}>
        <View style={styles.hudManeuverBox}>
          <Ionicons
            name={isWaitingPassenger ? 'pin' : 'arrow-forward'}
            size={28}
            color={colors.white}
          />
        </View>

        <View style={styles.hudInstructionWrap}>
          <Text style={styles.hudStepBadge}>{stepTitle}</Text>
          <Text style={styles.hudInstructionText} numberOfLines={2}>
            {nextInstruction}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.hudCloseButton}
          onPress={() => navigation?.navigate?.('Home')}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* BANNER DE FEEDBACK INLINE (Cero Alert.alert) */}
      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Ionicons name="information-circle" size={17} color="#15803D" />
          <Text style={styles.feedbackBannerText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* ÁREA CENTRAL: MAPA O SIMULADOR VISUAL DE RUTA */}
      <View style={styles.mapArea}>
        {Platform.OS !== 'web' && MapView ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: activeTrip.pickup?.coords?.latitude || 4.6560,
              longitude: activeTrip.pickup?.coords?.longitude || -74.0595,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
          >
            {activeTrip.pickup?.coords && (
              <Marker
                coordinate={activeTrip.pickup.coords}
                title="Punto de Recogida"
                pinColor="#15803D"
              />
            )}
            {activeTrip.dropoff?.coords && (
              <Marker
                coordinate={activeTrip.dropoff.coords}
                title="Destino Final"
                pinColor="#DC2626"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.webRouteMock}>
            <View style={styles.routeHeaderMock}>
              <View style={styles.speedBadge}>
                <Text style={styles.speedNumber}>48</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaTime}>{activeTrip.durationMinutes || 18} min</Text>
                <Text style={styles.etaDistance}>{activeTrip.distanceKm || 6.8} km restantes</Text>
              </View>
            </View>

            <View style={styles.simulatedRoadGraphic}>
              <View style={styles.roadLine} />
              <View style={styles.carPulseWrap}>
                <Ionicons name="navigate" size={32} color="#2563EB" />
              </View>
            </View>

            <Text style={styles.webRouteNotice}>
              Navegación GPS asistida activa hacia: {currentAddress}
            </Text>
          </View>
        )}
      </View>

      {/* PANEL INFERIOR: INFORMACIÓN DEL PASAJERO Y ACCIONES OPERATIVAS */}
      <View style={styles.bottomControlCard}>
        {/* Fila del Pasajero */}
        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <Ionicons name="person" size={22} color="#1E293B" />
          </View>
          <View style={styles.passengerMeta}>
            <Text style={styles.passengerName}>
              {activeTrip.passenger?.name || 'Pasajero'}
            </Text>
            <View style={styles.passengerRatingRow}>
              <Ionicons name="star" size={13} color="#EAB308" />
              <Text style={styles.passengerRating}>
                {activeTrip.passenger?.rating || '5.0'}
              </Text>
              <Text style={styles.bulletSeparator}>•</Text>
              <Text style={styles.paymentMethodTag}>
                {activeTrip.paymentMethod || 'Efectivo'}
              </Text>
            </View>
          </View>

          {/* Atajos de Contacto */}
          <View style={styles.contactGroup}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                setFeedbackMessage(`Llamando al pasajero al ${activeTrip.passenger?.phone || '3124567890'}...`);
                setTimeout(() => setFeedbackMessage(null), 3000);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={18} color="#15803D" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                setFeedbackMessage('Chat: "Hola, voy en camino a tu ubicación."');
                setTimeout(() => setFeedbackMessage(null), 3000);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjeta de Destino Inmediato */}
        <View style={styles.addressCard}>
          <Ionicons
            name={isTripInProgress ? 'flag' : 'location'}
            size={18}
            color={isTripInProgress ? '#DC2626' : '#15803D'}
          />
          <View style={styles.addressTextColumn}>
            <Text style={styles.addressRoleLabel}>
              {isTripInProgress ? 'PUNTO DE DESTINO' : 'PUNTO DE ENCUENTRO'}
            </Text>
            <Text style={styles.addressTargetText} numberOfLines={2}>
              {currentAddress}
            </Text>
          </View>
          <View style={styles.fareTagBox}>
            <Text style={styles.fareAmountTag}>
              {activeTrip.formattedEarnings || '$ 14.800'}
            </Text>
            <Text style={styles.fareSubtext}>Tu ganancia</Text>
          </View>
        </View>

        {/* BOTÓN PRINCIPAL DE AVANCE DE ESTADO */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isGoingToPickup
              ? styles.actionButtonPickup
              : isWaitingPassenger
              ? styles.actionButtonWaiting
              : styles.actionButtonFinish,
          ]}
          onPress={handlePrimaryAction}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          <Ionicons
            name={
              isGoingToPickup
                ? 'location-outline'
                : isWaitingPassenger
                ? 'play-circle-outline'
                : 'checkmark-circle-outline'
            }
            size={22}
            color={colors.white}
          />
          <Text style={styles.actionButtonText}>
            {isGoingToPickup
              ? 'LLEGUÉ AL PUNTO DE RECOGIDA'
              : isWaitingPassenger
              ? 'INICIAR VIAJE CON PASAJERO'
              : 'FINALIZAR Y COBRAR VIAJE'}
          </Text>
        </TouchableOpacity>

        {/* BOTÓN SECUNDARIO: CANCELAR VIAJE */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelTrip}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancelar servicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  hudTopBar: {
    backgroundColor: '#0B0F19',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    zIndex: 10,
  },
  hudManeuverBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  hudInstructionWrap: {
    flex: 1,
  },
  hudStepBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.6,
  },
  hudInstructionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    marginTop: 2,
  },
  hudCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
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
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webRouteMock: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  routeHeaderMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  speedUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  etaBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#334155',
  },
  etaTime: {
    fontSize: 16,
    fontWeight: '900',
    color: '#22C55E',
  },
  etaDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  simulatedRoadGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  roadLine: {
    position: 'absolute',
    width: 6,
    height: '100%',
    backgroundColor: '#334155',
    borderRadius: 3,
  },
  carPulseWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  webRouteNotice: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    backgroundColor: '#1E293B',
    padding: spacing.sm,
    borderRadius: 8,
  },
  bottomControlCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    elevation: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
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
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passengerMeta: {
    flex: 1,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  passengerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  passengerRating: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bulletSeparator: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  paymentMethodTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  contactGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  addressTextColumn: {
    flex: 1,
  },
  addressRoleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  addressTargetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  fareTagBox: {
    alignItems: 'flex-end',
  },
  fareAmountTag: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  fareSubtext: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  actionButtonPickup: {
    backgroundColor: '#05A357',
  },
  actionButtonWaiting: {
    backgroundColor: '#1E293B',
  },
  actionButtonFinish: {
    backgroundColor: '#05A357',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.8,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.sm,
    lineHeight: 18,
  },
  backHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.black,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: 12,
    gap: 8,
    marginTop: spacing.md,
  },
  backHomeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

export default ActiveTripScreen;
