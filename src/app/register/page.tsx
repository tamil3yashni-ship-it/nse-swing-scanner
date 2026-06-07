'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Leaf, ArrowLeft, ArrowRight } from 'lucide-react'
import LanguageToggle from '@/components/ui/LanguageToggle'

interface RegisterForm {
  fullName: string
  email: string
  phone: string
  age: number
  height: number
  currentWeight: number
  targetWeight: number
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const { t } = useLanguage()
  const { register: registerUser } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<RegisterForm>()

  const nextStep = async () => {
    const fieldsToValidate = step === 1
      ? ['fullName', 'email', 'phone'] as const
      : ['age', 'height', 'currentWeight', 'targetWeight'] as const
    const valid = await trigger(fieldsToValidate)
    if (valid) setStep(step + 1)
  }

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        age: Number(data.age),
        height: Number(data.height),
        currentWeight: Number(data.currentWeight),
        targetWeight: Number(data.targetWeight),
      })
      toast.success('Account created! Welcome to HerbaCoach!')
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      if (message.includes('email-already-in-use')) {
        toast.error('Email already registered')
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <LanguageToggle />
        </div>

        <div className="card shadow-xl border-0">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{t('registerTitle')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('registerSubtitle')}</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s <= step ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 transition-all ${s < step ? 'bg-orange-500' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 animate-slide-up">
                <div>
                  <label className="label">{t('fullName')}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    {...register('fullName', { required: t('required') })}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="label">{t('email')}</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    {...register('email', {
                      required: t('required'),
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                    })}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">{t('phone')}</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    {...register('phone', { required: t('required') })}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <button type="button" onClick={nextStep} className="btn-primary w-full flex items-center justify-center gap-2">
                  {t('next')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Health Info */}
            {step === 2 && (
              <div className="space-y-4 animate-slide-up">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('age')}</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="25"
                      {...register('age', { required: t('required'), min: { value: 10, message: 'Min 10' }, max: { value: 100, message: 'Max 100' } })}
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
                  </div>
                  <div>
                    <label className="label">{t('height')}</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="165"
                      {...register('height', { required: t('required'), min: { value: 100, message: 'Min 100cm' } })}
                    />
                    {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('currentWeight')}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      placeholder="75"
                      {...register('currentWeight', { required: t('required'), min: { value: 20, message: 'Min 20kg' } })}
                    />
                    {errors.currentWeight && <p className="text-red-500 text-xs mt-1">{errors.currentWeight.message}</p>}
                  </div>
                  <div>
                    <label className="label">{t('targetWeight')}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      placeholder="60"
                      {...register('targetWeight', { required: t('required'), min: { value: 20, message: 'Min 20kg' } })}
                    />
                    {errors.targetWeight && <p className="text-red-500 text-xs mt-1">{errors.targetWeight.message}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                    {t('back')}
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {t('next')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <div className="space-y-4 animate-slide-up">
                <div>
                  <label className="label">{t('password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-12"
                      placeholder="Min. 6 characters"
                      {...register('password', { required: t('required'), minLength: { value: 6, message: 'Min 6 characters' } })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="label">{t('confirmPassword')}</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: t('required'),
                      validate: (val) => val === watch('password') || 'Passwords do not match',
                    })}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? <><div className="spinner w-4 h-4" /> {t('loading')}</> : t('signUp')}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-5 text-center text-sm text-gray-600">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-orange-600 font-semibold hover:underline">
              {t('signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
