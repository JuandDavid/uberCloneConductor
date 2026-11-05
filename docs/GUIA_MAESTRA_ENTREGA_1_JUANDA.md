# PROYECTO: UBERCLONE CONDUCTOR (UNIVERSIDAD)
## Entrega 1: 5 de Noviembre | Materia: Programación Móvil
**Integrantes:** Juan Felipe (Fiera) y Juan David (Juanda)  
**Docente:** Paula Andrea Muñoz Correa  
**Tecnologías:** React Native con Expo (SDK 57) • Firebase Firestore Web (</>)  
**Repositorio Oficial del Proyecto:** https://github.com/JuandDavid/uberCloneConductor.git

---

## 1. REGLAS ACADÉMICAS OBLIGATORIAS (DOCENTE PAULA ANDREA)

1. **Validaciones en Línea (Inline):**
   - Los mensajes de error de los formularios deben aparecer debajo de cada campo en texto color rojo (`#E11D48`).
   - **NUNCA usar ventanas emergentes de `Alert`** para errores de validación en los formularios (requisito estricto calificado por la docente).
   - El botón final solo se habilita cuando todos los campos son válidos.

2. **Firebase Firestore (Configuración Web Oficial):**
   - Inicializar con credenciales Web (`</>`), tal como enseñó la profesora en la clase del 15 de octubre.
   - **NO usar `google-services.json`** en Expo Go para evitar fallos nativos.
   - Exportar siempre la constante `db = getFirestore(app)` en `src/config/firebase.js`.
   - Las operaciones de base de datos se centralizan en `src/services/dbService.js` (nunca consultas directas en las vistas).
   - El conductor se registra en la colección `drivers` con el estado inicial `pending_approval`.

3. **Versión de Expo y React Native:**
   - Usar **Expo SDK 57** (`expo: ~57.0.31`, `react-native: 0.86.3`, `react: 19.2.3`).
   - Siempre instalar librerías con `npx expo install <paquete>` para mantener versiones compatibles.

---

## 2. ESTRATEGIA DE EQUIPO: 20 COMMITS (10 FIERA / 10 JUANDA)

Para reflejar un trabajo universitario colaborativo y natural:
- Exactamente 20 commits distribuidos entre Fiera y Juanda según la tabla de `docs/GUIA_MAESTRA_ENTREGA_1_JUANDA.md`.
- Se trabaja con ramas `feature/fiera-xxx` y `feature/juanda-xxx`, integrando a `main` con Pull Requests o merge limpio.
- **Antes de cada commit:** Verificar que la autoría de Git (`git config user.name`) corresponda a quien le toca en la tabla:
  - Fiera: `git config user.name "Juan Felipe"`
  - Juanda: `git config user.name "Juan David"`

---

## 3. ARQUITECTURA MODULAR IMPLEMENTADA

La arquitectura del módulo de registro se organizó de forma desacoplada y escalable:
- **Componentes UI Reutilizables:** `src/components/` (`InputWithValidation.js`, `CustomButton.js`)
- **Configuraciones Globales:** `src/config/` (`firebase.js`)
- **Servicios de Base de Datos:** `src/services/dbService.js` (centraliza `setDoc`, `getDoc` y `updateDoc`)
- **Gestión de Estado y Sesión:** `src/context/` (`AuthContext.js`)
- **Vistas del Registro:** `src/screens/auth/RegisterScreen.js` (navegación por 3 pestañas y validaciones)
- **Tema Visual y Colores:** `src/styles/theme.js`

Al desarrollar cada módulo, se respetan los criterios de aceptación acordados: validaciones en línea obligatorias sin `Alert`, persistencia en la colección `drivers` y verificación continua de compilación en Expo Go.

---

## 4. TABLA OFICIAL DE LOS 20 COMMITS (10 Y 10)

| Commit | Responsable | Mensaje de Commit Sugerido | Descripción de la Tarea |
| :---: | :---: | :--- | :--- |
| **01** | **Fiera** | `docs: documentar alcance y requerimientos de la primera entrega (registro)` | Crea `README.md` con alcance de Pestaña 1, Pestaña 2 y criterios de aceptación. |
| **02** | **Juanda** | `docs: definir convencion de ramas git y criterios de aceptacion de registro` | Añade guía de ramas (`main`, `feature/`), formato de commits y definición de terminado. |
| **03** | **Fiera** | `chore: inicializar proyecto expo sdk 57 y estructura base de carpetas` | Crea proyecto con `npx create-expo-app` y arma carpetas `src/components`, `src/screens`, `src/context`, `src/services`, `src/styles`. |
| **04** | **Juanda** | `chore: configurar gitignore y template de variables de entorno .env.example` | Ignora `node_modules`, `.expo`, archivos `.env`, y añade `.env.example`. |
| **05** | **Fiera** | `test: verificar ejecucion limpia de expo en android sin errores de inicio` | Comprueba ejecución en celular y corre `npx expo-doctor` para validar compatibilidad. |
| **06** | **Fiera** | `feat(ui): componente InputWithValidation para mensajes de error debajo del campo` | Crea `InputWithValidation.js` con soporte para etiquetas, errores inline en rojo e íconos. |
| **07** | **Juanda** | `feat(ui): componente CustomButton y tema base de colores corporativos` | Crea `CustomButton.js` y `src/styles/theme.js` con la paleta de colores. |
| **08** | **Fiera** | `feat(nav): configurar Stack navigator y pantalla contenedora de registro` | Configura `@react-navigation/native` y `@react-navigation/native-stack` con la ruta de Registro. |
| **09** | **Juanda** | `feat(nav): implementar barra de navegacion por pestañas para el registro` | Diseña las pestañas superiores (1. Personal, 2. Vehículo, 3. Documentos) con indicador activo. |
| **10** | **Juanda** | `feat(firebase): configurar conexion web a firestore segun estructura de clase` | Crea `src/config/firebase.js` con `initializeApp` y exporta la constante `db = getFirestore(app)`. |
| **11** | **Juanda** | `feat(services): crear dbService con funciones para guardar y leer conductores` | Crea `src/services/dbService.js` con las funciones `saveDriver` y `getDriver`. |
| **12** | **Fiera** | `feat(auth): crear AuthContext para almacenar estado del conductor y sesion local` | Crea `src/context/AuthContext.js` con persistencia mediante `@react-native-async-storage/async-storage`. |
| **13** | **Juanda** | `fix(auth): enlazar contexto con la coleccion drivers de firestore` | Conecta el `AuthContext` con `dbService` para sincronizar con Firestore en segundo plano. |
| **14** | **Fiera** | `feat(registro): formulario de datos personales (pestaña 1) con validaciones` | Implementa inputs de nombre, cédula, celular, fecha de nacimiento y correo con validaciones regex. |
| **15** | **Fiera** | `feat(registro): selector de foto de perfil con expo-image-picker` | Integra `launchImageLibraryAsync` para capturar la foto de perfil del conductor. |
| **16** | **Juanda** | `feat(registro): formulario de vehiculo (pestaña 2) con seleccion de categoria` | Implementa inputs de marca, modelo, año, capacidad y selector de categoría (*Economy*, *XL*, *Premium*). |
| **17** | **Juanda** | `feat(registro): validacion de placa colombiana en mayusculas y foto del vehiculo` | Añade regex `^[A-Z]{3}\d{3}$` para placas colombianas y selector de foto del carro. |
| **18** | **Fiera** | `fix(registro): corregir formato de placa y bloqueo de navegacion a pestaña 2` | Fiera revisa la rama de Juanda y añade validación para pasar automáticamente a mayúsculas y control de tabs. |
| **19** | **Juanda** | `feat(registro): guardar conductor en firestore con estado pending_approval` | Conecta el botón final de la pestaña 2 con `registerDriver` para persistir en Firestore. |
| **20** | **Fiera / Juanda** | `test(registro): validar flujo completo de registro de pestañas 1 y 2 en celular` | Prueban el flujo de punta a punta en sus celulares y documentan capturas de prueba. |

---

## 5. CÓMO DEFENDER ESTA ENTREGA ANTE LA PROFESORA PAULA ANDREA
Si la profesora les pregunta en la sustentación:
* **"¿Por qué no usaron Alert para los errores?"**  
  *Respuesta:* "Profe, el requerimiento del documento exige expresamente que los errores se muestren en línea debajo de cada campo para mejorar la experiencia de usuario (UX) en formularios móviles, evitando interrumpir al usuario con popups molestos".
* **"¿Cómo conectaron Firebase?"**  
  *Respuesta:* "Siguiendo lo que usted explicó en la clase del 15 de octubre: creamos el proyecto web (`</>`), inicializamos con `firebase/firestore` y exportamos la constante `db`. No usamos `google-services.json` para no generar conflictos nativos con Expo Go".
* **"¿Dónde se guarda el conductor?"**  
  *Respuesta:* "En la colección `drivers` de Firestore usando `setDoc(doc(db, 'drivers', driverId), data)`. Al registrarse queda con `status: 'pending_approval'`, cumpliendo la regla de que requiere aprobación".
