from pydantic import BaseModel, Field, validator
from typing import List, Literal
from schemas.enums import UserRole

class RoleAssignmentRequest(BaseModel):
    """Esquema para asignar/revocar roles a usuarios"""
    user_dni: str = Field(..., description="DNI del usuario al que se le asignará/revocará el rol")
    role: str = Field(..., description="Rol a asignar/revocar (ej: recruiter)")
    action: Literal["assign", "revoke"] = Field(..., description="Acción a realizar: assign (asignar) o revoke (revocar)")
    
    @validator('role')
    def validate_role(cls, v):
        """Valida que el rol sea válido"""
        allowed_roles = ["recruiter"]  # Se pueden añadir más roles en el futuro
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {allowed_roles}")
        return v

class RoleAssignmentResponse(BaseModel):
    """Respuesta de asignación de rol"""
    message: str = Field(..., description="Mensaje de confirmación")
    user_dni: str = Field(..., description="DNI del usuario afectado")
    user_name: str = Field(..., description="Nombre del usuario afectado")
    user_role: UserRole = Field(..., description="Rol base del usuario (doctor/police)")
    current_roles: List[str] = Field(..., description="Roles actuales del usuario después de la operación")
    action_performed: str = Field(..., description="Acción realizada")

class UserRoleInfo(BaseModel):
    """Información de roles de un usuario"""
    user_dni: str = Field(..., description="DNI del usuario")
    user_name: str = Field(..., description="Nombre del usuario")
    user_role: UserRole = Field(..., description="Rol base del usuario")
    additional_roles: List[str] = Field(..., description="Roles adicionales del usuario")
    enabled: bool = Field(..., description="Si el usuario está habilitado")
