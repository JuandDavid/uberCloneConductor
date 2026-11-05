import React, { useState, useMemo } from 'react';
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
import { colors, spacing } from '../../styles/theme';
import { InputWithValidation } from '../../components/InputWithValidation';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

/**
 * Constantes y funciones de apoyo para el Selector Intuitivo de Fecha (DatePicker Modal)
 */
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const getFirstDayOfWeek = (year, month) => {
  // Domingo = 0, Lunes = 1 -> Convertido a Lunes = 0, ..., Domingo = 6
  const day = new Date(year, month - 1, 1).getDay();
  return (day + 6) % 7;
};

const calculateAge = (year, month, day) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = (today.getMonth() + 1) - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
};

const formatDateString = (year, month, day) => {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const formatReadableDate = (year, month, day) => {
  const mName = MONTHS_ES[month - 1] || '';
  return `${day} de ${mName} de ${year}`;
};

const parseBirthDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) {
    return { year: 2000, month: 1, day: 1 };
  }
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10) || 2000;
  const m = parseInt(parts[1], 10) || 1;
  const d = parseInt(parts[2], 10) || 1;
  return { year: y, month: m, day: d };
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
  const { registerDriver } = useAuth();
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

  // --- ESTADO DE ERRORES EN LÍNEA ---
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredDriverData, setRegisteredDriverData] = useState(null);

  // --- ESTADO: Selector de Fecha Modal Intuitivo ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerView, setDatePickerView] = useState('calendar'); // 'calendar' | 'years' | 'months'

  const currentYear = new Date().getFullYear();
  const maxBirthYear = currentYear - 18;
  const minBirthYear = 1950;

  const initialParsedDate = useMemo(
    () => parseBirthDate(personal.birthDate),
    [personal.birthDate]
  );

  const [pickerYear, setPickerYear] = useState(initialParsedDate.year);
  const [pickerMonth, setPickerMonth] = useState(initialParsedDate.month);
  const [pickerDay, setPickerDay] = useState(initialParsedDate.day);

  // Lista de años disponibles (desde maxBirthYear hacia minBirthYear)
  const availableYears = useMemo(() => {
    const list = [];
    for (let y = maxBirthYear; y >= minBirthYear; y--) {
      list.push(y);
    }
    return list;
  }, [maxBirthYear, minBirthYear]);

  // Edad calculada en tiempo real según la fecha seleccionada en el modal
  const pickerAge = useMemo(
    () => calculateAge(pickerYear, pickerMonth, pickerDay),
    [pickerYear, pickerMonth, pickerDay]
  );

  // Abrir selector sincronizando con la fecha actual del formulario y cerrando teclado
  const openDatePicker = () => {
    Keyboard.dismiss();
    const parsed = parseBirthDate(personal.birthDate);
    setPickerYear(parsed.year);
    setPickerMonth(parsed.month);
    setPickerDay(parsed.day);
    setDatePickerView('calendar');
    setShowDatePicker(true);
  };

  // Navegación de mes anterior / siguiente
  const handlePrevMonth = () => {
    if (pickerMonth === 1) {
      if (pickerYear > minBirthYear) {
        setPickerYear((y) => y - 1);
        setPickerMonth(12);
      }
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 12) {
      if (pickerYear < maxBirthYear) {
        setPickerYear((y) => y + 1);
        setPickerMonth(1);
      }
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  // Confirmar la selección de fecha
  const handleConfirmDate = () => {
    const maxDays = getDaysInMonth(pickerYear, pickerMonth);
    const validDay = Math.min(pickerDay, maxDays);
    const formatted = formatDateString(pickerYear, pickerMonth, validDay);
    const age = calculateAge(pickerYear, pickerMonth, validDay);

    if (age < 18) {
      setErrors((prev) => ({
        ...prev,
        birthDate: 'El conductor debe ser mayor de 18 años',
      }));
    } else {
      setPersonal((prev) => ({ ...prev, birthDate: formatted }));
      if (errors.birthDate) {
        setErrors((prev) => ({ ...prev, birthDate: null }));
      }
    }
    setShowDatePicker(false);
  };

  // Renderizadores de vistas del Modal de Fecha
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
    const firstDayIndex = getFirstDayOfWeek(pickerYear, pickerMonth);
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calendarDayCellEmpty} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = d === pickerDay;
      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDayCellSelected,
          ]}
          onPress={() => setPickerDay(d)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarGrid}>
        <View style={styles.calendarWeekRow}>
          {DAYS_OF_WEEK.map((dName) => (
            <Text key={dName} style={styles.calendarWeekDayText}>
              {dName}
            </Text>
          ))}
        </View>
        <View style={styles.calendarDaysWrap}>{cells}</View>
      </View>
    );
  };

  const renderMonthsGrid = () => {
    return (
      <View style={styles.monthsGrid}>
        {MONTHS_SHORT.map((mName, idx) => {
          const monthNum = idx + 1;
          const isSelected = monthNum === pickerMonth;
          return (
            <TouchableOpacity
              key={mName}
              style={[
                styles.monthGridCell,
                isSelected && styles.monthGridCellSelected,
              ]}
              onPress={() => {
                setPickerMonth(monthNum);
                setDatePickerView('calendar');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.monthGridCellText,
                  isSelected && styles.monthGridCellTextSelected,
                ]}
              >
                {MONTHS_ES[idx]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderYearsGrid = () => {
    return (
      <ScrollView
        style={styles.yearsScrollView}
        contentContainerStyle={styles.yearsGridContent}
        showsVerticalScrollIndicator={true}
      >
        {availableYears.map((yr) => {
          const isSelected = yr === pickerYear;
          return (
            <TouchableOpacity
              key={yr}
              style={[
                styles.yearGridCell,
                isSelected && styles.yearGridCellSelected,
              ]}
              onPress={() => {
                setPickerYear(yr);
                setDatePickerView('calendar');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.yearGridCellText,
                  isSelected && styles.yearGridCellTextSelected,
                ]}
              >
                {yr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // --- SELECCIÓN DE FOTO DE PERFIL (EXPO-IMAGE-PICKER) ---
  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        if (type === 'personal') {
          setPersonal((p) => ({ ...p, photoUri: uri }));
          if (errors.personalPhoto) {
            setErrors((e) => ({ ...e, personalPhoto: null }));
          }
        }
        if (type === 'vehicle') {
          setVehicle((v) => ({ ...v, photoUri: uri }));
          if (errors.vehiclePhoto) {
            setErrors((e) => ({ ...e, vehiclePhoto: null }));
          }
        }
      }
    } catch (err) {
      console.warn('Error al seleccionar imagen:', err);
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

    // 4. Año: 4 dígitos numéricos, menor o igual al año actual
    const vehYear = parseInt(vehicle.year, 10);
    if (!vehYear || (vehicle.year || '').trim().length !== 4) {
      errs.year = 'El año debe contener 4 dígitos';
    } else if (vehYear > currentYear) {
      errs.year = `No puede ser mayor al año actual (${currentYear})`;
    }

    // 5. Capacidad de Pasajeros: numérica >= 1, y si es XL mínimo 6
    const cap = parseInt(vehicle.capacity, 10);
    if (!cap || isNaN(cap) || cap < 1) {
      errs.capacity = 'Ingresa una capacidad de pasajeros válida (mínimo 1)';
    } else if (vehicle.category === 'xl' && cap < 6) {
      errs.capacity = 'La categoría XL exige una capacidad mínima de 6 pasajeros';
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
              <Ionicons name="checkmark-circle" size={68} color={colors.online} />
              <Text style={styles.successTitle}>¡Registro Guardado en Firestore!</Text>
              <Text style={styles.successSubtitle}>
                Los datos del conductor han sido guardados exitosamente en la colección 'drivers'.
              </Text>

              {/* Badge de estado obligatorio (Docente Paula Andrea) */}
              <View style={styles.statusBadge}>
                <Ionicons name="time-outline" size={16} color="#B45309" />
                <Text style={styles.statusBadgeText}>
                  Estado: pending_approval
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
                  <Text style={styles.detailLabel}>Colección Nube:</Text>
                  <Text style={styles.detailValueTag}>drivers</Text>
                </View>
              </View>

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

              {/* Fecha de Nacimiento (Selector Intuitivo con Modal) */}
              <View style={styles.dateFieldContainer}>
                <Text style={styles.fieldLabel}>Fecha de Nacimiento</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerInput,
                    Boolean(errors.birthDate) && styles.datePickerInputError,
                  ]}
                  onPress={openDatePicker}
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
                        ? `${formatReadableDate(
                            parseBirthDate(personal.birthDate).year,
                            parseBirthDate(personal.birthDate).month,
                            parseBirthDate(personal.birthDate).day
                          )} (${personal.birthDate})`
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
                    ? 'La categoría XL requiere al menos 6 pasajeros'
                    : 'Cantidad de puestos disponibles para pasajeros'
                }
                iconName="people-outline"
                maxLength={2}
              />

              {/* Botones de navegación y registro */}
              <View style={styles.buttonRow}>
                <CustomButton
                  title="Atrás"
                  variant="secondary"
                  onPress={() => setActiveTab(0)}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                />
                <CustomButton
                  title="Registrar Conductor"
                  onPress={handleRegisterDriver}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}

          {/* PESTAÑA 3: DOCUMENTOS */}
          {activeTab === 2 && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.black} />
                <Text style={styles.sectionHeader}>3. Documentación</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Carga de licencia de conducción, SOAT y revisión técnico-mecánica.
              </Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="document-attach-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.placeholderCardText}>
                  Módulo de Documentación y Términos
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
        </>
      )}
      </View>
    </KeyboardAvoidingView>

    {/* MODAL INTUITIVO DE FECHA DE NACIMIENTO */}
    <Modal
      visible={showDatePicker}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Cabecera del Modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <Ionicons name="calendar" size={20} color={colors.black} />
              <Text style={styles.modalTitle}>Fecha de Nacimiento</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Banner de Resumen y Validación de Mayoría de Edad */}
          <View style={styles.modalSummaryBox}>
            <Text style={styles.modalDatePreview}>
              {pickerDay} de {MONTHS_ES[pickerMonth - 1]} de {pickerYear}
            </Text>
            <View
              style={[
                styles.modalAgeBadge,
                pickerAge >= 18
                  ? styles.modalAgeBadgeValid
                  : styles.modalAgeBadgeInvalid,
              ]}
            >
              <Ionicons
                name={pickerAge >= 18 ? 'checkmark-circle' : 'alert-circle'}
                size={15}
                color={pickerAge >= 18 ? '#15803D' : '#BE123C'}
              />
              <Text
                style={[
                  styles.modalAgeBadgeText,
                  pickerAge >= 18
                    ? styles.modalAgeBadgeTextValid
                    : styles.modalAgeBadgeTextInvalid,
                ]}
              >
                {pickerAge >= 18
                  ? `${pickerAge} años • Mayor de edad (Válido)`
                  : `${pickerAge} años • Menor de edad (Mínimo 18)`}
              </Text>
            </View>
          </View>

          {/* Selector de Modos / Barra de Navegación */}
          <View style={styles.pickerNavBar}>
            <TouchableOpacity
              style={styles.pickerNavArrow}
              onPress={handlePrevMonth}
              disabled={datePickerView !== 'calendar'}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={datePickerView === 'calendar' ? colors.black : colors.border}
              />
            </TouchableOpacity>

            <View style={styles.pickerNavPillsRow}>
              {/* Botón selector de Mes */}
              <TouchableOpacity
                style={[
                  styles.pickerNavPill,
                  datePickerView === 'months' && styles.pickerNavPillActive,
                ]}
                onPress={() =>
                  setDatePickerView(datePickerView === 'months' ? 'calendar' : 'months')
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerNavPillText,
                    datePickerView === 'months' && styles.pickerNavPillTextActive,
                  ]}
                >
                  {MONTHS_ES[pickerMonth - 1]} ▾
                </Text>
              </TouchableOpacity>

              {/* Botón selector de Año */}
              <TouchableOpacity
                style={[
                  styles.pickerNavPill,
                  datePickerView === 'years' && styles.pickerNavPillActive,
                ]}
                onPress={() =>
                  setDatePickerView(datePickerView === 'years' ? 'calendar' : 'years')
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerNavPillText,
                    datePickerView === 'years' && styles.pickerNavPillTextActive,
                  ]}
                >
                  {pickerYear} ▾
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.pickerNavArrow}
              onPress={handleNextMonth}
              disabled={datePickerView !== 'calendar'}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={datePickerView === 'calendar' ? colors.black : colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* Vista condicional del selector */}
          <View style={styles.pickerBodyContainer}>
            {datePickerView === 'calendar' && renderCalendarDays()}
            {datePickerView === 'months' && renderMonthsGrid()}
            {datePickerView === 'years' && renderYearsGrid()}
          </View>

          {/* Botones de Acción */}
          <View style={styles.modalActionRow}>
            <CustomButton
              title="Cancelar"
              variant="secondary"
              onPress={() => setShowDatePicker(false)}
              style={{ flex: 1 }}
            />
            <CustomButton
              title="Confirmar Fecha"
              onPress={handleConfirmDate}
              disabled={pickerAge < 18}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
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
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
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
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalDatePreview: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalAgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalAgeBadgeValid: {
    backgroundColor: '#DCFCE7',
  },
  modalAgeBadgeInvalid: {
    backgroundColor: '#FFE4E6',
  },
  modalAgeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalAgeBadgeTextValid: {
    color: '#15803D',
  },
  modalAgeBadgeTextInvalid: {
    color: '#BE123C',
  },
  pickerNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  pickerNavArrow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  pickerNavPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerNavPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerNavPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  pickerNavPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickerNavPillTextActive: {
    color: colors.white,
  },
  pickerBodyContainer: {
    minHeight: 235,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  calendarGrid: {
    width: '100%',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  calendarDaysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCellEmpty: {
    width: `${100 / 7}%`,
    height: 36,
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginVertical: 2,
  },
  calendarDayCellSelected: {
    backgroundColor: colors.black,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  calendarDayTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  monthGridCell: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthGridCellSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  monthGridCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  monthGridCellTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  yearsScrollView: {
    maxHeight: 220,
  },
  yearsGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  yearGridCell: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearGridCellSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  yearGridCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  yearGridCellTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default RegisterScreen;
