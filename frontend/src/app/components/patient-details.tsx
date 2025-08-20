'use client'

import { Patient, PatientComplete, PatientSummary, VisitSummary, getPatientComplete, getPatientVisits, updatePatient, updatePatientMedicalHistory, addBloodAnalysis, addRadiologyStudy, BloodAnalysisCreate, RadiologyStudyCreate, PatientUpdate, PatientMedicalHistoryUpdate, Gender, getExams, submitExamResult, getPatientExamResults, Exam, ExamSubmission, ExamResult, PatientExamHistory, QuestionAnswer } from '../../lib/api'
import { XMarkIcon, PencilIcon, CheckIcon, XCircleIcon, ClockIcon, UserIcon, PlusIcon, HeartIcon, DocumentTextIcon, BeakerIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import VisitDetails from './visit-details'
import CreateVisit from './create-visit'

interface PatientDetailsProps {
  patient: PatientSummary | null
  isOpen: boolean
  onClose: () => void
  onPatientUpdate?: (updatedPatient: PatientSummary) => void
}

type TabType = 'info' | 'history' | 'medical' | 'blood' | 'radiology' | 'psycho'

export default function PatientDetails({ patient, isOpen, onClose, onPatientUpdate }: PatientDetailsProps) {
  const [patientComplete, setPatientComplete] = useState<PatientComplete | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [visits, setVisits] = useState<VisitSummary[]>([])
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [visitsError, setVisitsError] = useState<string | null>(null)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [isCreateVisitModalOpen, setIsCreateVisitModalOpen] = useState(false)
  const [isNewlyCreatedVisit, setIsNewlyCreatedVisit] = useState(false)

  // Form states
  const [basicInfo, setBasicInfo] = useState<PatientUpdate>({})
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistoryUpdate>({})
  const [newBloodAnalysis, setNewBloodAnalysis] = useState<BloodAnalysisCreate | null>(null)
  const [newRadiologyStudy, setNewRadiologyStudy] = useState<RadiologyStudyCreate | null>(null)
  const [showBloodAnalysisForm, setShowBloodAnalysisForm] = useState(false)
  const [showRadiologyForm, setShowRadiologyForm] = useState(false)

  // States for psychotechnical exams
  const [availableExams, setAvailableExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examAnswers, setExamAnswers] = useState<QuestionAnswer[]>([])
  const [examNotes, setExamNotes] = useState('')
  const [examObservations, setExamObservations] = useState('')
  const [patientExamHistory, setPatientExamHistory] = useState<PatientExamHistory | null>(null)
  const [loadingExams, setLoadingExams] = useState(false)
  const [loadingExamResults, setLoadingExamResults] = useState(false)
  const [showExamForm, setShowExamForm] = useState(false)

  const fetchPatientComplete = async () => {
    if (!patient) return
    
    setIsLoading(true)
    try {
      const completeData = await getPatientComplete(patient.dni)
      setPatientComplete(completeData)
      
      // Initialize form data
      setBasicInfo({
        name: completeData.name,
        age: completeData.age,
        phone: completeData.phone || '',
        discapacity_level: completeData.discapacity_level || 0,
      })
      
      setMedicalHistory({
        allergies: completeData.medical_history.allergies,
        medical_notes: completeData.medical_history.medical_notes,
        major_surgeries: completeData.medical_history.major_surgeries,
        current_medications: completeData.medical_history.current_medications,
        chronic_conditions: completeData.medical_history.chronic_conditions,
        family_history: completeData.medical_history.family_history
      })
    } catch (error) {
      console.error('Error fetching complete patient data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVisits = async () => {
    if (!patient) return
    
    setVisitsLoading(true)
    setVisitsError(null)
    try {
      const visitsData = await getPatientVisits(patient.dni)
      setVisits(visitsData)
    } catch (error) {
      console.error('Error fetching visits:', error)
      setVisitsError('Error al cargar el historial de visitas')
    } finally {
      setVisitsLoading(false)
    }
  }

  const fetchAvailableExams = async () => {
    setLoadingExams(true)
    try {
      const examsData = await getExams()
      setAvailableExams(examsData.filter(exam => exam.enabled))
    } catch (error) {
      console.error('Error fetching available exams:', error)
    } finally {
      setLoadingExams(false)
    }
  }

  const fetchPatientExamResults = async () => {
    if (!patient) return
    
    setLoadingExamResults(true)
    try {
      const historyData = await getPatientExamResults(patient.dni)
      setPatientExamHistory(historyData)
    } catch (error) {
      console.error('Error fetching patient exam results:', error)
    } finally {
      setLoadingExamResults(false)
    }
  }

  useEffect(() => {
    if (patient && isOpen) {
      fetchPatientComplete()
    }
  }, [patient, isOpen])

  useEffect(() => {
    if (activeTab === 'history' && patient && isOpen) {
      fetchVisits()
    }
  }, [activeTab, patient, isOpen])

  useEffect(() => {
    if (activeTab === 'psycho' && patient && isOpen) {
      fetchAvailableExams()
      fetchPatientExamResults()
    }
  }, [activeTab, patient, isOpen])

  if (!isOpen || !patient) return null

  const formatSex = (sex: string) => {
    return sex === 'male' ? 'Masculino' : 'Femenino'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const arrayToString = (arr: string[]): string => {
    return arr.join(', ')
  }

  const stringToArray = (str: string): string[] => {
    if (!str.trim()) return []
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  const handleSaveBasicInfo = async () => {
    if (!patient || !patientComplete) return

    setIsLoading(true)
    try {
      await updatePatient(patient.dni, basicInfo)
      await fetchPatientComplete()
      setIsEditing(false)
      
      // Update the summary patient data
      onPatientUpdate?.({
        ...patient,
        name: basicInfo.name || patient.name,
        age: basicInfo.age || patient.age,
      })
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Error al actualizar el paciente')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMedicalHistory = async () => {
    if (!patient) return

    setIsLoading(true)
    try {
      await updatePatientMedicalHistory(patient.dni, medicalHistory)
      await fetchPatientComplete()
      alert('Historial médico actualizado correctamente')
    } catch (error) {
      console.error('Error updating medical history:', error)
      alert('Error al actualizar el historial médico')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBloodAnalysis = async () => {
    if (!patient || !newBloodAnalysis) return

    setIsLoading(true)
    try {
      await addBloodAnalysis(patient.dni, newBloodAnalysis)
      await fetchPatientComplete()
      setShowBloodAnalysisForm(false)
      setNewBloodAnalysis(null)
      alert('Análisis de sangre agregado correctamente')
    } catch (error) {
      console.error('Error adding blood analysis:', error)
      alert('Error al agregar el análisis de sangre')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRadiologyStudy = async () => {
    if (!patient || !newRadiologyStudy) return

    setIsLoading(true)
    try {
      await addRadiologyStudy(patient.dni, newRadiologyStudy)
      await fetchPatientComplete()
      setShowRadiologyForm(false)
      setNewRadiologyStudy(null)
      alert('Estudio radiológico agregado correctamente')
    } catch (error) {
      console.error('Error adding radiology study:', error)
      alert('Error al agregar el estudio radiológico')
    } finally {
      setIsLoading(false)
    }
  }

  // Functions for psychotechnical exams
  const handleExamSelection = (exam: Exam) => {
    setSelectedExam(exam)
    // Initialize answers array for all questions using real question IDs from backend
    const initialAnswers: QuestionAnswer[] = []
    exam.categories.forEach((category) => {
      category.questions.forEach((question) => {
        initialAnswers.push({
          question_id: question.question_id, // Use real question ID from backend
          selected_option: ''
        })
      })
    })
    setExamAnswers(initialAnswers)
    setExamNotes('')
    setExamObservations('')
  }

  const handleAnswerChange = (questionId: string, selectedOption: string) => {
    setExamAnswers(prev => 
      prev.map(answer => 
        answer.question_id === questionId 
          ? { ...answer, selected_option: selectedOption }
          : answer
      )
    )
  }

  const handleSubmitExam = async () => {
    if (!patient || !selectedExam) return

    // Validate all questions are answered
    const unansweredQuestions = examAnswers.filter(answer => !answer.selected_option.trim())
    if (unansweredQuestions.length > 0) {
      alert('Por favor responde todas las preguntas antes de enviar el examen.')
      return
    }

    setIsLoading(true)
    try {
      const examSubmission: ExamSubmission = {
        exam_id: selectedExam.exam_id, // Use real exam_id from backend
        patient_dni: patient.dni,
        answers: examAnswers,
        notes: examNotes.trim() || undefined,
        observations: examObservations.trim() || undefined
      }

      await submitExamResult(examSubmission)
      await fetchPatientExamResults()
      
      // Reset form
      setSelectedExam(null)
      setExamAnswers([])
      setExamNotes('')
      setExamObservations('')
      setShowExamForm(false)
      
      alert('Examen enviado correctamente')
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert('Error al enviar el examen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelExam = () => {
    setSelectedExam(null)
    setExamAnswers([])
    setExamNotes('')
    setExamObservations('')
    setShowExamForm(false)
  }

  const handleVisitClick = (visitId: string) => {
    setSelectedVisitId(visitId)
    setIsVisitModalOpen(true)
  }

  const handleVisitModalClose = () => {
    setIsVisitModalOpen(false)
    setSelectedVisitId(null)
    setIsNewlyCreatedVisit(false)
  }

  const handleVisitUpdate = () => {
    fetchVisits()
  }

  const handleStudyAdded = () => {
    // When a study is added from a visit, refresh both patient data and visits
    fetchPatientComplete()
    fetchVisits()
  }

  const handleCreateVisit = () => {
    setIsCreateVisitModalOpen(true)
  }

  const handleCreateVisitClose = () => {
    setIsCreateVisitModalOpen(false)
  }

  const getRandomInRange = (min: number, max: number, decimals: number = 2): number => {
    const value = Math.random() * (max - min) + min
    return Number(value.toFixed(decimals))
  }

  const getNormalValue = (field: string, sex: Gender = 'male'): number => {
    const ranges = {
      red_blood_cells: sex === 'male' ? { min: 4.5, max: 5.9, decimals: 2 } : { min: 4.1, max: 5.1, decimals: 2 },
      hemoglobin: sex === 'male' ? { min: 13.5, max: 17.5, decimals: 1 } : { min: 12.0, max: 15.5, decimals: 1 },
      hematocrit: sex === 'male' ? { min: 41, max: 53, decimals: 1 } : { min: 36, max: 46, decimals: 1 },
      platelets: { min: 150000, max: 450000, decimals: 0 },
      lymphocytes: { min: 20, max: 45, decimals: 1 },
      glucose: { min: 70, max: 99, decimals: 0 },
      cholesterol: { min: 150, max: 199, decimals: 0 },
      urea: { min: 15, max: 50, decimals: 0 },
      cocaine: { min: 0, max: 0, decimals: 0 },
      alcohol: { min: 0, max: 0, decimals: 0 },
      mdma: { min: 0, max: 0, decimals: 0 },
      fentanyl: { min: 0, max: 0, decimals: 0 }
    }

    const range = ranges[field as keyof typeof ranges]
    if (!range) return 0

    return getRandomInRange(range.min, range.max, range.decimals)
  }

  const handleVisitCreated = (visitId: string) => {
    fetchVisits()
    setSelectedVisitId(visitId)
    setIsNewlyCreatedVisit(true)
    setIsVisitModalOpen(true)
  }

  if (isLoading && !patientComplete) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative bg-white shadow-sm rounded-lg max-w-6xl w-full p-8">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!patientComplete) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Modal panel */}
      <div className="relative bg-white shadow-sm rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-hospital-blue text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Detalles del Paciente</h3>
              <p className="text-gray-300 text-sm mt-1">{patientComplete.name} - {patientComplete.dni}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateVisit}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
                title="Ingresar paciente"
              >
                <PlusIcon className="h-4 w-4" />
                Ingresar
              </button>
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-white p-2 rounded-md transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Información
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'medical'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartIcon className="h-4 w-4 inline mr-2" />
              Historial Médico
            </button>
            <button
              onClick={() => setActiveTab('blood')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'blood'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BeakerIcon className="h-4 w-4 inline mr-2" />
              Análisis
            </button>
            <button
              onClick={() => setActiveTab('radiology')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'radiology'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 inline mr-2" />
              Radiología
            </button>
            <button
              onClick={() => setActiveTab('psycho')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'psycho'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AcademicCapIcon className="h-4 w-4 inline mr-2" />
              Exámenes Psicotécnicos
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="h-4 w-4 inline mr-2" />
              Visitas
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Información Básica Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Información Personal */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide">
                    Información Personal
                  </h4>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-hospital-blue hover:text-hospital-blue/80 p-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={basicInfo.name || ''}
                        onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {patientComplete.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">DNI</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {patientComplete.dni}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Edad</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={basicInfo.age || ''}
                        onChange={(e) => setBasicInfo(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {patientComplete.age} años
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Sexo</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {formatSex(patientComplete.sex)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Teléfono</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={basicInfo.phone || ''}
                        onChange={(e) => setBasicInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {patientComplete.phone || 'No registrado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Tipo Sangre</label>
                    <div className="inline-block bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium">
                      {patientComplete.blood_type}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Nivel de Discapacidad</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={basicInfo.discapacity_level || ''}
                        onChange={(e) => setBasicInfo(prev => ({ ...prev, discapacity_level: parseInt(e.target.value) || 0 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {patientComplete.discapacity_level ? `${patientComplete.discapacity_level}%` : '0%'}
                      </p>
                    )}
                  </div>
                </div>
              </div>


              {/* Timestamps */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Información del Registro
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Creado</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {formatDate(patientComplete.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Última Actualización</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {formatDate(patientComplete.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historial Médico Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide">
                    Historial Médico Detallado
                  </h4>
                  <p className="text-xs text-gray-600">
                    Última actualización: {formatDate(patientComplete.medical_history.last_updated)}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Alergias */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alergias Conocidas
                    </label>
                    <textarea
                      value={arrayToString(medicalHistory.allergies || [])}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, allergies: stringToArray(e.target.value) }))}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Separar con comas: polen, polvo, alimentos..."
                    />
                  </div>

                  {/* Cirugías Mayores */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cirugías Mayores
                    </label>
                    <textarea
                      value={arrayToString(medicalHistory.major_surgeries || [])}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, major_surgeries: stringToArray(e.target.value) }))}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Separar con comas: apendicetomía 2020, bypass 2018..."
                    />
                  </div>

                  {/* Medicamentos Actuales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicamentos Actuales
                    </label>
                    <textarea
                      value={arrayToString(medicalHistory.current_medications || [])}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, current_medications: stringToArray(e.target.value) }))}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Separar con comas: aspirina 100mg, metformina 500mg..."
                    />
                  </div>

                  {/* Condiciones Crónicas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condiciones Crónicas
                    </label>
                    <textarea
                      value={arrayToString(medicalHistory.chronic_conditions || [])}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, chronic_conditions: stringToArray(e.target.value) }))}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Separar con comas: diabetes tipo 2, hipertensión..."
                    />
                  </div>

                  {/* Historial Familiar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Historial Familiar
                    </label>
                    <textarea
                      value={medicalHistory.family_history || ''}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, family_history: e.target.value }))}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Antecedentes médicos familiares relevantes..."
                    />
                  </div>

                  {/* Notas Médicas Generales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Médicas Generales
                    </label>
                    <textarea
                      value={medicalHistory.medical_notes || ''}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, medical_notes: e.target.value }))}
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Información médica adicional relevante..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveMedicalHistory}
                      disabled={isLoading}
                      className="px-4 py-2 bg-hospital-blue text-white rounded-md hover:bg-hospital-blue/80 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Actualizar Historial Médico'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Análisis de Sangre Tab */}
          {activeTab === 'blood' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Análisis de Sangre</h4>
                <button
                  onClick={() => setShowBloodAnalysisForm(!showBloodAnalysisForm)}
                  className="bg-hospital-blue text-white px-4 py-2 rounded-md hover:bg-hospital-blue/80"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Nuevo Análisis
                </button>
              </div>

              {/* Formulario para nuevo análisis */}
              {showBloodAnalysisForm && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h5 className="font-medium mb-4">Agregar Nuevo Análisis de Sangre</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Glóbulos Rojos (millones/μL) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores normales:<br/>
                              Hombres: 4,5 – 5,9<br/>
                              Mujeres: 4,1 – 5,1
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            red_blood_cells: getNormalValue('red_blood_cells', patientComplete?.sex) 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBloodAnalysis?.red_blood_cells || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, red_blood_cells: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Hemoglobina (g/dL) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores normales:<br/>
                              Hombres: 13,5 – 17,5<br/>
                              Mujeres: 12 – 15,5
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            hemoglobin: getNormalValue('hemoglobin', patientComplete?.sex) 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newBloodAnalysis?.hemoglobin || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, hemoglobin: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Hematocrito (%) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores normales:<br/>
                              Hombres: 41 – 53%<br/>
                              Mujeres: 36 – 46%
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            hematocrit: getNormalValue('hematocrit', patientComplete?.sex) 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={newBloodAnalysis?.hematocrit || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, hematocrit: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Plaquetas (/μL) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores normales:<br/>
                              150.000 – 450.000 /μL
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            platelets: getNormalValue('platelets') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={newBloodAnalysis?.platelets || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, platelets: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Linfocitos (%) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores normales:<br/>
                              20 – 45% de leucocitos totales
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            lymphocytes: getNormalValue('lymphocytes') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={newBloodAnalysis?.lymphocytes || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, lymphocytes: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Glucosa (mg/dL) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores:<br/>
                              Normal: 70 – 99 mg/dL<br/>
                              Pre-diabetes: 100 – 125 mg/dL<br/>
                              Diabetes: ≥ 126 mg/dL
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            glucose: getNormalValue('glucose') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={newBloodAnalysis?.glucose || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, glucose: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Colesterol (mg/dL) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Valores:<br/>
                              Deseable: &lt; 200 mg/dL<br/>
                              Límite: 200 – 239 mg/dL<br/>
                              Alto: ≥ 240 mg/dL
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            cholesterol: getNormalValue('cholesterol') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={newBloodAnalysis?.cholesterol || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, cholesterol: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Urea (mg/dL) *
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Normal: 15 – 50 mg/dL<br/>
                              (depende de dieta y función renal)
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            urea: getNormalValue('urea') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={newBloodAnalysis?.urea || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, urea: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Cocaína (ng/mL)
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Normal: 0 ng/mL<br/>
                              Umbral positivo: ≥ 10–20 ng/mL<br/>
                              (para metabolitos benzoylecgonina)
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            cocaine: getNormalValue('cocaine') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBloodAnalysis?.cocaine || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, cocaine: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Alcohol (mg/dL)
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Normal: 0 mg/dL<br/>
                              Límite legal (España): 500 mg/dL<br/>
                              Potencialmente letal: 3000-4000 mg/dL
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            alcohol: getNormalValue('alcohol') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBloodAnalysis?.alcohol || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, alcohol: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            MDMA (ng/mL)
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Normal: 0 ng/mL<br/>
                              Positivo: ≥ 25–50 ng/mL
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            mdma: getNormalValue('mdma') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBloodAnalysis?.mdma || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, mdma: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Fentanilo (ng/mL)
                          </label>
                          <div className="group relative">
                            <div className="cursor-help">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg">
                              Normal: 0 ng/mL<br/>
                              Terapéutico: 0,6 – 3 ng/mL<br/>
                              Tóxico/letal: ≥ 10 ng/mL
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewBloodAnalysis(prev => ({ 
                            ...prev, 
                            fentanyl: getNormalValue('fentanyl') 
                          }))}
                          className="text-xs text-hospital-blue hover:text-hospital-blue/80"
                          title="Establecer valor normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBloodAnalysis?.fentanyl || ''}
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, fentanyl: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas Adicionales
                      </label>
                      <textarea
                        onChange={(e) => setNewBloodAnalysis(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Observaciones del análisis..."
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowBloodAnalysisForm(false)
                        setNewBloodAnalysis(null)
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddBloodAnalysis}
                      disabled={isLoading || !newBloodAnalysis?.red_blood_cells}
                      className="px-4 py-2 bg-hospital-blue text-white rounded-md hover:bg-hospital-blue/80 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Agregar Análisis'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de análisis existentes */}
              <div className="space-y-4">
                {patientComplete.medical_history.blood_analyses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay análisis de sangre registrados
                  </div>
                ) : (
                  patientComplete.medical_history.blood_analyses.map((analysis) => (
                    <div key={analysis.analysis_id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h6 className="font-medium text-gray-900">
                          Análisis #{analysis.analysis_id.slice(-8)}
                        </h6>
                        <span className="text-sm text-gray-500">
                          {formatDate(analysis.date_performed)}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {/* Parámetros hematológicos */}
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">Parámetros hematológicos</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="font-medium">Glóbulos Rojos</div>
                              <div className={`${
                                patientComplete.sex === 'male' 
                                  ? (analysis.red_blood_cells >= 4.5 && analysis.red_blood_cells <= 5.9 ? 'text-green-600' : 'text-red-600')
                                  : (analysis.red_blood_cells >= 4.1 && analysis.red_blood_cells <= 5.1 ? 'text-green-600' : 'text-red-600')
                              }`}>
                                {analysis.red_blood_cells} millones/μL
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: {patientComplete.sex === 'male' ? '4,5 – 5,9' : '4,1 – 5,1'}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Hemoglobina</div>
                              <div className={`${
                                patientComplete.sex === 'male'
                                  ? (analysis.hemoglobin >= 13.5 && analysis.hemoglobin <= 17.5 ? 'text-green-600' : 'text-red-600')
                                  : (analysis.hemoglobin >= 12 && analysis.hemoglobin <= 15.5 ? 'text-green-600' : 'text-red-600')
                              }`}>
                                {analysis.hemoglobin} g/dL
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: {patientComplete.sex === 'male' ? '13,5 – 17,5' : '12 – 15,5'}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Hematocrito</div>
                              <div className={`${
                                patientComplete.sex === 'male'
                                  ? (analysis.hematocrit >= 41 && analysis.hematocrit <= 53 ? 'text-green-600' : 'text-red-600')
                                  : (analysis.hematocrit >= 36 && analysis.hematocrit <= 46 ? 'text-green-600' : 'text-red-600')
                              }`}>
                                {analysis.hematocrit}%
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: {patientComplete.sex === 'male' ? '41 – 53' : '36 – 46'}%
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Plaquetas</div>
                              <div className={`${
                                analysis.platelets >= 150000 && analysis.platelets <= 450000 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.platelets}/μL
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: 150.000 – 450.000
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Linfocitos</div>
                              <div className={`${
                                analysis.lymphocytes >= 20 && analysis.lymphocytes <= 45 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.lymphocytes}%
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: 20 – 45%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bioquímica básica */}
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">Bioquímica básica</h6>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="font-medium">Glucosa</div>
                              <div className={`${
                                analysis.glucose < 100 ? 'text-green-600' 
                                : analysis.glucose <= 125 ? 'text-yellow-600'
                                : 'text-red-600'
                              }`}>
                                {analysis.glucose} mg/dL
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: 70 – 99
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Colesterol</div>
                              <div className={`${
                                analysis.cholesterol < 200 ? 'text-green-600'
                                : analysis.cholesterol <= 239 ? 'text-yellow-600'
                                : 'text-red-600'
                              }`}>
                                {analysis.cholesterol} mg/dL
                              </div>
                              <div className="text-xs text-gray-500">
                                Deseable: &lt; 200
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Urea</div>
                              <div className={`${
                                analysis.urea >= 15 && analysis.urea <= 50 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.urea} mg/dL
                              </div>
                              <div className="text-xs text-gray-500">
                                Normal: 15 – 50
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Drogas en sangre */}
                        {(analysis.cocaine > 0 || analysis.alcohol > 0 || analysis.mdma > 0 || analysis.fentanyl > 0) && (
                          <div>
                            <h6 className="font-medium text-gray-900 mb-2">Drogas en sangre</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {analysis.cocaine > 0 && (
                                <div>
                                  <div className="font-medium">Cocaína</div>
                                  <div className="text-red-600">
                                    {analysis.cocaine} ng/mL
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Positivo: ≥ 10–20 ng/mL
                                  </div>
                                </div>
                              )}
                              {analysis.alcohol > 0 && (
                                <div>
                                  <div className="font-medium">Alcohol</div>
                                  <div className={`${
                                    analysis.alcohol < 500 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {analysis.alcohol} mg/dL
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Límite legal: 500 mg/dL
                                  </div>
                                </div>
                              )}
                              {analysis.mdma > 0 && (
                                <div>
                                  <div className="font-medium">MDMA</div>
                                  <div className="text-red-600">
                                    {analysis.mdma} ng/mL
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Positivo: ≥ 25–50 ng/mL
                                  </div>
                                </div>
                              )}
                              {analysis.fentanyl > 0 && (
                                <div>
                                  <div className="font-medium">Fentanilo</div>
                                  <div className={`${
                                    analysis.fentanyl <= 3 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {analysis.fentanyl} ng/mL
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Terapéutico: 0,6 – 3 ng/mL
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        {analysis.performed_by_name && (
                          <div>
                            <span className="font-medium text-sm">Realizado por:</span>
                            <span className="text-sm text-gray-700 ml-2">
                              {analysis.performed_by_name} ({analysis.performed_by_dni})
                            </span>
                          </div>
                        )}
                        {analysis.notes && (
                          <div>
                            <span className="font-medium text-sm">Notas:</span>
                            <p className="text-sm text-gray-700 mt-1">{analysis.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Estudios Radiológicos Tab */}
          {activeTab === 'radiology' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Estudios Radiológicos</h4>
                <button
                  onClick={() => setShowRadiologyForm(!showRadiologyForm)}
                  className="bg-hospital-blue text-white px-4 py-2 rounded-md hover:bg-hospital-blue/80"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Nuevo Estudio
                </button>
              </div>

              {/* Formulario para nuevo estudio */}
              {showRadiologyForm && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h5 className="font-medium mb-4">Agregar Nuevo Estudio Radiológico</h5>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Estudio *
                        </label>
                        <input
                          type="text"
                          onChange={(e) => setNewRadiologyStudy(prev => ({ ...prev, study_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Ej: Rayos X, CT, MRI, Ecografía..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parte del Cuerpo *
                        </label>
                        <input
                          type="text"
                          onChange={(e) => setNewRadiologyStudy(prev => ({ ...prev, body_part: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Ej: Tórax, Abdomen, Pierna derecha..."
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hallazgos *
                      </label>
                      <textarea
                        onChange={(e) => setNewRadiologyStudy(prev => ({ ...prev, findings: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Descripción detallada de los hallazgos..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL de Imagen
                        </label>
                        <input
                          type="url"
                          onChange={(e) => setNewRadiologyStudy(prev => ({ ...prev, image_url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowRadiologyForm(false)
                        setNewRadiologyStudy(null)
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddRadiologyStudy}
                      disabled={isLoading || !newRadiologyStudy?.study_type}
                      className="px-4 py-2 bg-hospital-blue text-white rounded-md hover:bg-hospital-blue/80 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Agregar Estudio'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de estudios existentes */}
              <div className="space-y-4">
                {patientComplete.medical_history.radiology_studies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay estudios radiológicos registrados
                  </div>
                ) : (
                  patientComplete.medical_history.radiology_studies.map((study) => (
                    <div key={study.study_id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h6 className="font-medium text-gray-900">
                          {study.study_type} - {study.body_part}
                        </h6>
                        <span className="text-sm text-gray-500">
                          {formatDate(study.date_performed)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-sm">Hallazgos:</span>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{study.findings}</p>
                        </div>
                        {study.performed_by_name && (
                          <div>
                            <span className="font-medium text-sm">Realizado por:</span>
                            <span className="text-sm text-gray-700 ml-2">
                              {study.performed_by_name} ({study.performed_by_dni})
                            </span>
                          </div>
                        )}
                        {study.image_url && (
                          <div>
                            <span className="font-medium text-sm">Imagen:</span>
                            <a
                              href={study.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-hospital-blue hover:underline ml-2"
                            >
                              Ver imagen
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Exámenes Psicotécnicos Tab */}
          {activeTab === 'psycho' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Exámenes Psicotécnicos</h4>
                <button
                  onClick={() => setShowExamForm(!showExamForm)}
                  className="bg-hospital-blue text-white px-4 py-2 rounded-md hover:bg-hospital-blue/80"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Realizar Examen
                </button>
              </div>

              {/* Formulario para nuevo examen */}
              {showExamForm && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  {!selectedExam ? (
                    /* Selección de examen */
                    <div>
                      <h5 className="font-medium mb-4">Seleccionar Examen</h5>
                      {loadingExams ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hospital-blue"></div>
                        </div>
                      ) : availableExams.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No hay exámenes disponibles
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableExams.map((exam) => (
                            <div
                              key={exam.exam_id}
                              className="border border-gray-300 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => handleExamSelection(exam)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h6 className="font-medium text-gray-900">{exam.name}</h6>
                                  <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                                  <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <span className="mr-4">
                                      {exam.categories.length} categoría{exam.categories.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="mr-4">
                                      {exam.categories.reduce((total, cat) => total + cat.questions.length, 0)} pregunta{exam.categories.reduce((total, cat) => total + cat.questions.length, 0) !== 1 ? 's' : ''}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Máx. {exam.max_error_allowed} errores
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => setShowExamForm(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Formulario de examen */
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Realizando: {selectedExam.name}</h5>
                        <span className="text-sm text-gray-500">
                          Máximo {selectedExam.max_error_allowed} errores permitidos
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        {selectedExam.categories.map((category, categoryIndex) => (
                          <div key={category.category_id} className="border border-gray-200 rounded-lg p-4">
                            <h6 className="font-medium text-gray-900 mb-2">{category.name}</h6>
                            {category.description && (
                              <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                            )}
                            
                            <div className="space-y-4">
                              {category.questions.map((question, questionIndex) => {
                                const questionId = question.question_id // Use real question ID from backend
                                const answer = examAnswers.find(a => a.question_id === questionId)
                                
                                return (
                                  <div key={question.question_id} className="bg-white p-4 rounded border">
                                    <p className="font-medium text-gray-900 mb-3">
                                      {questionIndex + 1}. {question.question}
                                    </p>
                                    <div className="space-y-2">
                                      {question.options.map((option, optionIndex) => (
                                        <label
                                          key={optionIndex}
                                          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                                        >
                                          <input
                                            type="radio"
                                            name={questionId}
                                            value={option}
                                            checked={answer?.selected_option === option}
                                            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                                            className="mr-3 text-hospital-blue focus:ring-hospital-blue"
                                          />
                                          <span className="text-sm text-gray-700">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                        )}
                        
                        {/* Notas y observaciones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notas del Examinador
                            </label>
                            <textarea
                              value={examNotes}
                              onChange={(e) => setExamNotes(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Observaciones durante el examen..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Observaciones Adicionales
                            </label>
                            <textarea
                              value={examObservations}
                              onChange={(e) => setExamObservations(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Comportamiento del paciente, condiciones del examen..."
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          onClick={handleCancelExam}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSubmitExam}
                          disabled={isLoading || examAnswers.some(answer => !answer.selected_option.trim())}
                          className="px-4 py-2 bg-hospital-blue text-white rounded-md hover:bg-hospital-blue/80 disabled:opacity-50"
                        >
                          {isLoading ? 'Enviando...' : 'Enviar Examen'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de resultados de exámenes existentes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium text-gray-900">Historial de Exámenes</h5>
                  {patientExamHistory && patientExamHistory.exam_results.length > 0 && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Total: <span className="font-medium">{patientExamHistory.total_exams}</span>
                      </span>
                      <span className="text-green-600">
                        Aprobados: <span className="font-medium">{patientExamHistory.passed_exams}</span>
                      </span>
                      <span className="text-red-600">
                        Fallidos: <span className="font-medium">{patientExamHistory.failed_exams}</span>
                      </span>
                    </div>
                  )}
                </div>
                {loadingExamResults ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue"></div>
                  </div>
                ) : !patientExamHistory || patientExamHistory.exam_results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay exámenes psicotécnicos registrados
                  </div>
                ) : (
                  patientExamHistory.exam_results.map((result) => (
                    <div key={result.result_id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h6 className="font-medium text-gray-900">
                            {result.exam_name}
                          </h6>
                          <div className="flex items-center mt-1 text-sm space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              result.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.is_approved ? 'APROBADO' : 'NO APROBADO'}
                            </span>
                            <span className="text-gray-600">
                              Puntuación: {result.score_percentage.toFixed(1)}%
                            </span>
                            <span className="text-gray-600">
                              {result.correct_answers}/{result.total_questions} correctas
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(result.exam_date)}
                        </span>
                      </div>
                      
                      {result.notes && (
                        <div className="mb-2">
                          <span className="font-medium text-sm">Notas:</span>
                          <p className="text-sm text-gray-700 mt-1">{result.notes}</p>
                        </div>
                      )}
                      
                      {result.observations && (
                        <div className="mb-2">
                          <span className="font-medium text-sm">Observaciones:</span>
                          <p className="text-sm text-gray-700 mt-1">{result.observations}</p>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600 border-t border-gray-200 pt-2 mt-2">
                        <span className="font-medium">Evaluado por:</span>
                        <span className="ml-2">
                          {result.examiner_name} ({result.examiner_dni}) - {result.examiner_role}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Historial de Visitas Tab */}
          {activeTab === 'history' && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                Historial de Visitas
              </h4>
              
              {visitsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue"></div>
                </div>
              ) : visitsError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{visitsError}</p>
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay visitas registradas para este paciente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lugar
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Médico
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visits.map((visit) => (
                        <tr 
                          key={visit.visit_id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleVisitClick(visit.visit_id)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(visit.date_of_admission)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              visit.visit_status === 'admission' 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {visit.visit_status === 'admission' ? 'Ingresado/a' : 'Alta'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {visit.attention_place} {visit.attention_details ? `- ${visit.attention_details}` : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {visit.doctor_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                            <div className="whitespace-pre-wrap break-words">
                              {visit.reason || 'No especificado'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Visit Details Modal */}
      <VisitDetails
        visitId={selectedVisitId}
        isOpen={isVisitModalOpen}
        onClose={handleVisitModalClose}
        onVisitUpdate={handleVisitUpdate}
        onStudyAdded={handleStudyAdded}
        autoEditMode={isNewlyCreatedVisit}
      />

      {/* Create Visit Modal */}
      <CreateVisit
        patientDni={patient.dni}
        patientName={patient.name}
        isOpen={isCreateVisitModalOpen}
        onClose={handleCreateVisitClose}
        onVisitCreated={handleVisitCreated}
      />
    </div>
  )
} 