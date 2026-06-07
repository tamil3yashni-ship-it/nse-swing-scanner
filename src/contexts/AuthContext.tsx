'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  fullName: string
  phone: string
  age: number
  height: number
  currentWeight: number
  targetWeight: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await loadUserProfile(firebaseUser.uid)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const loadUserProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setUserProfile({ uid, ...docSnap.data() } as UserProfile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (data: RegisterData) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, data.email, data.password)
    await updateProfile(newUser, { displayName: data.fullName })

    const profile: Omit<UserProfile, 'uid'> = {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      age: data.age,
      height: data.height,
      startWeight: data.currentWeight,
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      joinDate: new Date().toISOString().split('T')[0],
      isAdmin: false,
    }

    await setDoc(doc(db, 'users', newUser.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    })
  }

  const logout = async () => {
    await signOut(auth)
    setUserProfile(null)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const refreshProfile = async () => {
    if (user) await loadUserProfile(user.uid)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
