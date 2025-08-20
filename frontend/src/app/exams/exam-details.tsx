'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../components/navbar'
import { getExam, type Exam } from '../../lib/api'
import { ArrowLeftIcon, PencilIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'

function ExamDetailContent() {
  const { user, systemUser, doctor, police } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('examId')
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin
  const isPolice = systemUser?.role === 'police'
  const themeColor = isPolice ? '#810000' : '#004e81'

  const fetchExam = useCallback(async () => {
    if (!examId) return
    
    try {
      setLoading(true)
      setError(null)
      const examData = await getExam(examId)
      setExam(examData)
    } catch (err) {
      console.error('Error fetching exam:', err)
      setError('Error al cargar el examen')
    } finally {
      setLoading(false)
    }
  }, [examId])

  useEffect(() => {
    // Don't do anything if still loading auth state
    if (!user) return

    // Redirect if not admin
    if (!isAdmin) {
      router.push('/?error=access-denied')
      return
    }

    // Fetch exam if we have an ID
    if (examId) {
      fetchExam()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, examId, fetchExam])

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/exams')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a exámenes
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
          ) : exam ? (
            <div className="space-y-6">
              {/* Exam Header */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.name}</h1>
                    <p className="text-gray-600 mb-4">{exam.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Creado: {formatDate(exam.created_at)}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Actualizado: {formatDate(exam.updated_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: themeColor }}>
                        {exam.max_error_allowed}
                      </div>
                      <div className="text-xs text-gray-500">Errores máximos</div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/exams/exam-edit?examId=${exam.exam_id}`)}
                      className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-80 transition-colors"
                      style={{ backgroundColor: themeColor }}
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Editar
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold" style={{ color: themeColor }}>
                    {exam.categories.length}
                  </div>
                  <div className="text-sm text-gray-500">Categoría{exam.categories.length !== 1 ? 's' : ''}</div>
                </div>
                
                <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold" style={{ color: themeColor }}>
                    {exam.categories.reduce((total, cat) => total + cat.questions.length, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Pregunta{exam.categories.reduce((total, cat) => total + cat.questions.length, 0) !== 1 ? 's' : ''} total{exam.categories.reduce((total, cat) => total + cat.questions.length, 0) !== 1 ? 'es' : ''}</div>
                </div>
                
                <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(((exam.categories.reduce((total, cat) => total + cat.questions.length, 0) - exam.max_error_allowed) / exam.categories.reduce((total, cat) => total + cat.questions.length, 0)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Precisión requerida</div>
                </div>
              </div>

              {/* Categories and Questions */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Categorías y Preguntas</h2>
                
                {exam.categories.map((category, categoryIndex) => (
                  <div key={`category-${categoryIndex}-${category.name}`} className="bg-white shadow-sm rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: themeColor }}>
                        {categoryIndex + 1}. {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        {category.questions.length} pregunta{category.questions.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {category.questions.map((question, questionIndex) => (
                        <div key={`question-${categoryIndex}-${questionIndex}-${question.question.slice(0, 20)}`} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900">
                              {questionIndex + 1}. {question.question}
                            </h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={`option-${categoryIndex}-${questionIndex}-${optionIndex}-${option.slice(0, 10)}`}
                                className={`p-3 rounded-md border-2 ${
                                  option === question.correct_option
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center">
                                  <span className="font-medium text-sm text-gray-700 mr-2">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className={
                                    option === question.correct_option
                                      ? 'text-green-800 font-medium'
                                      : 'text-gray-700'
                                  }>
                                    {option}
                                  </span>
                                  {option === question.correct_option && (
                                    <svg className="h-5 w-5 text-green-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Examen no encontrado</h3>
              <p className="text-gray-500">El examen que buscas no existe o ha sido eliminado.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function ExamDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ExamDetailContent />
    </Suspense>
  )
}
