'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { getThemeByRoute, themes } from '../../lib/theme-config'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const { signIn, resetPassword } = useAuth();
  const pathname = usePathname()
  
  // Use theme based on current route, default to SIGMA
  const currentTheme = getThemeByRoute(pathname)
  const theme = themes[currentTheme]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido')
      } else if (error.code === 'auth/user-not-found') {
        setError('Usuario no encontrado')
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta')
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email) {
      setError('Por favor ingresa tu correo electrónico')
      setLoading(false)
      return
    }

    try {
      await resetPassword(email)
      setResetEmailSent(true)
    } catch (error: any) {
      console.error('Reset password error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setResetEmailSent(false)
    setError('')
    setEmail('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-24 w-auto"
            src={theme.logoImage}
            alt={theme.altText}
          />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {showForgotPassword ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showForgotPassword 
              ? 'Ingresa tu correo electrónico para recibir instrucciones de recuperación'
              : theme.description
            }
          </p>
        </div>

        {resetEmailSent ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ¡Correo enviado exitosamente!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada y sigue las instrucciones.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleBackToLogin}
                className="font-medium hover:underline transition-colors"
                style={{ color: theme.primaryColor }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit}>
            <div className={showForgotPassword ? "rounded-md shadow-sm" : "rounded-md shadow-sm -space-y-px"}>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Correo electrónico
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] focus:z-10 sm:text-sm ${
                    showForgotPassword ? 'rounded-md' : 'rounded-t-md'
                  }`}
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {!showForgotPassword && (
                <div>
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] focus:z-10 sm:text-sm"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ 
                  backgroundColor: theme.primaryColor
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryColor + 'cc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primaryColor}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading 
                  ? (showForgotPassword ? 'Enviando...' : 'Iniciando sesión...') 
                  : (showForgotPassword ? 'Enviar enlace de recuperación' : 'Iniciar sesión')
                }
              </button>
            </div>
            
            <div className="text-center space-y-3">
              {!showForgotPassword ? (
                <>
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-medium hover:underline transition-colors text-sm"
                      style={{ color: theme.primaryColor }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    <a
                      href="/register"
                      className="font-medium hover:underline transition-colors"
                      style={{ color: theme.primaryColor }}
                    >
                      Registrarse como médico o policía
                    </a>
                  </p>
                </>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="font-medium hover:underline transition-colors text-sm"
                    style={{ color: theme.primaryColor }}
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

