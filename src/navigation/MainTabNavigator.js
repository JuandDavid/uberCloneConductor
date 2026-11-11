import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/main/HomeScreen';
import { EarningsScreen } from '../screens/main/EarningsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();

/**
 * Navegador de Pestañas Inferiores del Conductor (MainTabNavigator).
 * Implementado bajo arquitectura modular y estándar de diseño Uber Driver (Docente Paula Andrea):
 * 1. Pestaña 'Conducir': Mapa en vivo, switch circular Online/Offline y recepción de viajes.
 * 2. Pestaña 'Ganancias': Métricas acumuladas del día, balance disponible y liquidación.
 * 3. Pestaña 'Perfil': Datos del conductor, vehículo asignado y control de sesión.
 */
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Conducir',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'car-sport' : 'car-sport-outline'}
              size={size + 1}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Ganancias',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopColor: '#1F2937',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    elevation: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default MainTabNavigator;
