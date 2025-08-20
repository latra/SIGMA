'use client'

import { useState, useEffect } from 'react'
import { getAdmittedPatients, type PatientAdmitted } from '../../lib/api'
import Navbar from "../components/navbar"
import DoctorRoute from "../components/DoctorRoute"
import VisitDetails from "../components/visit-details"
import { EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Admissions() {
  const [admittedPatients, setAdmittedPatients] = useState<PatientAdmitted[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)
  const [showVisitDetails, setShowVisitDetails] = useState(false)

  const fetchAdmittedPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const patients = await getAdmittedPatients()
      setAdmittedPatients(patients)
    } catch (err) {
      console.error('Error fetching admitted patients:', err)
      setError('Error al cargar los pacientes en admisión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmittedPatients()
  }, [])

  const handleVisitClick = (visitId: string) => {
    setSelectedVisitId(visitId)
    setShowVisitDetails(true)
  }

  const handleVisitUpdate = (updatedVisit: any) => {
    // Refresh the list when a visit is updated
    fetchAdmittedPatients()
  }

  const formatTriage = (triage: string) => {
    const triageConfig = {
      unknown: { label: 'Sin clasificar', color: 'bg-gray-100 text-gray-800' },
      green: { label: 'Verde', color: 'bg-green-100 text-green-800' },
      yellow: { label: 'Amarillo', color: 'bg-yellow-100 text-yellow-800' },
      red: { label: 'Rojo', color: 'bg-red-100 text-red-800' },
      black: { label: 'Negro', color: 'bg-black text-white' }
    }
    
    const config = triageConfig[triage as keyof typeof triageConfig] || triageConfig.unknown
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatAttentionType = (type: string) => {
    switch (type) {
      case 'street': return 'Calle'
      case 'hospital': return 'Hospital'
      case 'traslad': return 'Traslado'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DoctorRoute>
      {loading ? (
        <>
          <Navbar />
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue"></div>
            <p className="mt-4 text-gray-600">Cargando admisiones...</p>
          </div>
        </>
      ) : error ? (
        <>
          <Navbar />
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={fetchAdmittedPatients}
                className="mt-4 bg-hospital-blue hover:bg-hospital-blue/80 text-white font-medium py-2 px-4 rounded-md"
              >
                Reintentar
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <Navbar />
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admisiones</h1>
                <p className="mt-2 text-gray-600">
                  Pacientes actualmente en admisión ({admittedPatients.length})
                </p>
              </div>

              {/* Table */}
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {admittedPatients.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay admisiones activas</h3>
                    <p className="text-gray-500">No hay pacientes actualmente en admisión.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Triaje
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paciente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Médico Asignado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lugar de la atención
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {admittedPatients.map((patient) => (
                          <tr 
                            key={patient.visit_id}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleVisitClick(patient.visit_id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatTriage(patient.triage)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {patient.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  DNI: {patient.dni}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {patient.doctor_name} | {patient.doctor_dni}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatAttentionType(patient.attention_place)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={patient.reason}>
                                {patient.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleVisitClick(patient.visit_id)
                                }}
                                className="text-hospital-blue hover:text-hospital-blue/80 flex items-center gap-1"
                              >
                                <EyeIcon className="h-4 w-4" />
                                Ver detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visit Details Modal */}
          <VisitDetails
            visitId={selectedVisitId}
            isOpen={showVisitDetails}
            onClose={() => {
              setShowVisitDetails(false)
              setSelectedVisitId(null)
            }}
            onVisitUpdate={handleVisitUpdate}
          />
        </>
      )}
    </DoctorRoute>
  )
}