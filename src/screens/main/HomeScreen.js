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
 * Módulo de Geolocalización y Mapa Interactivo (Commit 42)
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Integra react-native-maps y expo-location con solicitud de permisos en primer plano.
 * 2. Cero diálogos modales de Alert; fallos de geolocalización se informan mediante banner visual.
 * 3. Proporciona fallback visual interactivo en Web para evitar caídas en emuladores o navegador.
 */
export function HomeScreen({ navigation }) {
  const { driver } = useAuth();
  const {
    isOnline,
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

      {/* BANNER INFORMATIVO DE GEOLOCALIZACIÓN */}
      {locationStatusMessage && (
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

      {/* PANEL INFERIOR DE RESUMEN OPERATIVO */}
      <View style={styles.bottomSheetPreview}>
        <View style={styles.dragPill} />
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
    bottom: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomSheetPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  dragPill: {
    width: 36,
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
});

export default HomeScreen;
