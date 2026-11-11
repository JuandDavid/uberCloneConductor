import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../styles/theme';

const Stack = createNativeStackNavigator();

/**
 * Navegador principal condicional de la aplicación (RootNavigator).
 * Implementado bajo arquitectura modular y desacoplada (Docente Paula Andrea Muñoz Correa):
 * 1. Controla el flujo dinámico según el estado de la sesión en AuthContext:
 *    - Si no hay sesión activa: Muestra LoginScreen y RegisterScreen.
 *    - Si la cuenta está en revisión ('pending_approval'): Dirige a PendingApprovalScreen.
 *    - Si la cuenta está aprobada ('approved'): Abre HomeScreen con mapa interactivo y geolocalización.
 * 2. Despliega un splash/loading con tema oscuro corporativo mientras se verifica AsyncStorage.
 * 3. Transición limpia y sin destellos entre estados.
 */
export function RootNavigator() {
  const { driver, isLoading } = useAuth();

  // Pantalla de carga mientras se lee el estado persistido en AsyncStorage
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogoBox}>
          <Ionicons name="car-sport" size={34} color={colors.white} />
        </View>
        <Text style={styles.loadingTitle}>UberClone Conductor</Text>
        <ActivityIndicator size="small" color={colors.white} style={{ marginVertical: spacing.sm }} />
        <Text style={styles.loadingSubtitle}>Verificando credenciales de conductor...</Text>
      </View>
    );
  }

  const isPending = driver && driver.status === 'pending_approval';

  return (
    <Stack.Navigator
      initialRouteName={!driver ? 'Login' : isPending ? 'PendingApproval' : 'Home'}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        animation: 'slide_from_right',
      }}
    >
      {!driver ? (
        // --- FLUJO 1: NO AUTENTICADO (PÚBLICO) ---
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: 'Iniciar Sesión',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: 'Registro de Conductor',
              headerBackTitle: 'Atrás',
            }}
          />
        </>
      ) : isPending ? (
        // --- FLUJO 2: CONDUCTOR EN REVISIÓN (PENDING_APPROVAL) ---
        <>
          <Stack.Screen
            name="PendingApproval"
            component={PendingApprovalScreen}
            options={{
              title: 'Estado de la Cuenta',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Mapa Conductor',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: 'Datos de la Solicitud',
              headerBackTitle: 'Atrás',
            }}
          />
        </>
      ) : (
        // --- FLUJO 3: CONDUCTOR APROBADO (HABILITADO PARA OPERAR) ---
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Mapa Conductor',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PendingApproval"
            component={PendingApprovalScreen}
            options={{
              title: 'Panel del Conductor',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: 'Datos de Conductor',
              headerBackTitle: 'Atrás',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingLogoBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: spacing.xs,
  },
});

export default RootNavigator;
