import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';
import { InputWithValidation } from '../../components/InputWithValidation';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

/**
 * Pantalla de Inicio de Sesión del Conductor (LoginScreen).
 * Permite a conductores registrados autenticarse mediante su cédula o correo.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. CERO ventanas emergentes de Alert; todos los errores se muestran inline en color rojo (#E11D48).
 * 2. Validación y consulta centralizada en Firestore (colección 'drivers').
 * 3. Proporciona botones de acceso rápido demo para facilitar la sustentación en clase.
 */
export function LoginScreen({ navigation }) {
  const { loginWithIdentifier } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manejador del inicio de sesión
  const handleLogin = async (customId) => {
    Keyboard.dismiss();
    setError(null);
    const idToUse = String(customId || identifier || '').trim();

    if (!idToUse) {
      setError('Por favor ingresa tu número de cédula o correo electrónico');
      return;
    }

    try {
      setIsLoading(true);
      const loggedDriver = await loginWithIdentifier(idToUse);

      // Redirección inteligente según el estado del conductor
      if (loggedDriver.status === 'pending_approval') {
        navigation.navigate('PendingApproval');
      } else {
        // En fases posteriores redirigirá al Home Conductor
        navigation.navigate('PendingApproval');
      }
    } catch (err) {
      setError(err.message || 'No se encontró ningún conductor con los datos ingresados');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera / Hero de Bienvenida */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="car-sport" size={38} color={colors.white} />
            </View>
            <Text style={styles.appTitle}>UberClone Conductor</Text>
            <Text style={styles.appSubtitle}>
              Ingresa a tu cuenta para gestionar tu vehículo, disponibilidad y viajes
            </Text>
          </View>

          {/* Tarjeta del Formulario de Ingreso */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>
            <Text style={styles.formDesc}>
              Ingresa el número de cédula o correo registrado en la plataforma.
            </Text>

            <InputWithValidation
              label="Cédula de Ciudadanía o Correo"
              placeholder="Ej: 1098765432 o correo@ejemplo.com"
              value={identifier}
              onChangeText={(txt) => {
                setIdentifier(txt);
                if (error) setError(null);
              }}
              error={error}
              iconName="person-outline"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <CustomButton
              title="Ingresar a la Plataforma"
              onPress={() => handleLogin()}
              loading={isLoading}
              disabled={isLoading}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </View>

          {/* Accesos Rápidos Demo para Sustentación Docente */}
          <View style={styles.demoBox}>
            <View style={styles.demoHeader}>
              <Ionicons name="flash-outline" size={18} color="#D97706" />
              <Text style={styles.demoTitle}>Accesos Rápidos Demo (Sustentación)</Text>
            </View>
            <Text style={styles.demoSubtitle}>
              Toca una cuenta para iniciar sesión instantáneamente sin escribir:
            </Text>

            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => {
                setIdentifier('1098765432');
                handleLogin('1098765432');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle" size={24} color={colors.black} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.demoPillName}>Juan Felipe (Fiera)</Text>
                <Text style={styles.demoPillSub}>C.C. 1098765432 • Conductor Demo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => {
                setIdentifier('1020304050');
                handleLogin('1020304050');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle" size={24} color={colors.black} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.demoPillName}>Juan David (Juanda)</Text>
                <Text style={styles.demoPillSub}>C.C. 1020304050 • Conductor Registrado</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Enlace hacia el Registro */}
          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerPrompt}>¿Aún no te has registrado como conductor?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Crear Solicitud de Conductor</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  demoBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: spacing.lg,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  demoSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: spacing.sm,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: spacing.xs,
  },
  demoPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  demoPillSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  registerLinkContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  registerPrompt: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    textDecorationLine: 'underline',
  },
});
