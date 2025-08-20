'use client'

import { useAuth } from '../contexts/AuthContext'

export default function GlobalLoader() {
  const { loading } = useAuth()

  if (!loading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <img
          className="mx-auto h-32 w-auto mb-8 animate-pulse"
          src="/hosp-logo.png"
          alt="Hospital General de Real"
        />
        <img
          className="mx-auto h-16 w-auto mb-8"
          src="/hosp-title.png"
          alt="Hospital General de Real"
        />
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-hospital-blue border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-600 text-lg">Cargando...</p>
      </div>
    </div>
  )
} 