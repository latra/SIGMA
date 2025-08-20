'use client'

import { createVisit, type VisitBase } from '../../lib/api'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface CreateVisitProps {
  patientDni: string
  patientName: string
  isOpen: boolean
  onClose: () => void
  onVisitCreated?: (visitId: string) => void
}

const attentionPlaces = [
  { value: 'home', label: 'Casa', description: 'Atención médica realizada en la residencia particular del paciente' },
  { value: 'street', label: 'Calle', description: 'Atención en espacios abiertos como calles, parques, carreteras o plazas' },
  { value: 'headquarters', label: 'Sede', description: 'Atención dentro de una instalación fija, ya sea legal o ilegal' },
  { value: 'hospital', label: 'Hospital', description: 'Atención dentro de un centro médico oficial' },
  { value: 'traslad', label: 'Traslado', description: 'Atención durante el transporte del paciente, ya sea en ambulancia, helicóptero o vehículo no oficial' },
  { value: 'other', label: 'Otro', description: 'Atención en otro lugar no convencional' }
]

const headquartersTypes = [
  { value: 'comisaria', label: 'Comisaría' },
  { value: 'estacion', label: 'Estación' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'base_criminal', label: 'Base Criminal' },
  { value: 'taller_clandestino', label: 'Taller Clandestino' },
  { value: 'sede_organizacion', label: 'Sede de Organización' }
]

const patientStatuses = [
  { value: 'conscious', label: 'Consciente' },
  { value: 'unconscious', label: 'Inconsciente' },
  { value: 'in_danger', label: 'En Peligro' },
  { value: 'critical', label: 'Crítico' }
]

const triageLevels = [
  { value: 'unknown', label: 'Desconocido', color: 'bg-gray-100 text-gray-800' },
  { value: 'green', label: 'Verde', color: 'bg-green-100 text-green-800' },
  { value: 'yellow', label: 'Amarillo', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'red', label: 'Rojo', color: 'bg-red-100 text-red-800' },
  { value: 'black', label: 'Negro', color: 'bg-black text-white' }
]

export default function CreateVisit({ patientDni, patientName, isOpen, onClose, onVisitCreated }: CreateVisitProps) {
  const [formData, setFormData] = useState<VisitBase>({
    patient_dni: patientDni,
    reason: '',
    attention_place: 'street',
    attention_details: '',
    location: 'Ciudad Real',
    admission_status: 'conscious',
    admission_heart_rate: undefined,
    admission_blood_pressure: undefined,
    admission_temperature: undefined,
    admission_oxygen_saturation: undefined,
    triage: 'unknown'
  })
  const [headquartersType, setHeadquartersType] = useState<string>('comisaria')
  const [otherPlace, setOtherPlace] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : Number(value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.reason || !formData.location) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }
      
      // Validate other place if selected
      if (formData.attention_place === 'other' && !otherPlace.trim()) {
        throw new Error('Por favor especifica el lugar de atención')
      }

      // Prepare visit data with headquarters type if applicable
      const visitData = {
        ...formData,
        attention_details: formData.attention_place === 'headquarters' 
          ? headquartersTypes.find(type => type.value === headquartersType)?.label || ''
          : formData.attention_place === 'other'
          ? otherPlace
          : formData.attention_details
      }

      const createdVisit = await createVisit(visitData)
      
      // Reset form and close modal
      setFormData({
        patient_dni: patientDni,
        reason: '',
        attention_place: 'street',
        attention_details: '',
        location: '',
        admission_status: 'conscious',
        admission_heart_rate: undefined,
        admission_blood_pressure: undefined,
        admission_temperature: undefined,
        admission_oxygen_saturation: undefined,
        triage: 'unknown'
      })
      setHeadquartersType('comisaria')
      setOtherPlace('')
      
              onVisitCreated?.(createdVisit.visit_id)
      onClose()
    } catch (err: any) {
      console.error('Error creating visit:', err)
      setError(err.message || 'Error al crear la visita')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      ></div>

      {/* Modal panel */}
      <div className="relative bg-white shadow-sm rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-hospital-blue text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Formulario de Ingreso</h3>
              <p className="text-gray-300 text-sm mt-1">{patientName} - {patientDni}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-300 hover:text-white p-2 rounded-md transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Información Básica */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                Información de la Visita
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Motivo de Atención *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={6}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm resize-none"
                    placeholder="Describa el motivo de la atención..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lugar donde se ha atendido *
                  </label>
                  <div className="relative">
                    <select
                      name="attention_place"
                      value={formData.attention_place}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                    >
                      {attentionPlaces.map(type => (
                        <option key={type.value} value={type.value} title={type.description}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown with tooltips for better UX */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* Tooltip info */}
                  <div className="mt-1 text-xs text-gray-500">
                    {attentionPlaces.find(place => place.value === formData.attention_place)?.description}
                  </div>
                  
                  {/* Headquarters type selector */}
                  {formData.attention_place === 'headquarters' && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo de Sede *
                      </label>
                      <select
                        value={headquartersType}
                        onChange={(e) => setHeadquartersType(e.target.value)}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                      >
                        {headquartersTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Other place input */}
                  {formData.attention_place === 'other' && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Especificar Lugar *
                      </label>
                      <input
                        type="text"
                        value={otherPlace}
                        onChange={(e) => setOtherPlace(e.target.value)}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                        placeholder="Describa el lugar de atención..."
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || 'Ciudad Real'}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                    placeholder="Ubicación de la atención..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estado del Paciente
                  </label>
                  <select
                    name="admission_status"
                    value={formData.admission_status}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                  >
                    {patientStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Signos Vitales */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                Signos Vitales
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Frecuencia Cardíaca
                  </label>
                  <input
                    type="number"
                    name="admission_heart_rate"
                    value={formData.admission_heart_rate || ''}
                    onChange={handleNumberInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                    placeholder="BPM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Presión Arterial
                  </label>
                  <input
                    type="text"
                    name="admission_blood_pressure"
                    value={formData.admission_blood_pressure || ''}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                    placeholder="mmHg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Temperatura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="admission_temperature"
                    value={formData.admission_temperature || ''}
                    onChange={handleNumberInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                    placeholder="°C"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Saturación O2
                  </label>
                  <input
                    type="number"
                    name="admission_oxygen_saturation"
                    value={formData.admission_oxygen_saturation || ''}
                    onChange={handleNumberInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] text-sm"
                    placeholder="%"
                  />
                </div>
              </div>
            </div>

            {/* Triage */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
                Clasificación de Triage
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {triageLevels.map(triage => (
                  <button
                    key={triage.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, triage: triage.value as any }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.triage === triage.value
                        ? triage.color
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {triage.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {isLoading ? 'Registrando Ingreso...' : 'Ingresar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 