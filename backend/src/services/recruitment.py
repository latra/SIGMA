from services.firestore import FirestoreService
from models.recruitment import RecruitmentDB
from schemas.recruitment import RecruitmentCreate, RecruitmentComplete
from schemas.enums import Profession
from typing import List, Optional
from datetime import datetime
import logging
import httpx
import os

logger = logging.getLogger(__name__)

class RecruitmentService(FirestoreService):
    """Servicio para gestionar reclutamientos"""
    
    def __init__(self):
        super().__init__()
        self.medical_recruitments_collection = "medical_recruitments"
        self.police_recruitments_collection = "police_recruitments"
        self.discord_webhook_url = os.getenv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/1410959590576881664/fhsW0-cugWe6xxzJyxtBJ7lF3aTl0xUjz7fngVo8NBu2LV5h4wBFrJVfo7WHMcnm-vwm")

    async def _send_discord_notification(self, recruitment_data: RecruitmentCreate) -> None:
        """Envía una notificación a Discord cuando se crea un nuevo recruitment"""
        try:
            message_content = f"@everyone nueva solicitud entrante. El usuario {recruitment_data.name} con discord {recruitment_data.discord} ha enviado un formulario y está disponible en SIGMA"
            
            payload = {
                "content": message_content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.discord_webhook_url, json=payload)
                
                if response.status_code == 204:
                    logger.info(f"Discord notification sent successfully for recruitment: {recruitment_data.name}")
                else:
                    logger.warning(f"Discord notification failed with status {response.status_code}: {response.text}")
                    
        except Exception as e:
            logger.error(f"Error sending Discord notification: {e}")
            # No lanzamos excepción para que no falle la creación del recruitment

    def _get_collection_name(self, profession: Profession) -> str:
        """Determina la colección basada en la profesión"""
        if profession == Profession.EMS:
            return self.medical_recruitments_collection
        elif profession == Profession.POLICE:
            return self.police_recruitments_collection
        else:
            raise ValueError(f"Profession {profession} not supported for recruitment")

    async def create_recruitment(self, recruitment_data: RecruitmentCreate) -> RecruitmentDB:
        """Crea una nueva solicitud de reclutamiento"""
        try:
            collection_name = self._get_collection_name(recruitment_data.profession)
            
            # Crear el modelo de base de datos
            recruitment_db = RecruitmentDB(
                **recruitment_data.dict(),
                attended=False,
                attended_by=None,
                attended_at=None,
                created_at=datetime.now()
            )
            
            # Guardar en Firestore
            doc_ref = self.db.collection(collection_name).add(recruitment_db.dict())
            
            logger.info(f"Created recruitment for {recruitment_data.profession} with ID: {doc_ref[1].id}")
            
            # Enviar notificación a Discord
            await self._send_discord_notification(recruitment_data)
            
            return recruitment_db
            
        except Exception as e:
            logger.error(f"Error creating recruitment: {e}")
            raise e

    def get_recruitments_by_profession(self, profession: Profession, attended_only: Optional[bool] = None) -> List[dict]:
        """Obtiene las solicitudes de reclutamiento por profesión"""
        try:
            collection_name = self._get_collection_name(profession)
            
            query = self.db.collection(collection_name)
            
            # Filtrar por estado de atención si se especifica
            if attended_only is not None:
                query = query.where("attended", "==", attended_only)
            
            # Ordenar por fecha de creación descendente
            query = query.order_by("created_at", direction="DESCENDING")
            
            docs = query.get()
            
            recruitments = []
            for doc in docs:
                recruitment_data = doc.to_dict()
                recruitment_data['id'] = doc.id
                recruitments.append(recruitment_data)
            
            logger.info(f"Retrieved {len(recruitments)} recruitments for {profession}")
            return recruitments
            
        except Exception as e:
            logger.error(f"Error getting recruitments for {profession}: {e}")
            raise e

    def get_unattended_recruitments(self, profession: Profession) -> List[dict]:
        """Obtiene solo las solicitudes no atendidas por profesión"""
        return self.get_recruitments_by_profession(profession, attended_only=False)

    def mark_recruitment_attended(self, recruitment_id: str, profession: Profession, doctor_name: str) -> dict:
        """Marca una solicitud de reclutamiento como atendida"""
        try:

            collection_name = self._get_collection_name(profession)
            
            # Actualizar el documento
            doc_ref = self.db.collection(collection_name).document(recruitment_id)
            
            # Verificar que el documento existe
            doc = doc_ref.get()
            if not doc.exists:
                raise ValueError(f"Recruitment with ID {recruitment_id} not found")
            
            # Actualizar los campos
            update_data = {
                "attended": True,
                "attended_by": doctor_name,
                "attended_at": datetime.now()
            }
            
            doc_ref.update(update_data)
            
            # Obtener el documento actualizado
            updated_doc = doc_ref.get()
            recruitment_data = updated_doc.to_dict()
            recruitment_data['id'] = updated_doc.id
            
            logger.info(f"Marked recruitment {recruitment_id} as attended by {doctor_name}")
            return recruitment_data
            
        except Exception as e:
            logger.error(f"Error marking recruitment {recruitment_id} as attended: {e}")
            raise e

    def get_recruitment_by_id(self, recruitment_id: str, profession: Profession) -> Optional[dict]:
        """Obtiene una solicitud específica por ID"""
        try:
            collection_name = self._get_collection_name(profession)
            
            doc = self.db.collection(collection_name).document(recruitment_id).get()
            
            if doc.exists:
                recruitment_data = doc.to_dict()
                recruitment_data['id'] = doc.id
                return recruitment_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting recruitment {recruitment_id}: {e}")
            raise e
