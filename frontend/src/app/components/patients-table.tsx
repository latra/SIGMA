'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { getPatients, PatientSummary } from '../../lib/api'
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

interface PatientsTableProps {
  onPatientDetails: (patient: PatientSummary) => void
  refreshTrigger?: number
  onPatientDelete: (patient: PatientSummary) => void
}

export default function PatientsTable({ onPatientDetails, refreshTrigger, onPatientDelete }: PatientsTableProps) {
  const { user, doctor, police, loading: authLoading } = useAuth()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const patientsPerPage = 20

  const fetchPatients = useCallback(async () => {
    // Don't fetch if still loading auth or if no user
    if (authLoading || !user) {
      return
    }

    try {
      setLoading(true)
      const data = await getPatients()
      setPatients(data)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching patients:', err)
      
      // Handle specific authentication errors
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Error de autenticación. Por favor, inicie sesión nuevamente.')
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setError('No tiene permisos para acceder a esta información.')
      } else if (err.message?.includes('500') || err.message?.includes('Internal Server Error')) {
        setError('Error del servidor. Por favor, intente más tarde.')
      } else {
        setError('Error al cargar los pacientes. Verifique su conexión.')
      }
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  // Fetch patients when auth is ready and user is available
  useEffect(() => {
    if (!authLoading && user) {
      fetchPatients()
    }
  }, [fetchPatients, authLoading, user])

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && !authLoading && user) {
      fetchPatients()
    }
  }, [refreshTrigger, fetchPatients, authLoading, user])

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients
    
    const term = searchTerm.toLowerCase()
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.dni.toLowerCase().includes(term) ||
      patient.blood_type.toLowerCase().includes(term)
    )
  }, [patients, searchTerm])

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)
  const startIndex = (currentPage - 1) * patientsPerPage
  const endIndex = startIndex + patientsPerPage
  const currentPatients = filteredPatients.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin visitas'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatSex = (sex: string) => {
    return sex === 'male' ? 'M' : 'F'
  }

  const formatAllergies = (allergies: string[]) => {
    if (allergies.length === 0) return 'Ninguna'
    if (allergies.length === 1) return allergies[0]
    return `${allergies[0]} +${allergies.length - 1}`
  }

  // Show loading while auth is being resolved
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue"></div>
      </div>
    )
  }

  // Show error if no user (not authenticated)
  if (!user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Debe iniciar sesión para ver los pacientes.
            </h3>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {error}
            </h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Search and filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o tipo de sangre..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            Total: <span className="font-medium ml-1">{filteredPatients.length}</span> pacientes
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Edad/Sexo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo Sangre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alergias Críticas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Visita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentPatients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron pacientes con los criterios de búsqueda' : 'No hay pacientes registrados'}
                </td>
              </tr>
            ) : (
              currentPatients.map((patient) => (
                <tr key={patient.dni} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.dni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.age} años • {formatSex(patient.sex)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {patient.blood_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(patient.last_visit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          console.log('Button clicked for patient:', patient.name)
                          onPatientDetails(patient)
                        }}
                        className="text-hospital-blue hover:text-hospital-blue/80 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb]"
                      >
                        Ver detalles
                      </button>
                      {doctor?.is_admin && (
                        <button
                          onClick={() => onPatientDelete(patient)}
                          className="text-red-600 hover:text-red-800 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb]"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb]"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{startIndex + 1}</span>
                {' '}a{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredPatients.length)}
                </span>
                {' '}de{' '}
                <span className="font-medium">{filteredPatients.length}</span>
                {' '}resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb]"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-hospital-blue border-hospital-blue text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb]`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb]"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 