# 👨‍💼 Endpoints de Administración - Gestión de Roles

## 🔗 Base URL
```
/admin
```

## 🔐 Autenticación
- **Administradores**: Requiere token Firebase con rol `admin` y permisos de administrador

---

## 📝 Asignar/Revocar Roles

### `POST /admin/assign-role`
**🔐 Autenticación**: Requerida (Solo Administradores)

**📋 Descripción**: Asigna o revoca un rol adicional a un usuario (médico o policía).

**📤 Request Body**:
```json
{
  "user_dni": "12345678",
  "role": "recruiter",
  "action": "assign"  // o "revoke"
}
```

**📥 Response** (200 OK):
```json
{
  "message": "Rol 'recruiter' asignado exitosamente",
  "user_dni": "12345678",
  "user_name": "Dr. Juan Pérez",
  "user_role": "DOCTOR",
  "current_roles": ["recruiter"],
  "action_performed": "assign"
}
```

**❌ Errores**:
- `400`: Solo médicos y policías pueden tener roles adicionales
- `404`: Usuario no encontrado
- `500`: Error interno del servidor

---

## 👤 Consultar Roles de Usuario

### `GET /admin/user-roles/{user_dni}`
**🔐 Autenticación**: Requerida (Solo Administradores)

**📋 Descripción**: Obtiene información completa de roles de un usuario específico.

**🔗 Parámetros URL**:
- `user_dni`: DNI del usuario a consultar

**📥 Response** (200 OK):
```json
{
  "user_dni": "12345678",
  "user_name": "Dr. Juan Pérez",
  "user_role": "DOCTOR",
  "additional_roles": ["recruiter"],
  "enabled": true
}
```

**❌ Errores**:
- `404`: Usuario no encontrado

---

## 👥 Lista de Recruiters

### `GET /admin/recruiters`
**🔐 Autenticación**: Requerida (Solo Administradores)

**📋 Descripción**: Obtiene lista de todos los usuarios que tienen el rol 'recruiter'.

**📥 Response** (200 OK):
```json
[
  {
    "user_dni": "12345678",
    "user_name": "Dr. Juan Pérez",
    "user_role": "DOCTOR",
    "additional_roles": ["recruiter"],
    "enabled": true
  },
  {
    "user_dni": "87654321",
    "user_name": "Oficial María García",
    "user_role": "POLICE",
    "additional_roles": ["recruiter"],
    "enabled": true
  }
]
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | ✅ Operación exitosa |
| `400` | ❌ Datos de entrada inválidos o usuario no elegible |
| `401` | ❌ No autorizado (token inválido) |
| `403` | ❌ Prohibido (no es administrador) |
| `404` | ❌ Usuario no encontrado |
| `500` | ❌ Error interno del servidor |

---

## 🔧 Headers Requeridos

```http
Authorization: Bearer {firebase_jwt_token}
Content-Type: application/json
```

---

## 📝 Notas para el Frontend

1. **Solo Administradores**: Todos estos endpoints requieren permisos de administrador completos

2. **Roles Válidos**: Actualmente solo se soporta el rol `"recruiter"`, pero el sistema está preparado para futuras expansiones

3. **Usuarios Elegibles**: Solo médicos (`DOCTOR`) y policías (`POLICE`) pueden tener roles adicionales

4. **Acciones Disponibles**:
   - `"assign"`: Asigna el rol si no lo tiene
   - `"revoke"`: Remueve el rol si lo tiene

5. **Validaciones**:
   - Si se intenta asignar un rol que ya tiene: operación exitosa con mensaje informativo
   - Si se intenta revocar un rol que no tiene: operación exitosa con mensaje informativo

6. **Auditoria**: Todas las acciones quedan registradas en logs con el DNI del administrador que realizó la acción

---

## 🎯 Flujo de Trabajo para Administradores

### **Asignar Rol Recruiter**
1. **Verificar usuario** → `GET /admin/user-roles/{dni}`
2. **Asignar rol** → `POST /admin/assign-role` con `action: "assign"`
3. **Verificar asignación** → `GET /admin/user-roles/{dni}` (opcional)

### **Revocar Rol Recruiter**
1. **Verificar usuario actual** → `GET /admin/user-roles/{dni}`
2. **Revocar rol** → `POST /admin/assign-role` con `action: "revoke"`

### **Consultar Recruiters Activos**
1. **Obtener lista completa** → `GET /admin/recruiters`

---

## 🔄 Integración con Sistema de Reclutamiento

### **Flujo Completo**
1. **Admin asigna rol** → Usuario obtiene acceso a endpoints de reclutamiento
2. **Usuario accede** → Puede gestionar solicitudes según su profesión
3. **Admin revoca rol** → Usuario pierde acceso inmediatamente

### **Verificación en Frontend**
```javascript
// Verificar si el usuario puede gestionar reclutamiento
const canManageRecruitment = user.additional_roles?.includes('recruiter');

// Mostrar opciones según el rol
if (user.user_role === 'DOCTOR' && canManageRecruitment) {
    // Mostrar gestión de reclutamiento médico
} else if (user.user_role === 'POLICE' && canManageRecruitment) {
    // Mostrar gestión de reclutamiento policial
}
```

---

## 🛡️ Seguridad

- ✅ **Autenticación obligatoria**: Token Firebase válido
- ✅ **Autorización estricta**: Solo administradores pueden acceder
- ✅ **Validación de datos**: Roles y acciones válidas
- ✅ **Logging completo**: Todas las acciones auditables
- ✅ **Atomicidad**: Operaciones completas o fallan completamente
