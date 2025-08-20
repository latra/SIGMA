'use client'

import { useState } from 'react'
import { createPatient, PatientCreate, BloodType, Gender } from '../../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface RegisterPatientProps {
  isOpen: boolean
  onClose: () => void
  onPatientCreated: () => void
}

const bloodTypes = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
]

const genders = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' }
]

export default function RegisterPatient({ isOpen, onClose, onPatientCreated }: RegisterPatientProps) {
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    // Datos básicos
    name: '',
    dni: '',
    age: '',
    sex: '',
    phone: '',
    blood_type: '',
    allergies: '',
    medical_notes: '',
    major_surgeries: '',
    current_medications: '',
    chronic_conditions: '',
    family_history: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const stringToArray = (str: string): string[] => {
    if (!str.trim()) return []
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is authenticated
    if (!user) {
      setError('Debe iniciar sesión para registrar pacientes.')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.dni || !formData.age || !formData.sex || !formData.blood_type) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      const patientData: PatientCreate = {
        name: formData.name,
        dni: formData.dni,
        age: parseInt(formData.age),
        sex: formData.sex as Gender,
        blood_type: formData.blood_type as BloodType,
        phone: formData.phone || undefined,
        allergies: stringToArray(formData.allergies),
        medical_notes: formData.medical_notes || undefined,
        major_surgeries: stringToArray(formData.major_surgeries),
        current_medications: stringToArray(formData.current_medications),
        chronic_conditions: stringToArray(formData.chronic_conditions),
        family_history: formData.family_history || undefined
      }

      await createPatient(patientData)
      
      // Reset form and close modal
      setFormData({
        name: '',
        dni: '',
        age: '',
        sex: '',
        phone: '',
        blood_type: '',
        allergies: '',
        medical_notes: '',
        major_surgeries: '',
        current_medications: '',
        chronic_conditions: '',
        family_history: ''
      })
      
      onPatientCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el paciente')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // Show loading if auth is still being resolved
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
            <p className="text-gray-600 mb-4">Debe iniciar sesión para registrar pacientes.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Registrar Nuevo Paciente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Datos Básicos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos Básicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nombre - Obligatorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DNI - Obligatorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Edad - Obligatorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sexo - Obligatorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo <span className="text-red-500">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar sexo</option>
                  {genders.map(gender => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teléfono - Opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipo de Sangre - Obligatorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Sangre <span className="text-red-500">*</span>
                </label>
                <select
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tipo de sangre</option>
                  {bloodTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Historial Médico */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial Médico</h3>
            <div className="space-y-4">
              {/* Alergias Generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alergias Conocidas
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Separar con comas: polen, polvo, alimentos..."
                />
              </div>

              {/* Cirugías Mayores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cirugías Mayores
                </label>
                <textarea
                  name="major_surgeries"
                  value={formData.major_surgeries}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Separar con comas: apendicetomía 2020, bypass 2018..."
                />
              </div>

              {/* Medicamentos Actuales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamentos Actuales
                </label>
                <textarea
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Separar con comas: aspirina 100mg, metformina 500mg..."
                />
              </div>

              {/* Condiciones Crónicas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condiciones Crónicas
                </label>
                <textarea
                  name="chronic_conditions"
                  value={formData.chronic_conditions}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Separar con comas: diabetes tipo 2, hipertensión..."
                />
              </div>

              {/* Historial Familiar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Historial Familiar
                </label>
                <textarea
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Antecedentes médicos familiares relevantes..."
                />
              </div>

              {/* Notas Médicas Generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Médicas Generales
                </label>
                <textarea
                  name="medical_notes"
                  value={formData.medical_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Información médica adicional relevante..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Registrando...' : 'Registrar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}