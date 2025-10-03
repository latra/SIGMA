'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function DoctorRecruiterRoute({ children }: { children: React.ReactNode }) {
  const { doctor, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!doctor || !doctor.roles?.includes('recruiter'))) {
      router.push('/')
    }
  }, [doctor, loading, router])

  if (loading || !doctor || !doctor.roles?.includes('recruiter')) {
    return null
  }

  return <>{children}</>
}

