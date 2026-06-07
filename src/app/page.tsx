'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageToggle from '@/components/ui/LanguageToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Scale,
  Camera,
  TrendingDown,
  MessageCircle,
  Star,
  CheckCircle,
  ArrowRight,
  Users,
  Award,
  Heart,
  Leaf,
} from 'lucide-react'

const testimonials = [
  { name: 'Priya Sundaram', loss: '12 kg', duration: '3 months', image: '👩', rating: 5 },
  { name: 'Karthik Rajan', loss: '18 kg', duration: '5 months', image: '👨', rating: 5 },
  { name: 'Meena Krishnan', loss: '8 kg', duration: '2 months', image: '👩', rating: 5 },
]

export default function LandingPage() {
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">HerbaCoach</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/login" className="text-gray-600 font-medium hover:text-orange-600 transition-colors px-3 py-2">
              {t('login')}
            </Link>
            <Link href="/register" className="btn-primary py-2 px-5 text-sm">
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 min-h-screen flex items-center bg-gradient-to-br from-orange-50 via-white to-green-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <span>🌿</span>
                <span>Herbalife Wellness Coach</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                {t('heroTitle')}
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary flex items-center gap-2">
                  {t('getStarted')} <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '+919876543210'}?text=${encodeURIComponent(t('whatsappMessage'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-green flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('whatsappCoach')}
                </a>
              </div>
              <div className="mt-10 flex items-center gap-8">
                {[
                  { value: '500+', label: 'Happy Clients' },
                  { value: '95%', label: 'Success Rate' },
                  { value: '5★', label: 'Rating' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="w-80 h-80 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-10 absolute inset-0 m-auto" />
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  {[
                    { icon: Scale, label: 'Weight Tracking', color: 'orange' },
                    { icon: Camera, label: 'Progress Photos', color: 'green' },
                    { icon: TrendingDown, label: 'Progress Charts', color: 'blue' },
                    { icon: MessageCircle, label: 'WhatsApp Support', color: 'purple' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${color}-600`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">{t('featuresTitle')}</h2>
            <p className="mt-3 text-gray-500 text-lg">Everything you need for your transformation journey</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: t('feature1Title'), desc: t('feature1Desc'), color: 'rose', bg: 'rose' },
              { icon: Users, title: t('feature2Title'), desc: t('feature2Desc'), color: 'blue', bg: 'blue' },
              { icon: TrendingDown, title: t('feature3Title'), desc: t('feature3Desc'), color: 'green', bg: 'green' },
              { icon: MessageCircle, title: t('feature4Title'), desc: t('feature4Desc'), color: 'purple', bg: 'purple' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card-hover group cursor-pointer text-center">
                <div className={`w-14 h-14 rounded-2xl bg-${bg}-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-7 h-7 text-${color}-600`} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-green-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">How It Works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register', desc: 'Create your account with your health goals and details', icon: Users },
              { step: '02', title: 'Start Program', desc: 'Get your personalized Herbalife nutrition plan', icon: Leaf },
              { step: '03', title: 'Track & Transform', desc: 'Log daily check-ins and watch your progress', icon: Award },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="relative inline-block mb-5">
                  <div className="w-16 h-16 rounded-full bg-orange-500 text-white font-bold text-xl flex items-center justify-center mx-auto">
                    {step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">{t('testimonialsTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t_) => (
              <div key={t_.name} className="card border border-orange-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{t_.image}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{t_.name}</div>
                    <div className="text-sm text-gray-500">{t_.duration}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t_.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">Lost {t_.loss}</div>
                <p className="text-gray-600 text-sm">
                  &ldquo;Amazing transformation! The daily tracking and coach support made all the difference.&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Start Your Transformation Today</h2>
          <p className="text-orange-100 text-lg mb-8">Join 500+ happy clients who have transformed their lives</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-2">
              {t('getStarted')} <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '+919876543210'}?text=${encodeURIComponent('Hi! I want to start my Herbalife journey.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">HerbaCoach</span>
            </div>
            <p className="text-sm">&copy; {new Date().getFullYear()} HerbaCoach. All rights reserved.</p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-orange-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
