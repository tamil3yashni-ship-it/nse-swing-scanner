export interface UserProfile {
  uid: string
  email: string
  fullName: string
  phone: string
  age: number
  height: number
  startWeight: number
  currentWeight: number
  targetWeight: number
  joinDate: string
  isAdmin: boolean
  photoURL?: string
  coachId?: string
}

export interface WeightEntry {
  id?: string
  userId: string
  weight: number
  date: string
  notes?: string
  bmi?: number
  createdAt: string
}

export interface DailyCheckin {
  id?: string
  userId: string
  date: string
  waterIntake: number
  morningShake: boolean
  eveningShake: boolean
  supplementsTaken: boolean
  exerciseDone: boolean
  exerciseMinutes: number
  sleepHours: number
  energyLevel: number
  mood: number
  notes?: string
  createdAt: string
}

export interface Photo {
  id?: string
  userId: string
  type: 'before' | 'after'
  url: string
  thumbnailUrl?: string
  date: string
  notes?: string
  weight?: number
  createdAt: string
}

export interface AdminStats {
  totalCustomers: number
  activeToday: number
  totalCheckins: number
  avgWeightLoss: number
}
