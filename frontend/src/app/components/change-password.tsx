'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { getThemeByRoute, themes } from '../../lib/theme-config'
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface ChangePasswordProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ChangePassword({ onSuccess, onCancel }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { changePassword } = useAuth()
  const pathname = usePathname()
  
  // Use theme based on current route, default to SIGMA
  const currentTheme = getThemeByRoute(pathname)
  const theme = themes[currentTheme]

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres')
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula')
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula')
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('La contraseña debe contener al menos un número')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones
    if (!currentPassword) {
      setError('Por favor ingresa tu contraseña actual')
      return
    }

    if (!newPassword) {
      setError('Por favor ingresa una nueva contraseña')
      return
    }

    if (!confirmPassword) {
      setError('Por favor confirma tu nueva contraseña')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    // Validar fortaleza de la nueva contraseña
    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '))
      return
    }

    setLoading(true)

    try {
      await changePassword(currentPassword, newPassword)
      setSuccess('Contraseña cambiada exitosamente')
      
      // Limpiar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Llamar callback de éxito si existe
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      setError(error.message || 'Error al cambiar la contraseña. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${theme.primaryColor}20` }}>
          <LockClosedIcon className="h-6 w-6" style={{ color: theme.primaryColor }} />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Cambiar Contraseña
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Ingresa tu contraseña actual y tu nueva contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contraseña Actual */}
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña Actual
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${error && !currentPassword ? 'border-red-500' : 'border-gray-300'}`}
              style={{ 
                borderColor: error && !currentPassword ? '#ef4444' : undefined,
                '--tw-ring-color': theme.primaryColor
              } as React.CSSProperties}
              placeholder="Ingresa tu contraseña actual"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
            >
              {showCurrentPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Nueva Contraseña */}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            Nueva Contraseña
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${error && !newPassword ? 'border-red-500' : 'border-gray-300'}`}
              style={{ 
                borderColor: error && !newPassword ? '#ef4444' : undefined,
                '--tw-ring-color': theme.primaryColor
              } as React.CSSProperties}
              placeholder="Ingresa tu nueva contraseña"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
            >
              {showNewPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {newPassword && (
            <div className="mt-2 text-xs space-y-1">
              <div className={`flex items-center ${newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{newPassword.length >= 6 ? '✓' : '○'}</span>
                Al menos 6 caracteres
              </div>
              <div className={`flex items-center ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{/(?=.*[a-z])/.test(newPassword) ? '✓' : '○'}</span>
                Una letra minúscula
              </div>
              <div className={`flex items-center ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{/(?=.*[A-Z])/.test(newPassword) ? '✓' : '○'}</span>
                Una letra mayúscula
              </div>
              <div className={`flex items-center ${/(?=.*\d)/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-2">{/(?=.*\d)/.test(newPassword) ? '✓' : '○'}</span>
                Un número
              </div>
            </div>
          )}
        </div>

        {/* Confirmar Nueva Contraseña */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Nueva Contraseña
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${error && !confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              style={{ 
                borderColor: error && !confirmPassword ? '#ef4444' : undefined,
                '--tw-ring-color': theme.primaryColor
              } as React.CSSProperties}
              placeholder="Confirma tu nueva contraseña"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {confirmPassword && newPassword && (
            <div className={`mt-1 text-xs ${confirmPassword === newPassword ? 'text-green-600' : 'text-red-500'}`}>
              {confirmPassword === newPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
            </div>
          )}
        </div>

        {/* Mensajes de Error y Éxito */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: theme.primaryColor,
              '--tw-ring-color': theme.primaryColor
            } as React.CSSProperties}
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
