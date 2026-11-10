import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

const Stack = createNativeStackNavigator();

/**
 * Navegador principal tipo Stack de la aplicación.
 * Gestiona el flujo entre el registro de conductor, estado de aprobación y pantallas principales.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Register"
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
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Registro de Conductor',
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="PendingApproval"
        component={PendingApprovalScreen}
        options={{
          title: 'Estado de la Cuenta',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default RootNavigator;
