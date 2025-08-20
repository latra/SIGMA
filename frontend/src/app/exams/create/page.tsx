'use client'

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/navbar'
import { createExam, type ExamCreate, type ExamCategory, type ExamQuestion } from '../../../lib/api'
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function CreateExamPage() {
  const { user, systemUser, doctor, police } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = systemUser?.is_admin || doctor?.is_admin || police?.is_admin
  const isPolice = systemUser?.role === 'police'
  const themeColor = isPolice ? '#810000' : '#004e81'

  const [examData, setExamData] = useState<ExamCreate>({
    name: '',
    max_error_allowed: 3,
    description: '',
    categories: [
      {
        category_id: crypto.randomUUID(),
        name: '',
        description: '',
        questions: [
          {
            question_id: crypto.randomUUID(),
            question: '',
            options: ['', '', '', ''],
            correct_option: ''
          }
        ]
      }
    ]
  })

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/?error=access-denied')
    return null
  }

  const handleExamChange = (field: keyof ExamCreate, value: any) => {
    setExamData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (categoryIndex: number, field: keyof ExamCategory, value: any) => {
    setExamData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, index) =>
        index === categoryIndex ? { ...cat, [field]: value } : cat
      )
    }))
  }

  const handleQuestionChange = (categoryIndex: number, questionIndex: number, field: keyof ExamQuestion, value: any) => {
    setExamData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, catIndex) =>
        catIndex === categoryIndex
          ? {
              ...cat,
              questions: cat.questions.map((q, qIndex) =>
                qIndex === questionIndex ? { ...q, [field]: value } : q
              )
            }
          : cat
      )
    }))
  }

  const handleOptionChange = (categoryIndex: number, questionIndex: number, optionIndex: number, value: string) => {
    setExamData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, catIndex) =>
        catIndex === categoryIndex
          ? {
              ...cat,
              questions: cat.questions.map((q, qIndex) =>
                qIndex === questionIndex
                  ? {
                      ...q,
                      options: q.options.map((opt, optIndex) =>
                        optIndex === optionIndex ? value : opt
                      )
                    }
                  : q
              )
            }
          : cat
      )
    }))
  }

  const addCategory = () => {
    setExamData(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          category_id: crypto.randomUUID(),
          name: '',
          description: '',
          questions: [
            {
              question_id: crypto.randomUUID(),
              question: '',
              options: ['', '', '', ''],
              correct_option: ''
            }
          ]
        }
      ]
    }))
  }

  const removeCategory = (categoryIndex: number) => {
    setExamData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, index) => index !== categoryIndex)
    }))
  }

  const addQuestion = (categoryIndex: number) => {
    setExamData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, index) =>
        index === categoryIndex
          ? {
              ...cat,
              questions: [
                ...cat.questions,
                {
                  question_id: crypto.randomUUID(),
                  question: '',
                  options: ['', '', '', ''],
                  correct_option: ''
                }
              ]
            }
          : cat
      )
    }))
  }

  const removeQuestion = (categoryIndex: number, questionIndex: number) => {
    setExamData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, catIndex) =>
        catIndex === categoryIndex
          ? {
              ...cat,
              questions: cat.questions.filter((_, qIndex) => qIndex !== questionIndex)
            }
          : cat
      )
    }))
  }

  const validateForm = (): string | null => {
    if (!examData.name.trim()) return 'El nombre del examen es requerido'
    if (!examData.description.trim()) return 'La descripción es requerida'
    if (examData.max_error_allowed < 0) return 'Los errores máximos permitidos no pueden ser negativos'
    if (examData.categories.length === 0) return 'Debe haber al menos una categoría'

    for (let i = 0; i < examData.categories.length; i++) {
      const category = examData.categories[i]
      if (!category.name.trim()) return `El nombre de la categoría ${i + 1} es requerido`
      if (category.questions.length === 0) return `La categoría "${category.name}" debe tener al menos una pregunta`

      for (let j = 0; j < category.questions.length; j++) {
        const question = category.questions[j]
        if (!question.question.trim()) return `La pregunta ${j + 1} de la categoría "${category.name}" es requerida`
        if (question.options.some(opt => !opt.trim())) return `Todas las opciones de la pregunta ${j + 1} en "${category.name}" son requeridas`
        if (!question.correct_option.trim()) return `La respuesta correcta de la pregunta ${j + 1} en "${category.name}" es requerida`
        if (!question.options.includes(question.correct_option)) return `La respuesta correcta de la pregunta ${j + 1} en "${category.name}" debe ser una de las opciones`
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      await createExam(examData)
      router.push('/exams')
    } catch (err) {
      console.error('Error creating exam:', err)
      setError('Error al crear el examen. Inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Examen</h1>
            <p className="mt-2 text-gray-600">
              Crea una nueva plantilla de examen con categorías y preguntas
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Exam Info */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre del Examen *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={examData.name}
                    onChange={(e) => handleExamChange('name', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="max_error_allowed" className="block text-sm font-medium text-gray-700">
                    Errores Máximos Permitidos *
                  </label>
                  <input
                    type="number"
                    id="max_error_allowed"
                    min="0"
                    value={examData.max_error_allowed}
                    onChange={(e) => handleExamChange('max_error_allowed', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={examData.description}
                  onChange={(e) => handleExamChange('description', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                  required
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Categorías y Preguntas</h2>
                <button
                  type="button"
                  onClick={addCategory}
                  className="flex items-center px-3 py-2 text-white rounded-md hover:opacity-80 transition-colors"
                  style={{ backgroundColor: themeColor }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Añadir Categoría
                </button>
              </div>

              {examData.categories.map((category, categoryIndex) => (
                <div key={`category-${categoryIndex}-${category.name || 'new'}`} className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-900">
                      Categoría {categoryIndex + 1}
                    </h3>
                    {examData.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(categoryIndex)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de la Categoría *
                      </label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => handleCategoryChange(categoryIndex, 'name', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descripción de la Categoría
                      </label>
                      <input
                        type="text"
                        value={category.description}
                        onChange={(e) => handleCategoryChange(categoryIndex, 'description', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700">Preguntas</h4>
                      <button
                        type="button"
                        onClick={() => addQuestion(categoryIndex)}
                        className="flex items-center px-2 py-1 text-sm text-white rounded hover:opacity-80"
                        style={{ backgroundColor: themeColor }}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Añadir Pregunta
                      </button>
                    </div>

                    {category.questions.map((question, questionIndex) => (
                      <div key={`question-${categoryIndex}-${questionIndex}-${question.question.slice(0, 20) || 'new'}`} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Pregunta {questionIndex + 1}
                          </span>
                          {category.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(categoryIndex, questionIndex)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pregunta *
                          </label>
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'question', e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opciones *
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, optionIndex) => (
                              <input
                                key={`option-input-${categoryIndex}-${questionIndex}-${optionIndex}`}
                                type="text"
                                placeholder={`Opción ${optionIndex + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(categoryIndex, questionIndex, optionIndex, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                required
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Respuesta Correcta *
                          </label>
                          <select
                            value={question.correct_option}
                            onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'correct_option', e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                            required
                          >
                            <option value="">Seleccionar respuesta correcta</option>
                            {question.options.map((option, optionIndex) => (
                              <option key={`option-select-${categoryIndex}-${questionIndex}-${optionIndex}`} value={option}>
                                {option || `Opción ${optionIndex + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/exams')}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-white rounded-md hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: themeColor }}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </div>
                ) : (
                  'Crear Examen'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
