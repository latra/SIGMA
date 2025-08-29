from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.recruitment import RecruitmentCreate, RecruitmentComplete
from schemas.enums import Profession
from services.recruitment import RecruitmentService
from services.user import UserService
from auth.authorization import require_doctor_recruiter, require_police_recruiter
from schemas.user import Doctor, Police
import logging

logger = logging.getLogger(__name__)

recruitment_router = APIRouter(prefix="/recruitment", tags=["recruitment"])
recruitment_service = RecruitmentService()
user_service = UserService()


@recruitment_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_recruitment_request(recruitment: RecruitmentCreate):
    """
    Crea una nueva solicitud de reclutamiento
    - Se almacenan en repositorios separados según la profesión (EMS o POLICE)
    """
    try:
        created_recruitment = await recruitment_service.create_recruitment(recruitment)
        return {
            "message": f"Solicitud de reclutamiento para {recruitment.profession.value} creada exitosamente",
            "recruitment": created_recruitment.dict()
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating recruitment request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al crear la solicitud"
        )


@recruitment_router.get("/medical", response_model=List[dict])
async def get_medical_recruitments(
    current_doctor: Doctor = require_doctor_recruiter()
):
    """
    Obtiene todas las solicitudes de reclutamiento médico
    Solo accesible para médicos con rol 'recruiter'
    """
    try:
        recruitments = recruitment_service.get_recruitments_by_profession(Profession.EMS)
        logger.info(f"Doctor {current_doctor.dni} retrieved {len(recruitments)} medical recruitments")
        return recruitments
    except Exception as e:
        logger.error(f"Error retrieving medical recruitments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar las solicitudes médicas"
        )


@recruitment_router.get("/police", response_model=List[dict])
async def get_police_recruitments(
    current_police: Police = require_police_recruiter()
):
    """
    Obtiene todas las solicitudes de reclutamiento policial
    Solo accesible para policías con rol 'recruiter'
    """
    try:
        recruitments = recruitment_service.get_recruitments_by_profession(Profession.POLICE)
        logger.info(f"Police {current_police.dni} retrieved {len(recruitments)} police recruitments")
        return recruitments
    except Exception as e:
        logger.error(f"Error retrieving police recruitments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar las solicitudes policiales"
        )


@recruitment_router.get("/medical/pending", response_model=List[dict])
async def get_pending_medical_recruitments(
    current_doctor: Doctor = require_doctor_recruiter()
):
    """
    Obtiene solo las solicitudes de reclutamiento médico no atendidas
    Solo accesible para médicos con rol 'recruiter'
    """
    try:
        recruitments = recruitment_service.get_unattended_recruitments(Profession.EMS)
        logger.info(f"Doctor retrieved {len(recruitments)} pending medical recruitments")
        return recruitments
    except Exception as e:
        logger.error(f"Error retrieving pending medical recruitments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar las solicitudes médicas pendientes"
        )


@recruitment_router.get("/police/pending", response_model=List[dict])
async def get_pending_police_recruitments(
    current_police: Police = require_police_recruiter()
):
    """
    Obtiene solo las solicitudes de reclutamiento policial no atendidas
    Solo accesible para policías con rol 'recruiter'
    """
    try:
        recruitments = recruitment_service.get_unattended_recruitments(Profession.POLICE)
        logger.info(f"Police {current_police.dni} retrieved {len(recruitments)} pending police recruitments")
        return recruitments
    except Exception as e:
        logger.error(f"Error retrieving pending police recruitments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar las solicitudes policiales pendientes"
        )


@recruitment_router.put("/medical/{recruitment_id}/attend")
async def mark_medical_recruitment_attended(
    recruitment_id: str,
    current_doctor: Doctor = require_doctor_recruiter()
):
    """
    Marca una solicitud de reclutamiento médico como atendida
    Solo accesible para médicos con rol 'recruiter'
    """
    try:
        updated_recruitment = recruitment_service.mark_recruitment_attended(
            recruitment_id, Profession.EMS, current_doctor.name
        )
        
        return {
            "message": "Solicitud médica marcada como atendida exitosamente",
            "recruitment": updated_recruitment
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error marking medical recruitment {recruitment_id} as attended: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al marcar la solicitud médica como atendida"
        )


@recruitment_router.put("/police/{recruitment_id}/attend")
async def mark_police_recruitment_attended(
    recruitment_id: str,
    current_police: Police = require_police_recruiter()
):
    """
    Marca una solicitud de reclutamiento policial como atendida
    Solo accesible para policías con rol 'recruiter'
    """
    try:
        updated_recruitment = recruitment_service.mark_recruitment_attended(
            recruitment_id, Profession.POLICE, current_police.dni
        )
        
        return {
            "message": "Solicitud policial marcada como atendida exitosamente",
            "recruitment": updated_recruitment
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error marking police recruitment {recruitment_id} as attended: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al marcar la solicitud policial como atendida"
        )


@recruitment_router.get("/medical/{recruitment_id}")
async def get_medical_recruitment_by_id(
    recruitment_id: str,
    current_doctor: Doctor = require_doctor_recruiter()
):
    """
    Obtiene una solicitud de reclutamiento médico específica por ID
    Solo accesible para médicos con rol 'recruiter'
    """
    try:
        recruitment = recruitment_service.get_recruitment_by_id(recruitment_id, Profession.EMS)
        
        if not recruitment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud de reclutamiento médico no encontrada"
            )
        
        return recruitment
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving medical recruitment {recruitment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar la solicitud médica"
        )


@recruitment_router.get("/police/{recruitment_id}")
async def get_police_recruitment_by_id(
    recruitment_id: str,
    current_police: Police = require_police_recruiter()
):
    """
    Obtiene una solicitud de reclutamiento policial específica por ID
    Solo accesible para policías con rol 'recruiter'
    """
    try:
        recruitment = recruitment_service.get_recruitment_by_id(recruitment_id, Profession.POLICE)
        
        if not recruitment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud de reclutamiento policial no encontrada"
            )
        
        return recruitment
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error retrieving police recruitment {recruitment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar la solicitud policial"
        )
