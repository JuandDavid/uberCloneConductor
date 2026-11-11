# PROYECTO: UBERCLONE CONDUCTOR (UNIVERSIDAD)
## Entrega 2: Ciclo Completo del Servicio de Transporte | Materia: Programación Móvil
**Integrantes:** Juan David (Juanda) y Juan Felipe (Fiera)  
**Docente:** Paula Andrea Muñoz Correa  
**Tecnologías:** React Native con Expo (SDK 57) • Firebase Firestore Web SDK (`</>`) • React Navigation v7  
**Repositorio Oficial del Proyecto:** https://github.com/JuandDavid/uberCloneConductor.git  

---

## 1. REGLAS ACADÉMICAS OBLIGATORIAS (DOCENTE PAULA ANDREA)

1. **Cero Popups de `Alert.alert()` en Formularios y Flujo Operativo:**
   - La experiencia de usuario debe ser fluida y completamente integrada en la interfaz.
   - Todo mensaje de validación, error o estado se despliega mediante banners visuales inline estilizados (`#15803D` para éxito, `#E11D48` para errores, `#B45309` para advertencias) y modales dedicados (`IncomingTripModal`, `TripReceiptModal`).

2. **Arquitectura Firebase Firestore Web Oficial:**
   - Inicializado mediante el SDK Web de Firestore (`getFirestore(app)` en `src/config/firebase.js`), **sin utilizar `google-services.json`** para garantizar portabilidad multiplataforma total (Android, iOS y Web).
   - Acceso a datos centralizado en `src/services/dbService.js` (operaciones atómicas `setDoc`, `getDoc`, `updateDoc`, `query`, `where`).
   - Colecciones oficiales: `drivers` y `trips`.

3. **Demostración de Sustentación en Vivo (Classroom Grading):**
   - Incorporación de botón para simulación de viajes de prueba en clase (`simulateIncomingTrip`).
   - Switch de alternancia de estado de aprobación (`approved` ↔ `pending_approval`) en `PendingApprovalScreen` y `ProfileScreen`.

---

## 2. BALANCE OFICIAL DE COMMITS (26 FIERA / 26 JUANDA = 52 COMMITS TOTALES)

Al finalizar la Entrega 2, el repositorio alcanza un balance perfecto del **50% / 50%**:
- **Juan Felipe (Fiera):** 26 commits (Commits 1 al 20 de Entrega 1 + Commits 21 al 26 de inicio de Entrega 2).
- **Juan David (Juanda):** 26 commits (Commits de Entrega 1 + Commits 37 al 52 de culminación de Entrega 2).

### Tabla de Commits de la Fase Final (Juan David):
| Commit | Hash / Tipo | Mensaje de Commit Oficial | Módulo Impactado |
| :---: | :---: | :--- | :--- |
| **37** | `feat(screens)` | `feat(screens): pantalla de estado de aprobacion PendingApprovalScreen` | `src/screens/auth/PendingApprovalScreen.js` |
| **38** | `feat(auth)` | `feat(auth): pantalla de inicio de sesion LoginScreen para conductores` | `src/screens/auth/LoginScreen.js` |
| **39** | `feat(nav)` | `feat(nav): navegacion condicional en RootNavigator segun estado de sesion` | `src/navigation/RootNavigator.js` |
| **40** | `feat(config)` | `feat(config): modulo de tarifas y calculo de costos pricing.js` | `src/config/pricing.js` |
| **41** | `feat(context)` | `feat(context): crear TripContext para gestion de estado de viajes en tiempo real` | `src/context/TripContext.js`, `App.js` |
| **42** | `feat(home)` | `feat(home): pantalla principal HomeScreen con react-native-maps y expo-location` | `src/screens/main/HomeScreen.js` |
| **43** | `feat(home)` | `feat(home): switch circular online/offline sincronizado con firestore` | `src/screens/main/HomeScreen.js` |
| **44** | `feat(ui)` | `feat(ui): componente HeaderConductor con balance del dia y calificacion` | `src/components/HeaderConductor.js` |
| **45** | `feat(trips)` | `feat(trips): modal de solicitud de viaje entrante con temporizador e info de ruta` | `src/components/IncomingTripModal.js` |
| **46** | `feat(trips)` | `feat(trips): acciones de aceptar y rechazar viaje con persistencia en coleccion trips y transicion visual` | `src/services/dbService.js`, `HomeScreen.js` |
| **47** | `feat(trips)` | `feat(trips): pantalla de viaje activo con navegacion paso a paso hacia destino ActiveTripScreen` | `src/screens/trips/ActiveTripScreen.js` |
| **48** | `feat(trips)` | `feat(trips): liquidacion del viaje, cobro de tarifa y actualizacion de balance` | `src/components/TripReceiptModal.js` |
| **49** | `feat(nav)` | `feat(nav): integracion de BottomTabNavigator con Home, Ganancias y Perfil` | `src/navigation/MainTabNavigator.js` |
| **50** | `feat(screens)` | `feat(screens): pantalla de historial de ganancias y balance acumulado EarningsScreen` | `src/screens/main/EarningsScreen.js` |
| **51** | `feat(screens)` | `feat(screens): pantalla de perfil de conductor con vehiculo y cierre de sesion ProfileScreen` | `src/screens/main/ProfileScreen.js` |
| **52** | `docs` | `docs: documentar manual de arquitectura de entrega 2 y guia de sustentacion` | `docs/GUIA_MAESTRA_ENTREGA_2_JUANDA.md` |

---

## 3. ARQUITECTURA GENERAL DEL SISTEMA (ENTREGA 2)

```
uberCloneConductor/
├── src/
│   ├── components/
│   │   ├── HeaderConductor.js       # Cabecera flotante con balance y modo privacidad
│   │   ├── IncomingTripModal.js     # Modal de solicitud con cuenta regresiva
│   │   ├── TripReceiptModal.js      # Modal de liquidación, cobro y calificación
│   │   ├── InputWithValidation.js   # Entradas con error inline (rojo #E11D48)
│   │   └── CustomButton.js          # Botones corporativos
│   ├── config/
│   │   ├── firebase.js              # Conexión Firestore Web Oficial
│   │   └── pricing.js               # Algoritmo de tarifas y formato COP
│   ├── context/
│   │   ├── AuthContext.js           # Sesión persistente con AsyncStorage
│   │   └── TripContext.js           # Máquina de estados de viaje en tiempo real
│   ├── navigation/
│   │   ├── RootNavigator.js         # Pila condicional de autenticación y modales
│   │   └── MainTabNavigator.js      # Pestañas inferiores (Conducir, Ganancias, Perfil)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   └── PendingApprovalScreen.js
│   │   ├── main/
│   │   │   ├── HomeScreen.js        # Mapa GPS, botón GO circular y HUD de carrera
│   │   │   ├── EarningsScreen.js    # Balance, retiros y gráfica semanal
│   │   │   └── ProfileScreen.js     # Ficha técnica de vehículo y documentos
│   │   └── trips/
│   │       └── ActiveTripScreen.js  # Navegación asistida paso a paso HUD
│   ├── services/
│   │   └── dbService.js             # Centralización de queries de Firestore
│   └── styles/
│       └── theme.js
└── test/
    └── datePickerValidation.test.js # Suite de pruebas unitarias automatizadas
```

---

## 4. GUÍA RÁPIDA DE SUSTENTACIÓN EN CLASE (PASO A PASO)

1. **Inicio de Sesión y Verificación de Estado:**
   - Ingresar con cédula `1098765432` o presionar *"Iniciar con Conductor Demo"*.
   - Explicar la pantalla `PendingApprovalScreen`: La cuenta inicia en estado de revisión y se puede alternar con el switch de demostración.
2. **Conexión en Línea (HomeScreen):**
   - Presionar el botón circular central **INICIAR CONECTAR**.
   - Mostrar cómo se actualiza en Firestore el campo `isOnline: true` y la cabecera modular `HeaderConductor` cambia a verde `ONLINE`.
   - Demostrar el modo privacidad en ganancias presionando el ícono del ojo.
3. **Recepción y Aceptación de Viaje:**
   - Presionar *"Simular Solicitud de Viaje Entrante (Sustentación)"*.
   - Mostrar el temporizador regresivo de 15 segundos en `IncomingTripModal`.
   - Explicar la transparencia tarifaria (Ganancia estimada: `$ 14.800 COP`, pasajero, origen y destino).
   - Presionar **ACEPTAR VIAJE**.
4. **Ciclo Operativo y Navegación Paso a Paso:**
   - La app abre `ActiveTripScreen` con navegación paso a paso HUD.
   - Demostrar las 3 transiciones secuenciales:
     1. *"LLEGUÉ AL PUNTO DE RECOGIDA"* -> Estado `ARRIVED`.
     2. *"INICIAR VIAJE CON PASAJERO"* -> Estado `IN_PROGRESS`.
     3. *"FINALIZAR Y COBRAR VIAJE"* -> Estado `COMPLETED`.
5. **Liquidación y Cobro:**
   - Se abre `TripReceiptModal` desglosando la tarifa en efectivo, la comisión retenida y la calificación del pasajero (1 a 5 estrellas).
   - Presionar *"CONFIRMAR PAGO RECIBIDO"*.
6. **Módulo de Ganancias y Perfil:**
   - Ir a la pestaña **Ganancias**: Visualizar el saldo actualizado, la gráfica de barras y el historial de viajes.
   - Probar el modal *"Solicitar Retiro de Saldo"* a Nequi.
   - Ir a la pestaña **Perfil**: Mostrar los datos del vehículo, la vigencia del SOAT y el botón seguro de cierre de sesión.
