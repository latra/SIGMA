# 📋 Sistema de Reclutamiento - Documentación de Endpoints

## 🔗 Base URL
```
/recruitment
```

## 🔐 Autenticación
- **Público**: Solo el endpoint de creación de solicitudes
- **Médicos Recruiters**: Requiere token Firebase con rol `doctor` Y rol adicional `recruiter`
- **Policías Recruiters**: Requiere token Firebase con rol `police` Y rol adicional `recruiter`

## 🎯 Sistema de Roles Granular
El sistema ahora implementa un sistema de roles más específico:
- **Roles básicos**: `doctor`, `police`, `admin`
- **Roles adicionales**: Array de strings que incluye roles especializados como `recruiter`
- **Acceso a reclutamiento**: Solo usuarios con el rol adicional `recruiter` pueden acceder a las funcionalidades de gestión de reclutamiento

---

## 📝 Crear Solicitud de Reclutamiento

### `POST /recruitment/`
**🌐 Acceso**: Público (sin autenticación)

**📋 Descripción**: Crea una nueva solicitud de reclutamiento que se almacena automáticamente en el repositorio correspondiente según la profesión.

**📤 Request Body**:
```json
{
  "name": "string",
  "discord": "string", 
  "phone": "string",
  "profession": "EMS" | "POLICE",
  "dni": "string",
  "motivation": "string",
  "experience": "string",
  "description": ["string", "string", ...]
}
```

**📥 Response** (201 Created):
```json
{
  "message": "Solicitud de reclutamiento para {profession} creada exitosamente",
  "recruitment": {
    "name": "string",
    "discord": "string",
    "phone": "string", 
    "profession": "EMS" | "POLICE",
    "dni": "string",
    "motivation": "string",
    "experience": "string",
    "description": ["string"],
    "attended": false,
    "attended_by": null,
    "attended_at": null,
    "created_at": "2024-01-01T10:00:00"
  }
}
```

**❌ Errores**:
- `400`: Profesión no soportada
- `500`: Error interno del servidor

---

## 👨‍⚕️ Endpoints para Médicos

### `GET /recruitment/medical`
**🔐 Autenticación**: Requerida (Médico con rol 'recruiter')

**📋 Descripción**: Obtiene todas las solicitudes de reclutamiento médico.

**📥 Response** (200 OK):
```json
[
  {
    "id": "firestore_document_id",
    "name": "string",
    "discord": "string",
    "phone": "string",
    "profession": "EMS",
    "dni": "string", 
    "motivation": "string",
    "experience": "string",
    "description": ["string"],
    "attended": true | false,
    "attended_by": "string" | null,
    "attended_at": "2024-01-01T10:00:00" | null,
    "created_at": "2024-01-01T10:00:00"
  }
]
```

### `GET /recruitment/medical/pending`
**🔐 Autenticación**: Requerida (Médico con rol 'recruiter')

**📋 Descripción**: Obtiene solo las solicitudes de reclutamiento médico **no atendidas**.

**📥 Response**: Mismo formato que el anterior, pero filtrado por `attended: false`

### `GET /recruitment/medical/{recruitment_id}`
**🔐 Autenticación**: Requerida (Médico con rol 'recruiter')

**📋 Descripción**: Obtiene una solicitud médica específica por ID.

**🔗 Parámetros URL**:
- `recruitment_id`: ID del documento en Firestore

**📥 Response** (200 OK): Objeto individual con el mismo formato que el array anterior

**❌ Errores**:
- `404`: Solicitud no encontrada

### `PUT /recruitment/medical/{recruitment_id}/attend`
**🔐 Autenticación**: Requerida (Médico con rol 'recruiter')

**📋 Descripción**: Marca una solicitud médica como atendida.

**🔗 Parámetros URL**:
- `recruitment_id`: ID del documento en Firestore

**📤 Request Body**: No requerido

**📥 Response** (200 OK):
```json
{
  "message": "Solicitud médica marcada como atendida exitosamente",
  "recruitment": {
    // Objeto completo actualizado con:
    "attended": true,
    "attended_by": "dni_del_medico",
    "attended_at": "2024-01-01T15:30:00"
  }
}
```

**❌ Errores**:
- `404`: Solicitud no encontrada

---

## 👮‍♂️ Endpoints para Policías

### `GET /recruitment/police`
**🔐 Autenticación**: Requerida (Policía con rol 'recruiter')

**📋 Descripción**: Obtiene todas las solicitudes de reclutamiento policial.

**📥 Response**: Mismo formato que `/recruitment/medical`, pero con `profession: "POLICE"`

### `GET /recruitment/police/pending`
**🔐 Autenticación**: Requerida (Policía con rol 'recruiter')

**📋 Descripción**: Obtiene solo las solicitudes de reclutamiento policial **no atendidas**.

**📥 Response**: Filtrado por `attended: false`

### `GET /recruitment/police/{recruitment_id}`
**🔐 Autenticación**: Requerida (Policía con rol 'recruiter')

**📋 Descripción**: Obtiene una solicitud policial específica por ID.

**🔗 Parámetros URL**:
- `recruitment_id`: ID del documento en Firestore

### `PUT /recruitment/police/{recruitment_id}/attend`
**🔐 Autenticación**: Requerida (Policía con rol 'recruiter')

**📋 Descripción**: Marca una solicitud policial como atendida.

**🔗 Parámetros URL**:
- `recruitment_id`: ID del documento en Firestore

**📥 Response**:
```json
{
  "message": "Solicitud policial marcada como atendida exitosamente",
  "recruitment": {
    // Objeto actualizado con attended: true
  }
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | ✅ Operación exitosa |
| `201` | ✅ Recurso creado exitosamente |
| `400` | ❌ Datos de entrada inválidos |
| `401` | ❌ No autorizado (token inválido) |
| `403` | ❌ Prohibido (rol insuficiente) |
| `404` | ❌ Recurso no encontrado |
| `500` | ❌ Error interno del servidor |

---

## 🔧 Headers Requeridos

### Para endpoints autenticados:
```http
Authorization: Bearer {firebase_jwt_token}
Content-Type: application/json
```

### Para endpoint público:
```http
Content-Type: application/json
```

---

## 📝 Notas para el Frontend

1. **Validación de Profesión**: Solo `"EMS"` y `"POLICE"` son valores válidos para el campo `profession`

2. **Timestamps**: Todos los timestamps están en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ss`)

3. **Separación de Datos**: Los médicos solo pueden ver/gestionar solicitudes médicas, los policías solo las policiales

4. **Estados de Solicitud**:
   - `attended: false` = Solicitud pendiente
   - `attended: true` = Solicitud ya procesada

5. **Formulario Público**: El endpoint `POST /recruitment/` es el único que no requiere autenticación y es donde los usuarios enviarán sus solicitudes

6. **IDs de Firestore**: Los IDs en las respuestas son los document IDs de Firestore, úsalos para las operaciones específicas

7. **Ordenamiento**: Las listas se devuelven ordenadas por fecha de creación (más recientes primero)

8. **🎯 Rol Recruiter Requerido**: Todos los endpoints de gestión (excepto crear solicitud) requieren que el usuario tenga el rol adicional `"recruiter"` en su perfil. Un médico normal sin rol recruiter no podrá acceder a estos endpoints.

9. **🔄 Compatibilidad hacia Atrás**: Si un usuario existente no tiene el campo `roles` en su perfil (usuarios creados antes de esta actualización), se asumirá que tiene un array vacío `[]`, por lo que NO tendrá acceso a funcionalidades de reclutamiento hasta que se le asigne el rol.

10. **Códigos de Error Específicos para Recruiter**:
    - `403`: Si el usuario es médico/policía válido pero no tiene rol "recruiter"
    - Mensaje: "Access denied: Recruiter role required for [medical|police] recruitment management"

---

## 🎯 Flujo de Trabajo Sugerido

1. **Usuario solicita ingreso** → `POST /recruitment/`
2. **Médico/Policía Recruiter consulta pendientes** → `GET /recruitment/{medical|police}/pending`
3. **Médico/Policía Recruiter revisa solicitud específica** → `GET /recruitment/{medical|police}/{id}`
4. **Médico/Policía Recruiter marca como atendida** → `PUT /recruitment/{medical|police}/{id}/attend`

---

## 🔄 Migración y Compatibilidad

### **Usuarios Existentes**
- **Sin campo `roles`**: Automáticamente tratados como `roles: []` (sin acceso a reclutamiento)
- **Con campo `roles: null`**: Automáticamente tratados como `roles: []` (sin acceso a reclutamiento)
- **Con campo `roles: []`**: Sin acceso hasta que se añada `"recruiter"`

### **Asignación de Rol Recruiter**
Para habilitar acceso a reclutamiento, el administrador debe:
1. **Actualizar el perfil del usuario** añadiendo `"recruiter"` al array `roles`
2. **Ejemplo de estructura**:
```json
{
  "dni": "12345678",
  "name": "Dr. Juan Pérez",
  "roles": ["recruiter"]  // ← Añadir este rol
}
```

### **Implementación Segura**
- ✅ **No rompe usuarios existentes**: Funcionalidad normal preservada
- ✅ **Acceso denegado por defecto**: Solo usuarios con rol explícito tienen acceso
- ✅ **Migración gradual**: Se puede asignar el rol progresivamente
