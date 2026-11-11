import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { colors, spacing } from '../../styles/theme';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { getDriver } from '../../services/dbService';

/**
 * Pantalla de Estado de Aprobación del Conductor (PendingApprovalScreen)
 * Diseñada para conductores con estado 'pending_approval' o 'approved'.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Muestra el estado del conductor en tiempo real desde Firestore ('drivers').
 * 2. CERO uso de diálogos emergentes 'Alert.alert()'; mensajes y estados visuales inline.
 * 3. Proporciona botón de simulación docente para alternar estado y sustentar la transición.
 */
export function PendingApprovalScreen({ navigation }) {
  const { driver, toggleApprovalStatus, logout, setDriver } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState(null);

  const isApproved = driver?.status === 'approved';

  // Sincronización en tiempo real con Firestore para detectar cambios del administrador
  useEffect(() => {
    if (!driver?.id) return;

    try {
      const docRef = doc(db, 'drivers', driver.id);
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const remoteData = snap.data();
            if (remoteData.status && remoteData.status !== driver.status) {
              setDriver((prev) => ({
                ...prev,
                ...remoteData,
                status: remoteData.status,
              }));
            }
          }
        },
        (error) => {
          console.warn('PendingApprovalScreen [onSnapshot]:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('PendingApprovalScreen [useEffect]:', err);
    }
  }, [driver?.id, driver?.status]);

  // Recarga manual al deslizar o presionar botón
  const handleRefresh = async () => {
    if (!driver?.id) return;
    setIsRefreshing(true);
    setLastCheckMessage(null);

    try {
      const updated = await getDriver(driver.id);
      if (updated) {
        setDriver((prev) => ({ ...prev, ...updated }));
        setLastCheckMessage('Información sincronizada con Firestore exitosamente.');
      } else {
        setLastCheckMessage('Conductor verificado con datos locales activos.');
      }
    } catch (err) {
      setLastCheckMessage('Error al consultar Firestore. Mostrando último estado en caché.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Acción para simular la aprobación administrativa en clase con la docente
  const handleToggleSimulatedStatus = async () => {
    try {
      setIsToggling(true);
      await toggleApprovalStatus();
      setLastCheckMessage(
        isApproved
          ? 'Estado revertido a "Pendiente de Aprobación" para demostración.'
          : '¡Estado actualizado a "Aprobado"! Conductor habilitado en plataforma.'
      );
    } catch (err) {
      console.warn('Error al alternar estado simulado:', err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.black]}
            tintColor={colors.black}
          />
        }
      >
        {/* Cabecera Superior */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estado de la Cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tarjeta Principal de Estado */}
        <View style={[styles.statusHeroCard, isApproved ? styles.statusHeroCardApproved : styles.statusHeroCardPending]}>
          <View style={[styles.statusIconCircle, isApproved ? styles.statusIconCircleApproved : styles.statusIconCirclePending]}>
            <Ionicons
              name={isApproved ? 'shield-checkmark' : 'time'}
              size={36}
              color={isApproved ? '#15803D' : '#B45309'}
            />
          </View>

          <Text style={styles.statusHeroTitle}>
            {isApproved ? '¡Cuenta Aprobada y Activa!' : 'Solicitud en Revisión'}
          </Text>

          <Text style={styles.statusHeroSubtitle}>
            {isApproved
              ? 'Tus documentos han sido validados oficialmente por el administrador. Ya puedes conectarte y aceptar solicitudes de viaje.'
              : 'Tus documentos personales y vehiculares están siendo verificados por el equipo de seguridad. Este proceso garantiza la calidad del servicio.'}
          </Text>

          {/* Badge de Estado en Tiempo Real */}
          <View style={[styles.badgePill, isApproved ? styles.badgePillApproved : styles.badgePillPending]}>
            <View style={[styles.liveDot, isApproved ? styles.liveDotApproved : styles.liveDotPending]} />
            <Text style={[styles.badgePillText, isApproved ? styles.badgePillTextApproved : styles.badgePillTextPending]}>
              {isApproved ? 'STATUS: APPROVED' : 'STATUS: PENDING_APPROVAL'}
            </Text>
          </View>
        </View>

        {/* Mensaje de Retroalimentación Inline */}
        {lastCheckMessage && (
          <View style={styles.feedbackBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={styles.feedbackBannerText}>{lastCheckMessage}</Text>
          </View>
        )}

        {/* Resumen del Conductor Registrado */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-circle-outline" size={20} color={colors.black} />
            <Text style={styles.sectionTitle}>Datos del Conductor</Text>
          </View>

          <View style={styles.driverProfileRow}>
            {driver?.photoUri ? (
              <Image source={{ uri: driver.photoUri }} style={styles.driverAvatar} />
            ) : (
              <View style={styles.driverAvatarPlaceholder}>
                <Ionicons name="person" size={28} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.driverProfileInfo}>
              <Text style={styles.driverName}>{driver?.fullName || 'Conductor Registrado'}</Text>
              <Text style={styles.driverSubtext}>C.C. {driver?.documentId || 'Sin registrar'}</Text>
              <Text style={styles.driverSubtext}>{driver?.email || 'Sin correo registrado'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Información del Vehículo */}
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleBadge}>
              <Text style={styles.vehiclePlateText}>{driver?.vehicle?.plate || 'ABC123'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.vehicleTitle}>
                {driver?.vehicle?.make || 'Vehículo'} {driver?.vehicle?.model || ''} ({driver?.vehicle?.year || '2021'})
              </Text>
              <Text style={styles.vehicleCategory}>
                Categoría: {(driver?.vehicle?.category || 'economy').toUpperCase()} • {driver?.vehicle?.capacity || 4} Pasajeros
              </Text>
            </View>
          </View>
        </View>

        {/* Checklist de Documentación */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="documents-outline" size={20} color={colors.black} />
            <Text style={styles.sectionTitle}>Checklist de Documentos</Text>
          </View>

          <View style={styles.checkItem}>
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={isApproved ? '#15803D' : colors.textSecondary}
            />
            <View style={styles.checkItemTextContainer}>
              <Text style={styles.checkItemTitle}>Documento de Identidad (Cédula)</Text>
              <Text style={styles.checkItemSubtitle}>Cédula registrada: {driver?.documentId || 'Cargada'}</Text>
            </View>
            <Text style={[styles.checkItemStatus, isApproved && styles.checkItemStatusApproved]}>
              {isApproved ? 'Verificado' : 'En revisión'}
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={isApproved ? '#15803D' : colors.textSecondary}
            />
            <View style={styles.checkItemTextContainer}>
              <Text style={styles.checkItemTitle}>Licencia de Conducción</Text>
              <Text style={styles.checkItemSubtitle}>
                No. {driver?.documents?.licenseNumber || 'Registrada'}
              </Text>
            </View>
            <Text style={[styles.checkItemStatus, isApproved && styles.checkItemStatusApproved]}>
              {isApproved ? 'Verificado' : 'En revisión'}
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={isApproved ? '#15803D' : colors.textSecondary}
            />
            <View style={styles.checkItemTextContainer}>
              <Text style={styles.checkItemTitle}>Póliza de SOAT</Text>
              <Text style={styles.checkItemSubtitle}>
                Vence: {driver?.documents?.soatExpiry || 'Vigente'}
              </Text>
            </View>
            <Text style={[styles.checkItemStatus, isApproved && styles.checkItemStatusApproved]}>
              {isApproved ? 'Vigente' : 'En revisión'}
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={22}
              color={isApproved ? '#15803D' : colors.textSecondary}
            />
            <View style={styles.checkItemTextContainer}>
              <Text style={styles.checkItemTitle}>Términos y Liquidación</Text>
              <Text style={styles.checkItemSubtitle}>Términos de la plataforma aceptados</Text>
            </View>
            <Text style={[styles.checkItemStatus, isApproved && styles.checkItemStatusApproved]}>
              Aceptado
            </Text>
          </View>
        </View>

        {/* Zona de Demostración Docente (Paula Andrea) */}
        <View style={styles.academicDemoCard}>
          <View style={styles.academicDemoHeader}>
            <Ionicons name="school-outline" size={20} color="#6366F1" />
            <Text style={styles.academicDemoTitle}>Sustentación Docente — Paula Andrea</Text>
          </View>
          <Text style={styles.academicDemoDesc}>
            Para la sustentación en clase: utiliza este control para alternar el estado en tiempo real en Firestore
            ('pending_approval' ⟷ 'approved') y demostrar la transición del conductor.
          </Text>

          <CustomButton
            title={
              isToggling
                ? 'Actualizando Firestore...'
                : isApproved
                ? 'Simular Desaprobación (Volver a Pendiente)'
                : 'Simular Aprobación Docente (Habilitar)'
            }
            onPress={handleToggleSimulatedStatus}
            loading={isToggling}
            variant={isApproved ? 'outline' : 'primary'}
            style={{ width: '100%', marginTop: spacing.sm }}
          />
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsContainer}>
          {isApproved && (
            <CustomButton
              title="Abrir Mapa del Conductor"
              onPress={() => navigation?.navigate?.('Home')}
              style={{ width: '100%', marginBottom: spacing.sm }}
            />
          )}

          <CustomButton
            title="Consultar Estado en Tiempo Real"
            variant="secondary"
            onPress={handleRefresh}
            loading={isRefreshing}
            style={{ width: '100%', marginBottom: spacing.sm }}
          />

          <CustomButton
            title="Volver al Formulario de Registro"
            variant="outline"
            onPress={() => navigation?.navigate?.('Register')}
            style={{ width: '100%', marginBottom: spacing.sm }}
          />

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.offline} />
            <Text style={styles.logoutButtonText}>Cerrar Sesión del Conductor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusHeroCard: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  statusHeroCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusHeroCardApproved: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusIconCirclePending: {
    backgroundColor: '#FEF3C7',
  },
  statusIconCircleApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statusHeroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgePillPending: {
    backgroundColor: '#FDF6B2',
  },
  badgePillApproved: {
    backgroundColor: '#DEF7EC',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotPending: {
    backgroundColor: '#D97706',
  },
  liveDotApproved: {
    backgroundColor: '#057A55',
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgePillTextPending: {
    color: '#92400E',
  },
  badgePillTextApproved: {
    color: '#03543F',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
    gap: 8,
  },
  feedbackBannerText: {
    fontSize: 13,
    color: colors.info,
    flex: 1,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverProfileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleBadge: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CA8A04',
  },
  vehiclePlateText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 1,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vehicleCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  checkItemTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  checkItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checkItemSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  checkItemStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  checkItemStatusApproved: {
    color: '#15803D',
  },
  academicDemoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginBottom: spacing.md,
  },
  academicDemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  academicDemoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  academicDemoDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  actionsContainer: {
    marginTop: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.offline,
  },
});
