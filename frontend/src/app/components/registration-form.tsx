'use client'

import { useState } from 'react'
import { registerDoctor, registerPolice, DoctorRegister, PoliceRegister } from '../../lib/api'

type UserType = 'doctor' | 'police'

interface FormData {
  // Basic user info
  name: string
  dni: string
  email: string
  phone: string
  userType: UserType
  
  // Doctor-specific fields
  medical_license?: string
  specialty?: string
  institution?: string
  years_experience?: number
  
  // Police-specific fields
  badge_number?: string
  rank?: string
  department?: string
  station?: string
  years_service?: number
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    dni: '',
    email: '',
    phone: '',
    userType: 'doctor'
  })
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Dynamic theme based on user type
  const themeColor = formData.userType === 'police' ? '#810000' : '#004e81'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Clear success message when user starts typing again
    if (success) {
      setSuccess('')
      setGeneratedPassword('')
    }
    if (error) {
      setError('')
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const generatePassword = (dni: string): string => {
    // Si el DNI tiene menos de 6 caracteres, añadir 0s delante hasta llegar a 6
    return dni.padStart(6, '0')
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'El nombre es requerido'
    if (!formData.dni.trim()) return 'El DNI es requerido'
    if (!formData.email.trim()) return 'El email es requerido'
    
    // Validaciones específicas por tipo de usuario
    if (formData.userType === 'police') {
      if (!formData.badge_number?.trim()) return 'El número de placa es requerido para policías'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    
    try {
      // Register user in backend system
      console.log('Starting registration process for:', formData.userType)
      
      if (formData.userType === 'doctor') {
        const doctorData: DoctorRegister = {
          name: formData.name,
          dni: formData.dni,
          email: formData.email,
          phone: formData.phone || undefined,
          specialty: formData.specialty || undefined,
          medical_license: formData.medical_license || undefined,
          institution: formData.institution || undefined,
          years_experience: formData.years_experience || undefined
        }
        
        console.log('Sending doctor data to API:', doctorData)
        await registerDoctor(doctorData)
      } else {
        const policeData: PoliceRegister = {
          name: formData.name,
          dni: formData.dni,
          email: formData.email,
          phone: formData.phone || undefined,
          badge_number: formData.badge_number!, // Required field
          rank: formData.rank || undefined,
          department: formData.department || undefined,
          station: formData.station || undefined,
          years_service: formData.years_service || undefined
        }
        
        console.log('Sending police data to API:', policeData)
        await registerPolice(policeData)
      }
      
      // Generate password from DNI and store it
      const password = generatePassword(formData.dni)
      setGeneratedPassword(password)
      
      // Show success message
      setSuccess('registered')
      
      // Reset form
      setFormData({
        name: '',
        dni: '',
        email: '',
        phone: '',
        userType: 'doctor'
      })
      
    } catch (backendError: any) {
      console.error('Backend registration error:', backendError)
      setError(backendError.message || 'Error al registrar usuario en el sistema. Inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {formData.userType === 'police' ? (
            <>
              <img
                className="mx-auto h-24 w-auto"
                src="/policia.png"
                alt="Policía Nacional"
              />
              <img
                className="mx-auto h-12 w-auto"
                src="/police-title.png"
                alt="Policía Nacional"
              />
            </>
          ) : (
            <>
              <img
                className="mx-auto h-24 w-auto"
                src="/hosp-logo.png"
                alt="Hospital General de Real"
              />
              <img
                className="mx-auto h-12 w-auto"
                src="/hosp-title.png"
                alt="Hospital General de Real"
              />
            </>
          )}
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Registro de Usuario
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Crear cuenta para médico o policía
          </p>
        </div>

        <form className="bg-white shadow-sm rounded-lg p-6 space-y-6" onSubmit={handleSubmit}>
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuario
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="doctor"
                  checked={formData.userType === 'doctor'}
                  onChange={handleInputChange}
                  className="mr-2"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-sm font-medium text-gray-700">Médico</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="police"
                  checked={formData.userType === 'police'}
                  onChange={handleInputChange}
                  className="mr-2"
                  style={{ accentColor: themeColor }}
                />
                <span className="text-sm font-medium text-gray-700">Policía</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              />
            </div>
            
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700">
                DNI *
              </label>
              <input
                type="text"
                name="dni"
                id="dni"
                required
                value={formData.dni}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
              />
            </div>
          </div>

          {/* Password Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Información sobre la contraseña
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Tu contraseña será generada automáticamente basada en tu DNI. Si tu DNI tiene menos de 6 dígitos, se añadirán ceros al inicio.</p>
                  <p className="mt-1"><strong>Ejemplo:</strong> DNI "123" → Contraseña "000123"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {formData.userType === 'doctor' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Médica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="medical_license" className="block text-sm font-medium text-gray-700">
                    Licencia Médica
                  </label>
                  <input
                    type="text"
                    name="medical_license"
                    id="medical_license"
                    value={formData.medical_license || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    id="specialty"
                    value={formData.specialty || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    Institución
                  </label>
                  <input
                    type="text"
                    name="institution"
                    id="institution"
                    value={formData.institution || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700">
                    Años de Experiencia
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    id="years_experience"
                    min="0"
                    value={formData.years_experience || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Police-specific fields */}
          {formData.userType === 'police' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Policial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="badge_number" className="block text-sm font-medium text-gray-700">
                    Número de Placa *
                  </label>
                  <input
                    type="text"
                    name="badge_number"
                    id="badge_number"
                    required
                    value={formData.badge_number || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
                    Rango
                  </label>
                  <input
                    type="text"
                    name="rank"
                    id="rank"
                    value={formData.rank || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="department"
                    id="department"
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="station" className="block text-sm font-medium text-gray-700">
                    Estación/Comisaría
                  </label>
                  <input
                    type="text"
                    name="station"
                    id="station"
                    value={formData.station || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
                
                <div>
                  <label htmlFor="years_service" className="block text-sm font-medium text-gray-700">
                    Años de Servicio
                  </label>
                  <input
                    type="number"
                    name="years_service"
                    id="years_service"
                    min="0"
                    value={formData.years_service || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-blue focus:border-hospital-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800">
                    ¡Registro Exitoso!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Tu cuenta ha sido creada correctamente.</p>
                    <div className="mt-3 p-3 bg-green-100 rounded-md border border-green-300">
                      <p className="font-semibold">Tu contraseña de acceso es: <span className="font-mono text-lg bg-white px-2 py-1 rounded border">{generatedPassword}</span></p>
                    </div>
                    <p className="mt-3">Puedes iniciar sesión ahora usando tu email y esta contraseña.</p>
                    <div className="mt-4">
                      <a
                        href="/login"
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Ir al Login
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColor, outlineColor: themeColor }}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'Registrando...' : `Registrar ${formData.userType === 'doctor' ? 'Médico' : 'Policía'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
