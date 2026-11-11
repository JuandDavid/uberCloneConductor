import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio centralizado de base de datos Firestore (dbService.js)
 * Estructurado según las directrices académicas de la profesora Paula Andrea Muñoz Correa:
 * - Centraliza todas las operaciones de base de datos (nunca consultas directas en las vistas).
 * - Utiliza la colección 'drivers' para persistencia de conductores con estado 'pending_approval'.
 * - Implementa setDoc con { merge: true }, getDoc con snap.exists() y updateDoc.
 */

// Nombres de colecciones oficiales
export const DRIVERS_COLLECTION = 'drivers';
export const TRIPS_COLLECTION = 'trips';

// ==========================================
// 1. CONDUCTOR (Colección 'drivers')
// ==========================================

/**
 * Guarda o actualiza un conductor en la colección 'drivers'.
 * Cumple con el registro de las pestañas (personal, vehículo, documentos)
 * y asigna por defecto el estado 'pending_approval' si no viene definido.
 *
 * @param {Object} driverData - Datos completos del conductor
 * @returns {Promise<Object>} Objeto del conductor guardado con ID y fechas
 */
export async function saveDriver(driverData) {
  try {
    const driverId = driverData.id || `driver_${Date.now()}`;
    const docRef = doc(db, DRIVERS_COLLECTION, driverId);

    const dataToSave = {
      ...driverData,
      id: driverId,
      status: driverData.status || 'pending_approval',
      updatedAt: new Date().toISOString(),
      createdAt: driverData.createdAt || new Date().toISOString(),
    };

    // setDoc con merge tal como enseñó la docente
    await setDoc(docRef, dataToSave, { merge: true });
    return dataToSave;
  } catch (error) {
    console.warn('dbService [saveDriver]:', error.message);
    throw error;
  }
}

/**
 * Consulta un conductor específico por su ID único.
 * Implementa el patrón explicado por la docente: getDoc y snap.exists().
 *
 * @param {string} driverId
 * @returns {Promise<Object|null>} Datos del conductor o null si no existe
 */
export async function getDriver(driverId) {
  try {
    const docRef = doc(db, DRIVERS_COLLECTION, driverId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.warn('dbService [getDriver]:', error.message);
    return null;
  }
}

/**
 * Actualiza el estado de aprobación del conductor ('pending_approval' | 'approved').
 *
 * @param {string} driverId
 * @param {string} status
 */
export async function updateDriverStatus(driverId, status) {
  try {
    const docRef = doc(db, DRIVERS_COLLECTION, driverId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('dbService [updateDriverStatus]:', error.message);
    throw error;
  }
}

/**
 * Actualiza el saldo en plataforma del conductor.
 *
 * @param {string} driverId
 * @param {number} newBalance
 */
export async function updateDriverBalanceInDb(driverId, newBalance) {
  try {
    const docRef = doc(db, DRIVERS_COLLECTION, driverId);
    await updateDoc(docRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('dbService [updateDriverBalance]:', error.message);
  }
}

/**
 * Busca un conductor en la colección 'drivers' por su número de documento (cédula) o correo electrónico.
 * Implementa queries estructuradas de Firestore según las directrices de la docente.
 *
 * @param {string} identifier - Cédula o correo
 * @returns {Promise<Object|null>}
 */
export async function findDriverByIdentifier(identifier) {
  try {
    const cleanId = String(identifier || '').trim();
    if (!cleanId) return null;

    // 1. Buscar coincidencia exacta por cédula (documentId)
    const qDoc = query(
      collection(db, DRIVERS_COLLECTION),
      where('documentId', '==', cleanId)
    );
    const snapDoc = await getDocs(qDoc);
    if (!snapDoc.empty) {
      const docData = snapDoc.docs[0];
      return { id: docData.id, ...docData.data() };
    }

    // 2. Buscar coincidencia por correo electrónico (email)
    const qEmail = query(
      collection(db, DRIVERS_COLLECTION),
      where('email', '==', cleanId.toLowerCase())
    );
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      const docData = snapEmail.docs[0];
      return { id: docData.id, ...docData.data() };
    }

    return null;
  } catch (error) {
    console.warn('dbService [findDriverByIdentifier]:', error.message);
    return null;
  }
}

// ==========================================
// 2. VIAJES (Colección 'trips')
// ==========================================

/**
 * Guarda o actualiza un viaje en la colección 'trips'.
 * Cumple con el estándar de la docente: setDoc con { merge: true }.
 * 
 * @param {Object} tripData - Datos completos del viaje
 * @returns {Promise<Object>} Viaje guardado
 */
export async function saveTrip(tripData) {
  try {
    const tripId = tripData.id || `trip_${Date.now()}`;
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    const dataToSave = {
      ...tripData,
      id: tripId,
      updatedAt: new Date().toISOString(),
      createdAt: tripData.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
    return dataToSave;
  } catch (error) {
    console.warn('dbService [saveTrip]:', error.message);
    throw error;
  }
}

/**
 * Actualiza el estado operativo y marcas de tiempo de un viaje en Firestore.
 * 
 * @param {string} tripId
 * @param {string} status - 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
 * @param {Object} additionalData - Campos opcionales (e.g. arrivedAt, startedAt, completedAt, cancelReason)
 */
export async function updateTripStatus(tripId, status, additionalData = {}) {
  try {
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    await updateDoc(docRef, {
      status,
      ...additionalData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('dbService [updateTripStatus]:', error.message);
    throw error;
  }
}

/**
 * Obtiene los detalles de un viaje por su ID.
 * 
 * @param {string} tripId
 * @returns {Promise<Object|null>}
 */
export async function getTrip(tripId) {
  try {
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.warn('dbService [getTrip]:', error.message);
    return null;
  }
}

/**
 * Obtiene el historial de viajes de un conductor específico.
 * 
 * @param {string} driverId
 * @returns {Promise<Array>} Lista de viajes ordenados cronológicamente
 */
export async function getDriverTrips(driverId) {
  try {
    if (!driverId) return [];
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('driverId', '==', driverId)
    );
    const snap = await getDocs(q);
    const trips = [];
    snap.forEach((d) => trips.push({ id: d.id, ...d.data() }));
    return trips.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (error) {
    console.warn('dbService [getDriverTrips]:', error.message);
    return [];
  }
}

export default {
  saveDriver,
  getDriver,
  updateDriverStatus,
  updateDriverBalanceInDb,
  findDriverByIdentifier,
  saveTrip,
  updateTripStatus,
  getTrip,
  getDriverTrips,
};
