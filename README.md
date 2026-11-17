# UberClone Conductor 🚗📱
## Proyecto de Programación Móvil — Universidad
**Entrega 1:** 5 de Noviembre  
**Docente:** Paula Andrea Muñoz Correa  
**Semestre:** 5.° Semestre de Ingeniería de Software  
**Integrantes:**
- Juan Felipe ("Fiera")
- Juan David ("Juanda")

---

## 📌 1. Descripción del Proyecto
Aplicación móvil desarrollada en **React Native** con **Expo (SDK 57)** para conductores de plataforma de transporte tipo Uber. La aplicación permite a los conductores registrarse, subir su documentación y vehículo, gestionar disponibilidad, aceptar viajes y monitorear ingresos.

---

## 🎯 2. Alcance de la Primera Entrega (5 de Noviembre)
El objetivo central de la Entrega 1 es el **Módulo Completo de Registro y Validación de Conductores**, implementando navegación modular por pestañas, validaciones en línea y persistencia en la nube mediante **Firebase Firestore**.

### 📋 Pestaña 1: Datos Personales del Conductor
- **Nombre Completo:** Validación de caracteres alfabéticos y longitud mínima.
- **Documento de Identidad (Cédula):** Numérico, entre 6 y 10 dígitos.
- **Teléfono Móvil:** Numérico, exactamente 10 dígitos (formato estándar móvil Colombia).
- **Correo Electrónico:** Formato de correo estándar válido (`ejemplo@dominio.com`).
- **Fecha de Nacimiento:** Validación de mayoría de edad (mínimo 18 años requeridos).
- **Idioma:** Selección de idioma preferido para la app.
- **Foto de Perfil:** Carga de imagen desde la galería del dispositivo móvil.

### 🚘 Pestaña 2: Información del Vehículo
- **Placa del Vehículo:** Formato colombiano estándar (`ABC123`, 3 letras mayúsculas seguidas de 3 números). Conversión automática a mayúsculas.
- **Marca:** Selección o texto de la marca del automóvil.
- **Modelo / Línea:** Especificación del modelo del vehículo.
- **Año:** Año de fabricación válido (vehículos dentro de la normativa de operación).
- **Categoría del Servicio:** Selección entre *Economy*, *XL* y *Premium*.
- **Capacidad de Pasajeros:** Número de pasajeros admitidos según la categoría.
- **Foto del Vehículo:** Carga de fotografía del vehículo registrado.

### 📄 Pestaña 3: Documentación y Validación Legal
- **Licencia de Conducción:** Número de licencia validado y captura de fotografía legible.
- **Póliza de SOAT Vigente:** Validación estricta de vigencia legal (requiere como mínimo 1 día de vigencia restante antes del vencimiento) y carga de póliza.
- **Revisión Técnico-Mecánica:** Validación inteligente obligatoria para vehículos con 5 o más años de antigüedad.
- **Captura Dual de Documentos:** Menú contextual para capturar en vivo mediante la cámara física o adjuntar desde la galería.
- **Cuenta de Liquidación:** Correo registrado para recepción de ingresos por carreras completadas.
- **Términos del Servicio:** Aceptación explícita de condiciones con retención del 20% de comisión de plataforma.
- **Sincronización en Tiempo Real (onSnapshot):** La pantalla de confirmación se actualiza automáticamente en vivo al cambiar el estado del conductor.

---

## ⚖️ 3. Criterios de Aceptación y Reglas Académicas Obligatorias

1. **Validaciones en Línea (Inline UX) — Sin Popups de `Alert`:**
   - Todo mensaje de validación debe renderizarse inmediatamente debajo del campo correspondiente en color rojo (`#E11D48`).
   - **Regla estricta:** Queda terminantemente prohibido el uso de diálogos emergentes `Alert` para informar errores de formulario.
   - El botón de envío o avance solo se habilita cuando todos los campos del formulario han superado las validaciones.

2. **Integración con Firebase Firestore (Configuración Web Oficial):**
   - La conexión con Firebase se inicializa con credenciales Web (`</>`), sin depender de `google-services.json` para garantizar compatibilidad pura con Expo Go.
   - Instancia exportada en `src/config/firebase.js` como `export const db = getFirestore(app)`.
   - Todas las llamadas a base de datos se encapsulan en `src/services/dbService.js` (arquitectura limpia y desacoplada).
   - El nuevo conductor se almacena en la colección `drivers` con el estado inicial `pending_approval`.

3. **Compatibilidad y Dependencias:**
   - Expo SDK 57 (`expo: ~57.0.31`, `react-native: 0.86.3`, `react: 19.2.3`).
   - Dependencias instaladas exclusivamente mediante `npx expo install`.

---

## 🛠️ 4. Tecnologías Principales
- **Framework:** React Native con Expo SDK 57
- **Lenguaje:** JavaScript (ES6+)
- **Navegación:** `@react-navigation/native` & `@react-navigation/native-stack`
- **Base de Datos en la Nube:** Firebase Firestore Web SDK v11
- **Almacenamiento Local:** `@react-native-async-storage/async-storage`
- **Manejo de Multimedia:** `expo-image-picker`
- **Iconografía:** `@expo/vector-icons`

---

## 👥 5. Flujo de Trabajo Colaborativo (Git)
El proyecto se desarrolla bajo un esquema colaborativo riguroso y equitativo entre ambos integrantes:
- **Juan Felipe ("Fiera"):** 42 commits (arquitectura inicial, validaciones, internacionalización i18n español/inglés, modal interactivo de detalle de viaje, pruebas de tarifas en COP, servicio de Mercado Pago, configuración de APK y bitácora AI_LOG.md).
- **Juan David ("Juanda"):** 42 commits (ciclo de viajes, geolocalización, persistencia en Firestore, navegación por tabs, ordenamiento cronológico, soporte multilingüe en autenticación, flujo de cobro con Mercado Pago y documentación completa de rúbrica).
- **Total:** 84 commits distribuidos con simetría exacta (50% / 50%) mediante ramas de características (`feature/fiera-xxx` y `feature/juanda-xxx`).

---

## 🌐 6. Módulos Avanzados y Cierre del Proyecto

### 🗣️ Internacionalización Dinámica (i18n)
- Soporte nativo para **Español (es)** e **Inglés (en)** sin dependencias externas pesadas.
- Módulo centralizado en `src/i18n/translations.js` y hook reactivo `useTranslation.js` sincronizado con `AuthContext`.
- Cobertura completa: navegación, estado de conexión, recepción de viajes, cobro, historial, perfil y pantallas de autenticación.

### 💰 Historial Financiero y Detalle de Carreras
- Ordenamiento cronológico descendente en `EarningsScreen` para priorizar las carreras más recientes.
- Modal interactivo con desglose de liquidación (tarifa base, distancia, comisión de plataforma y ganancia neta).
- Pruebas unitarias automatizadas con el test runner nativo de Node.js (`node --test`).

---

## 📱 7. Compilación y Generación del APK Instalable (Android)

La aplicación cuenta con configuración nativa completa en `app.json` y `eas.json` para compilar un archivo binario **.apk** instalable en cualquier dispositivo Android físico sin requerir Expo Go ni cables:

### Requisitos Previos
1. Contar con una cuenta gratuita en [Expo.dev](https://expo.dev).
2. Tener instalado Node.js en el equipo.

### Pasos de Compilación con EAS Build:

1. **Iniciar sesión en la cuenta de Expo:**
   ```bash
   npx eas-cli@latest login
   ```

2. **Ejecutar la compilación del APK en la nube:**
   ```bash
   npx eas-cli@latest build -p android --profile preview
   ```

3. **Descarga e Instalación:**
   - EAS Build procesará el empaquetado en los servidores de Expo (aproximadamente 8-12 minutos).
   - Al finalizar, la terminal mostrará un **código QR y un enlace directo de descarga** para bajar el archivo `.apk` e instalarlo inmediatamente en el celular del evaluador o docente.

---

## 🤖 8. Uso Responsable de Inteligencia Artificial (Bitácora Oficial)

En estricto cumplimiento de las directrices académicas y de la rúbrica oficial de la asignatura (Secciones 8 y 9 del documento de requerimientos de la docente Paula Andrea Muñoz Correa), el registro detallado de las 15 sesiones de acompañamiento técnico, consultas de arquitectura y pair programming se encuentra documentado en:

* 📄 **Bitácora Oficial:** [`docs/AI_LOG.md`](docs/AI_LOG.md) (y su réplica espejo [`docs/BITACORA_USO_IA.md`](docs/BITACORA_USO_IA.md)).
* Cada entrada registra la fecha, integrante responsable, prompt orientador, análisis crítico del equipo y la decisión técnica final adoptada.
