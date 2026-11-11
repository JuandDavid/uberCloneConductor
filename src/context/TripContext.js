import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { calculateTripFare, formatCOP } from '../config/pricing';
import { db } from '../config/firebase';
import { updateDriverBalanceInDb, TRIPS_COLLECTION, DRIVERS_COLLECTION } from '../services/dbService';

const TripContext = createContext();

export const TRIP_STATUS = {
  IDLE: 'idle', // Conductor disponible esperando viaje
  REQUESTED: 'requested', // Solicitud entrante en pantalla (modal con cuenta regresiva)
  ACCEPTED: 'accepted', // Conductor aceptó, va en camino a recoger al pasajero
  ARRIVED: 'arrived', // Conductor llegó al punto de recogida
  IN_PROGRESS: 'in_progress', // Pasajero a bordo, viaje en curso hacia el destino
  COMPLETED: 'completed', // Viaje finalizado, resumen de cobro
  CANCELLED: 'cancelled', // Viaje descartado o cancelado
};

// Pasajeros y rutas demo para simulación docente en clase
const DEMO_TRIP_SAMPLES = [
  {
    passengerName: 'Valentina Gómez',
    passengerPhone: '3124567890',
    passengerRating: 4.9,
    pickupAddress: 'Calle 72 # 10-34, Zona Financiera',
    pickupCoords: { latitude: 4.6560, longitude: -74.0595 },
    dropoffAddress: 'Centro Comercial Unicentro, Entrada 3',
    dropoffCoords: { latitude: 4.7015, longitude: -74.0410 },
    distanceKm: 6.8,
    durationMinutes: 18,
    paymentMethod: 'Efectivo',
  },
  {
    passengerName: 'Carlos Andrés Mendoza',
    passengerPhone: '3209876543',
    passengerRating: 4.8,
    pickupAddress: 'Carrera 7 # 32-16, Centro Internacional',
    pickupCoords: { latitude: 4.6210, longitude: -74.0680 },
    dropoffAddress: 'Parque de la 93, Carrera 11A # 93-42',
    dropoffCoords: { latitude: 4.6765, longitude: -74.0485 },
    distanceKm: 8.4,
    durationMinutes: 24,
    paymentMethod: 'Mercado Pago',
  },
  {
    passengerName: 'Mariana Restrepo',
    passengerPhone: '3012349876',
    passengerRating: 5.0,
    pickupAddress: 'Aeropuerto El Dorado, Salida Nacional',
    pickupCoords: { latitude: 4.7015, longitude: -74.1469 },
    dropoffAddress: 'Hotel Tequendama, Carrera 10 # 26-21',
    dropoffCoords: { latitude: 4.6150, longitude: -74.0720 },
    distanceKm: 14.2,
    durationMinutes: 35,
    paymentMethod: 'Tarjeta de Crédito',
  },
];

/**
 * Proveedor de Estado Global de Viajes (TripContext)
 * Gestiona el ciclo de vida del servicio de transporte:
 * IDLE -> REQUESTED -> ACCEPTED -> ARRIVED -> IN_PROGRESS -> COMPLETED
 */
export function TripProvider({ children }) {
  const { driver, updateDriverBalance } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [tripState, setTripState] = useState(TRIP_STATUS.IDLE);
  const [activeTrip, setActiveTrip] = useState(null);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [completedTripsCount, setCompletedTripsCount] = useState(0);

  // Sincronizar disponibilidad con Firestore en tiempo real
  const setOnlineStatus = useCallback(
    async (onlineStatus) => {
      setIsOnline(onlineStatus);

      if (driver?.id) {
        try {
          const docRef = doc(db, DRIVERS_COLLECTION, driver.id);
          await updateDoc(docRef, {
            isOnline: onlineStatus,
            lastStatusChange: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('TripContext [setOnlineStatus]:', err.message);
        }
      }
    },
    [driver?.id]
  );

  const toggleOnlineStatus = useCallback(() => {
    setOnlineStatus(!isOnline);
  }, [isOnline, setOnlineStatus]);

  // Generador de viajes de prueba para sustentación docente
  const simulateIncomingTrip = useCallback(
    (sampleIndex = 0) => {
      if (!isOnline) {
        setOnlineStatus(true);
      }

      const sample = DEMO_TRIP_SAMPLES[sampleIndex % DEMO_TRIP_SAMPLES.length];
      const category = driver?.vehicle?.category || 'economy';
      const fareInfo = calculateTripFare(category, sample.distanceKm, sample.durationMinutes);

      const newTrip = {
        id: `trip_${Date.now()}`,
        driverId: driver?.id || 'driver_demo',
        driverName: driver?.fullName || 'Conductor Registrado',
        category,
        passenger: {
          name: sample.passengerName,
          phone: sample.passengerPhone,
          rating: sample.passengerRating,
        },
        pickup: {
          address: sample.pickupAddress,
          coords: sample.pickupCoords,
        },
        dropoff: {
          address: sample.dropoffAddress,
          coords: sample.dropoffCoords,
        },
        distanceKm: sample.distanceKm,
        durationMinutes: sample.durationMinutes,
        paymentMethod: sample.paymentMethod,
        totalFare: fareInfo.totalFare,
        driverEarnings: fareInfo.driverEarnings,
        platformFee: fareInfo.platformFee,
        formattedTotal: fareInfo.formattedTotal,
        formattedEarnings: fareInfo.formattedDriverEarnings,
        status: TRIP_STATUS.REQUESTED,
        createdAt: new Date().toISOString(),
      };

      setActiveTrip(newTrip);
      setTripState(TRIP_STATUS.REQUESTED);
      return newTrip;
    },
    [isOnline, driver, setOnlineStatus]
  );

  // Aceptar la solicitud de viaje
  const acceptTrip = useCallback(async () => {
    if (!activeTrip) return;

    const updated = {
      ...activeTrip,
      status: TRIP_STATUS.ACCEPTED,
      acceptedAt: new Date().toISOString(),
    };

    setActiveTrip(updated);
    setTripState(TRIP_STATUS.ACCEPTED);

    // Persistir en Firestore colección 'trips'
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, updated.id);
      await setDoc(tripRef, updated, { merge: true });
    } catch (err) {
      console.warn('TripContext [acceptTrip]: Error al guardar en trips:', err.message);
    }
  }, [activeTrip]);

  // Rechazar o ignorar la solicitud de viaje
  const rejectTrip = useCallback(() => {
    setActiveTrip(null);
    setTripState(TRIP_STATUS.IDLE);
  }, []);

  // Notificar llegada al punto de recogida
  const notifyArrival = useCallback(async () => {
    if (!activeTrip) return;

    const updated = {
      ...activeTrip,
      status: TRIP_STATUS.ARRIVED,
      arrivedAt: new Date().toISOString(),
    };

    setActiveTrip(updated);
    setTripState(TRIP_STATUS.ARRIVED);

    try {
      const tripRef = doc(db, TRIPS_COLLECTION, updated.id);
      await updateDoc(tripRef, { status: TRIP_STATUS.ARRIVED });
    } catch (err) {
      console.warn('TripContext [notifyArrival]:', err.message);
    }
  }, [activeTrip]);

  // Iniciar el viaje con el pasajero a bordo
  const startTrip = useCallback(async () => {
    if (!activeTrip) return;

    const updated = {
      ...activeTrip,
      status: TRIP_STATUS.IN_PROGRESS,
      startedAt: new Date().toISOString(),
    };

    setActiveTrip(updated);
    setTripState(TRIP_STATUS.IN_PROGRESS);

    try {
      const tripRef = doc(db, TRIPS_COLLECTION, updated.id);
      await updateDoc(tripRef, { status: TRIP_STATUS.IN_PROGRESS });
    } catch (err) {
      console.warn('TripContext [startTrip]:', err.message);
    }
  }, [activeTrip]);

  // Finalizar el viaje y liquidar el cobro
  const finishTrip = useCallback(async () => {
    if (!activeTrip) return;

    const netEarnings = activeTrip.driverEarnings;
    const updated = {
      ...activeTrip,
      status: TRIP_STATUS.COMPLETED,
      completedAt: new Date().toISOString(),
    };

    setActiveTrip(updated);
    setTripState(TRIP_STATUS.COMPLETED);
    setDailyEarnings((prev) => prev + netEarnings);
    setCompletedTripsCount((prev) => prev + 1);

    // 1. Actualizar balance en AuthContext
    if (updateDriverBalance) {
      await updateDriverBalance(netEarnings);
    }

    // 2. Persistir viaje completado en Firestore
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, updated.id);
      await updateDoc(tripRef, {
        status: TRIP_STATUS.COMPLETED,
        completedAt: updated.completedAt,
      });

      // 3. Persistir saldo nuevo en la colección 'drivers'
      if (driver?.id) {
        const newBalance = (driver.balance || 0) + netEarnings;
        await updateDriverBalanceInDb(driver.id, newBalance);
      }
    } catch (err) {
      console.warn('TripContext [finishTrip]:', err.message);
    }
  }, [activeTrip, driver, updateDriverBalance]);

  // Restablecer a estado disponible para esperar nuevo servicio
  const resetTrip = useCallback(() => {
    setActiveTrip(null);
    setTripState(TRIP_STATUS.IDLE);
  }, []);

  return (
    <TripContext.Provider
      value={{
        isOnline,
        tripState,
        activeTrip,
        dailyEarnings,
        completedTripsCount,
        formattedDailyEarnings: formatCOP(dailyEarnings),
        setOnlineStatus,
        toggleOnlineStatus,
        simulateIncomingTrip,
        acceptTrip,
        rejectTrip,
        notifyArrival,
        startTrip,
        finishTrip,
        resetTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip debe utilizarse dentro de un TripProvider');
  }
  return context;
}

export default TripContext;
