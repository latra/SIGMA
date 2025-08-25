from __future__ import annotations
from locale import strcoll
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from schemas.enums import AttentionType, PatientStatus, Triage, VisitStatus
from uuid import uuid4

if TYPE_CHECKING:
    from models.patient import BloodAnalysis, RadiologyStudy


class VitalSigns(BaseModel):
    """Signos vitales del paciente durante la visita"""
    measurement_id: str = Field(default_factory=lambda: str(uuid4()), description="ID único de la medición")
    measured_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora de la medición")
    heart_rate: Optional[int] = Field(None, description="Frecuencia cardíaca (bpm)")
    systolic_pressure: Optional[str] = Field(None, description="Presión sistólica (mmHg)")
    diastolic_pressure: Optional[str] = Field(None, description="Presión diastólica (mmHg)")
    temperature: Optional[float] = Field(None, description="Temperatura corporal (°C)")
    oxygen_saturation: Optional[int] = Field(None, description="Saturación de oxígeno (%)")
    respiratory_rate: Optional[str] = Field(None, description="Frecuencia respiratoria (rpm)")
    weight: Optional[str] = Field(None, description="Peso (kg)")
    height: Optional[str] = Field(None, description="Altura (cm)")
    measured_by: Optional[str] = Field(None, description="DNI del profesional que tomó la medición")
    notes: Optional[str] = Field(None, description="Observaciones sobre los signos vitales")


class MedicalProcedure(BaseModel):
    """Procedimiento médico realizado durante la visita"""
    procedure_id: str = Field(default_factory=lambda: str(uuid4()), description="ID único del procedimiento")
    performed_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora del procedimiento")
    procedure_type: str = Field(..., description="Tipo de procedimiento realizado")
    description: str = Field(..., description="Descripción detallada del procedimiento")
    duration_minutes: Optional[int] = Field(None, ge=0, description="Duración en minutos")
    complications: Optional[str] = Field(None, description="Complicaciones durante el procedimiento")
    outcome: Optional[str] = Field(None, description="Resultado del procedimiento")
    performed_by: Optional[str] = Field(None, description="DNI del profesional que realizó el procedimiento")
    assistants: List[str] = Field(default_factory=list, description="DNIs de profesionales asistentes")


class MedicalEvolution(BaseModel):
    """Evolución médica del paciente durante la visita"""
    evolution_id: str = Field(default_factory=lambda: str(uuid4()), description="ID único de la evolución")
    recorded_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora del registro")
    clinical_status: PatientStatus = Field(..., description="Estado clínico del paciente")
    symptoms: List[str] = Field(default_factory=list, description="Síntomas reportados")
    physical_examination: str = Field("", description="Hallazgos del examen físico")
    clinical_impression: str = Field("", description="Impresión clínica")
    plan: str = Field("", description="Plan de tratamiento")
    recorded_by: Optional[str] = Field(None, description="DNI del profesional que registró la evolución")


class Prescription(BaseModel):
    """Prescripción médica"""
    prescription_id: str = Field(default_factory=lambda: str(uuid4()), description="ID único de la prescripción")
    prescribed_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora de prescripción")
    medication_name: str = Field(..., description="Nombre del medicamento")
    dosage: str = Field(..., description="Dosis prescrita")
    frequency: str = Field(..., description="Frecuencia de administración")
    duration: str = Field(..., description="Duración del tratamiento")
    route: str = Field(..., description="Vía de administración")
    instructions: Optional[str] = Field(None, description="Instrucciones especiales")
    prescribed_by: Optional[str] = Field(None, description="DNI del médico que prescribió")


class Diagnosis(BaseModel):
    """Diagnóstico médico"""
    diagnosis_id: str = Field(default_factory=lambda: str(uuid4()), description="ID único del diagnóstico")
    diagnosed_at: datetime = Field(default_factory=datetime.now, description="Fecha y hora del diagnóstico")
    primary_diagnosis: str = Field(..., description="Diagnóstico principal")
    secondary_diagnoses: List[str] = Field(default_factory=list, description="Diagnósticos secundarios")
    icd10_code: Optional[str] = Field(None, description="Código CIE-10")
    severity: Optional[str] = Field(None, description="Severidad del diagnóstico")
    confirmed: bool = Field(False, description="Si el diagnóstico está confirmado")
    differential_diagnoses: List[str] = Field(default_factory=list, description="Diagnósticos diferenciales")
    diagnosed_by: Optional[str] = Field(None, description="DNI del médico que realizó el diagnóstico")


class VisitDB(BaseModel):
    """Modelo completo de visita para la base de datos"""
    # Identificación de la visita
    visit_id: str = Field(default_factory=lambda: str(uuid4()), description="ID único de la visita")
    patient_dni: str = Field(..., description="DNI del paciente")
    
    # Información de admisión
    reason: str = Field(..., min_length=3, description="Motivo de la consulta")
    attention_place: AttentionType = Field(..., description="Lugar de atención")
    attention_details: Optional[str] = Field(None, description="Detalles del lugar de atención")
    location: str = Field(..., description="Ubicación específica")
    
    # Estado de la visita
    visit_status: VisitStatus = Field(default=VisitStatus.ADMISSION, description="Estado de la visita")
    triage: Optional[Triage] = Field(None, description="Clasificación de triage")
    priority_level: int = Field(default=3, ge=1, le=5, description="Nivel de prioridad (1=máxima, 5=mínima)")
    
    # Información del médico responsable
    attending_doctor_dni: str = Field(..., description="DNI del médico tratante")
    
    # Datos médicos estructurados
    admission_vital_signs: Optional[VitalSigns] = Field(None, description="Signos vitales de admisión")
    diagnoses: str = Field(default="", description="Diagnósticos de la visita")
    procedures: str = Field(default="", description="Procedimientos realizados")
    evolutions: str = Field(default="", description="Evoluciones médicas")
    prescriptions: str = Field(default="", description="Prescripciones médicas")
    treatment: str = Field(default="", description="Tratamiento")
    evolution: str = Field(default="", description="Evolución del paciente")
    # Análisis de sangre y estudios radiológicos relacionados con esta visita específica
    blood_analyses: List['BloodAnalysis'] = Field(default_factory=list, description="Análisis de sangre realizados durante esta visita")
    radiology_studies: List['RadiologyStudy'] = Field(default_factory=list, description="Estudios radiológicos realizados durante esta visita")
    
    # Metadatos del sistema
    created_at: datetime = Field(default_factory=datetime.now, description="Fecha de creación")
    updated_at: datetime = Field(default_factory=datetime.now, description="Última actualización")
    admission_date: datetime = Field(default_factory=datetime.now, description="Fecha de admisión")
    discharge_date: Optional[datetime] = Field(None, description="Fecha de alta")
    created_by: Optional[str] = Field(None, description="DNI del profesional que creó la visita")
    last_updated_by: Optional[str] = Field(None, description="DNI del último profesional que actualizó")
    
    # Control de calidad
    is_completed: bool = Field(False, description="Si la visita está completa")
    quality_indicators: dict = Field(default_factory=dict, description="Indicadores de calidad")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
    
    def update_timestamp(self, updated_by: Optional[str] = None):
        """Actualiza el timestamp de modificación"""
        self.updated_at = datetime.now()
        if updated_by:
            self.last_updated_by = updated_by
    
    def add_vital_signs(self, vital_signs: VitalSigns, measured_by: Optional[str] = None):
        """Actualiza los signos vitales de admisión"""
        if measured_by:
            vital_signs.measured_by = measured_by
        self.admission_vital_signs = vital_signs
        self.update_timestamp(measured_by)
    
    def add_diagnosis(self, diagnosis: Diagnosis, diagnosed_by: Optional[str] = None):
        """Añade un diagnóstico a la visita (como texto)"""
        if diagnosed_by:
            diagnosis.diagnosed_by = diagnosed_by
        
        # Convertir diagnóstico a texto
        diagnosis_text = f"Diagnóstico: {diagnosis.primary_diagnosis}"
        if diagnosis.icd10_code:
            diagnosis_text += f" (CIE-10: {diagnosis.icd10_code})"
        if diagnosis.severity:
            diagnosis_text += f" - Severidad: {diagnosis.severity}"
        
        # Añadir al campo string
        if self.diagnoses:
            self.diagnoses += f"\n{diagnosis_text}"
        else:
            self.diagnoses = diagnosis_text
        self.update_timestamp(diagnosed_by)
    
    def add_procedure(self, procedure: MedicalProcedure, performed_by: Optional[str] = None):
        """Añade un procedimiento a la visita (como texto)"""
        if performed_by:
            procedure.performed_by = performed_by
        
        # Convertir procedimiento a texto
        procedure_text = f"Procedimiento: {procedure.procedure_type} - {procedure.description}"
        if procedure.duration_minutes:
            procedure_text += f" (Duración: {procedure.duration_minutes} min)"
        if procedure.outcome:
            procedure_text += f" - Resultado: {procedure.outcome}"
        
        # Añadir al campo string
        if self.procedures:
            self.procedures += f"\n{procedure_text}"
        else:
            self.procedures = procedure_text
        self.update_timestamp(performed_by)
    
    def add_evolution(self, evolution: MedicalEvolution, recorded_by: Optional[str] = None):
        """Añade una evolución médica (como texto)"""
        if recorded_by:
            evolution.recorded_by = recorded_by
        
        # Convertir evolución a texto
        evolution_text = f"Estado clínico: {evolution.clinical_status}"
        if evolution.symptoms:
            evolution_text += f" - Síntomas: {', '.join(evolution.symptoms)}"
        if evolution.physical_examination:
            evolution_text += f" - Examen físico: {evolution.physical_examination}"
        if evolution.clinical_impression:
            evolution_text += f" - Impresión clínica: {evolution.clinical_impression}"
        if evolution.plan:
            evolution_text += f" - Plan: {evolution.plan}"
        
        # Añadir al campo string
        if self.evolutions:
            self.evolutions += f"\n{evolution_text}"
        else:
            self.evolutions = evolution_text
        self.update_timestamp(recorded_by)
    
    def add_prescription(self, prescription: Prescription, prescribed_by: Optional[str] = None):
        """Añade una prescripción médica (como texto)"""
        if prescribed_by:
            prescription.prescribed_by = prescribed_by
        
        # Convertir prescripción a texto
        prescription_text = f"Medicamento: {prescription.medication_name} - "
        prescription_text += f"Dosis: {prescription.dosage} - "
        prescription_text += f"Frecuencia: {prescription.frequency} - "
        prescription_text += f"Duración: {prescription.duration} - "
        prescription_text += f"Vía: {prescription.route}"
        if prescription.instructions:
            prescription_text += f" - Instrucciones: {prescription.instructions}"
        
        # Añadir al campo string
        if self.prescriptions:
            self.prescriptions += f"\n{prescription_text}"
        else:
            self.prescriptions = prescription_text
        self.update_timestamp(prescribed_by)
    
    def discharge_patient(self, discharged_by: Optional[str] = None):
        """Da de alta al paciente"""
        self.visit_status = VisitStatus.DISCHARGE
        self.discharge_date = datetime.now()
        self.is_completed = True
        self.update_timestamp(discharged_by)
    
    def get_latest_vital_signs(self) -> Optional[VitalSigns]:
        """Obtiene los signos vitales de admisión"""
        return self.admission_vital_signs
    
    def get_primary_diagnosis(self) -> Optional[str]:
        """Obtiene el diagnóstico principal (ahora como string)"""
        if not self.diagnoses:
            return None
        # Devolver la primera línea del diagnóstico (que es el principal)
        return self.diagnoses.split('\n')[0] if self.diagnoses else None
    
    def get_latest_evolution(self) -> Optional[str]:
        """Obtiene la evolución médica más reciente (ahora como string)"""
        if not self.evolutions:
            return None
        # Devolver la última línea del campo evolutions (que sería la más reciente)
        lines = self.evolutions.split('\n')
        return lines[-1] if lines else None
    
    def calculate_length_of_stay(self) -> Optional[int]:
        """Calcula la duración de la estancia en horas"""
        if self.discharge_date:
            delta = self.discharge_date - self.admission_date
            return int(delta.total_seconds() / 3600)
        else:
            delta = datetime.now() - self.admission_date
            return int(delta.total_seconds() / 3600)
    
    def add_blood_analysis(self, analysis: 'BloodAnalysis', performed_by: Optional[str] = None):
        """Añade un análisis de sangre a esta visita específica"""
        if performed_by:
            analysis.performed_by_dni = performed_by
        # Asegurarse de que el análisis esté relacionado con esta visita
        analysis.visit_related_id = self.visit_id
        self.blood_analyses.append(analysis)
        self.update_timestamp(performed_by)
    
    def add_radiology_study(self, study: 'RadiologyStudy', performed_by: Optional[str] = None):
        """Añade un estudio radiológico a esta visita específica"""
        if performed_by:
            study.performed_by_dni = performed_by
        # Asegurarse de que el estudio esté relacionado con esta visita
        study.visit_related_id = self.visit_id
        self.radiology_studies.append(study)
        self.update_timestamp(performed_by)
    
    def get_latest_blood_analysis(self) -> Optional['BloodAnalysis']:
        """Obtiene el análisis de sangre más reciente de esta visita"""
        if not self.blood_analyses:
            return None
        return max(self.blood_analyses, key=lambda x: x.date_performed)
    
    def get_latest_radiology_study(self) -> Optional['RadiologyStudy']:
        """Obtiene el estudio radiológico más reciente de esta visita"""
        if not self.radiology_studies:
            return None
        return max(self.radiology_studies, key=lambda x: x.date_performed)


# Llamada para reconstruir el modelo después de que todas las referencias estén disponibles
def rebuild_visit_models():
    """Reconstruye los modelos de visita para resolver referencias forward"""
    try:
        from models.patient import BloodAnalysis, RadiologyStudy
        VisitDB.model_rebuild()
    except ImportError:
        # Si aún no están disponibles, se reconstruirá cuando sea necesario
        pass 