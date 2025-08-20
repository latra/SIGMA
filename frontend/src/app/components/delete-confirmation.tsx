'use client'

import { useState } from 'react'
import { PatientSummary } from '../../lib/api'

interface DeleteConfirmationProps {
  patient: PatientSummary | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (patient: PatientSummary) => Promise<void>
}

export default function DeleteConfirmation({ patient, isOpen, onClose, onConfirm }: DeleteConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!patient) return
    
    setIsLoading(true)
    setError('')
    
    try {
      await onConfirm(patient)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el paciente')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !patient) return null

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Confirmar eliminación
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-4">
            ¿Está seguro de que desea eliminar al paciente <strong>{patient.name}</strong> (DNI: {patient.dni})?
          </p>
          <p className="text-sm text-red-600">
            Esta acción no se puede deshacer. Se eliminarán todos los datos del paciente de forma permanente.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar Paciente'}
          </button>
        </div>
      </div>
    </div>
  )
} 