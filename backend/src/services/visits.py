from services.firestore import FirestoreService
from models.visit import VisitDB, VitalSigns, Diagnosis, Prescription, MedicalProcedure, MedicalEvolution
from schemas import (
    Visit, VisitCreate, VisitUpdate, VisitSummary, VisitComplete, VisitStatus,
    VitalSignsBase, VitalSignsResponse, DiagnosisCreate, DiagnosisResponse,
    PrescriptionCreate, PrescriptionResponse, MedicalProcedureCreate, MedicalProcedureResponse,
    MedicalEvolutionCreate, MedicalEvolutionResponse, Doctor
)
from schemas.patient import (
    BloodAnalysisCreate, BloodAnalysisResponse, RadiologyStudyCreate, RadiologyStudyResponse
)
from models.patient import BloodAnalysis, RadiologyStudy
from services.doctor import DoctorService
from firebase_admin import firestore
from typing import Optional, List
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VisitRepository(FirestoreService):
    """Repositorio para operaciones de base de datos de visitas"""
    
    def __init__(self):
        super().__init__()
        self.visits_collection = "visits"
    
    def _document_to_visit_db(self, doc) -> Optional[VisitDB]:
        """Convierte un documento de Firestore a VisitDB"""
        try:
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            # Convertir timestamps de string a datetime si es necesario
            datetime_fields = [
                'created_at', 'updated_at', 'admission_date', 'discharge_date'
            ]
            
            for field in datetime_fields:
                if field in data and isinstance(data[field], str):
                    try:
                        data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                    except ValueError:
                        if field in ['created_at', 'updated_at', 'admission_date']:
                            data[field] = datetime.now()
                        else:
                            data[field] = None
            
            # Convertir timestamps en datos médicos anidados
            self._convert_nested_timestamps(data)
            
            return VisitDB(**data)
        except Exception as e:
            logger.error(f"Error converting document to VisitDB: {e}")
            return None
    
    def _convert_nested_timestamps(self, data: dict):
        """Convierte timestamps en estructuras anidadas"""
        # Signos vitales
        if 'admission_vital_signs' in data and data['admission_vital_signs'] and 'measured_at' in data['admission_vital_signs']:
            if isinstance(data['admission_vital_signs']['measured_at'], str):
                try:
                    data['admission_vital_signs']['measured_at'] = datetime.fromisoformat(data['admission_vital_signs']['measured_at'].replace('Z', '+00:00'))
                except ValueError:
                    data['admission_vital_signs']['measured_at'] = datetime.now()
        
        # Diagnósticos
        if 'diagnoses' in data:
            for diagnosis in data['diagnoses']:
                if 'diagnosed_at' in diagnosis and isinstance(diagnosis['diagnosed_at'], str):
                    try:
                        diagnosis['diagnosed_at'] = datetime.fromisoformat(diagnosis['diagnosed_at'].replace('Z', '+00:00'))
                    except ValueError:
                        diagnosis['diagnosed_at'] = datetime.now()
        
        # Procedimientos
        if 'procedures' in data:
            for procedure in data['procedures']:
                if 'performed_at' in procedure and isinstance(procedure['performed_at'], str):
                    try:
                        procedure['performed_at'] = datetime.fromisoformat(procedure['performed_at'].replace('Z', '+00:00'))
                    except ValueError:
                        procedure['performed_at'] = datetime.now()
        
        # Evoluciones
        if 'evolutions' in data:
            for evolution in data['evolutions']:
                if 'recorded_at' in evolution and isinstance(evolution['recorded_at'], str):
                    try:
                        evolution['recorded_at'] = datetime.fromisoformat(evolution['recorded_at'].replace('Z', '+00:00'))
                    except ValueError:
                        evolution['recorded_at'] = datetime.now()
        
        # Prescripciones
        if 'prescriptions' in data:
            for prescription in data['prescriptions']:
                if 'prescribed_at' in prescription and isinstance(prescription['prescribed_at'], str):
                    try:
                        prescription['prescribed_at'] = datetime.fromisoformat(prescription['prescribed_at'].replace('Z', '+00:00'))
                    except ValueError:
                        prescription['prescribed_at'] = datetime.now()
        
        # Análisis de sangre
        if 'blood_analyses' in data:
            for analysis in data['blood_analyses']:
                if 'date_performed' in analysis and isinstance(analysis['date_performed'], str):
                    try:
                        analysis['date_performed'] = datetime.fromisoformat(analysis['date_performed'].replace('Z', '+00:00'))
                    except ValueError:
                        analysis['date_performed'] = datetime.now()
        
        # Estudios radiológicos
        if 'radiology_studies' in data:
            for study in data['radiology_studies']:
                if 'date_performed' in study and isinstance(study['date_performed'], str):
                    try:
                        study['date_performed'] = datetime.fromisoformat(study['date_performed'].replace('Z', '+00:00'))
                    except ValueError:
                        study['date_performed'] = datetime.now()
    
    def get_by_id(self, visit_id: str) -> Optional[VisitDB]:
        """Obtiene una visita por ID"""
        try:
            doc = self.db.collection(self.visits_collection).document(visit_id).get()
            return self._document_to_visit_db(doc)
        except Exception as e:
            logger.error(f"Error getting visit by ID {visit_id}: {e}")
            return None
    
    def create(self, visit_db: VisitDB) -> bool:
        """Crea una nueva visita"""
        try:
            # Convertir el modelo a diccionario con timestamps como strings ISO
            visit_dict = self._visit_db_to_dict(visit_db)
            
            self.db.collection(self.visits_collection).document(visit_db.visit_id).set(visit_dict)
            logger.info(f"Visit {visit_db.visit_id} created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating visit {visit_db.visit_id}: {e}")
            return False
    
    def update(self, visit_db: VisitDB) -> bool:
        """Actualiza una visita existente"""
        try:
            # Actualizar timestamp
            visit_db.update_timestamp()
            
            # Convertir a diccionario con manejo de timestamps
            visit_dict = self._visit_db_to_dict(visit_db)
            
            self.db.collection(self.visits_collection).document(visit_db.visit_id).set(visit_dict)
            logger.info(f"Visit {visit_db.visit_id} updated successfully")
            return True
        except Exception as e:
            logger.error(f"Error updating visit {visit_db.visit_id}: {e}")
            return False
    
    def delete(self, visit_id: str) -> bool:
        """Elimina una visita (hard delete)"""
        try:
            self.db.collection(self.visits_collection).document(visit_id).delete()
            logger.info(f"Visit {visit_id} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting visit {visit_id}: {e}")
            return False
    
    def get_by_patient_dni(self, patient_dni: str) -> List[VisitDB]:
        """Obtiene todas las visitas de un paciente"""
        try:
            docs = self.db.collection(self.visits_collection)\
                .where("patient_dni", "==", patient_dni)\
                .order_by("admission_date", direction=firestore.Query.DESCENDING)\
                .get()
            
            visits = []
            for doc in docs:
                visit = self._document_to_visit_db(doc)
                if visit:
                    visits.append(visit)
            return visits
        except Exception as e:
            logger.error(f"Error getting visits for patient {patient_dni}: {e}")
            return []
    
    def get_by_doctor_dni(self, doctor_dni: str) -> List[VisitDB]:
        """Obtiene todas las visitas de un médico"""
        try:
            docs = self.db.collection(self.visits_collection)\
                .where("attending_doctor_dni", "==", doctor_dni)\
                .order_by("admission_date", direction=firestore.Query.DESCENDING)\
                .get()
            
            visits = []
            for doc in docs:
                visit = self._document_to_visit_db(doc)
                if visit:
                    visits.append(visit)
            return visits
        except Exception as e:
            logger.error(f"Error getting visits for doctor {doctor_dni}: {e}")
            return []
    
    def get_by_status(self, status: VisitStatus) -> List[VisitDB]:
        """Obtiene todas las visitas por estado"""
        try:
            docs = self.db.collection(self.visits_collection)\
                .where("visit_status", "==", status)\
                .order_by("admission_date", direction=firestore.Query.DESCENDING)\
                .get()
            
            visits = []
            for doc in docs:
                visit = self._document_to_visit_db(doc)
                if visit:
                    visits.append(visit)
            return visits
        except Exception as e:
            logger.error(f"Error getting visits by status {status}: {e}")
            return []
    
    def get_all(self) -> List[VisitDB]:
        """Obtiene todas las visitas"""
        try:
            docs = self.db.collection(self.visits_collection)\
                .order_by("admission_date", direction=firestore.Query.DESCENDING)\
                .get()
            
            visits = []
            for doc in docs:
                visit = self._document_to_visit_db(doc)
                if visit:
                    visits.append(visit)
            return visits
        except Exception as e:
            logger.error(f"Error getting all visits: {e}")
            return []
    
    def _visit_db_to_dict(self, visit_db: VisitDB) -> dict:
        """Convierte VisitDB a diccionario con timestamps como strings"""
        visit_dict = visit_db.model_dump()
        
        # Convertir timestamps principales
        datetime_fields = [
            'created_at', 'updated_at', 'admission_date', 'discharge_date'
        ]
        
        for field in datetime_fields:
            if field in visit_dict and isinstance(visit_dict[field], datetime):
                visit_dict[field] = visit_dict[field].isoformat()
        
        # Convertir timestamps en signos vitales
        if 'admission_vital_signs' in visit_dict and visit_dict['admission_vital_signs']:
            vital_signs = visit_dict['admission_vital_signs']
            if 'measured_at' in vital_signs and isinstance(vital_signs['measured_at'], datetime):
                vital_signs['measured_at'] = vital_signs['measured_at'].isoformat()
        
        # Convertir timestamps en listas médicas
        for medical_list, timestamp_field in [
            ('diagnoses', 'diagnosed_at'),
            ('procedures', 'performed_at'),
            ('evolutions', 'recorded_at'),
            ('prescriptions', 'prescribed_at'),
            ('blood_analyses', 'date_performed'),
            ('radiology_studies', 'date_performed')
        ]:
            if medical_list in visit_dict:
                for item in visit_dict[medical_list]:
                    if timestamp_field in item and isinstance(item[timestamp_field], datetime):
                        item[timestamp_field] = item[timestamp_field].isoformat()
        
        return visit_dict


class VisitService:
    """Servicio principal para gestión de visitas"""
    
    def __init__(self):
        self.repository = VisitRepository()
        self.doctor_service = DoctorService()
        
        # Reconstruir modelos para resolver referencias forward
        try:
            from models.visit import rebuild_visit_models
            from models.patient import rebuild_patient_models
            rebuild_visit_models()
            rebuild_patient_models()
        except ImportError:
            pass
    
    def _visit_db_to_visit(self, visit_db: VisitDB, doctor_info: Optional[Doctor] = None) -> Visit:
        """Convierte VisitDB a esquema Visit (compatible con API actual)"""
        # Obtener información del médico si no se proporciona
        if not doctor_info:
            doctor_info = self.doctor_service.get_doctor(visit_db.attending_doctor_dni)
        
        # Obtener diagnóstico principal para compatibilidad (ahora es string)
        diagnosis_text = visit_db.diagnoses if visit_db.diagnoses else None
        
        # Crear esquema compatible
        visit = Visit(
            visit_id=visit_db.visit_id,
            patient_dni=visit_db.patient_dni,
            reason=visit_db.reason,
            attention_place=visit_db.attention_place,
            attention_details=visit_db.attention_details,
            location=visit_db.location,
            triage=visit_db.triage,
            visit_status=visit_db.visit_status,
            admission_date=visit_db.admission_date,
            discharge_date=visit_db.discharge_date,
            doctor_dni=visit_db.attending_doctor_dni,
            doctor_name=doctor_info.name if doctor_info else "Unknown",
            doctor_email=doctor_info.email if doctor_info else None,
            doctor_specialty=doctor_info.specialty if doctor_info else None,
            diagnosis=diagnosis_text,
            procedures=visit_db.procedures if visit_db.procedures else None,
            treatment=getattr(visit_db, 'treatment', None),
            evolution=visit_db.get_latest_evolution(),
            medication=visit_db.prescriptions if visit_db.prescriptions else None,
            additional_observations=getattr(visit_db, 'evolution', None),
            notes=getattr(visit_db, 'nursing_notes', None),
            created_at=visit_db.created_at,
            updated_at=visit_db.updated_at,
            date_of_admission=visit_db.admission_date,  # Para compatibilidad
            date_of_discharge=visit_db.discharge_date   # Para compatibilidad
        )
        
        return visit
    
    def _visit_db_to_complete(self, visit_db: VisitDB) -> VisitComplete:
        """Convierte VisitDB a esquema VisitComplete (con datos médicos completos)"""
        # Convertir signos vitales
        admission_vital_signs = None
        if visit_db.admission_vital_signs:
            admission_vital_signs = VitalSignsResponse(
                measurement_id=visit_db.admission_vital_signs.measurement_id,
                measured_at=visit_db.admission_vital_signs.measured_at,
                heart_rate=visit_db.admission_vital_signs.heart_rate,
                systolic_pressure=visit_db.admission_vital_signs.systolic_pressure,
                diastolic_pressure=visit_db.admission_vital_signs.diastolic_pressure,
                temperature=visit_db.admission_vital_signs.temperature,
                oxygen_saturation=visit_db.admission_vital_signs.oxygen_saturation,
                respiratory_rate=visit_db.admission_vital_signs.respiratory_rate,
                weight=visit_db.admission_vital_signs.weight,
                height=visit_db.admission_vital_signs.height,
                measured_by=visit_db.admission_vital_signs.measured_by,
                notes=visit_db.admission_vital_signs.notes
            )
        

        
        # Los campos médicos ahora son strings simples
        diagnoses = visit_db.diagnoses
        procedures = visit_db.procedures
        evolutions = visit_db.evolutions
        prescriptions = visit_db.prescriptions
        treatment = getattr(visit_db, 'treatment', '')
        medication = visit_db.prescriptions if visit_db.prescriptions else ''
        
        # Convertir análisis de sangre
        blood_analyses = [
            BloodAnalysisResponse(
                analysis_id=analysis.analysis_id,
                date_performed=analysis.date_performed,
                red_blood_cells=analysis.red_blood_cells,
                hemoglobin=analysis.hemoglobin,
                hematocrit=analysis.hematocrit,
                platelets=analysis.platelets,
                lymphocytes=analysis.lymphocytes,
                glucose=analysis.glucose,
                cholesterol=analysis.cholesterol,
                urea=analysis.urea,
                cocaine=analysis.cocaine,
                alcohol=analysis.alcohol,
                mdma=analysis.mdma,
                fentanyl=analysis.fentanyl,
                performed_by_dni=analysis.performed_by_dni,
                performed_by_name=analysis.performed_by_name,
                notes=analysis.notes,
                visit_related_id=analysis.visit_related_id
            ) for analysis in visit_db.blood_analyses
        ]
        
        # Convertir estudios radiológicos
        radiology_studies = [
            RadiologyStudyResponse(
                study_id=study.study_id,
                date_performed=study.date_performed,
                study_type=study.study_type,
                body_part=study.body_part,
                findings=study.findings,
                image_url=study.image_url,
                performed_by_dni=study.performed_by_dni,
                performed_by_name=study.performed_by_name,
                visit_related_id=study.visit_related_id
            ) for study in visit_db.radiology_studies
        ]
        
        return VisitComplete(
            visit_id=visit_db.visit_id,
            patient_dni=visit_db.patient_dni,
            reason=visit_db.reason,
            attention_place=visit_db.attention_place,
            attention_details=visit_db.attention_details,
            location=visit_db.location,
            visit_status=visit_db.visit_status,
            triage=visit_db.triage,
            priority_level=visit_db.priority_level,
            attending_doctor_dni=visit_db.attending_doctor_dni,
            admission_vital_signs=admission_vital_signs,
            diagnoses=diagnoses,
            procedures=procedures,
            evolutions=evolutions,
            prescriptions=prescriptions,
            treatment=treatment,
            medication=medication,
            laboratory_orders=getattr(visit_db, 'laboratory_orders', []),
            imaging_orders=getattr(visit_db, 'imaging_orders', []),
            referrals=getattr(visit_db, 'referrals', []),
            blood_analyses=blood_analyses,
            radiology_studies=radiology_studies,
            nursing_notes=getattr(visit_db, 'nursing_notes', []),
            additional_observations=getattr(visit_db, 'evolution', None),
            complications=getattr(visit_db, 'complications', []),
            created_at=visit_db.created_at,
            updated_at=visit_db.updated_at,
            admission_date=visit_db.admission_date,
            discharge_date=visit_db.discharge_date,
            created_by=visit_db.created_by,
            last_updated_by=visit_db.last_updated_by,
            is_completed=visit_db.is_completed,
            length_of_stay_hours=visit_db.calculate_length_of_stay()
        )
    
    def get_visit(self, visit_id: str) -> Optional[Visit]:
        """Obtiene una visita básica por ID"""
        visit_db = self.repository.get_by_id(visit_id)
        if visit_db:
            return self._visit_db_to_visit(visit_db)
        return None
    
    def get_visit_complete(self, visit_id: str) -> Optional[VisitComplete]:
        """Obtiene una visita completa con todos los datos médicos por ID"""
        visit_db = self.repository.get_by_id(visit_id)
        if visit_db:
            return self._visit_db_to_complete(visit_db)
        return None
    
    def create_visit(self, visit_create: VisitCreate, doctor: Doctor) -> Optional[Visit]:
        """Crea una nueva visita"""
        try:
            # Crear signos vitales de admisión si se proporcionan
            admission_vital_signs = None
            if any([
                visit_create.admission_heart_rate,
                visit_create.admission_blood_pressure,
                visit_create.admission_temperature,
                visit_create.admission_oxygen_saturation
            ]):
                admission_vital_signs = VitalSigns(
                    heart_rate=visit_create.admission_heart_rate,
                    systolic_pressure=visit_create.admission_blood_pressure,
                    temperature=visit_create.admission_temperature,
                    oxygen_saturation=visit_create.admission_oxygen_saturation,
                    measured_by=doctor.dni
                )
            
            # Crear visita en BD
            visit_db = VisitDB(
                patient_dni=visit_create.patient_dni,
                reason=visit_create.reason,
                attention_place=visit_create.attention_place,
                attention_details=visit_create.attention_details,
                location=visit_create.location,
                triage=visit_create.triage,
                priority_level=visit_create.priority_level,
                attending_doctor_dni=doctor.dni,
                admission_vital_signs=admission_vital_signs,
                created_by=doctor.dni,

            )
            
            if self.repository.create(visit_db):
                return self._visit_db_to_visit(visit_db, doctor)
            return None
        except Exception as e:
            logger.error(f"Error creating visit: {e}")
            return None
    
    def update_visit(self, visit_id: str, visit_update: VisitUpdate, updated_by: Optional[str] = None) -> Optional[Visit]:
        """Actualiza información básica de una visita"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Actualizar campos básicos
            update_data = visit_update.model_dump(exclude_unset=True)
            
            # Campos directos
            for field in ['reason', 'attention_details', 'triage', 'priority_level']:
                if field in update_data and update_data[field] is not None:
                    setattr(visit_db, field, update_data[field])
            
            # Actualizar signos vitales de admisión si se proporcionan
            vital_fields = ['admission_heart_rate', 'admission_blood_pressure', 'admission_temperature', 'admission_oxygen_saturation']
            if any(field in update_data and update_data[field] is not None for field in vital_fields):
                if not visit_db.admission_vital_signs:
                    visit_db.admission_vital_signs = VitalSigns(measured_by=updated_by)
                
                if update_data.get('admission_heart_rate'):
                    visit_db.admission_vital_signs.heart_rate = update_data['admission_heart_rate']
                if update_data.get('admission_blood_pressure'):
                    visit_db.admission_vital_signs.systolic_pressure = update_data['admission_blood_pressure']
                if update_data.get('admission_temperature'):
                    visit_db.admission_vital_signs.temperature = update_data['admission_temperature']
                if update_data.get('admission_oxygen_saturation'):
                    visit_db.admission_vital_signs.oxygen_saturation = update_data['admission_oxygen_saturation']
            
            # Campos de compatibilidad con API actual
            compatibility_fields = {
                'diagnosis': 'diagnoses',
                'procedures': 'procedures',
                'treatment': 'treatment',
                'evolution': 'evolutions',
                'medication': 'prescriptions',
                'prescriptions': 'prescriptions',
                'additional_observations': 'evolution',
                'notes': 'nursing_notes'
            }
            
            for api_field, db_field in compatibility_fields.items():
                if api_field in update_data and update_data[api_field] is not None:
                    value = update_data[api_field]
                    
                    if api_field == 'diagnosis' and value:
                        # Actualizar diagnóstico como string
                        visit_db.diagnoses = value
                    
                    elif api_field == 'procedures' and value:
                        # Actualizar procedimientos como string
                        visit_db.procedures = value
                    
                    elif api_field == 'notes' and value:
                        # Manejar notas como string si nursing_notes no existe como lista
                        if hasattr(visit_db, 'nursing_notes') and isinstance(visit_db.nursing_notes, list):
                            if value not in visit_db.nursing_notes:
                                visit_db.nursing_notes.append(value)
                        else:
                            # Si no existe como lista, manejarlo como string
                            setattr(visit_db, 'nursing_notes', value)
                    
                    else:
                        # Campos directos
                        setattr(visit_db, db_field, value)
            
            visit_db.update_timestamp(updated_by)
            
            if self.repository.update(visit_db):
                return self._visit_db_to_visit(visit_db)
            return None
        except Exception as e:
            logger.error(f"Error updating visit {visit_id}: {e}")
            return None
    
    def discharge_visit(self, visit_id: str, discharged_by: Optional[str] = None) -> Optional[Visit]:
        """Da de alta a un paciente"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            visit_db.discharge_patient(discharged_by)
            
            if self.repository.update(visit_db):
                return self._visit_db_to_visit(visit_db)
            return None
        except Exception as e:
            logger.error(f"Error discharging visit {visit_id}: {e}")
            return None
    
    def delete_visit(self, visit_id: str) -> bool:
        """Elimina una visita"""
        return self.repository.delete(visit_id)
    
    def get_all_visits(self) -> List[Visit]:
        """Obtiene todas las visitas"""
        visits_db = self.repository.get_all()
        visits = []
        for visit_db in visits_db:
            visit = self._visit_db_to_visit(visit_db)
            if visit:
                visits.append(visit)
        return visits
    
    def get_all_visits_by_patient_dni(self, patient_dni: str) -> List[VisitSummary]:
        """Obtiene todas las visitas de un paciente como resumen"""
        visits_db = self.repository.get_by_patient_dni(patient_dni)
        summaries = []
        
        for visit_db in visits_db:
            doctor_info = self.doctor_service.get_doctor(visit_db.attending_doctor_dni)
            
            summary = VisitSummary(
                visit_id=visit_db.visit_id,
                patient_dni=visit_db.patient_dni,
                visit_status=visit_db.visit_status,
                reason=visit_db.reason,
                attention_place=visit_db.attention_place,
                attention_details=visit_db.attention_details,
                location=visit_db.location,
                triage=visit_db.triage,
                doctor_dni=visit_db.attending_doctor_dni,
                doctor_name=doctor_info.name if doctor_info else "Unknown",
                doctor_email=doctor_info.email if doctor_info else None,
                doctor_specialty=doctor_info.specialty if doctor_info else None,
                admission_date=visit_db.admission_date,
                discharge_date=visit_db.discharge_date,
                date_of_admission=visit_db.admission_date,  # Para compatibilidad
                date_of_discharge=visit_db.discharge_date   # Para compatibilidad
            )
            summaries.append(summary)
        
        return summaries
    
    def get_all_visits_by_doctor_dni(self, doctor_dni: str) -> List[Visit]:
        """Obtiene todas las visitas de un médico"""
        visits_db = self.repository.get_by_doctor_dni(doctor_dni)
        visits = []
        
        doctor_info = self.doctor_service.get_doctor(doctor_dni)
        for visit_db in visits_db:
            visit = self._visit_db_to_visit(visit_db, doctor_info)
            if visit:
                visits.append(visit)
        return visits
    
    def get_all_visits_by_status(self, status: VisitStatus) -> List[Visit]:
        """Obtiene todas las visitas por estado"""
        visits_db = self.repository.get_by_status(status)
        visits = []
        for visit_db in visits_db:
            visit = self._visit_db_to_visit(visit_db)
            if visit:
                visits.append(visit)
        return visits
    
    # Métodos adicionales para datos médicos específicos
    
    def add_vital_signs(self, visit_id: str, vital_signs_data: VitalSignsBase, measured_by: Optional[str] = None) -> Optional[VitalSignsResponse]:
        """Añade signos vitales a una visita"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            vital_signs = VitalSigns(
                heart_rate=vital_signs_data.heart_rate,
                systolic_pressure=vital_signs_data.systolic_pressure,
                diastolic_pressure=vital_signs_data.diastolic_pressure,
                temperature=vital_signs_data.temperature,
                oxygen_saturation=vital_signs_data.oxygen_saturation,
                respiratory_rate=vital_signs_data.respiratory_rate,
                weight=vital_signs_data.weight,
                height=vital_signs_data.height,
                notes=vital_signs_data.notes,
                measured_by=measured_by
            )
            
            visit_db.add_vital_signs(vital_signs, measured_by)
            
            if self.repository.update(visit_db):
                return VitalSignsResponse(
                    measurement_id=vital_signs.measurement_id,
                    measured_at=vital_signs.measured_at,
                    heart_rate=vital_signs.heart_rate,
                    systolic_pressure=vital_signs.systolic_pressure,
                    diastolic_pressure=vital_signs.diastolic_pressure,
                    temperature=vital_signs.temperature,
                    oxygen_saturation=vital_signs.oxygen_saturation,
                    respiratory_rate=vital_signs.respiratory_rate,
                    weight=vital_signs.weight,
                    height=vital_signs.height,
                    measured_by=vital_signs.measured_by,
                    notes=vital_signs.notes
                )
            return None
        except Exception as e:
            logger.error(f"Error adding vital signs to visit {visit_id}: {e}")
            return None
    
    def add_diagnosis(self, visit_id: str, diagnosis_data: DiagnosisCreate, diagnosed_by: Optional[str] = None) -> Optional[DiagnosisResponse]:
        """Añade un diagnóstico a una visita"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Crear texto del diagnóstico para añadir al campo string
            diagnosis_text = f"Diagnóstico: {diagnosis_data.primary_diagnosis}"
            if diagnosis_data.icd10_code:
                diagnosis_text += f" (CIE-10: {diagnosis_data.icd10_code})"
            if diagnosis_data.severity:
                diagnosis_text += f" - Severidad: {diagnosis_data.severity}"
            if diagnosis_data.secondary_diagnoses:
                diagnosis_text += f" - Diagnósticos secundarios: {', '.join(diagnosis_data.secondary_diagnoses)}"
            
            # Añadir al campo diagnoses como string
            if visit_db.diagnoses:
                visit_db.diagnoses += f"\n{diagnosis_text}"
            else:
                visit_db.diagnoses = diagnosis_text
            
            visit_db.update_timestamp(diagnosed_by)
            
            if self.repository.update(visit_db):
                # Crear objeto de respuesta simulado para compatibilidad
                from uuid import uuid4
                return DiagnosisResponse(
                    diagnosis_id=str(uuid4()),
                    diagnosed_at=datetime.now(),
                    primary_diagnosis=diagnosis_data.primary_diagnosis,
                    secondary_diagnoses=diagnosis_data.secondary_diagnoses,
                    icd10_code=diagnosis_data.icd10_code,
                    severity=diagnosis_data.severity,
                    confirmed=diagnosis_data.confirmed,
                    differential_diagnoses=diagnosis_data.differential_diagnoses,
                    diagnosed_by=diagnosed_by
                )
            return None
        except Exception as e:
            logger.error(f"Error adding diagnosis to visit {visit_id}: {e}")
            return None
    
    def add_prescription(self, visit_id: str, prescription_data: PrescriptionCreate, prescribed_by: Optional[str] = None) -> Optional[PrescriptionResponse]:
        """Añade una prescripción a una visita"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Crear texto de la prescripción para añadir al campo string
            prescription_text = f"Medicamento: {prescription_data.medication_name} - "
            prescription_text += f"Dosis: {prescription_data.dosage} - "
            prescription_text += f"Frecuencia: {prescription_data.frequency} - "
            prescription_text += f"Duración: {prescription_data.duration} - "
            prescription_text += f"Vía: {prescription_data.route}"
            if prescription_data.instructions:
                prescription_text += f" - Instrucciones: {prescription_data.instructions}"
            
            # Añadir al campo prescriptions como string
            if visit_db.prescriptions:
                visit_db.prescriptions += f"\n{prescription_text}"
            else:
                visit_db.prescriptions = prescription_text
            
            visit_db.update_timestamp(prescribed_by)
            
            if self.repository.update(visit_db):
                # Crear objeto de respuesta simulado para compatibilidad
                from uuid import uuid4
                return PrescriptionResponse(
                    prescription_id=str(uuid4()),
                    prescribed_at=datetime.now(),
                    medication_name=prescription_data.medication_name,
                    dosage=prescription_data.dosage,
                    frequency=prescription_data.frequency,
                    duration=prescription_data.duration,
                    route=prescription_data.route,
                    instructions=prescription_data.instructions,
                    prescribed_by=prescribed_by
                )
            return None
        except Exception as e:
            logger.error(f"Error adding prescription to visit {visit_id}: {e}")
            return None
    
    def add_blood_analysis(self, visit_id: str, analysis_data: BloodAnalysisCreate, performed_by_dni: Optional[str] = None, performed_by_name: Optional[str] = None) -> Optional[BloodAnalysisResponse]:
        """Añade un análisis de sangre a una visita específica"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Crear análisis de sangre
            analysis = BloodAnalysis(
                red_blood_cells=analysis_data.red_blood_cells,
                hemoglobin=analysis_data.hemoglobin,
                hematocrit=analysis_data.hematocrit,
                platelets=analysis_data.platelets,
                lymphocytes=analysis_data.lymphocytes,
                glucose=analysis_data.glucose,
                cholesterol=analysis_data.cholesterol,
                urea=analysis_data.urea,
                cocaine=analysis_data.cocaine,
                alcohol=analysis_data.alcohol,
                mdma=analysis_data.mdma,
                fentanyl=analysis_data.fentanyl,
                notes=analysis_data.notes,
                performed_by_dni=performed_by_dni,
                performed_by_name=performed_by_name,
                visit_related_id=visit_id  # Establecer la relación con la visita
            )
            
            # Añadir análisis a la visita
            visit_db.add_blood_analysis(analysis, performed_by_dni)
            
            if self.repository.update(visit_db):
                return BloodAnalysisResponse(
                    analysis_id=analysis.analysis_id,
                    date_performed=analysis.date_performed,
                    red_blood_cells=analysis.red_blood_cells,
                    hemoglobin=analysis.hemoglobin,
                    hematocrit=analysis.hematocrit,
                    platelets=analysis.platelets,
                    lymphocytes=analysis.lymphocytes,
                    glucose=analysis.glucose,
                    cholesterol=analysis.cholesterol,
                    urea=analysis.urea,
                    cocaine=analysis.cocaine,
                    alcohol=analysis.alcohol,
                    mdma=analysis.mdma,
                    fentanyl=analysis.fentanyl,
                    performed_by_dni=analysis.performed_by_dni,
                    performed_by_name=analysis.performed_by_name,
                    notes=analysis.notes,
                    visit_related_id=analysis.visit_related_id
                )
            return None
        except Exception as e:
            logger.error(f"Error adding blood analysis to visit {visit_id}: {e}")
            return None
    
    def add_radiology_study(self, visit_id: str, study_data: RadiologyStudyCreate, performed_by_dni: Optional[str] = None, performed_by_name: Optional[str] = None) -> Optional[RadiologyStudyResponse]:
        """Añade un estudio radiológico a una visita específica"""
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Crear estudio radiológico
            study = RadiologyStudy(
                study_type=study_data.study_type,
                body_part=study_data.body_part,
                findings=study_data.findings,
                image_url=study_data.image_url,
                performed_by_dni=performed_by_dni,
                performed_by_name=performed_by_name,
                visit_related_id=visit_id  # Establecer la relación con la visita
            )
            
            # Añadir estudio a la visita
            visit_db.add_radiology_study(study, performed_by_dni)
            
            if self.repository.update(visit_db):
                return RadiologyStudyResponse(
                    study_id=study.study_id,
                    date_performed=study.date_performed,
                    study_type=study.study_type,
                    body_part=study.body_part,
                    findings=study.findings,
                    image_url=study.image_url,
                    performed_by_dni=study.performed_by_dni,
                    performed_by_name=study.performed_by_name,
                    visit_related_id=study.visit_related_id
                )
            return None
        except Exception as e:
            logger.error(f"Error adding radiology study to visit {visit_id}: {e}")
            return None
    
    def add_blood_analysis_with_patient_sync(self, visit_id: str, analysis_data: BloodAnalysisCreate, performed_by_dni: Optional[str] = None, performed_by_name: Optional[str] = None) -> Optional[BloodAnalysisResponse]:
        """Añade un análisis de sangre tanto a la visita como al historial del paciente"""
        from services.patient import PatientService  # Import local para evitar import circular
        
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Primero añadir a la visita
            visit_result = self.add_blood_analysis(visit_id, analysis_data, performed_by_dni, performed_by_name)
            if not visit_result:
                return None
            
            # Luego añadir al historial del paciente
            patient_service = PatientService()
            patient_result = patient_service.add_blood_analysis(
                visit_db.patient_dni, 
                analysis_data, 
                performed_by_dni, 
                performed_by_name, 
                visit_id
            )
            
            if patient_result:
                logger.info(f"Blood analysis {visit_result.analysis_id} added to both visit {visit_id} and patient {visit_db.patient_dni}")
                return visit_result
            else:
                logger.warning(f"Blood analysis added to visit {visit_id} but failed to add to patient {visit_db.patient_dni}")
                return visit_result
                
        except Exception as e:
            logger.error(f"Error adding blood analysis with patient sync to visit {visit_id}: {e}")
            return None
    
    def add_radiology_study_with_patient_sync(self, visit_id: str, study_data: RadiologyStudyCreate, performed_by_dni: Optional[str] = None, performed_by_name: Optional[str] = None) -> Optional[RadiologyStudyResponse]:
        """Añade un estudio radiológico tanto a la visita como al historial del paciente"""
        from services.patient import PatientService  # Import local para evitar import circular
        
        visit_db = self.repository.get_by_id(visit_id)
        if not visit_db:
            return None
        
        try:
            # Primero añadir a la visita
            visit_result = self.add_radiology_study(visit_id, study_data, performed_by_dni, performed_by_name)
            if not visit_result:
                return None
            
            # Luego añadir al historial del paciente
            patient_service = PatientService()
            patient_result = patient_service.add_radiology_study(
                visit_db.patient_dni, 
                study_data, 
                performed_by_dni, 
                performed_by_name, 
                visit_id
            )
            
            if patient_result:
                logger.info(f"Radiology study {visit_result.study_id} added to both visit {visit_id} and patient {visit_db.patient_dni}")
                return visit_result
            else:
                logger.warning(f"Radiology study added to visit {visit_id} but failed to add to patient {visit_db.patient_dni}")
                return visit_result
                
        except Exception as e:
            logger.error(f"Error adding radiology study with patient sync to visit {visit_id}: {e}")
            return None