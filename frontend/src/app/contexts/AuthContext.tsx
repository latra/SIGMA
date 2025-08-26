'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as FirebaseUser, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getCurrentUser, getCurrentDoctor, getCurrentPolice, Doctor, User as SystemUser, PoliceUser } from '../../lib/api'
import { handleAuthError } from '../../lib/auth-utils'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  firebaseUser: FirebaseUser | null
  systemUser: SystemUser | null
  doctor: Doctor | null
  police: PoliceUser | null
  loading: boolean
  logout: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  // Legacy compatibility
  user: FirebaseUser | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [systemUser, setSystemUser] = useState<SystemUser | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [police, setPolice] = useState<PoliceUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Try new system first
          try {
            const userData = await getCurrentUser()
            setSystemUser(userData)
            console.log('User data fetched from new system:', userData)
            
            // Handle role-specific data
            if (userData.role === 'doctor') {
              try {
                const doctorData = await getCurrentDoctor()
                setDoctor(doctorData)
                setPolice(null)
              } catch (doctorError) {
                console.warn('Could not fetch legacy doctor data:', doctorError)
                // Create a compatible doctor object from system user
                setDoctor({
                  name: userData.name,
                  dni: userData.dni,
                  email: userData.email,
                  enabled: userData.enabled,
                  is_admin: userData.is_admin
                })
                setPolice(null)
              }
            } else if (userData.role === 'police') {
              try {
                const policeData = await getCurrentPolice()
                setPolice(policeData)
                setDoctor(null)
              } catch (policeError) {
                console.warn('Could not fetch police data:', policeError)
                setPolice(null)
                setDoctor(null)
              }
            } else {
              setDoctor(null)
              setPolice(null)
            }
          } catch (userError) {
            console.warn('New user system not available, falling back to legacy:', userError)
            
            // Fallback to legacy doctor system
            try {
              const doctorData = await getCurrentDoctor()
              setDoctor(doctorData)
              setPolice(null)
              
              // Create a system user object for compatibility
              setSystemUser({
                name: doctorData.name,
                dni: doctorData.dni,
                email: doctorData.email,
                user_id: user.uid,
                firebase_uid: user.uid,
                role: 'doctor',
                enabled: doctorData.enabled,
                is_admin: doctorData.is_admin || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            } catch (doctorError) {
              console.error('Error fetching doctor data:', doctorError)
              await handleAuthError(doctorError)
              setDoctor(null)
              setPolice(null)
              setSystemUser(null)
            }
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error)
          await handleAuthError(error)
          setSystemUser(null)
          setDoctor(null)
          setPolice(null)
        }
      } else {
        setSystemUser(null)
        setDoctor(null)
        setPolice(null)
      }
      
      setTimeout(() => {
        setFirebaseUser(user)
        setLoading(false)
      }, 500)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password).then(() => {
        router.push('/')
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };
  const logout = async () => {
    try {
      await signOut(auth)
      setFirebaseUser(null)
      setSystemUser(null)
      setDoctor(null)
      setPolice(null)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser) {
      throw new Error('No hay usuario autenticado')
    }

    try {
      // Crear credenciales para la reautenticación
      const credential = EmailAuthProvider.credential(
        firebaseUser.email!,
        currentPassword
      )

      // Reautenticar al usuario
      await reauthenticateWithCredential(firebaseUser, credential)

      // Cambiar la contraseña
      await updatePassword(firebaseUser, newPassword)

      console.log('Contraseña actualizada exitosamente')
    } catch (error: any) {
      console.error('Error changing password:', error)
      if (error.code === 'auth/wrong-password') {
        throw new Error('La contraseña actual es incorrecta')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('La nueva contraseña es muy débil')
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('Por seguridad, necesitas iniciar sesión nuevamente antes de cambiar tu contraseña')
      } else {
        throw new Error('Error al cambiar la contraseña. Inténtalo de nuevo.')
      }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log('Email de recuperación enviado exitosamente')
    } catch (error: any) {
      console.error('Error sending password reset email:', error)
      if (error.code === 'auth/user-not-found') {
        throw new Error('No se encontró una cuenta con este correo electrónico')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('El correo electrónico no es válido')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos. Espera un momento antes de intentar nuevamente')
      } else {
        throw new Error('Error al enviar el correo de recuperación. Inténtalo de nuevo.')
      }
    }
  }

  const value = {
    firebaseUser,
    systemUser,
    doctor,
    police,
    loading,
    logout,
    signIn,
    signUp,
    changePassword,
    resetPassword,
    // Legacy compatibility
    user: firebaseUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 