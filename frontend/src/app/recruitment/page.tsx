'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  HeartIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { submitRecruitmentRequest, type RecruitmentRequest, type Profession } from '../../lib/api'
import { themes } from '../../lib/theme-config'

export default function RecruitmentPage() {
  const router = useRouter()
  const theme = themes.sigma
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<RecruitmentRequest>({
    name: '',
    discord: '',
    phone: '',
    profession: 'EMS',
    dni: '',
    motivation: '',
    experience: '',
    description: ['']
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof RecruitmentRequest, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RecruitmentRequest, string>> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    
    if (!formData.discord.trim()) {
      newErrors.discord = 'El discord es requerido'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }
    
    if (!formData.dni.trim()) {
      newErrors.dni = 'El ID Ingame es requerido'
    }
    
    if (formData.profession === 'POLICE') {
      newErrors.profession = 'El reclutamiento policial no está disponible actualmente'
      return false
    }
    
    if (!formData.motivation.trim()) {
      newErrors.motivation = 'La motivación es requerida'
    }
    
    if (!formData.experience.trim()) {
      newErrors.experience = 'La experiencia es requerida'
    }
    
    // Validate description array - remove empty strings and check if at least one exists
    const validDescriptions = formData.description.filter(desc => desc.trim())
    if (validDescriptions.length === 0) {
      newErrors.description = 'Debe proporcionar al menos una descripción del personaje'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof RecruitmentRequest, value: string | Profession) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...formData.description]
    newDescriptions[index] = value
    setFormData(prev => ({
      ...prev,
      description: newDescriptions
    }))
  }

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      description: [...prev.description, '']
    }))
  }

  const removeDescription = (index: number) => {
    if (formData.description.length > 1) {
      const newDescriptions = formData.description.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        description: newDescriptions
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Filter out empty descriptions before submitting
      const cleanedData = {
        ...formData,
        description: formData.description.filter(desc => desc.trim())
      }
      
      const response = await submitRecruitmentRequest(cleanedData)
      console.log('Recruitment submitted successfully:', response)
      
      setSubmitSuccess(true)
      
      // Reset form
      setFormData({
        name: '',
        discord: '',
        phone: '',
        profession: 'EMS',
        dni: '',
        motivation: '',
        experience: '',
        description: ['']
      })
      
    } catch (error) {
      console.error('Error submitting recruitment:', error)
      setSubmitError(error instanceof Error ? error.message : 'Error al enviar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <HeartIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Gracias por tu interés en unirte al cuerpo. Hemos recibido tu solicitud y será revisada por nuestro equipo de reclutamiento.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Te contactaremos pronto a través de Discord para continuar con el proceso.
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              Solicitud de Reclutamiento
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              ¿Quieres formar parte del cuerpo? Completa este formulario para solicitar tu ingreso.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                      errors.name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                    placeholder="Ej: Juan Pérez"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                    DNI / ID Ingame *
                  </label>
                  <input
                    type="text"
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                      errors.dni 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                    placeholder="ID Ingame"
                  />
                  {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
                </div>
                
                <div>
                  <label htmlFor="discord" className="block text-sm font-medium text-gray-700 mb-2">
                    Discord *
                  </label>
                  <input
                    type="text"
                    id="discord"
                    value={formData.discord}
                    onChange={(e) => handleInputChange('discord', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                      errors.discord 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                    placeholder="usuario#1234"
                  />
                  {errors.discord && <p className="mt-1 text-sm text-red-600">{errors.discord}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono del Personaje *
                  </label>
                  <input
                    type="text"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                      errors.phone 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                    placeholder="555-0123"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Profession Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <IdentificationIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                Profesión Deseada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    formData.profession === 'EMS' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleInputChange('profession', 'EMS')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="ems"
                      name="profession"
                      value="EMS"
                      checked={formData.profession === 'EMS'}
                      onChange={() => handleInputChange('profession', 'EMS')}
                      className="mr-3"
                    />
                    <HeartIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">EMS - Servicios Médicos</h4>
                      <p className="text-sm text-gray-600">Equipo médico de emergencias</p>
                    </div>
                  </div>
                </div>
                
                                <div 
                  className="border-2 rounded-lg p-6 cursor-not-allowed opacity-60 bg-gray-50"
                >
                  <div className="flex items-center">
                    <input
                      disabled
                      type="radio"
                      id="police"
                      name="profession"
                      value="POLICE"
                      className="mr-3"
                    />
                    <ShieldCheckIcon className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-700">POLICE - Fuerza Policial</h4>
                      <p className="text-sm text-gray-500">Próximamente disponible</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded-md p-2">
                    El reclutamiento policial aún no está disponible. Por favor, mantente atento a futuros anuncios.
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation and Experience */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                Motivación y Experiencia
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Por qué quieres unirte al cuerpo? *
                  </label>
                  <textarea
                    id="motivation"
                    rows={4}
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                      errors.motivation 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                    placeholder="Explica tu motivación para formar parte del equipo..."
                  />
                  {errors.motivation && <p className="mt-1 text-sm text-red-600">{errors.motivation}</p>}
                </div>
                
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Experiencia previa en roleplay médico/policial *
                  </label>
                  <textarea
                    id="experience"
                    rows={4}
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                      errors.experience 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                    }`}
                    placeholder="Describe tu experiencia previa en roleplay de servicios de emergencia..."
                  />
                  {errors.experience && <p className="mt-1 text-sm text-red-600">{errors.experience}</p>}
                </div>
              </div>
            </div>

            {/* Character Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                Descripción del Personaje
              </h3>
              
              <div className="space-y-4">
                {formData.description.map((desc, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <textarea
                        rows={3}
                        value={desc}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                        placeholder={`Descripción ${index + 1} del personaje...`}
                      />
                    </div>
                    {formData.description.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDescription(index)}
                        className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                
                <button
                  type="button"
                  onClick={addDescription}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Añadir otra descripción
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-md shadow-sm text-base font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'hover:shadow-lg transform hover:scale-105 focus:ring-orange-500'
                }`}
                style={{ 
                  backgroundColor: isSubmitting ? undefined : theme.primaryColor 
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
