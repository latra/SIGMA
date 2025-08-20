'use client'

import { getVisitComplete, updateVisit, dischargeVisit, addBloodAnalysisToVisit, addRadiologyStudyToVisit, type VisitComplete, type BloodAnalysisCreate, type RadiologyStudyCreate, type Gender } from '../../lib/api'
import { XMarkIcon, PencilIcon, CheckIcon, XCircleIcon, ClockIcon, UserIcon, HeartIcon, ChartBarIcon, ArrowRightIcon, BeakerIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

interface VisitDetailsProps {
  visitId: string | null
  isOpen: boolean
  onClose: () => void
  onVisitUpdate?: (updatedVisit: VisitComplete) => void
  onStudyAdded?: () => void
  autoEditMode?: boolean
}

type TabType = 'admission' | 'medical' | 'studies' | 'evolution' | 'discharge'

const attentionPlaces = [
  { value: 'street', label: 'Calle' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'traslad', label: 'Traslado' },
  { value: 'other', label: 'Otro' },
  { value: 'headquarters', label: 'Sede' },
  { value: 'home', label: 'Casa' }
]

export default function VisitDetails({ visitId, isOpen, onClose, onVisitUpdate, onStudyAdded, autoEditMode }: VisitDetailsProps) {
  const [visit, setVisit] = useState<VisitComplete | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDischarging, setIsDischarging] = useState(false)
  const [editedVisit, setEditedVisit] = useState<VisitComplete | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('admission')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBloodAnalysisForm, setShowBloodAnalysisForm] = useState(false)
  const [showRadiologyForm, setShowRadiologyForm] = useState(false)
  const [newBloodAnalysis, setNewBloodAnalysis] = useState<BloodAnalysisCreate | null>(null)
  const [newRadiologyStudy, setNewRadiologyStudy] = useState<RadiologyStudyCreate | null>(null)

  const fetchVisitDetails = async () => {
    if (!visitId) return
    
    setLoading(true)
    setError(null)
    try {
      const visitData = await getVisitComplete(visitId)
      setVisit(visitData)
      setEditedVisit(visitData)
    } catch (error) {
      console.error('Error fetching visit details:', error)
      setError('Error al cargar los detalles de la visita')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && visitId) {
      fetchVisitDetails()
    }
  }, [isOpen, visitId])

  // Auto-edit mode for newly created visits
  useEffect(() => {
    if (autoEditMode && visit && !isEditing) {
      setIsEditing(true)
      setActiveTab('medical')
    }
  }, [autoEditMode, visit, isEditing])

  // Reset active tab when visit status changes
  useEffect(() => {
    const currentVisit = editedVisit || visit
    if (currentVisit && currentVisit.visit_status === 'admission' && activeTab === 'discharge') {
      setActiveTab('evolution')
    }
  }, [editedVisit, visit, activeTab])

  if (!isOpen || !visitId) return null

  const formatVisitStatus = (status: string) => {
    switch (status) {
      case 'admission': return 'Ingreso'
      case 'discharge': return 'Alta'
      case 'pending': return 'Pendiente'
      default: return status
    }
  }

  const formatAttentionType = (type: string) => {
    switch (type) {
      case 'street': return 'Calle'
      case 'hospital': return 'Hospital'
      case 'traslad': return 'Traslado'
      default: return type
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No registrada'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    setEditedVisit(visit ? { ...visit } : null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedVisit(visit ? { ...visit } : null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editedVisit || !visitId) return

    setIsLoading(true)
    try {
      await updateVisit(visitId, editedVisit)
      // Fetch complete visit details after update
      const completeVisit = await getVisitComplete(visitId)
      setVisit(completeVisit)
      setEditedVisit(completeVisit)
      onVisitUpdate?.(completeVisit)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating visit:', error)
      alert('Error al actualizar la visita')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDischarge = async () => {
    if (!visitId) return

    setIsDischarging(true)
    try {
      await dischargeVisit(visitId)
      // Refresh visit details to get updated status
      await fetchVisitDetails()
      if (visit) {
        onVisitUpdate?.({ ...visit, visit_status: 'discharge' })
      }
      alert('Paciente dado de alta exitosamente')
    } catch (error) {
      console.error('Error discharging patient:', error)
      alert('Error al dar de alta al paciente')
    } finally {
      setIsDischarging(false)
    }
  }

  const handleAddBloodAnalysis = async () => {
    if (!visitId || !newBloodAnalysis) return

    setIsLoading(true)
    try {
      await addBloodAnalysisToVisit(visitId, newBloodAnalysis)
      setShowBloodAnalysisForm(false)
      setNewBloodAnalysis(null)
      alert('Análisis de sangre agregado correctamente')
      // Refresh visit details to show the new analysis
      await fetchVisitDetails()
      // Notify parent component that a study was added
      onStudyAdded?.()
    } catch (error) {
      console.error('Error adding blood analysis:', error)
      alert('Error al agregar el análisis de sangre')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRadiologyStudy = async () => {
    if (!visitId || !newRadiologyStudy) return

    setIsLoading(true)
    try {
      await addRadiologyStudyToVisit(visitId, newRadiologyStudy)
      setShowRadiologyForm(false)
      setNewRadiologyStudy(null)
      alert('Estudio radiológico agregado correctamente')
      // Refresh visit details to show the new study
      await fetchVisitDetails()
      // Notify parent component that a study was added
      onStudyAdded?.()
    } catch (error) {
      console.error('Error adding radiology study:', error)
      alert('Error al agregar el estudio radiológico')
    } finally {
      setIsLoading(false)
    }
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

  const currentVisit = editedVisit || visit

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative bg-white rounded-lg p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentVisit) return null

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
              <h3 className="text-lg font-semibold">Gestión de Visita</h3>
              <p className="text-gray-300 text-sm mt-1">ID: {currentVisit.visit_id} - {formatVisitStatus(currentVisit.visit_status)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && currentVisit.visit_status === 'admission' && (
                <button
                  onClick={handleDischarge}
                  disabled={isDischarging}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  title="Dar de alta al paciente"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                  {isDischarging ? 'Dando de alta...' : 'Dar de Alta'}
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-md transition-colors"
                  title="Editar visita"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
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
          <div className="flex">
            <button
              onClick={() => setActiveTab('admission')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'admission'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Ingreso
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'medical'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartIcon className="h-4 w-4 inline mr-2" />
              Evaluación Médica
            </button>
            <button
              onClick={() => setActiveTab('studies')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'studies'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BeakerIcon className="h-4 w-4 inline mr-2" />
              Estudios
            </button>
            <button
              onClick={() => setActiveTab('evolution')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'evolution'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 inline mr-2" />
              Evolución
            </button>
            {currentVisit.visit_status === 'discharge' && (
              <button
                onClick={() => setActiveTab('discharge')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'discharge'
                    ? 'border-hospital-blue text-hospital-blue'
                    : 'border-transparent text-gray-900 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockIcon className="h-4 w-4 inline mr-2" />
                Alta
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'admission' && (
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Información Básica
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.reason}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, reason: e.target.value } : null)}
                        rows={2}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {currentVisit.reason}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lugar de la atención</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {attentionPlaces.find(place => place.value === currentVisit.attention_place)?.label || 'No registrado'} {currentVisit.attention_details ? `- ${currentVisit.attention_details}` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentVisit.location}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, location: e.target.value } : null)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {currentVisit.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {formatDate(currentVisit.date_of_admission)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signos Vitales */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Signos Vitales al Ingreso
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Frecuencia Cardíaca</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={currentVisit.admission_heart_rate || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, admission_heart_rate: e.target.value ? parseInt(e.target.value) : null } : null)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                        placeholder="BPM"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {currentVisit.admission_heart_rate ? `${currentVisit.admission_heart_rate} BPM` : 'No registrado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Presión Arterial</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentVisit.admission_blood_pressure || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, admission_blood_pressure: e.target.value ? e.target.value : null } : null)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                        placeholder="mmHg"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {currentVisit.admission_blood_pressure ? `${currentVisit.admission_blood_pressure} mmHg` : 'No registrado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Temperatura</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={currentVisit.admission_temperature || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, admission_temperature: e.target.value ? parseFloat(e.target.value) : null } : null)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                        placeholder="°C"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {currentVisit.admission_temperature ? `${currentVisit.admission_temperature}°C` : 'No registrado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Saturación O2</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={currentVisit.admission_oxygen_saturation || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, admission_oxygen_saturation: e.target.value ? parseInt(e.target.value) : null } : null)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                        placeholder="%"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                        {currentVisit.admission_oxygen_saturation ? `${currentVisit.admission_oxygen_saturation}%` : 'No registrado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-6">
              
              {/* Exámenes */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Pruebas Realizadas
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pruebas</label>
                  {isEditing ? (
                    <textarea
                      value={currentVisit.tests || ''}
                      onChange={(e) => setEditedVisit(prev => prev ? { ...prev, tests: e.target.value } : null)}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                      placeholder="Ingrese los exámenes solicitados..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                      {currentVisit.tests || 'No especificado'}
                    </p>
                  )}
                </div>
              </div>
              {/* Diagnóstico */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Diagnóstico y Tratamiento
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Diagnóstico</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.diagnosis || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, diagnosis: e.target.value } : null)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese el diagnóstico..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                        {currentVisit.diagnosis || 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tratamiento</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.treatment || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, treatment: e.target.value } : null)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese el tratamiento..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                        {currentVisit.treatment || 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medicación</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.medication || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, medication: e.target.value } : null)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese la medicación..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                        {currentVisit.medication || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'studies' && (
            <div className="space-y-6">
              {/* Análisis de Sangre */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide">
                    Análisis de Sangre
                  </h4>
                  <button
                    onClick={() => setShowBloodAnalysisForm(!showBloodAnalysisForm)}
                    className="bg-hospital-blue text-white px-4 py-2 rounded-md hover:bg-hospital-blue/80 flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nuevo Análisis
                  </button>
                </div>

                {showBloodAnalysisForm && (
                  <div className="bg-white rounded-lg p-4 border border-gray-300 mb-4">
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
                              red_blood_cells: getNormalValue('red_blood_cells', 'male') 
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
                              hemoglobin: getNormalValue('hemoglobin', 'male') 
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
                              hematocrit: getNormalValue('hematocrit', 'male') 
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
              </div>

              {/* Estudios Radiológicos */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide">
                    Estudios Radiológicos
                  </h4>
                  <button
                    onClick={() => setShowRadiologyForm(!showRadiologyForm)}
                    className="bg-hospital-blue text-white px-4 py-2 rounded-md hover:bg-hospital-blue/80 flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nuevo Estudio
                  </button>
                </div>

                {showRadiologyForm && (
                  <div className="bg-white rounded-lg p-4 border border-gray-300 mb-4">
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
              </div>

              {/* Estudios Existentes Asociados a la Visita */}
              {currentVisit.blood_analyses && currentVisit.blood_analyses.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                    Análisis de Sangre de esta Visita
                  </h4>
                  <div className="space-y-4">
                    {currentVisit.blood_analyses.map((analysis) => (
                      <div key={analysis.analysis_id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h6 className="font-medium text-gray-900">
                            Análisis #{analysis.analysis_id.slice(-8)}
                          </h6>
                          <span className="text-sm text-gray-500">
                            {formatDate(analysis.date_performed)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="font-medium">Glóbulos Rojos</div>
                            <div>{analysis.red_blood_cells} millones/μL</div>
                          </div>
                          <div>
                            <div className="font-medium">Hemoglobina</div>
                            <div>{analysis.hemoglobin} g/dL</div>
                          </div>
                          <div>
                            <div className="font-medium">Hematocrito</div>
                            <div>{analysis.hematocrit}%</div>
                          </div>
                          <div>
                            <div className="font-medium">Plaquetas</div>
                            <div>{analysis.platelets}/μL</div>
                          </div>
                          <div>
                            <div className="font-medium">Linfocitos</div>
                            <div>{analysis.lymphocytes}%</div>
                          </div>
                          <div>
                            <div className="font-medium">Glucosa</div>
                            <div>{analysis.glucose} mg/dL</div>
                          </div>
                          <div>
                            <div className="font-medium">Colesterol</div>
                            <div>{analysis.cholesterol} mg/dL</div>
                          </div>
                          <div>
                            <div className="font-medium">Urea</div>
                            <div>{analysis.urea} mg/dL</div>
                          </div>
                          {(analysis.cocaine > 0 || analysis.alcohol > 0 || analysis.mdma > 0 || analysis.fentanyl > 0) && (
                            <>
                              {analysis.cocaine > 0 && (
                                <div>
                                  <div className="font-medium">Cocaína</div>
                                  <div className="text-red-600">{analysis.cocaine} ng/mL</div>
                                </div>
                              )}
                              {analysis.alcohol > 0 && (
                                <div>
                                  <div className="font-medium">Alcohol</div>
                                  <div className="text-red-600">{analysis.alcohol} mg/dL</div>
                                </div>
                              )}
                              {analysis.mdma > 0 && (
                                <div>
                                  <div className="font-medium">MDMA</div>
                                  <div className="text-red-600">{analysis.mdma} ng/mL</div>
                                </div>
                              )}
                              {analysis.fentanyl > 0 && (
                                <div>
                                  <div className="font-medium">Fentanilo</div>
                                  <div className="text-red-600">{analysis.fentanyl} ng/mL</div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {(analysis.performed_by_name || analysis.notes) && (
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentVisit.radiology_studies && currentVisit.radiology_studies.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                    Estudios Radiológicos de esta Visita
                  </h4>
                  <div className="space-y-4">
                    {currentVisit.radiology_studies.map((study) => (
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
                          {(study.performed_by_name || study.image_url) && (
                            <div className="space-y-2">
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evolution' && (
            <div className="space-y-6">
              {/* Evolución */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Evolución del Paciente
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Evolución</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.evolution || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, evolution: e.target.value } : null)}
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Describa la evolución del paciente..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[80px] whitespace-pre-wrap">
                        {currentVisit.evolution || 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones Adicionales</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.additional_observations || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, additional_observations: e.target.value } : null)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese observaciones adicionales..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                        {currentVisit.additional_observations || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discharge' && (
            <div className="space-y-6">
              {/* Alta */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                  Información de Alta
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Alta</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300">
                      {formatDate(currentVisit.date_of_discharge)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Recomendaciones</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.recommendations || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, recommendations: e.target.value } : null)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese las recomendaciones..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                        {currentVisit.recommendations || 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Seguimiento Especialista</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.specialist_follow_up || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, specialist_follow_up: e.target.value } : null)}
                        rows={2}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese el seguimiento con especialista..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[40px] whitespace-pre-wrap">
                        {currentVisit.specialist_follow_up || 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                    {isEditing ? (
                      <textarea
                        value={currentVisit.notes || ''}
                        onChange={(e) => setEditedVisit(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                        placeholder="Ingrese notas adicionales..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-300 min-h-[60px] whitespace-pre-wrap">
                        {currentVisit.notes || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t border-gray-200">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb] disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb] transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 