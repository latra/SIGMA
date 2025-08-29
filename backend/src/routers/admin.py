from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.admin import RoleAssignmentRequest, RoleAssignmentResponse, UserRoleInfo
from schemas.enums import UserRole
from services.user import UserService
from auth.authorization import require_admin
from schemas.user import User
import logging

logger = logging.getLogger(__name__)

admin_router = APIRouter(prefix="/admin", tags=["admin"])
user_service = UserService()


@admin_router.post("/assign-role", response_model=RoleAssignmentResponse)
async def assign_or_revoke_role(
    role_request: RoleAssignmentRequest,
    current_admin: User = Depends(require_admin)
):
    """
    Asigna o revoca un rol adicional a un usuario (médico o policía)
    Solo accesible para administradores
    """
    try:
        # Buscar el usuario por DNI
        user = user_service.get_user_by_dni(role_request.user_dni)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con DNI {role_request.user_dni} no encontrado"
            )
        
        # Verificar que el usuario sea médico o policía
        if user.role not in [UserRole.DOCTOR, UserRole.POLICE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden asignar roles adicionales a médicos y policías"
            )
        
        # Obtener el perfil específico del usuario
        if user.role == UserRole.DOCTOR:
            doctor = user_service.get_doctor_by_firebase_uid(user.firebase_uid)
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Perfil de médico no encontrado"
                )
            current_roles = getattr(doctor, 'roles', None) or []
            profile_type = "doctor"
            profile = doctor
        else:  # UserRole.POLICE
            police = user_service.get_police_by_firebase_uid(user.firebase_uid)
            if not police:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Perfil de policía no encontrado"
                )
            current_roles = getattr(police, 'roles', None) or []
            profile_type = "police"
            profile = police
        
        # Realizar la acción
        if role_request.action == "assign":
            if role_request.role not in current_roles:
                current_roles.append(role_request.role)
                action_message = f"Rol '{role_request.role}' asignado exitosamente"
            else:
                action_message = f"El usuario ya tiene el rol '{role_request.role}'"
        else:  # revoke
            if role_request.role in current_roles:
                current_roles.remove(role_request.role)
                action_message = f"Rol '{role_request.role}' revocado exitosamente"
            else:
                action_message = f"El usuario no tiene el rol '{role_request.role}'"
        
        # Actualizar el perfil en la base de datos
        updated_profile = user_service.update_user_roles(
            user.firebase_uid, 
            profile_type, 
            current_roles
        )
        
        if not updated_profile:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar los roles del usuario"
            )
        
        
        return RoleAssignmentResponse(
            message=action_message,
            user_dni=user.dni,
            user_name=user.name,
            user_role=user.role,
            current_roles=current_roles,
            action_performed=role_request.action
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error managing role for user {role_request.user_dni}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al gestionar el rol"
        )


@admin_router.get("/user-roles/{user_dni}", response_model=UserRoleInfo)
async def get_user_roles(
    user_dni: str,
    current_admin: User = Depends(require_admin)
):
    """
    Obtiene información de roles de un usuario específico
    Solo accesible para administradores
    """
    try:
        # Buscar el usuario por DNI
        user = user_service.get_user_by_dni(user_dni)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con DNI {user_dni} no encontrado"
            )
        
        # Obtener roles adicionales según el tipo de usuario
        additional_roles = []
        if user.role == UserRole.DOCTOR:
            doctor = user_service.get_doctor_by_firebase_uid(user.firebase_uid)
            if doctor:
                additional_roles = getattr(doctor, 'roles', None) or []
        elif user.role == UserRole.POLICE:
            police = user_service.get_police_by_firebase_uid(user.firebase_uid)
            if police:
                additional_roles = getattr(police, 'roles', None) or []
        
        return UserRoleInfo(
            user_dni=user.dni,
            user_name=user.name,
            user_role=user.role,
            additional_roles=additional_roles,
            enabled=user.enabled
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user roles for {user_dni}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener información de roles del usuario"
        )


@admin_router.get("/recruiters", response_model=List[UserRoleInfo])
async def get_all_recruiters(
    current_admin: User = Depends(require_admin)
):
    """
    Obtiene lista de todos los usuarios con rol 'recruiter'
    Solo accesible para administradores
    """
    try:
        recruiters = user_service.get_users_with_role("recruiter")
        
        result = []
        for recruiter in recruiters:
            # Obtener roles adicionales según el tipo
            additional_roles = []
            if recruiter.role == UserRole.DOCTOR:
                doctor = user_service.get_doctor_by_firebase_uid(recruiter.firebase_uid)
                if doctor:
                    additional_roles = getattr(doctor, 'roles', None) or []
            elif recruiter.role == UserRole.POLICE:
                police = user_service.get_police_by_firebase_uid(recruiter.firebase_uid)
                if police:
                    additional_roles = getattr(police, 'roles', None) or []
            
            result.append(UserRoleInfo(
                user_dni=recruiter.dni,
                user_name=recruiter.name,
                user_role=recruiter.role,
                additional_roles=additional_roles,
                enabled=recruiter.enabled
            ))
        
        logger.info(f"Admin {current_admin.dni} retrieved {len(result)} recruiters")
        return result
        
    except Exception as e:
        logger.error(f"Error getting recruiters list: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener la lista de recruiters"
        )
