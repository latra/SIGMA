from datetime import datetime
from pydantic import BaseModel, Field
from typing import List
from schemas.enums import Profession

class RecruitmentBase(BaseModel):
    """Esquema base para un reclutamiento"""
    name: str = Field(..., description="Nombre del personaje")
    discord: str = Field(..., description="Discord del jugador")
    phone: str = Field(..., description="Teléfono del personaje")
    profession: Profession = Field(..., description="Profesión del personaje")
    dni: str = Field(..., description="DNI del personaje")
    motivation: str = Field(..., description="Motivo por el que quiere unirse")
    experience: str = Field(..., description="Experiencia previa como jugador roleando EMS o cuerpos de salud")
    description: List[str] = Field(..., description="Descripción general del personaje")

class RecruitmentCreate(RecruitmentBase):
    pass

class RecruitmentComplete(RecruitmentBase):
    """Esquema para un reclutamiento completo"""
    attended: bool = Field(..., description="Si el reclutamiento fue atendido")
    attended_by: str = Field(..., description="DNI del médico que atendió el reclutamiento")
    attended_at: datetime = Field(..., description="Fecha y hora de la atención")
