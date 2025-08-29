'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DoctorRecruiterRoute from '../../components/DoctorRecruiterRoute'
import { 
  getPendingMedicalRecruitments, 
  markRecruitmentAsAttended,
  type RecruitmentResponse 
} from '../../../lib/api'
import { themes } from '../../../lib/theme-config'
import { 
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  IdentificationIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ManageRecruitmentPage() {
  const router = useRouter()
  const theme = themes.sigma
  
  const [recruitments, setRecruitments] = useState<RecruitmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecruitment, setSelectedRecruitment] = useState<RecruitmentResponse | null>(null)
  const [isMarkingAttended, setIsMarkingAttended] = useState(false)

  useEffect(() => {
    loadRecruitments()
  }, [])

  const loadRecruitments = async () => {
    try {
      const data = await getPendingMedicalRecruitments()
      setRecruitments(data)
      setError(null)
    } catch (err) {
      setError('Error al cargar las solicitudes de reclutamiento')
      console.error('Error loading recruitments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsAttended = async (recruitment: RecruitmentResponse) => {
    if (!recruitment.id || isMarkingAttended) return
    
    setIsMarkingAttended(true)
    try {
      await markRecruitmentAsAttended(recruitment.id)
      // Reload recruitments to get updated list
      await loadRecruitments()
      setSelectedRecruitment(null)
    } catch (err) {
      setError('Error al marcar la solicitud como atendida')
      console.error('Error marking recruitment as attended:', err)
    } finally {
      setIsMarkingAttended(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DoctorRecruiterRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver al inicio
              </Link>
            </div>
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Reclutamiento
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Revisa y gestiona las solicitudes de reclutamiento pendientes.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
              {error}
            </div>
          ) : recruitments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay solicitudes pendientes
              </h3>
              <p className="text-gray-600">
                Todas las solicitudes han sido atendidas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recruitment List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Solicitudes Pendientes
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {recruitments.map((recruitment) => (
                    <div
                      key={recruitment.id}
                      className={`p-6 cursor-pointer transition-colors ${
                        selectedRecruitment?.id === recruitment.id
                          ? 'bg-orange-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRecruitment(recruitment)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {recruitment.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ID: {recruitment.dni}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDate(recruitment.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruitment Details */}
              {selectedRecruitment ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Detalles de la Solicitud
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        Información Personal
                      </h3>
                      <dl className="grid grid-cols-1 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedRecruitment.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ID Ingame</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedRecruitment.dni}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Discord</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedRecruitment.discord}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedRecruitment.phone}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        Motivación y Experiencia
                      </h3>
                      <dl className="grid grid-cols-1 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Motivación</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                            {selectedRecruitment.motivation}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Experiencia Previa</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                            {selectedRecruitment.experience}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <IdentificationIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        Descripción del Personaje
                      </h3>
                      <div className="space-y-4">
                        {selectedRecruitment.description.map((desc, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-md p-4 text-sm text-gray-900"
                          >
                            {desc}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={() => handleMarkAsAttended(selectedRecruitment)}
                        disabled={isMarkingAttended}
                        className={`w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white shadow-sm transition-all duration-200 ${
                          isMarkingAttended
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'hover:shadow-lg transform hover:scale-105'
                        }`}
                        style={{ 
                          backgroundColor: isMarkingAttended ? undefined : theme.primaryColor 
                        }}
                      >
                        {isMarkingAttended ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Marcar como Atendida
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600">
                    Selecciona una solicitud para ver sus detalles
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DoctorRecruiterRoute>
  )
}
