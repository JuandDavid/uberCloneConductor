import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useTrip, TRIP_STATUS } from '../../context/TripContext';
import { HeaderConductor } from '../../components/HeaderConductor';
import { IncomingTripModal } from '../../components/IncomingTripModal';

// Importación condicional de react-native-maps para soporte nativo y web
let MapView = null;
let Marker = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (err) {
    console.warn('HomeScreen: react-native-maps no disponible en esta plataforma:', err.message);
  }
}

const { width, height } = Dimensions.get('window');

// Coordenadas centrales por defecto (Bogotá, Colombia)
const DEFAULT_COORDS = {
  latitude: 4.6560,
  longitude: -74.0595,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

/**
 * Pantalla Principal del Conductor (HomeScreen)
 * Módulos:
 * - Commit 42: Geolocalización GPS y Mapa Interactivo
 * - Commit 43: Switch Circular Online/Offline sincronizado con Firestore
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. El switch actualiza 'isOnline' en Firestore ('drivers').
 * 2. Cero popups de Alert; todo feedback visual se despliega inline con banners estilizados.
 * 3. Incorpora disparador de viajes demo para sustentación presencial en clase.
 */
export function HomeScreen({ navigation }) {
  const { driver } = useAuth();
  const {
    isOnline,
    toggleOnlineStatus,
    simulateIncomingTrip,
    tripState,
    activeTrip,
    acceptTrip,
    rejectTrip,
    notifyArrival,
    startTrip,
    finishTrip,
    resetTrip,
    dailyEarnings,
    formattedDailyEarnings,
    completedTripsCount,
  } = useTrip();

  const mapRef = useRef(null);
  const [currentCoords, setCurrentCoords] = useState(DEFAULT_COORDS);
  const [locationPermission, setLocationPermission] = useState('pending'); // 'granted' | 'denied' | 'pending'
  const [isLocating, setIsLocating] = useState(true);
  const [locationStatusMessage, setLocationStatusMessage] = useState(null);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [onlineFeedback, setOnlineFeedback] = useState(null);

  // Solicitar permisos de GPS y obtener ubicación actual
  useEffect(() => {
    let isMounted = true;

    async function setupLocation() {
      try {
        setIsLocating(true);
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMounted) {
            setLocationPermission('denied');
            setLocationStatusMessage('Permiso GPS denegado. Utilizando ubicación simulada de referencia.');
            setIsLocating(false);
          }
          return;
        }

        if (isMounted) setLocationPermission('granted');

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted && location?.coords) {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          };
          setCurrentCoords(newCoords);
          setLocationStatusMessage(null);
        }
      } catch (err) {
        if (isMounted) {
          setLocationStatusMessage('GPS no disponible en este momento. Operando en coordenadas de referencia.');
        }
      } finally {
        if (isMounted) setIsLocating(false);
      }
    }

    setupLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Recentrar mapa en la ubicación del conductor
  const handleRecenter = () => {
    if (mapRef.current && currentCoords) {
      mapRef.current.animateToRegion(currentCoords, 600);
    }
  };

  // Alternar disponibilidad Online / Offline sincronizando con Firestore
  const handleToggleOnline = async () => {
    try {
      setIsTogglingOnline(true);
      await toggleOnlineStatus();
      const willBeOnline = !isOnline;
      setOnlineFeedback(
        willBeOnline
          ? '¡Estás en línea! Tu vehículo está visible para solicitudes de viaje.'
          : 'Te has desconectado. Ya no recibirás nuevas solicitudes.'
      );
      setTimeout(() => setOnlineFeedback(null), 3800);
    } catch (err) {
      console.warn('HomeScreen [handleToggleOnline]:', err);
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const hasActiveTrip = Boolean(
    activeTrip &&
      (tripState === TRIP_STATUS.ACCEPTED ||
        tripState === TRIP_STATUS.ARRIVED ||
        tripState === TRIP_STATUS.IN_PROGRESS)
  );

  const handleAcceptTripModal = async () => {
    try {
      await acceptTrip();
      setOnlineFeedback('¡Viaje aceptado! Abriendo navegación paso a paso...');
      setTimeout(() => {
        setOnlineFeedback(null);
        navigation?.navigate?.('ActiveTrip');
      }, 700);
    } catch (err) {
      console.warn('HomeScreen [handleAcceptTripModal]:', err);
    }
  };

  const handleDeclineTripModal = () => {
    rejectTrip('declined_by_driver');
    setOnlineFeedback('Solicitud de viaje rechazada. Sigues disponible.');
    setTimeout(() => setOnlineFeedback(null), 3000);
  };

  const handleAdvanceTripState = async () => {
    try {
      if (tripState === TRIP_STATUS.ACCEPTED) {
        await notifyArrival();
        setOnlineFeedback('¡Llegada notificada! El pasajero ha sido alertado.');
        setTimeout(() => setOnlineFeedback(null), 3500);
      } else if (tripState === TRIP_STATUS.ARRIVED) {
        await startTrip();
        setOnlineFeedback('¡Viaje iniciado! Conduce con precaución hacia el destino.');
        setTimeout(() => setOnlineFeedback(null), 3500);
      } else if (tripState === TRIP_STATUS.IN_PROGRESS) {
        await finishTrip();
        setOnlineFeedback('¡Viaje finalizado con éxito! Saldo acreditado.');
        setTimeout(() => setOnlineFeedback(null), 4000);
      }
    } catch (err) {
      console.warn('HomeScreen [handleAdvanceTripState]:', err);
    }
  };

  const handleCancelCurrentTrip = () => {
    rejectTrip('cancelled_by_driver');
    setOnlineFeedback('Servicio cancelado. Volviendo a modo disponible.');
    setTimeout(() => setOnlineFeedback(null), 3500);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' };
      case TRIP_STATUS.ARRIVED:
        return { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' };
      case TRIP_STATUS.IN_PROGRESS:
        return { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' };
      default:
        return { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return '#15803D';
      case TRIP_STATUS.ARRIVED:
        return '#B45309';
      case TRIP_STATUS.IN_PROGRESS:
        return '#1D4ED8';
      default:
        return colors.textPrimary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return 'EN CAMINO A RECOGER';
      case TRIP_STATUS.ARRIVED:
        return 'LLEGASTE AL PUNTO DE ENCUENTRO';
      case TRIP_STATUS.IN_PROGRESS:
        return 'VIAJE EN CURSO AL DESTINO';
      default:
        return 'VIAJE ACTIVO';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return 'navigate-circle';
      case TRIP_STATUS.ARRIVED:
        return 'location';
      case TRIP_STATUS.IN_PROGRESS:
        return 'car-sport';
      default:
        return 'time';
    }
  };

  const getMainActionLabel = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return 'LLEGUÉ AL PUNTO DE RECOGIDA';
      case TRIP_STATUS.ARRIVED:
        return 'INICIAR VIAJE CON PASAJERO';
      case TRIP_STATUS.IN_PROGRESS:
        return 'FINALIZAR Y COBRAR VIAJE';
      default:
        return 'CONTINUAR';
    }
  };

  const getMainActionIcon = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return 'location-outline';
      case TRIP_STATUS.ARRIVED:
        return 'play-circle-outline';
      case TRIP_STATUS.IN_PROGRESS:
        return 'checkmark-done-circle-outline';
      default:
        return 'arrow-forward';
    }
  };

  const getMainActionButtonStyle = (status) => {
    switch (status) {
      case TRIP_STATUS.ACCEPTED:
        return { backgroundColor: '#05A357' };
      case TRIP_STATUS.ARRIVED:
        return { backgroundColor: '#1E293B' };
      case TRIP_STATUS.IN_PROGRESS:
        return { backgroundColor: '#05A357' };
      default:
        return { backgroundColor: colors.black };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* MAPA NATIVO O SIMULADOR WEB */}
      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' && MapView ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={currentCoords}
            showsUserLocation={locationPermission === 'granted'}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {/* Marcador del Vehículo del Conductor */}
            <Marker
              coordinate={{
                latitude: currentCoords.latitude,
                longitude: currentCoords.longitude,
              }}
              title={driver?.fullName || 'Mi Vehículo'}
              description={`Placa: ${driver?.vehicle?.plate || 'ABC123'} • ${(driver?.vehicle?.category || 'economy').toUpperCase()}`}
            >
              <View style={[styles.vehicleMarker, isOnline ? styles.vehicleMarkerOnline : styles.vehicleMarkerOffline]}>
                <Ionicons name="car" size={22} color={colors.white} />
                <View style={styles.plateTag}>
                  <Text style={styles.plateTagText}>{driver?.vehicle?.plate || 'ABC123'}</Text>
                </View>
              </View>
            </Marker>

            {/* Marcadores de Recogida y Destino para Viaje Activo */}
            {hasActiveTrip && activeTrip?.pickup?.coords && (
              <Marker
                coordinate={activeTrip.pickup.coords}
                title="Punto de Recogida"
                description={activeTrip.pickup.address}
                pinColor="#15803D"
              />
            )}
            {hasActiveTrip && activeTrip?.dropoff?.coords && (
              <Marker
                coordinate={activeTrip.dropoff.coords}
                title="Destino Final"
                description={activeTrip.dropoff.address}
                pinColor="#DC2626"
              />
            )}
          </MapView>
        ) : (
          // Vista de respaldo para Navegador Web
          <View style={styles.webMapMock}>
            <View style={styles.webRadarCircle}>
              <View style={[styles.vehicleMarker, isOnline ? styles.vehicleMarkerOnline : styles.vehicleMarkerOffline]}>
                <Ionicons name="car" size={26} color={colors.white} />
                <View style={styles.plateTag}>
                  <Text style={styles.plateTagText}>{driver?.vehicle?.plate || 'ABC123'}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.webMapNotice}>
              {hasActiveTrip
                ? `📍 Viaje Activo: ${activeTrip?.passenger?.name || 'Pasajero'} • ${getStatusLabel(tripState)}`
                : `Modo Visualización Web (Expo): GPS Lat: ${currentCoords.latitude.toFixed(4)}, Lng: ${currentCoords.longitude.toFixed(4)}`}
            </Text>
          </View>
        )}
      </View>

      {/* CABECERA MODULAR DEL CONDUCTOR (Commit 44) */}
      <HeaderConductor
        driver={driver}
        isOnline={isOnline}
        dailyEarnings={dailyEarnings}
        formattedDailyEarnings={formattedDailyEarnings}
        completedTripsCount={completedTripsCount}
        onProfilePress={() => navigation?.navigate?.('PendingApproval')}
      />

      {/* BANNER DE NOTIFICACIÓN FEEDBACK (ONLINE / OFFLINE) */}
      {onlineFeedback && (
        <View style={[styles.feedbackBanner, isOnline ? styles.feedbackBannerOnline : styles.feedbackBannerOffline]}>
          <Ionicons
            name={isOnline ? 'radio-button-on' : 'power-outline'}
            size={16}
            color={isOnline ? '#15803D' : '#4B5563'}
          />
          <Text style={[styles.feedbackBannerText, isOnline ? styles.feedbackBannerTextOnline : styles.feedbackBannerTextOffline]}>
            {onlineFeedback}
          </Text>
        </View>
      )}

      {/* BANNER INFORMATIVO DE GEOLOCALIZACIÓN */}
      {locationStatusMessage && !onlineFeedback && (
        <View style={styles.locationBanner}>
          <Ionicons name="location-outline" size={16} color="#B45309" />
          <Text style={styles.locationBannerText}>{locationStatusMessage}</Text>
        </View>
      )}

      {/* BOTÓN FLOTANTE PARA RECENTRAR MAPA */}
      <TouchableOpacity
        style={styles.recenterFab}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={24} color={colors.black} />
      </TouchableOpacity>

      {/* BOTÓN CIRCULAR CENTRAL DE CONEXIÓN (Solo visible sin viaje activo) */}
      {!hasActiveTrip && (
        <View style={styles.goButtonContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.goButton,
              isOnline ? styles.goButtonOnline : styles.goButtonOffline,
              isTogglingOnline && styles.goButtonLoading,
            ]}
            onPress={handleToggleOnline}
            disabled={isTogglingOnline}
            activeOpacity={0.85}
          >
            {isTogglingOnline ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : isOnline ? (
              <View style={styles.goButtonContent}>
                <Ionicons name="power" size={26} color={colors.white} />
                <Text style={styles.goButtonLabelOnline}>DESCONECTAR</Text>
              </View>
            ) : (
              <View style={styles.goButtonContent}>
                <Text style={styles.goButtonLabelMain}>INICIAR</Text>
                <Text style={styles.goButtonLabelSub}>CONECTAR</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* PANEL INFERIOR: TARJETA DE VIAJE ACTIVO O RESUMEN OPERATIVO */}
      {hasActiveTrip && activeTrip ? (
        <View style={styles.activeTripCard}>
          <View style={styles.dragPill} />

          {/* Cabecera del Estado del Viaje */}
          <View style={styles.activeStatusHeader}>
            <View style={[styles.activeStatusBadge, getStatusBadgeStyle(tripState)]}>
              <Ionicons name={getStatusIcon(tripState)} size={15} color={getStatusColor(tripState)} />
              <Text style={[styles.activeStatusText, { color: getStatusColor(tripState) }]}>
                {getStatusLabel(tripState)}
              </Text>
            </View>
            <Text style={styles.activeEarningsHighlight}>
              {activeTrip.formattedEarnings || '$ 14.800'}
            </Text>
          </View>

          {/* Pasajero y Acciones Rápidas de Contacto */}
          <View style={styles.activePassengerRow}>
            <View style={styles.passengerAvatarActive}>
              <Ionicons name="person" size={20} color="#1E293B" />
            </View>
            <View style={styles.passengerInfoActive}>
              <Text style={styles.passengerNameActive} numberOfLines={1}>
                {activeTrip.passenger?.name || 'Pasajero'}
              </Text>
              <Text style={styles.passengerRatingActive}>
                ⭐ {activeTrip.passenger?.rating || '5.0'} • {activeTrip.paymentMethod || 'Efectivo'}
              </Text>
            </View>
            <View style={styles.contactActionsGroup}>
              <TouchableOpacity
                style={styles.contactIconBtn}
                onPress={() => {
                  setOnlineFeedback(`Llamando al pasajero (${activeTrip.passenger?.phone || '3124567890'})...`);
                  setTimeout(() => setOnlineFeedback(null), 3000);
                }}
              >
                <Ionicons name="call" size={17} color="#15803D" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactIconBtn}
                onPress={() => {
                  setOnlineFeedback('Chat con pasajero: "Hola, voy en camino a tu ubicación."');
                  setTimeout(() => setOnlineFeedback(null), 3000);
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={17} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dirección Objetivo Inmediata con acceso a HUD de Navegación */}
          <TouchableOpacity
            style={styles.activeTargetAddressBox}
            onPress={() => navigation?.navigate?.('ActiveTrip')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tripState === TRIP_STATUS.IN_PROGRESS ? 'navigate' : 'pin'}
              size={18}
              color={tripState === TRIP_STATUS.IN_PROGRESS ? '#2563EB' : '#15803D'}
            />
            <View style={styles.activeTargetTextWrap}>
              <Text style={styles.activeTargetLabel}>
                {tripState === TRIP_STATUS.IN_PROGRESS ? 'DESTINO FINAL DEL VIAJE' : 'PUNTO DE RECOGIDA'} (Toca para HUD)
              </Text>
              <Text style={styles.activeTargetAddress} numberOfLines={2}>
                {tripState === TRIP_STATUS.IN_PROGRESS ? activeTrip.dropoff?.address : activeTrip.pickup?.address}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Botón Principal de Avance de Estado */}
          <TouchableOpacity
            style={[styles.mainActionButton, getMainActionButtonStyle(tripState)]}
            onPress={handleAdvanceTripState}
            activeOpacity={0.85}
          >
            <Ionicons name={getMainActionIcon(tripState)} size={20} color={colors.white} />
            <Text style={styles.mainActionButtonText}>{getMainActionLabel(tripState)}</Text>
          </TouchableOpacity>

          {/* Botón Secundario para Cancelar */}
          <TouchableOpacity
            style={styles.cancelTripButton}
            onPress={handleCancelCurrentTrip}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelTripButtonText}>Cancelar servicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomSheetPreview}>
          <View style={styles.dragPill} />

          {/* Resumen de Métricas */}
          <View style={styles.statsSummaryRow}>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{formattedDailyEarnings || '$ 0'}</Text>
              <Text style={styles.statLabel}>Ganancias Hoy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{completedTripsCount || 0}</Text>
              <Text style={styles.statLabel}>Viajes Hechos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>5.0 ★</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </View>

          {/* Radar en vivo cuando está conectado */}
          {isOnline && (
            <View style={styles.radarNoticeRow}>
              <View style={styles.radarPulseDot} />
              <Text style={styles.radarNoticeText}>
                Buscando solicitudes de viaje en tu zona de cobertura...
              </Text>
            </View>
          )}

          {/* Botón de Demostración Docente (Paula Andrea) */}
          {isOnline && (
            <TouchableOpacity
              style={styles.demoTriggerButton}
              onPress={() => simulateIncomingTrip(0)}
              activeOpacity={0.7}
            >
              <Ionicons name="flash" size={15} color="#D97706" />
              <Text style={styles.demoTriggerText}>
                Simular Solicitud de Viaje Entrante (Sustentación)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* MODAL DE SOLICITUD DE VIAJE ENTRANTE (Commit 45) */}
      <IncomingTripModal
        visible={tripState === TRIP_STATUS.REQUESTED && Boolean(activeTrip)}
        trip={activeTrip}
        onAccept={handleAcceptTripModal}
        onDecline={handleDeclineTripModal}
        timeoutSeconds={15}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  vehicleMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  vehicleMarkerOnline: {
    backgroundColor: '#05A357',
  },
  vehicleMarkerOffline: {
    backgroundColor: '#1E1E1E',
  },
  plateTag: {
    position: 'absolute',
    bottom: -14,
    backgroundColor: '#FDE047',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CA8A04',
  },
  plateTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 0.5,
  },
  webMapMock: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  webRadarCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginBottom: spacing.md,
  },
  webMapNotice: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 148 : 115,
    left: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  feedbackBannerOnline: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackBannerOffline: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  feedbackBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  feedbackBannerTextOnline: {
    color: '#15803D',
  },
  feedbackBannerTextOffline: {
    color: '#374151',
  },
  locationBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 148 : 115,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    zIndex: 10,
  },
  locationBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  recenterFab: {
    position: 'absolute',
    right: spacing.md,
    bottom: 220,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
  },
  goButtonContainer: {
    position: 'absolute',
    bottom: 125,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  goButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: colors.white,
  },
  goButtonOffline: {
    backgroundColor: '#000000',
  },
  goButtonOnline: {
    backgroundColor: '#E11900', // Rojo para desconectar cuando está online
  },
  goButtonLoading: {
    opacity: 0.8,
  },
  goButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonLabelMain: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1,
  },
  goButtonLabelSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D1D5DB',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  goButtonLabelOnline: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  bottomSheetPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    elevation: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 15,
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  statColumn: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
  radarNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  radarPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  radarNoticeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
  demoTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs + 2,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  activeTripCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    elevation: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 25,
  },
  activeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
    paddingTop: spacing.xs,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeEarningsHighlight: {
    fontSize: 17,
    fontWeight: '900',
    color: '#15803D',
  },
  activePassengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passengerAvatarActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  passengerInfoActive: {
    flex: 1,
  },
  passengerNameActive: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  passengerRatingActive: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  contactActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 2,
  },
  activeTargetAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 10,
  },
  activeTargetTextWrap: {
    flex: 1,
  },
  activeTargetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  activeTargetAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  mainActionButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.8,
  },
  cancelTripButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 4,
    marginTop: 2,
  },
  cancelTripButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
});

export default HomeScreen;
