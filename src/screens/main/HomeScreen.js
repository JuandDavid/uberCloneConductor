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
              Modo Visualización Web (Expo): GPS Lat: {currentCoords.latitude.toFixed(4)}, Lng: {currentCoords.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* CABECERA SUPERIOR FLOTANTE */}
      <View style={styles.topFloatingCard}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            style={styles.profileAvatarButton}
            onPress={() => navigation?.navigate?.('PendingApproval')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={18} color="#15803D" />
          </TouchableOpacity>
          <View>
            <Text style={styles.driverGreeting} numberOfLines={1}>
              {driver?.fullName || 'Conductor'}
            </Text>
            <Text style={styles.driverSubinfo}>
              {driver?.vehicle?.plate || 'ABC123'} • {(driver?.vehicle?.category || 'economy').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Indicador de Disponibilidad */}
        <View style={[styles.statusPill, isOnline ? styles.statusPillOnline : styles.statusPillOffline]}>
          <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
          <Text style={[styles.statusPillText, isOnline ? styles.statusPillTextOnline : styles.statusPillTextOffline]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

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

      {/* BOTÓN CIRCULAR CENTRAL DE CONEXIÓN (ESTILO UBER GO) */}
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

      {/* PANEL INFERIOR DE RESUMEN OPERATIVO */}
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
  topFloatingCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 10,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  profileAvatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  driverGreeting: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverSubinfo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
  feedbackBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 86,
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
    top: Platform.OS === 'ios' ? 120 : 86,
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
});

export default HomeScreen;
