import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDriver, findDriverByIdentifier } from '../services/dbService';

const AuthContext = createContext();

const STORAGE_KEYS = {
  DRIVER_SESSION: '@uberclone_driver_session',
  LANGUAGE: '@uberclone_language',
  LAST_AVAILABILITY: '@uberclone_last_availability',
};

// Conductor inicial de prueba para facilitar demostración del flujo
const DEFAULT_DEMO_DRIVER = {
  id: 'driver_fiera_01',
  fullName: 'Juan Felipe (Fiera)',
  documentId: '1098765432',
  phone: '3001234567',
  email: 'fiera.driver@uberclone.com',
  birthDate: '2000-05-15',
  gender: 'Masculino',
  language: 'es',
  photoUri: null,
  status: 'pending_approval', // Todo registro inicia en 'pending_approval' según el PDF
  balance: 0,
  rating: 5.0,
  vehicle: {
    category: 'economy',
    plate: 'ABC123',
    makeModel: 'Chevrolet Onix',
    year: '2022',
    color: 'Gris Plata',
    capacity: 4,
    photoUri: null,
  },
  documents: {
    licenseNumber: 'C1-9876543',
    licenseExpiry: '2028-12-31',
    soatExpiry: '2027-11-20',
    tecnoExpiry: '2027-10-15',
    mpEmail: 'fiera.driver@mercadopago.com',
    termsAccepted: true,
  },
};

/**
 * Proveedor de Autenticación y Estado del Conductor (AuthContext).
 * Gestiona la sesión activa y almacenamiento local persistente con AsyncStorage.
 */
export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [language, setLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión y preferencias guardadas en AsyncStorage al iniciar
  useEffect(() => {
    async function loadStoredData() {
      try {
        const [storedSession, storedLang] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DRIVER_SESSION),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        ]);

        if (storedSession) {
          setDriver(JSON.parse(storedSession));
        } else {
          setDriver(null);
        }

        if (storedLang) {
          setLanguage(storedLang);
        }
      } catch (err) {
        console.warn('AuthContext [loadStoredData]: Error al cargar sesión local:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredData();
  }, []);

  // Guardar en AsyncStorage y sincronizar en Firestore (Colección 'drivers')
  const persistDriver = async (updatedDriver) => {
    setDriver(updatedDriver);
    if (updatedDriver) {
      await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_SESSION, JSON.stringify(updatedDriver));
      // Sincronizar automáticamente en la colección 'drivers' de Firestore en segundo plano
      saveDriver(updatedDriver).catch((err) => {
        console.warn('AuthContext [persistDriver]: Error al sincronizar con Firestore:', err.message);
      });
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_SESSION);
    }
  };

  // Registrar nuevo conductor (inicia siempre con estado 'pending_approval')
  const registerDriver = async (formData) => {
    const newDriver = {
      id: `driver_${Date.now()}`,
      fullName: formData.personal?.fullName || '',
      documentId: formData.personal?.documentId || '',
      phone: formData.personal?.phone || '',
      email: formData.personal?.email || '',
      birthDate: formData.personal?.birthDate || '',
      gender: formData.personal?.gender || 'Masculino',
      language: formData.personal?.language || 'es',
      photoUri: formData.personal?.photoUri || null,
      status: 'pending_approval', // Requisito estricto: requiere aprobación antes de operar
      balance: 0,
      rating: 5.0,
      vehicle: { ...formData.vehicle },
      documents: { ...formData.documents },
    };

    await persistDriver(newDriver);
    return newDriver;
  };

  // Simulación para alternar estado de aprobación (Aprobado <-> Pendiente)
  const toggleApprovalStatus = async () => {
    if (!driver) return;
    const nextStatus = driver.status === 'approved' ? 'pending_approval' : 'approved';
    const updated = { ...driver, status: nextStatus };
    await persistDriver(updated);
  };

  // Actualizar datos del perfil
  const updateDriverProfile = async (partialData) => {
    if (!driver) return;
    const updated = { ...driver, ...partialData };
    await persistDriver(updated);
  };

  // Actualizar saldo del conductor
  const updateDriverBalance = async (amountDelta) => {
    if (!driver) return;
    const updated = {
      ...driver,
      balance: Math.round((driver.balance || 0) + amountDelta),
    };
    await persistDriver(updated);
  };

  // Cambiar idioma de la aplicación
  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
  };

  // Iniciar sesión buscando conductor por cédula o correo
  const loginWithIdentifier = async (identifier) => {
    const cleanId = String(identifier || '').trim();
    if (!cleanId) {
      throw new Error('Ingresa tu cédula o correo electrónico');
    }

    // 1. Verificar si coincide con la sesión o el demo local
    if (
      driver &&
      (String(driver.documentId).trim() === cleanId ||
        driver.email?.toLowerCase().trim() === cleanId.toLowerCase())
    ) {
      await persistDriver(driver);
      return driver;
    }

    if (
      DEFAULT_DEMO_DRIVER.documentId === cleanId ||
      DEFAULT_DEMO_DRIVER.email.toLowerCase() === cleanId.toLowerCase()
    ) {
      await persistDriver(DEFAULT_DEMO_DRIVER);
      return DEFAULT_DEMO_DRIVER;
    }

    // 2. Buscar en Firestore (colección 'drivers')
    const foundDriver = await findDriverByIdentifier(cleanId);
    if (foundDriver) {
      await persistDriver(foundDriver);
      return foundDriver;
    }

    throw new Error('No se encontró ningún conductor con este documento o correo');
  };

  // Cerrar sesión
  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_SESSION);
    setDriver(null);
  };

  return (
    <AuthContext.Provider
      value={{
        driver,
        setDriver,
        isApproved: driver?.status === 'approved',
        language,
        isLoading,
        registerDriver,
        loginWithIdentifier,
        toggleApprovalStatus,
        updateDriverProfile,
        updateDriverBalance,
        changeLanguage,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
