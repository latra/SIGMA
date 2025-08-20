'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '../components/navbar'
import { getExams, deleteExam, type Exam } from '../../lib/api'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'

export default function ExamsPage() {
  const { user, systemUser, doctor, police } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin
  const isPolice = systemUser?.role === 'police'
  const themeColor = isPolice ? '#810000' : '#004e81'

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const examsData = await getExams()
      setExams(examsData)
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

    // Redirect if not admin
    if (!isAdmin) {
      router.push('/?error=access-denied')
      return
    }

    // Fetch exams if user is admin
    fetchExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, fetchExams])

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId)
      setExams(exams.filter(exam => exam.exam_id !== examId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting exam:', err)
      setError('Error al eliminar el examen')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

  // Redirect or show access denied if not admin
  if (!isAdmin) {
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
              Esta sección está disponible únicamente para administradores.
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Exámenes</h1>
              <p className="mt-2 text-gray-600">
                Administra las plantillas de exámenes del sistema
              </p>
            </div>
            <button
              onClick={() => router.push('/exams/create')}
              className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-80 transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Crear Examen
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColor }}></div>
            </div>
          ) : (
            /* Exams List */
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              {exams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay exámenes</h3>
                  <p className="text-gray-500 mb-4">Aún no has creado ningún examen.</p>
                  <button
                    onClick={() => router.push('/exams/create')}
                    className="inline-flex items-center px-4 py-2 text-white rounded-md hover:opacity-80 transition-colors"
                    style={{ backgroundColor: themeColor }}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Crear primer examen
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Examen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categorías
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Errores Máximos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exams.map((exam, index) => (
                        <tr key={exam.exam_id || `exam-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {exam.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {exam.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {exam.categories.length} categoría{exam.categories.length !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {exam.categories.reduce((total, cat) => total + cat.questions.length, 0)} pregunta{exam.categories.reduce((total, cat) => total + cat.questions.length, 0) !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {exam.max_error_allowed}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(exam.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/exams/exam-details?examId=${exam.exam_id}`)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Ver detalles"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => router.push(`/exams/exam-edit?examId=${exam.exam_id}`)}
                                className="hover:opacity-80"
                                style={{ color: themeColor }}
                                title="Editar"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(exam.exam_id)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
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

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">
                    Eliminar Examen
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que quieres eliminar este examen? Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="flex px-4 py-3 space-x-4">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeleteExam(deleteConfirm)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
