'use client'

import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ChangePassword from '../components/change-password'

export default function ChangePasswordPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSuccess = () => {
    router.push('/')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <ChangePassword 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
