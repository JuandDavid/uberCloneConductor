# Convenciones de Git y Criterios de Aceptación
## Proyecto: UberClone Conductor — Entrega 1 (5 de Noviembre)
**Materia:** Programación Móvil  
**Docente:** Paula Andrea Muñoz Correa  
**Integrantes:** Juan Felipe (Fiera) y Juan David (Juanda)  

---

## 🌿 1. Estrategia de Ramas (Git Flow Académico)

Para garantizar un desarrollo ordenado, trazable y equitativo entre ambos integrantes, se establece el siguiente modelo de ramas:

### 1.1. Rama Principal (`main`)
- Es la rama protegida y estable que contiene el código listo para revisión y entrega.
- Ningún integrante debe realizar `push` directo sobre `main` durante el desarrollo de nuevas funcionalidades.
- La integración a `main` se realiza mediante Pull Requests o integración verificada tras comprobar que el código compila limpiamente en Expo.

### 1.2. Ramas de Características (`feature/`)
Cada tarea de desarrollo se realiza en una rama propia que identifica claramente quién es el responsable:
- **Ramas de Juan Felipe:** `feature/fiera-<nombre-tarea>`  
  *Ejemplo:* `feature/fiera-input-validation`, `feature/fiera-auth-context`
- **Ramas de Juan David:** `feature/juanda-<nombre-tarea>`  
  *Ejemplo:* `feature/juanda-custom-button`, `feature/juanda-firebase-service`

### 1.3. Ciclo de Vida de una Rama
1. Crear la rama a partir de `main` actualizado:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/juanda-modulo-vehiculo
   ```
2. Realizar los cambios correspondientes y verificar la compilación en Expo (`npx expo start`).
3. Crear el commit con la autoría correcta (`Juan Felipe` o `Juan David`).
4. Integrar los cambios en `main` tras revisión cruzada.

---

## 📝 2. Formato de Mensajes de Commit (*Conventional Commits*)

Se adopta el estándar de la industria **Conventional Commits** utilizando el tipo de cambio en inglés y la descripción en español:

```text
<tipo>(<alcance opcional>): <descripción concisa de la tarea>
```

### 2.1. Tipos Permitidos:
- **`feat`**: Nueva funcionalidad para el usuario (ej: pantalla, componente, servicio).
- **`fix`**: Corrección de un fallo o ajuste en la lógica.
- **`docs`**: Cambios exclusivos en documentación (`README.md`, guías, comentarios explicativos).
- **`chore`**: Tareas de configuración, dependencias o mantenimiento que no alteran la lógica de negocio (ej: `package.json`, `.gitignore`).
- **`test`**: Pruebas de funcionamiento, verificación de compilación o testeo con `expo-doctor`.
- **`refactor`**: Reorganización de código sin alterar su comportamiento externo.
- **`style`**: Ajustes de formato, espaciado o linting que no afectan el significado del código.

### 2.2. Ejemplos Válidos del Proyecto:
```text
feat(ui): componente InputWithValidation para mensajes de error debajo del campo
feat(services): crear dbService con funciones para guardar y leer conductores
fix(registro): corregir formato de placa y bloqueo de navegacion a pestaña 2
chore: configurar gitignore y template de variables de entorno .env.example
```

---

## ✅ 3. Criterios de Aceptación (Definition of Done - DoD)

Una tarea o commit del **Módulo de Registro de Conductores** se considera terminada (*Done*) únicamente si cumple con la totalidad de los siguientes criterios:

### 3.1. Reglas Académicas Obligatorias (Evaluación Docente Paula Andrea)
1. **Validación en Línea (Inline UX) — Estricto:**
   - Todo mensaje de error debe posicionarse directamente debajo del campo correspondiente en texto de color rojo (`#E11D48`).
   - **Prohibición absoluta:** Bajo ninguna circunstancia se debe recurrir a alertas modales del sistema (`Alert.alert()`) para informar que un campo es obligatorio o inválido.
2. **Control de Activación del Botón:**
   - El botón de envío o de cambio de pestaña debe permanecer deshabilitado o bloquear la navegación hasta que la totalidad de los campos requeridos cumplan las validaciones de formato.
3. **Persistencia Web en Firebase Firestore:**
   - Configuración inicializada en modo Web (`</>`) exportando `export const db = getFirestore(app)` desde `src/config/firebase.js`.
   - **Cero uso de `google-services.json`** en el entorno Expo Go para evitar incompatibilidades binarias.
   - Las consultas y mutaciones deben realizarse a través del servicio centralizado `src/services/dbService.js`.
   - El conductor registrado debe crearse en la colección `drivers` con el atributo `status: 'pending_approval'`.

### 3.2. Criterios Técnicos de la Pestaña 1 (Datos Personales)
- Nombre completo validado (no vacío, caracteres válidos).
- Documento de identidad numérico de 6 a 10 dígitos.
- Teléfono móvil numérico de exactamente 10 dígitos.
- Correo electrónico con estructura válida (`nombre@dominio.ext`).
- Fecha de nacimiento verificando mayoría de edad (>= 18 años).
- Selector de foto de perfil funcional mediante `expo-image-picker`.

### 3.3. Criterios Técnicos de la Pestaña 2 (Vehículo)
- Placa colombiana estándar (`ABC123`), convertida automáticamente a mayúsculas.
- Marca, modelo y año del vehículo dentro de rangos operativos válidos.
- Capacidad de pasajeros acorde a la categoría elegida.
- Selector de categoría activo (*Economy*, *XL*, *Premium*).
- Selector de fotografía del vehículo registrado.

### 3.4. Criterios de Calidad de Código
- Código limpio, modular y sin advertencias en consola.
- Compatibilidad garantizada con **Expo SDK 57** (`react-native: 0.86.3`).
