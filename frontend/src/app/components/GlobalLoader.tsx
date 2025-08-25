'use client'

import { useAuth } from '../contexts/AuthContext'
import { themes } from '../../lib/theme-config'

export default function GlobalLoader() {
  const { loading } = useAuth()

  if (!loading) {
    return null
  }

  const sigmaTheme = themes.sigma

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <img
          className="mx-auto h-32 w-auto mb-8 animate-pulse"
          src={sigmaTheme.logoImage}
          alt={sigmaTheme.altText}
        />
        <div className="flex justify-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
            style={{ borderColor: sigmaTheme.primaryColor, borderTopColor: 'transparent' }}
          ></div>
        </div>
        <p className="mt-4 text-gray-600 text-lg">Cargando...</p>
      </div>
    </div>
  )
} 