'use client'

import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DoctorRouteProps {
  children: React.ReactNode
} 

export default function DoctorRoute({ children }: DoctorRouteProps) {
  const { user, systemUser, doctor, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!user) {
        router.push('/login')
        return
      }
      
      // Check if user is a doctor (either from new system or legacy)
      const isDoctor = systemUser?.role === 'doctor' || doctor
      
      if (!isDoctor) {
        // If authenticated but not a doctor, redirect to home with message
        router.push('/?error=access-denied')
        return
      }
    }
  }, [user, systemUser, doctor, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hospital-blue"></div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or not a doctor
  if (!user) {
    return null
  }

  const isDoctor = systemUser?.role === 'doctor' || doctor
  if (!isDoctor) {
    return (
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
            Esta sección está disponible únicamente para médicos.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-hospital-blue text-white px-4 py-2 rounded-md hover:bg-hospital-blue/80 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
