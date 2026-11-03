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
El proyecto se desarrolla bajo un esquema colaborativo riguroso de 20 commits divididos equitativamente entre los dos integrantes (10 commits Juan Felipe / 10 commits Juan David), utilizando ramas de características (`feature/fiera-xxx` y `feature/juanda-xxx`) y verificación continua de compilación.

Para más información, consultar:
- [Informe de Pruebas y Validación (Entrega 1)](file:///c:/Users/Juan%20David/uberCloneConductor/docs/PRUEBAS_REGISTRO_ENTREGA_1.md)
- [Convenciones de Git y Criterios de Aceptación](file:///c:/Users/Juan%20David/uberCloneConductor/docs/CONVENCIONES_GIT_Y_CRITERIOS.md)
- [Guía Maestra de Entrega 1](file:///c:/Users/Juan%20David/uberCloneConductor/docs/GUIA_MAESTRA_ENTREGA_1_JUANDA.md)
