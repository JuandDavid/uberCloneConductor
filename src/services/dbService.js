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

export default {
  saveDriver,
  getDriver,
  updateDriverStatus,
  updateDriverBalanceInDb,
  findDriverByIdentifier,
};
