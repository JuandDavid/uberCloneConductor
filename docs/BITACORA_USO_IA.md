# Bitácora de Acompañamiento Técnico y Uso Responsable de IA
## Proyecto: UberClone Conductor — Entrega 1 (5 de Noviembre)
**Materia:** Programación Móvil  
**Docente:** Paula Andrea Muñoz Correa  
**Semestre:** 5.° Semestre de Ingeniería de Software  
**Integrantes del Equipo:**
- Juan Felipe ("Fiera") — `juan.felipe@universidad.edu.co`
- Juan David ("Juanda") — `juan.david@universidad.edu.co`

---

## 1. Declaración Ética y Rol de la Inteligencia Artificial

En concordancia con las políticas institucionales y las directrices docentes para el desarrollo del proyecto universitario, el presente equipo manifiesta que las herramientas de Inteligencia Artificial Generativa se utilizaron **exclusivamente bajo la modalidad de Mentor Técnico, Tutor Arquitectónico y Asistente de Pair Programming**, y bajo ninguna circunstancia como generador automatizado o reemplazo del criterio de los estudiantes.

### Principios de Uso Aplicados por los Integrantes:
1. **Liderazgo Humano en el Diseño:** Toda decisión de negocio, reglas de validación (placa colombiana, cédula, edad mínima) y diseño visual fueron definidas por los estudiantes a partir de los requerimientos de la docente.
2. **Juicio Crítico y Filtrado Activo:** Las recomendaciones de la IA fueron evaluadas críticamente antes de ser implementadas, descartando sugerencias que violaran los lineamientos de la clase (por ejemplo, descartando el uso de `Alert.alert()` y evitando configuraciones nativas con `google-services.json`).
3. **Verificación Empírica Obligatoria:** Todo código consultado fue probado y validado manualmente por los integrantes en sus dispositivos físicos Android mediante la aplicación **Expo Go**.

---

## 2. Matriz de Consultas Técnicas y Acompañamiento (Sesiones de Tutoría)

A continuación se documentan las principales sesiones de consulta técnica realizadas durante el ciclo de vida de la Entrega 1:

| Sesión / Fecha | Objetivo de la Consulta al Mentor IA | Prompt / Pregunta Orientadora del Estudiante | Análisis y Aporte Crítico del Equipo (Estudiantes) | Decisión Técnica Final Implementada |
| :---: | :--- | :--- | :--- | :--- |
| **Sesión 1**<br>29 Octubre | **Arquitectura Base y Versiones de Expo** | *"Estamos iniciando un proyecto en Expo para entregar a la profe Paula Andrea. ¿Qué versión de Expo SDK y React Native debemos fijar para que no tengamos problemas con Expo Go en celulares Android actuales?"* | Analizamos que Expo Go en nuestros teléfonos soporta SDK 57. Si dejábamos que `create-expo-app` instalara la versión más reciente por defecto, fallaría en los dispositivos. | Se fijó explícitamente `expo: ~57.0.31`, `react-native: 0.86.3` y `react: 19.2.3`, verificado mediante `npx expo-doctor`. |
| **Sesión 2**<br>30 Octubre | **Validación en Línea (Inline UX) sin Popups** | *"La docente exige que bajo ninguna circunstancia se use Alert para informar errores de formulario, sino que aparezcan debajo de cada input en rojo. ¿Cómo estructuramos un componente reutilizable para esto?"* | Comprendimos que crear un componente `InputWithValidation` centralizado evita duplicar lógica de estilos y garantiza que el mensaje de error condicional (`hasError`) aparezca siempre debajo del campo en color `#E11D48`. | Se construyó `src/components/InputWithValidation.js` con soporte para etiquetas, íconos de Ionicons y mensajes en línea con fondo `#FFF1F2`. |
| **Sesión 3**<br>31 Octubre | **Conexión Web a Firebase Firestore** | *"La profe nos enseñó en clase a conectar Firebase Web con `getFirestore(app)` exportando la constante `db`. ¿Cómo desacoplamos las operaciones para no hacer consultas directas en las vistas?"* | La IA inicialmente sugirió usar `getAuth()` y reglas completas de autenticación. Nosotros determinamos que para la clase de la docente solo se requería Firestore y que `getAuth()` generaba advertencias innecesarias en consola móvil. | Descartamos Firebase Auth. Implementamos `src/services/dbService.js` con `saveDriver`, `getDriver` y `updateDriverStatus` apuntando a la colección `drivers`. |
| **Sesión 4**<br>1-2 Noviembre | **Formularios de Registro y Expresiones Regulares** | *"¿Cuáles son las expresiones regulares estándar en JavaScript para validar cédula colombiana (6-10 dígitos), celular (10 dígitos) y placa colombiana de 3 letras y 3 números?"* | Evaluamos los regex propuestos. Añadimos manualmente la lógica para sanitizar la placa a mayúsculas (`toUpperCase()`) y eliminar caracteres especiales, además de calcular la edad exacta con precisión de día, mes y año. | Se implementaron las funciones `validatePersonal()` y `validateVehicle()` en `RegisterScreen.js` con bloqueo de avance entre pestañas. |
| **Sesión 5**<br>3 Noviembre | **Depuración del Teclado en Dispositivos Móviles** | *"En las pruebas en celular físico notamos que al abrir el teclado en la pestaña 2 se tapan los inputs inferiores de año y capacidad. ¿Cómo se soluciona en Expo?"* | Identificamos la necesidad de envolver los formularios en `KeyboardAvoidingView` con comportamiento condicional según la plataforma (`Platform.OS === 'ios' ? 'padding' : undefined`). | Juan Felipe aplicó la corrección en el commit `11c3dc0: correcion comporamiento teclado`. |

---

## 3. Ejemplos de Sugerencias de la IA Modificadas o Rechazadas por el Equipo

Un aspecto fundamental del aprendizaje autónomo fue aprender a decir **"NO"** a las sugerencias automáticas de la IA cuando estas se alejaban del objetivo pedagógico:

1. **Rechazo de librerías nativas con configuración compleja (`google-services.json`):**  
   *Sugerencia de la IA:* Utilizar `@react-native-firebase/app` con archivos `google-services.json` de Android.  
   *Criterio del equipo:* Se rechazó de inmediato. La docente Paula Andrea especificó en su clase que en Expo Go se debe utilizar el SDK Web (`firebase/firestore`), asegurando portabilidad multiplataforma sin requerir compilar binarios nativos.
2. **Rechazo de diálogos emergentes automáticos:**  
   *Sugerencia de la IA:* Usar `Alert.alert('Error', 'Faltan campos obligatorios')` al presionar el botón de envío.  
   *Criterio del equipo:* Se descartó tajantemente para acatar la regla académica de evaluación: todos los errores se muestran inline en color rojo debajo del componente correspondiente.
3. **Rechazo del módulo `firebase/auth`:**  
   *Sugerencia de la IA:* Importar `getAuth(app)` para gestionar sesiones.  
   *Criterio del equipo:* Notamos que en React Native producía una advertencia amarilla de consola sobre persistencia no configurada. Como la docente solicitó almacenar los conductores directamente en Firestore (`drivers`), eliminamos `getAuth` y dejamos el código limpio.

---

## 4. Evidencias de Verificación Humana en Dispositivos Físicos

Todas las características generadas y refinadas con el apoyo del mentor IA fueron sometidas a pruebas reales en dispositivos físicos Android:
- **Dispositivo de Juan Felipe:** Android físico ejecutando Expo Go (SDK 57).
- **Dispositivo de Juan David:** Android físico ejecutando Expo Go (SDK 57).
- **Herramientas de Diagnóstico Ejecutadas por los Estudiantes:**
  - `npx expo-doctor` (21 de 21 comprobaciones de compatibilidad superadas).
  - Inspección de la consola de Firebase Web (`uberclone-conductor10`) confirmando la creación de documentos en la colección `drivers` con el campo `status: 'pending_approval'`.

---

## 5. Conclusión y Aprendizajes Obtenidos

El uso de la Inteligencia Artificial como mentor técnico permitió al equipo:
1. Comprender a fondo el flujo de ciclo de vida de los componentes en React Native (`useState`, `useEffect`, `useMemo`).
2. Entender la arquitectura en capas (UI en `components/`, Estado en `context/`, Lógica de negocio en `screens/`, y Acceso a datos en `services/`).
3. Aprender a interpretar mensajes de error en Expo y tomar decisiones de ingeniería conscientes basadas en los requerimientos del docente y no en soluciones prefabricadas.

---

## 6. Actualización Entrega 2: Ciclo de Viajes, Geoubicación y Arquitectura Financiera

Durante el desarrollo de la Entrega 2 (Commits 37 al 52, liderados por Juan David para nivelar el repositorio al 50%/50% con 26 commits cada uno), se llevaron a cabo sesiones adicionales de consulta técnica:

| Sesión / Fecha | Objetivo de la Consulta al Mentor IA | Prompt / Pregunta Orientadora del Estudiante | Análisis y Aporte Crítico del Equipo (Estudiantes) | Decisión Técnica Final Implementada |
| :---: | :--- | :--- | :--- | :--- |
| **Sesión 6**<br>10 Noviembre | **Máquina de Estados de Viaje y Ciclo Operativo** | *"¿Cómo estructuramos un `TripContext` en React Native que maneje las fases del viaje (requested, accepted, arrived, in_progress, completed) sincronizando con Firestore?"* | Analizamos que el conductor debe poder continuar operando incluso si recarga la app. Modelamos las transiciones atómicas y definimos la colección oficial `trips` en Firestore. | Se construyó `src/context/TripContext.js` conectado a `dbService.js` con persistencia de estados y marcas de tiempo (`arrivedAt`, `startedAt`, `completedAt`). |
| **Sesión 7**<br>10 Noviembre | **Geolocalización GPS y Soporte Dual Móvil/Web** | *"Al probar en Expo Web, `react-native-maps` genera errores porque es una biblioteca nativa. ¿Cómo logramos que funcione tanto en celulares Android como en navegadores web?"* | Descubrimos que la importación dinámica y condicional de `react-native-maps` junto con un radar visual de respaldo permite que la app sea probada en cualquier entorno sin crasheos. | Implementación condicional en `HomeScreen.js` y `ActiveTripScreen.js` con fallback web y marcador GPS centralizado. |
| **Sesión 8**<br>10 Noviembre | **Liquidación Financiera y Modo Privacidad** | *"En un carro con pasajeros es peligroso que la pantalla muestre todo el tiempo cuánto dinero lleva ganado el conductor. ¿Cómo implementamos un modo privacidad y el recibo final?"* | Diseñamos un botón de ojo en `HeaderConductor` para alternar la visualización del saldo con asteriscos (`••••••`), y un modal de liquidación `TripReceiptModal` que distingue entre cobro en efectivo y cobro digital. | Creación de `HeaderConductor.js` con modo privacidad y `TripReceiptModal.js` con calificación de estrellas al pasajero. |
| **Sesión 9**<br>10 Noviembre | **Pestañas Inferiores e Integración de Navegación** | *"¿Cómo integramos un BottomTabNavigator para Conducir, Ganancias y Perfil sin romper las rutas existentes de Login y PendingApproval?"* | Diseñamos una arquitectura híbrida donde `RootNavigator` gestiona la pila condicional de autenticación y modales a pantalla completa (`ActiveTrip`), mientras que la ruta `Home` monta el `MainTabNavigator`. | Creación de `src/navigation/MainTabNavigator.js` con 3 pestañas y registro fluido en `RootNavigator.js`. |

