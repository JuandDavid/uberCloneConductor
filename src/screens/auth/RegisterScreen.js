import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { colors, spacing } from '../../styles/theme';
import { InputWithValidation } from '../../components/InputWithValidation';
import { CustomButton } from '../../components/CustomButton';
import {
  DatePickerModal,
  formatReadableDate,
  parseDateString,
} from '../../components/DatePickerModal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';

const calculateAge = (year, month, day) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = (today.getMonth() + 1) - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
};

/**
 * Pantalla de Registro de Conductor.
 * Pestaña 1: Datos Personales con validaciones en línea (Inline UX).
 * 
 * Reglas académicas estrictas (Docente Paula Andrea Muñoz Correa):
 * 1. Los mensajes de error aparecen debajo de cada campo en texto rojo (#E11D48).
 * 2. NUNCA usar ventanas emergentes de Alert para validar formularios.
 * 3. El avance se bloquea si los campos no cumplen las expresiones regulares.
 */
export function RegisterScreen({ navigation }) {
  const { registerDriver, driver } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: Personal, 1: Vehículo, 2: Documentos

  // --- ESTADO: Pestaña 1 (Datos Personales) ---
  const [personal, setPersonal] = useState({
    fullName: '',
    documentId: '',
    phone: '',
    birthDate: '2000-01-01',
    gender: 'Masculino',
    email: '',
    language: 'es',
    photoUri: null,
  });

  // --- ESTADO: Pestaña 2 (Vehículo) ---
  const [vehicle, setVehicle] = useState({
    category: 'economy', // economy | xl | premium
    plate: '',
    make: '',
    model: '',
    year: '2021',
    color: 'Negro',
    capacity: '4',
    photoUri: null,
  });

  // --- ESTADO: Pestaña 3 (Documentación y Liquidación) ---
  const [docs, setDocs] = useState({
    licenseNumber: '',
    licensePhotoUri: null,
    soatExpiry: '2027-11-20',
    soatPhotoUri: null,
    tecnoPhotoUri: null,
    mpEmail: '',
    termsAccepted: true,
  });

  // --- ESTADO DE ERRORES EN LÍNEA ---
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredDriverData, setRegisteredDriverData] = useState(null);

  // --- SINCRONIZACIÓN EN TIEMPO REAL CON FIRESTORE (onSnapshot) ---
  // Escucha los cambios del conductor en la nube (ej: cuando el admin cambia status a 'approved')
  useEffect(() => {
    const driverId = registeredDriverData?.id || driver?.id;
    if (!driverId) return;

    try {
      const docRef = doc(db, 'drivers', driverId);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const cloudData = snapshot.data();
            setRegisteredDriverData((prev) => ({
              ...(prev || {}),
              ...cloudData,
            }));
          }
        },
        (error) => {
          console.warn('RegisterScreen [onSnapshot]:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('RegisterScreen [onSnapshot error]:', err);
    }
  }, [registeredDriverData?.id, driver?.id]);

  // --- ESTADO: Modales de Selección de Fecha (Nacimiento y SOAT) ---
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showSoatDatePicker, setShowSoatDatePicker] = useState(false);

  // --- ESTADO: Selector de Origen de Fotografía (Cámara vs Galería) ---
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [activePhotoTarget, setActivePhotoTarget] = useState(null); // personal | vehicle | license | soat | tecno

  // Formato legible de fecha para los campos de formulario
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const p = parseDateString(dateStr);
    return formatReadableDate(p.year, p.month, p.day);
  };

  // --- TÍTULOS DESCRIPTIVOS PARA EL MODAL DE FOTOGRAFÍAS ---
  const getPhotoTargetTitle = (target) => {
    switch (target) {
      case 'personal':
        return 'Foto de Perfil del Conductor';
      case 'vehicle':
        return 'Foto del Vehículo (Placa visible)';
      case 'license':
        return 'Licencia de Conducción';
      case 'soat':
        return 'Póliza de SOAT Vigente';
      case 'tecno':
        return 'Revisión Técnico-Mecánica';
      default:
        return 'Adjuntar Documentación';
    }
  };

  // Abre el modal para que el conductor decida si toma la foto con la cámara o la busca en su galería
  const pickImage = (type) => {
    setActivePhotoTarget(type);
    setPhotoModalVisible(true);
  };

  // Captura la foto usando la cámara física del móvil o seleccionándola de la galería
  const handleCaptureImage = async (source) => {
    const target = activePhotoTarget;
    setPhotoModalVisible(false);
    if (!target) return;

    try {
      const isDocument = ['license', 'soat', 'tecno'].includes(target);
      const aspect = isDocument ? [4, 3] : [1, 1];
      let result;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          const errField =
            target === 'personal'
              ? 'personalPhoto'
              : target === 'vehicle'
              ? 'vehiclePhoto'
              : `${target}Photo`;
          setErrors((prev) => ({
            ...prev,
            [errField]: 'Se requiere permiso de acceso a la cámara para tomar la fotografía.',
          }));
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          const errField =
            target === 'personal'
              ? 'personalPhoto'
              : target === 'vehicle'
              ? 'vehiclePhoto'
              : `${target}Photo`;
          setErrors((prev) => ({
            ...prev,
            [errField]: 'Se requiere permiso de acceso a la galería para seleccionar la fotografía.',
          }));
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        if (target === 'personal') {
          setPersonal((p) => ({ ...p, photoUri: uri }));
          if (errors.personalPhoto) setErrors((e) => ({ ...e, personalPhoto: null }));
        } else if (target === 'vehicle') {
          setVehicle((v) => ({ ...v, photoUri: uri }));
          if (errors.vehiclePhoto) setErrors((e) => ({ ...e, vehiclePhoto: null }));
        } else if (target === 'license') {
          setDocs((d) => ({ ...d, licensePhotoUri: uri }));
          if (errors.licensePhoto) setErrors((e) => ({ ...e, licensePhoto: null }));
        } else if (target === 'soat') {
          setDocs((d) => ({ ...d, soatPhotoUri: uri }));
          if (errors.soatPhoto) setErrors((e) => ({ ...e, soatPhoto: null }));
        } else if (target === 'tecno') {
          setDocs((d) => ({ ...d, tecnoPhotoUri: uri }));
          if (errors.tecnoPhoto) setErrors((e) => ({ ...e, tecnoPhoto: null }));
        }
      }
    } catch (err) {
      console.warn('Error al capturar/seleccionar imagen:', err);
    }
  };

  // --- VALIDACIÓN DE DATOS PERSONALES (PESTAÑA 1) ---
  const validatePersonal = () => {
    const errs = {};
    const currentYear = new Date().getFullYear();

    // 0. Foto de Perfil: obligatoria
    if (!personal.photoUri) {
      errs.personalPhoto = 'La foto de perfil es obligatoria';
    }

    // 1. Nombre Completo: obligatorio, máx 50 caracteres, solo letras y espacios
    if (!personal.fullName.trim()) {
      errs.fullName = 'El nombre completo es obligatorio';
    } else if (personal.fullName.length > 50) {
      errs.fullName = 'Máximo 50 caracteres permitidos';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(personal.fullName)) {
      errs.fullName = 'Solo se permiten letras y espacios';
    }

    // 2. Documento de Identidad: numérico, entre 6 y 10 dígitos
    if (!personal.documentId.trim()) {
      errs.documentId = 'El documento de identidad es obligatorio';
    } else if (!/^\d{6,10}$/.test(personal.documentId.trim())) {
      errs.documentId = 'Debe ser numérico de 6 a 10 dígitos';
    }

    // 3. Celular: numérico, exactamente 10 dígitos (formato estándar Colombia)
    if (!personal.phone.trim()) {
      errs.phone = 'El número de celular es obligatorio';
    } else if (!/^\d{10}$/.test(personal.phone.trim())) {
      errs.phone = 'Debe contener exactamente 10 dígitos';
    }

    // 4. Fecha de Nacimiento: mayor de 18 años (calculado con precisión de día, mes y año)
    const birthParts = (personal.birthDate || '').split('-');
    const bYear = parseInt(birthParts[0], 10);
    const bMonth = parseInt(birthParts[1], 10);
    const bDay = parseInt(birthParts[2], 10);

    if (!bYear || isNaN(bYear) || !bMonth || isNaN(bMonth) || !bDay || isNaN(bDay)) {
      errs.birthDate = 'Selecciona una fecha de nacimiento válida';
    } else {
      const calculatedAge = calculateAge(bYear, bMonth, bDay);
      if (calculatedAge < 18) {
        errs.birthDate = 'El conductor debe ser mayor de 18 años';
      }
    }

    // 5. Correo Electrónico: formato válido con @ y dominio
    if (!personal.email.trim()) {
      errs.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) {
      errs.email = 'Formato de correo inválido (ejemplo@dominio.com)';
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Manejador para continuar a la siguiente pestaña
  const handleContinueToVehicle = () => {
    // Limpiar errores previos de datos personales
    const cleanErrors = { ...errors };
    delete cleanErrors.personalPhoto;
    delete cleanErrors.fullName;
    delete cleanErrors.documentId;
    delete cleanErrors.phone;
    delete cleanErrors.birthDate;
    delete cleanErrors.email;
    setErrors(cleanErrors);

    if (validatePersonal()) {
      setActiveTab(1);
    }
  };

  // --- VALIDACIÓN DE VEHÍCULO (PESTAÑA 2) ---
  const validateVehicle = () => {
    const errs = {};
    const currentYear = new Date().getFullYear();

    // 0. Foto del vehículo con placa visible: obligatoria
    if (!vehicle.photoUri) {
      errs.vehiclePhoto = 'La foto del vehículo con placa visible es obligatoria';
    }

    // 1. Placa del Vehículo: formato colombiano estándar (3 letras y 3 números, Ej: ABC123)
    const cleanPlate = (vehicle.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    if (!cleanPlate) {
      errs.plate = 'La placa del vehículo es obligatoria';
    } else if (!/^[A-Z]{3}\d{3}$/.test(cleanPlate)) {
      errs.plate = 'Formato de placa colombiano inválido (Ej: ABC123, 3 letras y 3 números)';
    }

    // 2. Marca: obligatoria, máx 30 caracteres
    if (!vehicle.make.trim()) {
      errs.make = 'La marca del vehículo es obligatoria';
    } else if (vehicle.make.length > 30) {
      errs.make = 'Máximo 30 caracteres permitidos';
    }

    // 3. Modelo: obligatorio, máx 30 caracteres
    if (!vehicle.model.trim()) {
      errs.model = 'El modelo del vehículo es obligatorio';
    } else if (vehicle.model.length > 30) {
      errs.model = 'Máximo 30 caracteres permitidos';
    }

    // 4. Año: 4 dígitos numéricos, menor o igual al año actual y modelo 2005+
    const vehYear = parseInt(vehicle.year, 10);
    if (!vehYear || (vehicle.year || '').trim().length !== 4) {
      errs.year = 'El año debe contener 4 dígitos';
    } else if (vehYear > currentYear) {
      errs.year = `No puede ser mayor al año actual (${currentYear})`;
    } else if (vehYear < 2005) {
      errs.year = 'El vehículo debe ser modelo 2005 o superior para operar';
    }

    // 5. Capacidad de Pasajeros: coherencia por categoría
    const cap = parseInt(vehicle.capacity, 10);
    if (!cap || isNaN(cap) || cap < 1) {
      errs.capacity = 'Ingresa una capacidad de pasajeros válida (mínimo 1)';
    } else if ((vehicle.category === 'economy' || vehicle.category === 'premium') && cap > 4) {
      errs.capacity = 'Los vehículos estándar (Economy y Premium) admiten un máximo de 4 pasajeros';
    } else if (vehicle.category === 'xl' && cap < 6) {
      errs.capacity = 'La categoría XL exige una capacidad mínima de 6 pasajeros';
    } else if (vehicle.category === 'xl' && cap > 8) {
      errs.capacity = 'La categoría XL admite un máximo de 8 pasajeros';
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Manejador para continuar a la pestaña 3
  const handleContinueToDocs = () => {
    const cleanErrors = { ...errors };
    delete cleanErrors.vehiclePhoto;
    delete cleanErrors.plate;
    delete cleanErrors.make;
    delete cleanErrors.model;
    delete cleanErrors.year;
    delete cleanErrors.capacity;
    setErrors(cleanErrors);

    if (validateVehicle()) {
      setActiveTab(2);
    }
  };

  // --- VALIDACIÓN DE DOCUMENTACIÓN (PESTAÑA 3) ---
  const validateDocs = () => {
    const errs = {};
    const currentYear = new Date().getFullYear();
    const vehYear = parseInt(vehicle.year, 10) || currentYear;
    const vehicleAge = currentYear - vehYear;

    // 1. Número de Licencia de Conducción
    if (!docs.licenseNumber.trim()) {
      errs.licenseNumber = 'El número de licencia de conducción es obligatorio';
    } else if (docs.licenseNumber.trim().length < 5 || docs.licenseNumber.trim().length > 20) {
      errs.licenseNumber = 'Ingresa un número de licencia válido (5 a 20 caracteres)';
    }

    // 2. Foto de Licencia
    if (!docs.licensePhotoUri) {
      errs.licensePhoto = 'Debes adjuntar la foto legible de tu licencia de conducción';
    }

    // 3. Vigencia Legal del SOAT (Debe contar con al menos 1 día de vigencia)
    if (!docs.soatExpiry || !docs.soatExpiry.trim()) {
      errs.soatExpiry = 'La fecha de vencimiento del SOAT es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(docs.soatExpiry.trim())) {
      errs.soatExpiry = 'Formato inválido. Usa el formato AAAA-MM-DD (ej: 2027-11-20)';
    } else {
      const parts = docs.soatExpiry.trim().split('-');
      const expY = parseInt(parts[0], 10);
      const expM = parseInt(parts[1], 10);
      const expD = parseInt(parts[2], 10);

      const expiryDate = new Date(expY, expM - 1, expD);
      const isCalendarValid =
        expiryDate.getFullYear() === expY &&
        expiryDate.getMonth() === expM - 1 &&
        expiryDate.getDate() === expD;

      if (!isCalendarValid) {
        errs.soatExpiry = 'Ingresa una fecha de calendario válida';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);

        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 1) {
          errs.soatExpiry = 'El SOAT está vencido o vence hoy. La ley de transporte exige mínimo 1 día de vigencia legal para operar.';
        }
      }
    }

    // 4. Foto de la Póliza del SOAT
    if (!docs.soatPhotoUri) {
      errs.soatPhoto = 'Debes adjuntar la foto legible de la póliza de SOAT';
    }

    // 5. Técnico-mecánica (obligatoria si el vehículo tiene 5 o más años de antigüedad)
    if (vehicleAge >= 5 && !docs.tecnoPhotoUri) {
      errs.tecnoPhoto = 'Obligatoria para vehículos con 5 o más años de antigüedad';
    }

    // 6. Correo para Liquidaciones (Mercado Pago)
    if (docs.mpEmail && docs.mpEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(docs.mpEmail.trim())) {
        errs.mpEmail = 'Formato de correo de pagos inválido (ejemplo@dominio.com)';
      }
    }

    // 6. Aceptación de Términos y Comisión del 20%
    if (!docs.termsAccepted) {
      errs.terms = 'Debes aceptar los términos de servicio y la comisión del 20% para registrarte';
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // --- REGISTRO FINAL EN FIRESTORE (COLECCIÓN 'drivers') ---
  const handleRegisterDriver = async () => {
    // 1. Validar Pestaña 1
    const isPersonalValid = validatePersonal();
    if (!isPersonalValid) {
      setActiveTab(0);
      return;
    }

    // 2. Validar Pestaña 2
    const isVehicleValid = validateVehicle();
    if (!isVehicleValid) {
      setActiveTab(1);
      return;
    }

    // 3. Validar Pestaña 3
    const isDocsValid = validateDocs();
    if (!isDocsValid) {
      setActiveTab(2);
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanPlate = (vehicle.plate || '').toUpperCase().trim();
      const payload = {
        personal: {
          ...personal,
          fullName: personal.fullName.trim(),
          documentId: personal.documentId.trim(),
          phone: personal.phone.trim(),
          email: personal.email.trim(),
        },
        vehicle: {
          ...vehicle,
          plate: cleanPlate,
          make: vehicle.make.trim(),
          model: vehicle.model.trim(),
          capacity: parseInt(vehicle.capacity, 10),
        },
        documents: {
          licenseNumber: docs.licenseNumber.trim(),
          licensePhotoUri: docs.licensePhotoUri,
          soatExpiry: (docs.soatExpiry || '').trim(),
          soatPhotoUri: docs.soatPhotoUri,
          tecnoPhotoUri: docs.tecnoPhotoUri,
          mpEmail: (docs.mpEmail || '').trim(),
          termsAccepted: true,
        },
      };

      const result = await registerDriver(payload);
      setRegisteredDriverData(result);
      setRegistrationSuccess(true);
    } catch (err) {
      console.warn('Error al registrar conductor en Firestore:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
        {registrationSuccess ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successCard}>
              <Ionicons
                name={registeredDriverData?.status === 'approved' ? 'checkmark-done-circle' : 'checkmark-circle'}
                size={68}
                color={colors.online}
              />
              <Text style={styles.successTitle}>
                {registeredDriverData?.status === 'approved' ? '¡Conductor Aprobado!' : '¡Registro Exitoso!'}
              </Text>
              <Text style={styles.successSubtitle}>
                {registeredDriverData?.status === 'approved'
                  ? 'El administrador ha validado tu información y tu cuenta se encuentra oficialmente aprobada.'
                  : 'Tus datos han sido registrados correctamente y tu cuenta se encuentra en revisión.'}
              </Text>

              {/* Badge de estado en tiempo real (Docente Paula Andrea) */}
              <View
                style={[
                  styles.statusBadge,
                  registeredDriverData?.status === 'approved' && styles.statusBadgeApproved,
                ]}
              >
                <Ionicons
                  name={registeredDriverData?.status === 'approved' ? 'shield-checkmark' : 'time-outline'}
                  size={16}
                  color={registeredDriverData?.status === 'approved' ? '#15803D' : '#B45309'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    registeredDriverData?.status === 'approved' && styles.statusBadgeTextApproved,
                  ]}
                >
                  {registeredDriverData?.status === 'approved'
                    ? 'Estado: Aprobado (Activo en Plataforma)'
                    : 'Estado: Pendiente de Aprobación'}
                </Text>
              </View>

              {/* Indicador de estado de la cuenta */}
              <View
                style={[
                  styles.liveSyncBadge,
                  registeredDriverData?.status === 'approved'
                    ? styles.liveSyncBadgeApproved
                    : styles.liveSyncBadgePending,
                ]}
              >
                <View
                  style={[
                    styles.liveSyncDot,
                    {
                      backgroundColor:
                        registeredDriverData?.status === 'approved' ? '#16A34A' : '#F59E0B',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.liveSyncText,
                    registeredDriverData?.status === 'approved'
                      ? styles.liveSyncTextApproved
                      : styles.liveSyncTextPending,
                  ]}
                >
                  {registeredDriverData?.status === 'approved'
                    ? 'Cuenta habilitada para operar'
                    : 'Cuenta en proceso de verificación'}
                </Text>
              </View>

              {/* Resumen de los datos persistidos */}
              <View style={styles.detailBox}>
                <Text style={styles.detailSectionTitle}>Resumen del Conductor Registrado:</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>{registeredDriverData?.fullName || personal.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cédula:</Text>
                  <Text style={styles.detailValue}>{registeredDriverData?.documentId || personal.documentId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Celular:</Text>
                  <Text style={styles.detailValue}>{registeredDriverData?.phone || personal.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Correo:</Text>
                  <Text style={styles.detailValue}>{registeredDriverData?.email || personal.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehículo:</Text>
                  <Text style={styles.detailValue}>
                    {registeredDriverData?.vehicle?.make || vehicle.make} {registeredDriverData?.vehicle?.model || vehicle.model} ({registeredDriverData?.vehicle?.year || vehicle.year})
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Placa:</Text>
                  <Text style={styles.detailValueBold}>{registeredDriverData?.vehicle?.plate || vehicle.plate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoría:</Text>
                  <Text style={styles.detailValue}>
                    {(registeredDriverData?.vehicle?.category || vehicle.category).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Capacidad:</Text>
                  <Text style={styles.detailValue}>
                    {registeredDriverData?.vehicle?.capacity || vehicle.capacity} Pasajeros
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Licencia:</Text>
                  <Text style={styles.detailValueBold}>
                    {registeredDriverData?.documents?.licenseNumber || docs.licenseNumber || 'Registrada'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vigencia SOAT:</Text>
                  <Text style={styles.detailValue}>
                    {registeredDriverData?.documents?.soatExpiry || docs.soatExpiry || 'Vigente'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado de Solicitud:</Text>
                  <Text
                    style={[
                      styles.detailValueTag,
                      registeredDriverData?.status === 'approved' && styles.detailValueTagApproved,
                    ]}
                  >
                    {registeredDriverData?.status === 'approved' ? 'Aprobada' : 'En Revisión'}
                  </Text>
                </View>
              </View>

              {registeredDriverData?.status === 'approved' && (
                <View style={styles.approvedCelebrationBox}>
                  <Ionicons name="shield-checkmark" size={26} color="#15803D" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.approvedCelebrationTitle}>Documentación Validada</Text>
                    <Text style={styles.approvedCelebrationText}>
                      Tu licencia de conducción, póliza de SOAT y revisión vehicular fueron verificadas exitosamente.
                    </Text>
                  </View>
                </View>
              )}

              <CustomButton
                title="Modificar Datos / Volver al Formulario"
                variant="outline"
                onPress={() => setRegistrationSuccess(false)}
                style={{ width: '100%', marginTop: spacing.md }}
              />
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Encabezado */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Registro de Conductor</Text>
              <Text style={styles.headerSubtitle}>
                Completa las secciones requeridas para tu solicitud
              </Text>
            </View>

            {/* Barra de navegación por pestañas (Tab Bar) */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 0 && styles.tabItemActive]}
                onPress={() => setActiveTab(0)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={activeTab === 0 ? colors.black : colors.textMuted}
                />
                <Text style={[styles.tabLabel, activeTab === 0 && styles.tabLabelActive]}>
                  1. Personal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 1 && styles.tabItemActive]}
                onPress={() => {
                  if (validatePersonal()) {
                    setActiveTab(1);
                  } else {
                    setActiveTab(0);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="car-sport"
                  size={18}
                  color={activeTab === 1 ? colors.black : colors.textMuted}
                />
                <Text style={[styles.tabLabel, activeTab === 1 && styles.tabLabelActive]}>
                  2. Vehículo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 2 && styles.tabItemActive]}
                onPress={() => {
                  if (!validatePersonal()) {
                    setActiveTab(0);
                  } else if (!validateVehicle()) {
                    setActiveTab(1);
                  } else {
                    setActiveTab(2);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-text"
                  size={18}
                  color={activeTab === 2 ? colors.black : colors.textMuted}
                />
                <Text style={[styles.tabLabel, activeTab === 2 && styles.tabLabelActive]}>
                  3. Documentos
                </Text>
              </TouchableOpacity>
            </View>

        {/* Contenido según la pestaña activa */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* PESTAÑA 1: DATOS PERSONALES */}
          {activeTab === 0 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="person-circle-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>Datos Personales</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Ingresa tu información básica de contacto e identificación ciudadana.
              </Text>

              {/* Selector de Foto de Perfil con Expo Image Picker */}
              <View style={styles.photoPickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.avatarButton,
                    Boolean(errors.personalPhoto) && styles.avatarButtonError,
                  ]}
                  onPress={() => pickImage('personal')}
                  activeOpacity={0.8}
                >
                  {personal.photoUri ? (
                    <Image source={{ uri: personal.photoUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                      <Text style={styles.avatarLabel}>Subir Foto</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.photoHint}>Toca el círculo para cargar tu foto de perfil</Text>
                {Boolean(errors.personalPhoto) && (
                  <Text style={styles.errorInline}>{errors.personalPhoto}</Text>
                )}
              </View>

              {/* Nombre Completo */}
              <InputWithValidation
                label="Nombre Completo"
                placeholder="Ej: Juan Felipe Morales"
                value={personal.fullName}
                onChangeText={(txt) => {
                  setPersonal((p) => ({ ...p, fullName: txt }));
                  if (errors.fullName) setErrors((e) => ({ ...e, fullName: null }));
                }}
                error={errors.fullName}
                iconName="person-outline"
                maxLength={50}
              />

              {/* Documento de Identidad */}
              <InputWithValidation
                label="Documento de Identidad (Cédula: 6 a 10 dígitos)"
                placeholder="Ej: 1098765432"
                value={personal.documentId}
                onChangeText={(txt) => {
                  const sanitized = txt.replace(/[^0-9]/g, '').slice(0, 10);
                  setPersonal((p) => ({ ...p, documentId: sanitized }));
                  if (errors.documentId) setErrors((e) => ({ ...e, documentId: null }));
                }}
                keyboardType="numeric"
                error={errors.documentId}
                iconName="card-outline"
                maxLength={10}
              />

              {/* Teléfono Celular */}
              <InputWithValidation
                label="Número de Celular (10 dígitos)"
                placeholder="Ej: 3001234567"
                value={personal.phone}
                onChangeText={(txt) => {
                  const sanitized = txt.replace(/[^0-9]/g, '').slice(0, 10);
                  setPersonal((p) => ({ ...p, phone: sanitized }));
                  if (errors.phone) setErrors((e) => ({ ...e, phone: null }));
                }}
                keyboardType="phone-pad"
                error={errors.phone}
                iconName="call-outline"
                maxLength={10}
              />

              {/* Fecha de Nacimiento (Selector de Fecha Modal) */}
              <View style={styles.dateFieldContainer}>
                <Text style={styles.fieldLabel}>Fecha de Nacimiento</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerInput,
                    Boolean(errors.birthDate) && styles.datePickerInputError,
                  ]}
                  onPress={() => setShowBirthDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={errors.birthDate ? colors.errorText : colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.datePickerValueText}>
                      {personal.birthDate
                        ? `${formatDisplayDate(personal.birthDate)} (${personal.birthDate})`
                        : 'Toca para elegir fecha...'}
                    </Text>
                  </View>
                  <View style={styles.changeDateBadge}>
                    <Ionicons
                      name="calendar"
                      size={13}
                      color={colors.textPrimary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.changeDateBadgeText}>Elegir</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>

                {Boolean(errors.birthDate) ? (
                  <Text style={styles.errorInlineText}>{errors.birthDate}</Text>
                ) : (
                  <Text style={styles.dateHelperText}>
                    Requisito: el conductor debe tener al menos 18 años
                  </Text>
                )}
              </View>

              {/* Correo Electrónico */}
              <InputWithValidation
                label="Correo Electrónico"
                placeholder="conductor@ejemplo.com"
                value={personal.email}
                onChangeText={(txt) => {
                  setPersonal((p) => ({ ...p, email: txt }));
                  if (errors.email) setErrors((e) => ({ ...e, email: null }));
                }}
                keyboardType="email-address"
                error={errors.email}
                iconName="mail-outline"
                autoCapitalize="none"
              />

              {/* Botón de continuación a Vehículo */}
              <CustomButton
                title="Continuar a Vehículo"
                onPress={handleContinueToVehicle}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}

          {/* PESTAÑA 2: VEHÍCULO */}
          {activeTab === 1 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="car-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>2. Información del Vehículo</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Especifica la categoría, modelo, año y capacidad de pasajeros de tu automóvil.
              </Text>

              {/* Selector de Categoría */}
              <Text style={styles.fieldLabel}>Categoría del Servicio</Text>
              <View style={styles.categoryRow}>
                {[
                  { id: 'economy', label: 'Economy' },
                  { id: 'xl', label: 'XL (6+ Pasajeros)' },
                  { id: 'premium', label: 'Premium' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catBadge,
                      vehicle.category === cat.id && styles.catBadgeActive,
                    ]}
                    onPress={() => {
                      setVehicle((v) => ({ ...v, category: cat.id }));
                      if (errors.capacity) {
                        setErrors((e) => ({ ...e, capacity: null }));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.catBadgeText,
                        vehicle.category === cat.id && styles.catBadgeTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Foto del vehículo con placa */}
              <View style={styles.docUploadBox}>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    Boolean(errors.vehiclePhoto) && styles.uploadBtnError,
                  ]}
                  onPress={() => pickImage('vehicle')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={24} color={colors.textPrimary} />
                  <Text style={styles.uploadBtnText}>
                    {vehicle.photoUri ? 'Cambiar Foto del Vehículo' : 'Subir Foto con Placa Visible'}
                  </Text>
                </TouchableOpacity>
                {vehicle.photoUri && (
                  <Image source={{ uri: vehicle.photoUri }} style={styles.previewThumb} />
                )}
                {Boolean(errors.vehiclePhoto) && (
                  <Text style={styles.errorInline}>{errors.vehiclePhoto}</Text>
                )}
              </View>

              {/* Placa Colombiana */}
              <InputWithValidation
                label="Placa del Vehículo (Formato Colombiano: ABC123)"
                placeholder="ABC123"
                value={vehicle.plate}
                onChangeText={(txt) => {
                  // Sanitizar automáticamente: pasar a mayúsculas, remover espacios y caracteres especiales
                  const sanitized = txt.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                  setVehicle((v) => ({ ...v, plate: sanitized }));
                  if (errors.plate) setErrors((e) => ({ ...e, plate: null }));
                }}
                error={errors.plate}
                iconName="barcode-outline"
                autoCapitalize="characters"
                maxLength={6}
              />

              {/* Marca */}
              <InputWithValidation
                label="Marca del Vehículo"
                placeholder="Ej: Chevrolet"
                value={vehicle.make}
                onChangeText={(txt) => {
                  setVehicle((v) => ({ ...v, make: txt }));
                  if (errors.make) setErrors((e) => ({ ...e, make: null }));
                }}
                error={errors.make}
                iconName="pricetag-outline"
                maxLength={30}
              />

              {/* Modelo */}
              <InputWithValidation
                label="Modelo / Línea"
                placeholder="Ej: Onix Sedan"
                value={vehicle.model}
                onChangeText={(txt) => {
                  setVehicle((v) => ({ ...v, model: txt }));
                  if (errors.model) setErrors((e) => ({ ...e, model: null }));
                }}
                error={errors.model}
                iconName="car-sport-outline"
                maxLength={30}
              />

              {/* Año de Fabricación */}
              <InputWithValidation
                label="Año de Fabricación (4 dígitos)"
                placeholder="2021"
                value={vehicle.year}
                onChangeText={(txt) => {
                  setVehicle((v) => ({ ...v, year: txt }));
                  if (errors.year) setErrors((e) => ({ ...e, year: null }));
                }}
                keyboardType="numeric"
                error={errors.year}
                iconName="calendar-number-outline"
                maxLength={4}
              />

              {/* Capacidad de Pasajeros */}
              <InputWithValidation
                label="Capacidad de Pasajeros"
                placeholder="4"
                value={vehicle.capacity}
                onChangeText={(txt) => {
                  setVehicle((v) => ({ ...v, capacity: txt }));
                  if (errors.capacity) setErrors((e) => ({ ...e, capacity: null }));
                }}
                keyboardType="numeric"
                error={errors.capacity}
                helperText={
                  vehicle.category === 'xl'
                    ? 'La categoría XL requiere entre 6 y 8 pasajeros'
                    : 'Máximo 4 pasajeros en vehículos estándar (Economy y Premium)'
                }
                iconName="people-outline"
                maxLength={2}
              />

              {/* Botones de navegación de la Pestaña 2 */}
              <View style={styles.buttonRow}>
                <CustomButton
                  title="Atrás"
                  variant="secondary"
                  onPress={() => setActiveTab(0)}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                />
                <CustomButton
                  title="Continuar a Documentos"
                  onPress={handleContinueToDocs}
                  disabled={isSubmitting}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}

          {/* PESTAÑA 3: DOCUMENTOS Y LIQUIDACIÓN */}
          {activeTab === 2 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>Documentación y Liquidación</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Carga de licencia de conducción, SOAT, revisión técnico-mecánica y cuenta de pagos.
              </Text>

              {/* Número de Licencia */}
              <InputWithValidation
                label="Número de Licencia de Conducción"
                placeholder="Ej: C1-1098765432"
                value={docs.licenseNumber}
                onChangeText={(txt) => {
                  setDocs((d) => ({ ...d, licenseNumber: txt }));
                  if (errors.licenseNumber) setErrors((e) => ({ ...e, licenseNumber: null }));
                }}
                error={errors.licenseNumber}
                iconName="card-outline"
                autoCapitalize="characters"
                maxLength={20}
              />

              {/* Carga de Licencia */}
              <View style={styles.docUploadBox}>
                <Text style={styles.fieldLabel}>Foto de Licencia de Conducción</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    Boolean(errors.licensePhoto) && styles.uploadBtnError,
                  ]}
                  onPress={() => pickImage('license')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={docs.licensePhotoUri ? 'checkmark-circle' : 'camera-outline'}
                    size={22}
                    color={docs.licensePhotoUri ? colors.online : colors.textPrimary}
                  />
                  <Text style={styles.uploadBtnText}>
                    {docs.licensePhotoUri ? 'Licencia Cargada (Toca para cambiar)' : 'Subir Foto de Licencia'}
                  </Text>
                </TouchableOpacity>
                {docs.licensePhotoUri && (
                  <Image source={{ uri: docs.licensePhotoUri }} style={styles.previewThumb} />
                )}
                {Boolean(errors.licensePhoto) && (
                  <Text style={styles.errorInlineText}>{errors.licensePhoto}</Text>
                )}
              </View>

              {/* Fecha de Vencimiento del SOAT (Selector de Fecha Modal) */}
              <View style={styles.dateFieldContainer}>
                <Text style={styles.fieldLabel}>Fecha de Vencimiento del SOAT</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerInput,
                    Boolean(errors.soatExpiry) && styles.datePickerInputError,
                  ]}
                  onPress={() => setShowSoatDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={errors.soatExpiry ? colors.errorText : colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.datePickerValueText}>
                      {docs.soatExpiry
                        ? `${formatDisplayDate(docs.soatExpiry)} (${docs.soatExpiry})`
                        : 'Toca para elegir fecha de vencimiento...'}
                    </Text>
                  </View>
                  <View style={styles.changeDateBadge}>
                    <Ionicons
                      name="calendar"
                      size={13}
                      color={colors.textPrimary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.changeDateBadgeText}>Elegir</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>

                {Boolean(errors.soatExpiry) ? (
                  <Text style={styles.errorInlineText}>{errors.soatExpiry}</Text>
                ) : (
                  <Text style={styles.dateHelperText}>
                    Requisito legal: la póliza debe tener al menos 1 día de vigencia restante
                  </Text>
                )}
              </View>

              {/* Carga de SOAT */}
              <View style={styles.docUploadBox}>
                <Text style={styles.fieldLabel}>Póliza de SOAT Vigente</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    Boolean(errors.soatPhoto) && styles.uploadBtnError,
                  ]}
                  onPress={() => pickImage('soat')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={docs.soatPhotoUri ? 'checkmark-circle' : 'shield-checkmark-outline'}
                    size={22}
                    color={docs.soatPhotoUri ? colors.online : colors.textPrimary}
                  />
                  <Text style={styles.uploadBtnText}>
                    {docs.soatPhotoUri ? 'SOAT Cargado (Toca para cambiar)' : 'Subir Foto de SOAT'}
                  </Text>
                </TouchableOpacity>
                {docs.soatPhotoUri && (
                  <Image source={{ uri: docs.soatPhotoUri }} style={styles.previewThumb} />
                )}
                {Boolean(errors.soatPhoto) && (
                  <Text style={styles.errorInlineText}>{errors.soatPhoto}</Text>
                )}
              </View>

              {/* Carga de Técnico-Mecánica */}
              <View style={styles.docUploadBox}>
                <Text style={styles.fieldLabel}>Certificado de Revisión Técnico-Mecánica</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    Boolean(errors.tecnoPhoto) && styles.uploadBtnError,
                  ]}
                  onPress={() => pickImage('tecno')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={docs.tecnoPhotoUri ? 'checkmark-circle' : 'construct-outline'}
                    size={22}
                    color={docs.tecnoPhotoUri ? colors.online : colors.textPrimary}
                  />
                  <Text style={styles.uploadBtnText}>
                    {docs.tecnoPhotoUri ? 'Técnico-Mecánica Cargada (Toca para cambiar)' : 'Subir Foto Técnico-Mecánica'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.helperTextDoc}>
                  {parseInt(vehicle.year, 10) && new Date().getFullYear() - parseInt(vehicle.year, 10) >= 5
                    ? 'Obligatoria para vehículos con 5 o más años de antigüedad'
                    : 'Opcional si tu vehículo tiene menos de 5 años de antigüedad'}
                </Text>
                {docs.tecnoPhotoUri && (
                  <Image source={{ uri: docs.tecnoPhotoUri }} style={styles.previewThumb} />
                )}
                {Boolean(errors.tecnoPhoto) && (
                  <Text style={styles.errorInlineText}>{errors.tecnoPhoto}</Text>
                )}
              </View>

              {/* Correo Mercado Pago */}
              <InputWithValidation
                label="Correo de Cobro (Mercado Pago)"
                placeholder="pagos.conductor@mercadopago.com"
                value={docs.mpEmail}
                onChangeText={(txt) => {
                  setDocs((d) => ({ ...d, mpEmail: txt }));
                  if (errors.mpEmail) setErrors((e) => ({ ...e, mpEmail: null }));
                }}
                keyboardType="email-address"
                error={errors.mpEmail}
                helperText="Aquí se transferirán los ingresos de tus carreras finalizadas"
                iconName="wallet-outline"
              />

              {/* Checkbox Términos y Comisión 20% */}
              <TouchableOpacity
                style={styles.termsBox}
                onPress={() => {
                  setDocs((d) => ({ ...d, termsAccepted: !d.termsAccepted }));
                  if (errors.terms) setErrors((e) => ({ ...e, terms: null }));
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={docs.termsAccepted ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={docs.termsAccepted ? colors.online : colors.textMuted}
                />
                <Text style={styles.termsText}>
                  Acepto los términos y condiciones de servicio. Reconozco que la plataforma retiene una{' '}
                  <Text style={{ fontWeight: '800', color: colors.black }}>comisión del 20%</Text> sobre el valor del trayecto
                  y que el 100% de las propinas son directas para el conductor.
                </Text>
              </TouchableOpacity>
              {Boolean(errors.terms) && (
                <Text style={[styles.errorInlineText, { marginBottom: spacing.sm }]}>{errors.terms}</Text>
              )}

              {/* Botones de navegación y envío final */}
              <View style={styles.buttonRow}>
                <CustomButton
                  title="Atrás"
                  variant="secondary"
                  onPress={() => setActiveTab(1)}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                />
                <CustomButton
                  title="Finalizar Registro"
                  onPress={handleRegisterDriver}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}
        </ScrollView>
        </>
      )}
      </View>
    </KeyboardAvoidingView>

    {/* Selector de Fecha de Nacimiento */}
    <DatePickerModal
      visible={showBirthDatePicker}
      onClose={() => setShowBirthDatePicker(false)}
      onSelect={(selectedDate) => {
        setPersonal((prev) => ({ ...prev, birthDate: selectedDate }));
        if (errors.birthDate) {
          setErrors((prev) => ({ ...prev, birthDate: null }));
        }
      }}
      initialDate={personal.birthDate || '2000-01-01'}
      title="Fecha de Nacimiento"
      mode="birthDate"
    />

    {/* Selector de Fecha de Vencimiento de SOAT */}
    <DatePickerModal
      visible={showSoatDatePicker}
      onClose={() => setShowSoatDatePicker(false)}
      onSelect={(selectedDate) => {
        setDocs((prev) => ({ ...prev, soatExpiry: selectedDate }));
        if (errors.soatExpiry) {
          setErrors((prev) => ({ ...prev, soatExpiry: null }));
        }
      }}
      initialDate={docs.soatExpiry || '2027-11-20'}
      title="Vencimiento de Póliza SOAT"
      mode="futureDate"
    />

    {/* MODAL PARA SELECCIONAR ORIGEN DE FOTO (CÁMARA VS GALERÍA) */}
    <Modal
      visible={photoModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setPhotoModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPhotoModalVisible(false)}
      >
        <View style={styles.photoSourceSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.photoSourceHeader}>
            <View style={styles.photoSourceIconCircle}>
              <Ionicons name="camera-reverse" size={22} color={colors.black} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.photoSourceTitle}>
                {getPhotoTargetTitle(activePhotoTarget)}
              </Text>
              <Text style={styles.photoSourceSubtitle}>
                ¿Cómo deseas adjuntar este archivo?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPhotoModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Opción 1: Cámara de fotos */}
          <TouchableOpacity
            style={styles.photoSourceOption}
            onPress={() => handleCaptureImage('camera')}
            activeOpacity={0.7}
          >
            <View style={[styles.sourceIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="camera" size={24} color="#15803D" />
            </View>
            <View style={styles.sourceTextBox}>
              <Text style={styles.sourceOptionTitle}>Tomar foto con la cámara</Text>
              <Text style={styles.sourceOptionDesc}>
                Abre la cámara de tu teléfono para capturar el documento en tiempo real
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Opción 2: Galería de fotos */}
          <TouchableOpacity
            style={styles.photoSourceOption}
            onPress={() => handleCaptureImage('library')}
            activeOpacity={0.7}
          >
            <View style={[styles.sourceIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="images" size={24} color="#2563EB" />
            </View>
            <View style={styles.sourceTextBox}>
              <Text style={styles.sourceOptionTitle}>Elegir de la galería</Text>
              <Text style={styles.sourceOptionDesc}>
                Selecciona una foto previamente guardada en tu dispositivo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Botón Cancelar */}
          <TouchableOpacity
            style={styles.cancelSourceBtn}
            onPress={() => setPhotoModalVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelSourceBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  tabItemActive: {
    borderColor: colors.black,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.black,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 280, // Espacio generoso para que el teclado virtual nunca bloquee los campos inferiores
  },
  tabContentContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  placeholderCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  placeholderCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  photoPickerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  avatarButtonError: {
    borderColor: colors.errorText,
    backgroundColor: colors.errorBg,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  photoHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  errorInline: {
    color: colors.errorText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  catBadge: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  catBadgeActive: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catBadgeTextActive: {
    color: colors.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  docUploadBox: {
    marginBottom: spacing.md,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  uploadBtnError: {
    borderColor: colors.errorText,
    backgroundColor: colors.errorBg,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  previewThumb: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginTop: spacing.sm,
    backgroundColor: '#EEEEEE',
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.sm + 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helperTextDoc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 2,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadgeTextApproved: {
    color: '#15803D',
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  liveSyncBadgePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  liveSyncBadgeApproved: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  liveSyncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveSyncText: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveSyncTextPending: {
    color: '#D97706',
  },
  liveSyncTextApproved: {
    color: '#16A34A',
  },
  approvedCelebrationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  approvedCelebrationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  approvedCelebrationText: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 16,
  },
  detailBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 13,
    color: colors.black,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailValueTag: {
    fontSize: 11,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
    overflow: 'hidden',
  },
  detailValueTagApproved: {
    color: '#15803D',
    backgroundColor: '#DCFCE7',
  },
  // --- ESTILOS: Selector de Fecha Modal y Campo de Fecha ---
  dateFieldContainer: {
    marginBottom: spacing.md,
    width: '100%',
  },
  datePickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 4,
  },
  datePickerInputError: {
    borderColor: colors.errorText,
    backgroundColor: colors.errorBg,
  },
  datePickerValueText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  changeDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeDateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorInlineText: {
    color: colors.errorText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  dateHelperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // --- ESTILOS: Selector de Origen de Imagen (Cámara vs Galería) ---
  photoSourceSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  photoSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  photoSourceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSourceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  photoSourceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  photoSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
    gap: 12,
  },
  sourceIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTextBox: {
    flex: 1,
  },
  sourceOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sourceOptionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  cancelSourceBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelSourceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default RegisterScreen;
