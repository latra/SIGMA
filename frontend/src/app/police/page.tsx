'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '../components/navbar'
import { getExams, getCertificate, type Exam, type CertificateInfo } from '../../lib/api'
import { MagnifyingGlassIcon, DocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function PoliceVerificationPage() {
  const { user, systemUser, police } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Form state
  const [dni, setDni] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  
  // Results state
  const [searchResults, setSearchResults] = useState<CertificateInfo | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Check if user is police
  const isPolice = systemUser?.role === 'police' || police
  const themeColor = '#810000' // Police red

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const examsData = await getExams()
      // Only show enabled exams
      setExams(examsData.filter(exam => exam.enabled))
    } catch (err) {
      console.error('Error fetching exams:', err)
      setError('Error al cargar los exámenes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Don't do anything if still loading auth state
    if (!user) return

    // Redirect if not police
    if (!isPolice) {
      router.push('/?error=access-denied')
      return
    }

    // Fetch exams if user is police
    fetchExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPolice, fetchExams])

  const handleSearch = async () => {
    if (!dni.trim() || !selectedExamId) {
      setSearchError('Por favor ingresa un DNI válido y selecciona un tipo de examen')
      return
    }

    setSearchLoading(true)
    setSearchError(null)
    setSearchResults(null)
    setHasSearched(true)

    try {
      const certificateInfo = await getCertificate(selectedExamId, dni.trim())
      setSearchResults(certificateInfo)
    } catch (err) {
      console.error('Error searching certificate:', err)
      if (err instanceof Error && err.message.includes('404')) {
        setSearchError('No se encontraron registros para este DNI o el ciudadano no tiene este certificado')
      } else {
        setSearchError('Error al buscar el certificado')
      }
    } finally {
      setSearchLoading(false)
    }
  }

  const resetSearch = () => {
    setDni('')
    setSelectedExamId('')
    setSearchResults(null)
    setHasSearched(false)
    setSearchError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading while checking authentication
  if (loading && !user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: themeColor }}></div>
        </div>
      </>
    )
  }

  // Redirect or show access denied if not police
  if (!isPolice) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-sm rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-gray-600 mb-4">
              Esta sección está disponible únicamente para personal policial autorizado.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full text-white px-4 py-2 rounded-md hover:opacity-80 transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <DocumentCheckIcon className="h-8 w-8" style={{ color: themeColor }} />
              </div>
              <div className="ml-3">
                <h1 className="text-3xl font-bold text-gray-900">Verificación de Certificados</h1>
                <p className="mt-1 text-gray-600">
                  Consulta si un ciudadano posee un certificado de examen válido
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Search Form */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Datos de Búsqueda</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* DNI Input */}
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                  DNI del Ciudadano
                </label>
                <input
                  type="text"
                  id="dni"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ingrese DNI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--focus-ring-color': themeColor } as React.CSSProperties}
                />
              </div>

              {/* Exam Type Select */}
              <div>
                <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Examen
                </label>
                <select
                  id="examType"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--focus-ring-color': themeColor } as React.CSSProperties}
                >
                  <option value="">Selecciona un tipo de examen</option>
                  {exams.map((exam) => (
                    <option key={exam.exam_id} value={exam.exam_id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-800">{searchError}</div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSearch}
                disabled={searchLoading || !dni.trim() || !selectedExamId}
                className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: themeColor }}
              >
                {searchLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                )}
                {searchLoading ? 'Buscando...' : 'Verificar Certificado'}
              </button>

              {hasSearched && (
                <button
                  onClick={resetSearch}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Nueva Búsqueda
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {hasSearched && !searchLoading && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Resultado de la Verificación</h2>
              
              {searchResults && searchResults.exam_pass ? (
                /* Certificate Found and Passed */
                <div className="border border-green-200 bg-green-50 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <DocumentCheckIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        ✓ Certificado Válido Encontrado
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Información del Ciudadano</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Nombre:</span> {searchResults.citizen_name}</p>
                            <p><span className="font-medium">DNI:</span> {searchResults.citizen_dni}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Información del Examen</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Tipo:</span> {exams.find(e => e.exam_id === selectedExamId)?.name}</p>
                            <p><span className="font-medium">Resultado:</span> 
                              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                APROBADO
                              </span>
                            </p>
                            <p><span className="font-medium">Fecha de Realización:</span> {formatDate(searchResults.exam_date)}</p>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-900 mb-2">Información del Examinador</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Examinado por:</span> {searchResults.doctor_name}</p>
                            <p><span className="font-medium">DNI del Examinador:</span> {searchResults.doctor_dni}</p>
                            <p><span className="font-medium">Rol:</span> Doctor</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Valid Certificate Found */
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">
                        {searchResults && !searchResults.exam_pass ? 'Examen No Aprobado' : 'Certificado No Encontrado'}
                      </h3>
                      <div className="text-sm text-orange-700 space-y-2">
                        {searchResults && !searchResults.exam_pass ? (
                          <>
                            <p>
                              El ciudadano <strong>{searchResults.citizen_name}</strong> (DNI: <strong>{searchResults.citizen_dni}</strong>) 
                              realizó el examen tipo <strong>{exams.find(e => e.exam_id === selectedExamId)?.name}</strong> 
                              el {formatDate(searchResults.exam_date)}, pero <strong>no fue aprobado</strong>.
                            </p>
                            <div className="mt-3 p-3 bg-orange-100 rounded-md">
                              <p><span className="font-medium">Examinado por:</span> {searchResults.doctor_name} (DNI: {searchResults.doctor_dni})</p>
                              <p className="mt-1 text-xs text-orange-600">
                                El ciudadano debe volver a realizar el examen para obtener un certificado válido.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p>
                              El ciudadano con DNI <strong>{dni}</strong> no posee un certificado válido 
                              para el examen tipo <strong>{exams.find(e => e.exam_id === selectedExamId)?.name}</strong>.
                            </p>
                            <div className="mt-3 p-3 bg-orange-100 rounded-md">
                              <p className="font-medium">Posibles razones:</p>
                              <ul className="mt-1 list-disc list-inside space-y-1">
                                <li>El ciudadano no ha realizado este tipo de examen</li>
                                <li>El examen fue realizado pero no fue aprobado</li>
                                <li>El DNI ingresado no es correcto</li>
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
