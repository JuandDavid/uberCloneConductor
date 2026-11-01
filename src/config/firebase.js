import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuración oficial de Firebase para el proyecto UberClone Conductor.
 * Configurado según las directrices de la profesora Paula Andrea Muñoz Correa:
 * - Plataforma Web (</>)
 * - Sin uso de google-services.json nativo en Expo Go
 * - Exportación de la constante 'db' para Firestore
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDSQmqTMN7HQzL_zPiQD0qziRN5FvNNFJ0',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'uberclone-conductor10.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'uberclone-conductor10',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'uberclone-conductor10.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1031912853333',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1031912853333:web:dc5516e202adececc2e9dc',
};

// Inicializar Firebase evitando reinicializaciones duplicadas en desarrollo / Fast Refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Instancia centralizada de Firestore (constante 'db' obligatoria)
export const db = getFirestore(app);

export default app;
