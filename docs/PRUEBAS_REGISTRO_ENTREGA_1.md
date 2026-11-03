# Informe de Validación y Pruebas de Registro — Entrega 1
## Proyecto: UberClone Conductor
**Materia:** Programación Móvil  
**Docente:** Paula Andrea Muñoz Correa  
**Fecha de Prueba:** 3 de Noviembre  
**Responsables de Validación:** Juan Felipe (Fiera) y Juan David (Juanda)  
**Entorno de Ejecución:** Dispositivo Móvil Android (Expo Go) • React Native 0.86.3 • Expo SDK 57 • Firebase Firestore Web  

---

## 🎯 1. Resumen Ejecutivo
Se ejecutó la batería completa de pruebas funcionales y de experiencia de usuario sobre el **Módulo de Registro de Conductor (Pestañas 1 y 2)**. Todas las pruebas fueron superadas exitosamente, verificando el cumplimiento estricto de las reglas académicas exigidas por la docente Paula Andrea Muñoz Correa.

---

## 🧪 2. Matriz de Casos de Prueba Ejecutados

| ID | Módulo / Componente | Descripción de la Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **CP-01** | Datos Personales | Dejar campos en blanco y pulsar "Continuar". | Mensajes en rojo (`#E11D48`) debajo de cada campo. **CERO `Alert`**. | Errores en línea debajo de cada input. Sin popups. | ✅ Superado |
| **CP-02** | Validación Cédula | Ingresar 4 dígitos (`1234`) o letras en el documento. | Error: "Debe ser numérico de 6 a 10 dígitos". | Error en línea bloqueando el avance. | ✅ Superado |
| **CP-03** | Validación Celular | Ingresar 8 dígitos o caracteres alfanuméricos. | Error: "Debe contener exactamente 10 dígitos". | Validación en línea activada. | ✅ Superado |
| **CP-04** | Fecha Nacimiento | Ingresar fecha de un menor de edad (ej: 2012). | Error: "El conductor debe ser mayor de 18 años". | Validación matemática inline aplicada. | ✅ Superado |
| **CP-05** | Formato Correo | Ingresar correo sin arroba o sin dominio (`juan.com`). | Error: "Formato de correo inválido". | Expresión regular valida el formato. | ✅ Superado |
| **CP-06** | Foto de Perfil | Cargar foto desde galería con `expo-image-picker`. | Previsualización en avatar circular y limpieza de error. | Miniatura cargada correctamente. | ✅ Superado |
| **CP-07** | Bloqueo de Tabs | Pulsar pestaña 2 o 3 con datos personales incompletos. | La app bloquea el cambio de pestaña y muestra los errores. | Bloqueo efectivo, usuario permanece en Tab 1. | ✅ Superado |
| **CP-08** | Placa Colombiana | Ingresar placa en minúsculas con guion (`abc-123`). | Sanitización automática a mayúsculas y sin guiones (`ABC123`). | Placa formateada automáticamente en `ABC123`. | ✅ Superado |
| **CP-09** | Regla Categoría XL | Seleccionar categoría *XL* con capacidad de 4 pasajeros. | Error: "La categoría XL exige una capacidad mínima de 6 pasajeros". | Validación en línea aplicada. | ✅ Superado |
| **CP-10** | Foto de Vehículo | Cargar foto del vehículo con placa visible. | Miniatura previsualizada en caja de carga. | Imagen desplegada sin retrasos. | ✅ Superado |
| **CP-11** | Persistencia Cloud | Pulsar "Registrar Conductor" con datos válidos. | Conductor guardado en colección `drivers` con `status: 'pending_approval'`. | Registro persistido en Firestore y tarjeta de confirmación visible. | ✅ Superado |
| **CP-12** | Rendimiento Móvil | Compilación y recarga en caliente en Expo Go. | Cero caídas, cero advertencias de dependencias nativas. | Rendimiento óptimo en Expo SDK 57. | ✅ Superado |

---

## 📸 3. Evidencias de Cumplimiento de Reglas Académicas

### 3.1. Validaciones en Línea (Inline UX)
- Todos los mensajes de advertencia y error se renderizan directamente debajo del componente [`InputWithValidation`](file:///c:/Users/Juan%20David/uberCloneConductor/src/components/InputWithValidation.js) utilizando el color corporativo reglamentario `#E11D48` y fondo de alerta `#FFF1F2`.
- **Se certifica que no se utilizó `Alert.alert()` en ningún formulario de registro.**

### 3.2. Conexión Web a Firebase Firestore
- La instancia se exporta como `export const db = getFirestore(app)` en [`src/config/firebase.js`](file:///c:/Users/Juan%20David/uberCloneConductor/src/config/firebase.js) utilizando la configuración Web (`</>`) oficial enseñada por la docente.
- No se incluyó ningún archivo nativo `google-services.json`, asegurando portabilidad completa en Expo Go.

### 3.3. Estado Inicial del Conductor
- Al persistir la información mediante [`dbService.saveDriver()`](file:///c:/Users/Juan%20David/uberCloneConductor/src/services/dbService.js), el documento en la colección `drivers` se almacena con:
  ```json
  {
    "status": "pending_approval",
    "balance": 0,
    "rating": 5.0
  }
  ```

---

## 🏁 4. Conclusión
La **Entrega 1 (5 de Noviembre)** cumple el 100% de los requerimientos funcionales, de diseño y arquitectónicos solicitados para la materia de Programación Móvil.
