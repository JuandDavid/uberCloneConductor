import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

/**
 * Pantalla de Perfil del Conductor (ProfileScreen)
 * Centro de gestión de perfil, vehículo, documentos reglamentarios y sesión del conductor.
 * 
 * Reglas académicas (Docente Paula Andrea Muñoz Correa):
 * 1. Arquitectura desacoplada: consume de AuthContext de forma reactiva.
 * 2. Cero popups de Alert.alert(); las confirmaciones y retroalimentaciones son modales/inline.
 * 3. Módulo de verificación de documentos (SOAT, Licencia, Tecnomecánica).
 * 4. Switch interactivo para alternar el estado de aprobación durante la sustentación docente.
 */
export function ProfileScreen({ navigation }) {
  const {
    driver,
    logout,
    toggleApprovalStatus,
    isApproved,
    language,
    changeLanguage,
  } = useAuth();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const driverName = driver?.fullName || 'Conductor';
  const driverEmail = driver?.email || 'conductor@uberclone.com';
  const driverPhone = driver?.phone || '3001234567';
  const documentId = driver?.documentId || '1098765432';

  const vehiclePlate = driver?.vehicle?.plate || 'ABC123';
  const vehicleName = `${driver?.vehicle?.makeModel || 'Chevrolet Onix'} (${driver?.vehicle?.year || '2022'})`;
  const vehicleColor = driver?.vehicle?.color || 'Gris Plata';
  const category = (driver?.vehicle?.category || 'economy').toUpperCase();
  const capacity = driver?.vehicle?.capacity || 4;

  const licenseNum = driver?.documents?.licenseNumber || 'C1-9876543';
  const licenseExp = driver?.documents?.licenseExpiry || '2028-12-31';
  const soatExp = driver?.documents?.soatExpiry || '2027-11-20';
  const tecnoExp = driver?.documents?.tecnoExpiry || '2027-10-15';
  const mpEmail = driver?.documents?.mpEmail || driverEmail;

  // Alternar aprobación con feedback visual inline
  const handleToggleApproval = () => {
    toggleApprovalStatus();
    const willBeApproved = !isApproved;
    setFeedbackMessage(
      willBeApproved
        ? '¡Cuenta cambiada a APROBADA! Habilitado para recibir viajes.'
        : 'Cuenta cambiada a EN REVISIÓN (pending_approval) para prueba de flujo.'
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Cambiar idioma con feedback
  const handleToggleLanguage = (newLang) => {
    if (changeLanguage) {
      changeLanguage(newLang);
      setFeedbackMessage(
        newLang === 'es' ? 'Idioma cambiado a Español.' : 'Language changed to English.'
      );
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Confirmar cierre de sesión seguro
  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation?.navigate?.('PendingApproval')}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark" size={18} color="#15803D" />
          <Text style={styles.headerButtonText}>Estado</Text>
        </TouchableOpacity>
      </View>

      {/* BANNER DE FEEDBACK INLINE (Cero Alert.alert) */}
      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#15803D" />
          <Text style={styles.feedbackBannerText}>{feedbackMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TARJETA DE PERFIL Y ESTADO */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>
              {driverName}
            </Text>
            <Text style={styles.profileEmail}>{driverEmail}</Text>
            <Text style={styles.profilePhone}>C.C. {documentId} • {driverPhone}</Text>

            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusBadge, isApproved ? styles.badgeApproved : styles.badgePending]}>
                <Text style={[styles.statusBadgeText, isApproved ? styles.textApproved : styles.textPending]}>
                  {isApproved ? 'CONDUCTOR APROBADO' : 'EN REVISIÓN'}
                </Text>
              </View>
              <Text style={styles.ratingBadge}>⭐ 5.0 (Excelente)</Text>
            </View>
          </View>
        </View>

        {/* TARJETA DE VEHÍCULO */}
        <Text style={styles.sectionTitle}>VEHÍCULO ASIGNADO</Text>
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeaderRow}>
            <View style={styles.vehicleIconBox}>
              <Ionicons name="car-sport" size={24} color={colors.white} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleTitle}>{vehicleName}</Text>
              <Text style={styles.vehicleSubinfo}>Color: {vehicleColor} • Capacidad: {capacity} personas</Text>
            </View>
            <View style={styles.plateTag}>
              <Text style={styles.plateTagText}>{vehiclePlate}</Text>
            </View>
          </View>

          <View style={styles.vehicleDivider} />

          <View style={styles.vehicleMetaRow}>
            <View style={styles.vehicleMetaItem}>
              <Text style={styles.metaLabel}>Categoría</Text>
              <Text style={styles.metaValue}>{category}</Text>
            </View>
            <View style={styles.vehicleMetaItem}>
              <Text style={styles.metaLabel}>Tarifa Base</Text>
              <Text style={styles.metaValue}>$ 4.500 COP</Text>
            </View>
            <View style={styles.vehicleMetaItem}>
              <Text style={styles.metaLabel}>Por Km</Text>
              <Text style={styles.metaValue}>$ 1.200 COP</Text>
            </View>
          </View>
        </View>

        {/* DOCUMENTOS Y VIGENCIAS LEGALES */}
        <Text style={styles.sectionTitle}>DOCUMENTOS Y VIGENCIAS</Text>
        <View style={styles.documentsCard}>
          <View style={styles.docRow}>
            <Ionicons name="card-outline" size={18} color="#60A5FA" />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>Licencia de Conducción ({licenseNum})</Text>
              <Text style={styles.docExpiry}>Vence: {licenseExp}</Text>
            </View>
            <View style={styles.validBadge}>
              <Text style={styles.validBadgeText}>Vigente</Text>
            </View>
          </View>

          <View style={styles.docDivider} />

          <View style={styles.docRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#4ADE80" />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>Póliza SOAT Obligatoria</Text>
              <Text style={styles.docExpiry}>Vence: {soatExp}</Text>
            </View>
            <View style={styles.validBadge}>
              <Text style={styles.validBadgeText}>Vigente</Text>
            </View>
          </View>

          <View style={styles.docDivider} />

          <View style={styles.docRow}>
            <Ionicons name="construct-outline" size={18} color="#FBBF24" />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>Revisión Técnico-Mecánica</Text>
              <Text style={styles.docExpiry}>Vence: {tecnoExp}</Text>
            </View>
            <View style={styles.validBadge}>
              <Text style={styles.validBadgeText}>Vigente</Text>
            </View>
          </View>

          <View style={styles.docDivider} />

          <View style={styles.docRow}>
            <Ionicons name="wallet-outline" size={18} color="#C084FC" />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>Dispersión de Pagos</Text>
              <Text style={styles.docExpiry}>{mpEmail}</Text>
            </View>
            <View style={styles.validBadge}>
              <Text style={styles.validBadgeText}>Vinculada</Text>
            </View>
          </View>
        </View>

        {/* PREFERENCIAS DE LA APP */}
        <Text style={styles.sectionTitle}>PREFERENCIAS</Text>
        <View style={styles.preferencesCard}>
          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefTitle}>Idioma de la Interfaz</Text>
              <Text style={styles.prefSubtitle}>Selecciona el idioma del panel</Text>
            </View>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'es' && styles.langBtnActive]}
                onPress={() => handleToggleLanguage('es')}
                activeOpacity={0.7}
              >
                <Text style={[styles.langText, language === 'es' && styles.langTextActive]}>ES</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                onPress={() => handleToggleLanguage('en')}
                activeOpacity={0.7}
              >
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* DEMOSTRACIÓN DOCENTE: ALTERNAR APROBACIÓN */}
        <Text style={styles.sectionTitle}>MODO DEMOSTRACIÓN (DOCENTE PAULA ANDREA)</Text>
        <TouchableOpacity
          style={styles.demoToggleCard}
          onPress={handleToggleApproval}
          activeOpacity={0.8}
        >
          <View style={styles.demoIconBox}>
            <Ionicons name="swap-horizontal" size={20} color="#D97706" />
          </View>
          <View style={styles.demoTextWrap}>
            <Text style={styles.demoTitle}>Alternar Estado de Aprobación</Text>
            <Text style={styles.demoSubtitle}>
              Estado actual: {isApproved ? 'Aprobado (Conducir)' : 'En Revisión (PendingApproval)'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#D97706" />
        </TouchableOpacity>

        {/* BOTÓN DE CIERRE DE SESIÓN */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN (Cero Alert.alert) */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <Ionicons name="log-out" size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.modalSubtitle}>
              Tu sesión se cerrará en este dispositivo. Deberás ingresar tu cédula o correo para volver a entrar.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmModalBtnText}>Sí, Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#166534',
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#86EFAC',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
  },
  profileEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeApproved: {
    backgroundColor: '#14532D',
  },
  badgePending: {
    backgroundColor: '#78350F',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textApproved: {
    color: '#4ADE80',
  },
  textPending: {
    color: '#FDE047',
  },
  ratingBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  vehicleCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  vehicleSubinfo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  plateTag: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plateTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.black,
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: spacing.sm,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vehicleMetaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  documentsCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  docExpiry: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  validBadge: {
    backgroundColor: '#14532D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  validBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4ADE80',
  },
  docDivider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: spacing.sm,
  },
  preferencesCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefTextWrap: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  prefSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#05A357',
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  langTextActive: {
    color: colors.white,
  },
  demoToggleCard: {
    backgroundColor: '#1E1B18',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#78350F',
  },
  demoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#451A03',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  demoTextWrap: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDE047',
  },
  demoSubtitle: {
    fontSize: 11,
    color: '#D4D4D8',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#450A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: 12,
    backgroundColor: '#27272A',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  confirmModalBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  confirmModalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});

export default ProfileScreen;
