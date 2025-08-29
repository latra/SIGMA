from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from schemas.enums import Profession

class RecruitmentDB(BaseModel):
    """Modelo para un reclutamiento"""
    name: str = Field(..., description="Nombre del personaje")
    dni: str = Field(..., description="DNI del personaje")
    discord: str = Field(..., description="Discord del jugador")
    phone: str = Field(..., description="Teléfono del personaje")
    profession: Profession = Field(..., description="Profesión del personaje")
    motivation: str = Field(..., description="Motivo por el que quiere unirse")
    experience: str = Field(..., description="Experiencia previa como jugador roleando EMS o cuerpos de salud")
    description: List[str] = Field(..., description="Descripción general del personaje")
    attended: bool = Field(default=False, description="Si el reclutamiento fue atendido")
    attended_by: Optional[str] = Field(default=None, description="DNI del médico que atendió el reclutamiento")
    attended_at: Optional[datetime] = Field(default=None, description="Fecha y hora de la atención")
    created_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora de creación")

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }