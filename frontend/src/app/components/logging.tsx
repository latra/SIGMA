'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
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
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#4fbbeb] focus:border-[#4fbbeb] focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-hospital-blue hover:bg-hospital-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4fbbeb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <a
                href="/register"
                className="font-medium text-hospital-blue hover:text-hospital-blue/80"
              >
                Registrarse como médico o policía
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

