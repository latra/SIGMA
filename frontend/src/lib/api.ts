import { auth } from '../app/firebase/config'
import { handleAuthError } from './auth-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getAuthToken(): Promise<string | null> {
  // Wait for auth to be initialized
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const user = auth.currentUser
    if (user) {
      try {
        const token = await user.getIdToken()
        console.log('Auth token obtained successfully')
        return token
      } catch (error) {
        console.error('Error getting auth token:', error)
        return null
      }
    }
    
    // Wait a bit before trying again
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  console.warn('No user found after waiting for auth to initialize')
  return null
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
    console.log(`API call to ${endpoint} with auth token`)
  } else {
    console.warn(`No authentication token available for API call to: ${endpoint}`)
  }
  
  const url = `${API_BASE_URL}${endpoint}`
  console.log('Making API call to:', url, 'with token:', token ? 'Present' : 'Missing')
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const errorMessage = `API call failed: ${response.status} ${response.statusText}`
    console.error(errorMessage, 'for endpoint:', endpoint)
    
    // Handle 401 Unauthorized error - trigger logout
    if (response.status === 401) {
      await handleAuthError({ status: 401, message: 'Unauthorized' })
    }
    
    // Try to get more details from response
    try {
      const errorData = await response.text()
      console.error('Error response body:', errorData)
    } catch (e) {
      console.error('Could not read error response body')
    }
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}

// API functions for user data (new system)
export type UserRole = 'admin' | 'doctor' | 'police' | 'patient'

export interface User {
  name: string
  dni: string
  email: string
  phone?: string
  user_id: string
  firebase_uid: string
  role: UserRole
  enabled: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface DoctorProfile {
  medical_license?: string
  specialty?: string
  sub_specialty?: string
  institution?: string
  years_experience?: number
  can_prescribe?: boolean
  can_diagnose?: boolean
  can_perform_procedures?: boolean
}

export interface DoctorUser extends User {
  specialty?: string
  medical_license?: string
  institution?: string
  years_experience?: number
}

export interface PoliceProfile {
  badge_number?: string
  rank?: string
  department?: string
  station?: string
  years_service?: number
  can_arrest?: boolean
  can_investigate?: boolean
  can_access_medical_info?: boolean
}

export interface PoliceUser extends User {
  badge_number?: string
  rank?: string
  department?: string
  station?: string
  years_service?: number
}

// Admin-only user creation interfaces
export interface DoctorCreate {
  name: string
  dni: string
  email: string
  phone?: string
  role?: UserRole
  doctor_profile: DoctorProfile
}

export interface PoliceCreate {
  name: string
  dni: string
  email: string
  phone?: string
  role?: UserRole
  police_profile: PoliceProfile
}

// Public registration interfaces
export interface DoctorRegister {
  name: string
  dni: string
  email: string
  phone?: string
  specialty?: string
  medical_license?: string
  institution?: string
  years_experience?: number
}

export interface PoliceRegister {
  name: string
  dni: string
  email: string
  phone?: string
  badge_number: string
  rank?: string
  department?: string
  station?: string
  years_service?: number
}

// API functions for user data
export async function getCurrentUser(): Promise<User> {
  return apiCall<User>('/user/me')
}

export async function createDoctor(doctorData: DoctorCreate): Promise<DoctorUser> {
  return apiCall<DoctorUser>('/user/doctor', {
    method: 'POST',
    body: JSON.stringify(doctorData)
  })
}

export async function createPolice(policeData: PoliceCreate): Promise<PoliceUser> {
  return apiCall<PoliceUser>('/user/police', {
    method: 'POST',
    body: JSON.stringify(policeData)
  })
}

export async function getAllDoctors(): Promise<DoctorUser[]> {
  return apiCall<DoctorUser[]>('/user/doctors')
}

export async function getAllPolice(): Promise<PoliceUser[]> {
  return apiCall<PoliceUser[]>('/user/police')
}

// Public registration functions (no auth required during registration)
export async function registerDoctor(doctorData: DoctorRegister): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/register/doctor`
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(doctorData)
  })
  
  if (!response.ok) {
    const errorMessage = `Registration failed: ${response.status} ${response.statusText}`
    console.error(errorMessage)
    
    // Try to get more details from response
    try {
      const errorData = await response.text()
      console.error('Error response body:', errorData)
      
      // Try to parse as JSON for better error messages
      try {
        const parsedError = JSON.parse(errorData)
        if (parsedError.detail) {
          throw new Error(parsedError.detail)
        }
      } catch (parseError) {
        // If can't parse as JSON, use the raw text
        throw new Error(errorData || errorMessage)
      }
    } catch (e) {
      console.error('Could not read error response body')
      throw new Error(errorMessage)
    }
  }
  
  return response.json()
}

export async function registerPolice(policeData: PoliceRegister): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/register/police`
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(policeData)
  })
  
  if (!response.ok) {
    const errorMessage = `Registration failed: ${response.status} ${response.statusText}`
    console.error(errorMessage)
    
    // Try to get more details from response
    try {
      const errorData = await response.text()
      console.error('Error response body:', errorData)
      
      // Try to parse as JSON for better error messages
      try {
        const parsedError = JSON.parse(errorData)
        if (parsedError.detail) {
          throw new Error(parsedError.detail)
        }
      } catch (parseError) {
        // If can't parse as JSON, use the raw text
        throw new Error(errorData || errorMessage)
      }
    } catch (e) {
      console.error('Could not read error response body')
      throw new Error(errorMessage)
    }
  }
  
  return response.json()
}

// Legacy doctor functions for backward compatibility
export interface Doctor {
  name: string
  dni: string
  email: string
  enabled: boolean
  is_admin?: boolean | null
}

export async function getCurrentDoctor(): Promise<Doctor> {
  return apiCall<Doctor>('/doctor/me')
}

export async function getCurrentPolice(): Promise<PoliceUser> {
  return apiCall<PoliceUser>('/police/me')
}

// API functions for patients
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type Gender = 'male' | 'female'
export type PatientStatus = 'conscious' | 'unconscious' | 'in_danger' | 'stable' | 'critical'
export type AttentionType = 'home' | 'headquarters' | 'street' | 'hospital' | 'traslad' | 'other'
export type Triage = 'unknown' | 'green' | 'yellow' | 'red' | 'black'

export interface Patient {
  name: string
  dni: string
  age: number
  sex: Gender
  phone?: string
  blood_type: BloodType
  created_at: string
  updated_at: string
}

export interface PatientSummary {
  name: string
  dni: string
  age: number
  sex: Gender
  blood_type: BloodType
  last_visit?: string
}

export interface PatientCreate {
  name: string
  dni: string
  age: number
  sex: Gender
  phone?: string
  blood_type: BloodType
  allergies?: string[]
  medical_notes?: string
  major_surgeries?: string[]
  current_medications?: string[]
  chronic_conditions?: string[]
  family_history?: string
}

export interface PatientUpdate {
  name?: string
  age?: number
  phone?: string
  discapacity_level?: number
}

export interface BloodAnalysis {
  red_blood_cells: number
  hemoglobin: number
  hematocrit: number
  platelets: number
  lymphocytes: number
  glucose: number
  cholesterol: number
  urea: number
  cocaine?: number
  alcohol?: number
  mdma?: number
  fentanyl?: number
  notes?: string
  analysis_id: string
  date_performed: string
  performed_by_dni?: string
  performed_by_name?: string
}

export interface BloodAnalysisCreate {
  red_blood_cells: number
  hemoglobin: number
  hematocrit: number
  platelets: number
  lymphocytes: number
  glucose: number
  cholesterol: number
  urea: number
  cocaine?: number
  alcohol?: number
  mdma?: number
  fentanyl?: number
  notes?: string
}

export interface RadiologyStudy {
  study_type: string
  body_part: string
  findings: string
  image_url?: string
  study_id: string
  date_performed: string
  performed_by_dni?: string
  performed_by_name?: string
}

export interface RadiologyStudyCreate {
  study_type: string
  body_part: string
  findings: string
  image_url?: string
  radiologist?: string
}

export interface MedicalHistory {
  allergies: string[]
  medical_notes: string
  major_surgeries: string[]
  current_medications: string[]
  chronic_conditions: string[]
  family_history: string
  blood_analyses: BloodAnalysis[]
  radiology_studies: RadiologyStudy[]
  last_updated: string
  updated_by?: string
}

export interface PatientComplete {
  name: string
  dni: string
  age: number
  sex: Gender
  phone?: string
  blood_type: BloodType
  discapacity_level?: number
  created_at: string
  updated_at: string
  medical_history: MedicalHistory
  created_by?: string
  last_updated_by?: string
}

export interface PatientMedicalHistoryUpdate {
  allergies?: string[]
  medical_notes?: string
  major_surgeries?: string[]
  current_medications?: string[]
  chronic_conditions?: string[]
  family_history?: string
}

export async function getPatients(): Promise<PatientSummary[]> {
  return apiCall<PatientSummary[]>('/patients/')
}

export async function getPatient(dni: string): Promise<Patient> {
  return apiCall<Patient>(`/patients/${dni}`)
}

export async function getPatientComplete(dni: string): Promise<PatientComplete> {
  return apiCall<PatientComplete>(`/patients/${dni}/complete`)
}

export async function updatePatient(dni: string, patientData: PatientUpdate): Promise<Patient> {
  return apiCall<Patient>(`/patients/${dni}`, {
    method: 'PUT',
    body: JSON.stringify(patientData)
  })
}

export async function deletePatient(dni: string): Promise<void> {
  return apiCall<void>(`/patients/${dni}`, {
    method: 'DELETE'
  })
}

export async function createPatient(patientData: PatientCreate): Promise<Patient> {
  return apiCall<Patient>('/patients/', {
    method: 'POST',
    body: JSON.stringify(patientData)
  })
}

export async function updatePatientMedicalHistory(dni: string, medicalData: PatientMedicalHistoryUpdate): Promise<MedicalHistory> {
  return apiCall<MedicalHistory>(`/patients/${dni}/medical-history`, {
    method: 'PUT',
    body: JSON.stringify(medicalData)
  })
}

export async function addBloodAnalysis(dni: string, analysisData: BloodAnalysisCreate): Promise<BloodAnalysis> {
  return apiCall<BloodAnalysis>(`/patients/${dni}/blood-analysis`, {
    method: 'POST',
    body: JSON.stringify(analysisData)
  })
}

export async function addRadiologyStudy(dni: string, studyData: RadiologyStudyCreate): Promise<RadiologyStudy> {
  return apiCall<RadiologyStudy>(`/patients/${dni}/radiology-study`, {
    method: 'POST',
    body: JSON.stringify(studyData)
  })
}

// New functions for visit-related blood analysis and radiology studies
export async function addBloodAnalysisToVisit(visitId: string, analysisData: BloodAnalysisCreate): Promise<BloodAnalysis> {
  return apiCall<BloodAnalysis>(`/visit/${visitId}/blood-analysis`, {
    method: 'POST',
    body: JSON.stringify(analysisData)
  })
}

export async function addRadiologyStudyToVisit(visitId: string, studyData: RadiologyStudyCreate): Promise<RadiologyStudy> {
  return apiCall<RadiologyStudy>(`/visit/${visitId}/radiology-study`, {
    method: 'POST',
    body: JSON.stringify(studyData)
  })
}

// API functions for patient visits
export type VisitStatus = 'admission' | 'discharge'

export interface VisitSummary {
  visit_id: string
  visit_status: VisitStatus
  doctor_dni: string
  doctor_name: string
  doctor_email?: string
  doctor_specialty?: string
  date_of_admission: string
  date_of_discharge?: string
  reason: string
  attention_place: AttentionType
  attention_details?: string
  location: string
}

export interface Visit {
  patient_dni: string
  reason: string
  attention_place: AttentionType
  attention_details?: string
  location: string
  admission_status: PatientStatus
  admission_heart_rate?: number
  admission_blood_pressure?: number
  admission_temperature?: number
  admission_oxygen_saturation?: number
  triage?: Triage
  visit_id: string
  visit_status: VisitStatus
  date_of_admission?: string
  doctor_dni: string
  doctor_name: string
  doctor_email?: string
  doctor_specialty?: string
  diagnosis?: string
  tests?: string
  treatment?: string
  evolution?: string
  recommendations?: string
  medication?: string
  date_of_discharge?: string
  specialist_follow_up?: string
  additional_observations?: string
  notes?: string
}

export interface VisitComplete {
  visit_id: string
  patient_dni: string
  reason: string
  attention_place: AttentionType
  attention_details?: string
  location: string
  visit_status: VisitStatus
  triage?: Triage
  priority_level: number
  attending_doctor_dni: string
  referring_doctor_dni?: string
  blood_analyses: BloodAnalysis[]
  radiology_studies: RadiologyStudy[]
  discharge_summary?: string
  discharge_instructions?: string
  follow_up_required: boolean
  follow_up_date?: string
  follow_up_specialty?: string
  created_at: string
  updated_at: string
  admission_date: string
  discharge_date?: string
  created_by?: string
  last_updated_by?: string
  is_completed: boolean
  length_of_stay_hours?: number
  // For compatibility with existing code
  date_of_admission?: string
  date_of_discharge?: string
  admission_heart_rate?: number
  admission_blood_pressure?: string
  admission_temperature?: number
  admission_oxygen_saturation?: number
  diagnosis?: string
  tests?: string
  treatment?: string
  evolution?: string
  recommendations?: string
  medication?: string
  specialist_follow_up?: string
  additional_observations?: string
  notes?: string
}

export interface VisitBase {
  patient_dni: string
  reason: string
  attention_place: AttentionType
  attention_details?: string
  location: string
  admission_status: PatientStatus
  admission_heart_rate?: number
  admission_blood_pressure?: string
  admission_temperature?: number
  admission_oxygen_saturation?: number
  triage?: Triage
}

export interface VisitUpdate {
  reason?: string
  admission_heart_rate?: number
  admission_blood_pressure?: string
  admission_temperature?: number
  admission_oxygen_saturation?: number
  triage?: Triage
  diagnosis?: string
  tests?: string
  treatment?: string
  evolution?: string
  recommendations?: string
  medication?: string
  specialist_follow_up?: string
  additional_observations?: string
  notes?: string
}

export async function getPatientVisits(patientDni: string): Promise<VisitSummary[]> {
  return apiCall<VisitSummary[]>(`/visit/${patientDni}`)
}

export async function getVisitDetails(visitId: string): Promise<Visit> {
  return apiCall<Visit>(`/visit/info/${visitId}`)
}

export async function getVisitComplete(visitId: string): Promise<VisitComplete> {
  return apiCall<VisitComplete>(`/visit/complete/${visitId}`)
}

export async function updateVisit(visitId: string, visitData: VisitUpdate): Promise<Visit> {
  return apiCall<Visit>(`/visit/${visitId}`, {
    method: 'PUT',
    body: JSON.stringify(visitData)
  })
}

export async function createVisit(visitData: VisitBase): Promise<Visit> {
  return apiCall<Visit>('/visit/', {
    method: 'POST',
    body: JSON.stringify(visitData)
  })
}

export async function dischargeVisit(visitId: string): Promise<void> {
  return apiCall<void>(`/visit/${visitId}/discharge`, {
    method: 'PUT'
  })
}

// API functions for admitted patients
export interface PatientAdmitted {
  name: string
  dni: string
  visit_id: string
  reason: string
  attention_place: 'street' | 'hospital' | 'traslad' | 'other' | 'headquarters' | 'home' | 'other'
  attention_details: string
  triage: 'unknown' | 'green' | 'yellow' | 'red' | 'black'
  doctor_name: string
  doctor_dni: string
}

export async function getAdmittedPatients(): Promise<PatientAdmitted[]> {
  return apiCall<PatientAdmitted[]>('/patients/admitted')
}

// API functions for exam system
export interface ExamQuestion {
  question_id: string
  question: string
  options: string[]
  correct_option: string
}

export interface ExamCategory {
  category_id: string
  name: string
  description: string
  questions: ExamQuestion[]
}

export interface ExamCreate {
  name: string
  max_error_allowed: number
  description: string
  categories: ExamCategory[]
}

export interface Exam {
  exam_id: string
  name: string
  max_error_allowed: number
  description: string
  categories: ExamCategory[]
  enabled: boolean
  disabled_by?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export async function getExams(): Promise<Exam[]> {
  return apiCall<Exam[]>('/exams/')
}

export async function getExam(examId: string): Promise<Exam> {
  return apiCall<Exam>(`/exams/${examId}`)
}

export async function createExam(examData: ExamCreate): Promise<Exam> {
  return apiCall<Exam>('/exams/', {
    method: 'POST',
    body: JSON.stringify(examData)
  })
}

export async function updateExam(examId: string, examData: ExamCreate): Promise<Exam> {
  return apiCall<Exam>(`/exams/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(examData)
  })
}

export async function deleteExam(examId: string): Promise<void> {
  return apiCall<void>(`/exams/${examId}`, {
    method: 'DELETE'
  })
}

// Interfaces for psychotechnical exam results
export interface QuestionAnswer {
  question_id: string
  selected_option: string
}

export interface ExamSubmission {
  exam_id: string
  patient_dni: string
  answers: QuestionAnswer[]
  notes?: string
  observations?: string
}

export interface ExamResult {
  result_id: string
  exam_id: string
  exam_name: string
  patient_dni: string
  patient_name: string
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  score_percentage: number
  status: string
  is_approved: boolean
  examiner_dni: string
  examiner_name: string
  examiner_role: string
  notes?: string | null
  observations?: string | null
  exam_date: string
  created_at: string
}

export interface PatientExamHistory {
  patient_dni: string
  patient_name: string
  exam_results: ExamResult[]
  total_exams: number
  passed_exams: number
  failed_exams: number
}

// API functions for psychotechnical exam results
export async function submitExamResult(examData: ExamSubmission): Promise<ExamResult> {
  return apiCall<ExamResult>('/exams/results', {
    method: 'POST',
    body: JSON.stringify(examData)
  })
}

export async function getPatientExamResults(patientDni: string): Promise<PatientExamHistory> {
  return apiCall<PatientExamHistory>(`/exams/patients/${patientDni}/history`)
}

// Interface for certificate verification (police endpoint)
export interface CertificateInfo {
  citizen_dni: string
  citizen_name: string
  exam_pass: boolean
  exam_date: string
  doctor_dni: string
  doctor_name: string
}

// Police certificate verification function
export async function getCertificate(examId: string, patientDni: string): Promise<CertificateInfo> {
  return apiCall<CertificateInfo>(`/exams/get_certificate/${examId}/${patientDni}`)
} 