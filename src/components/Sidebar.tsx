'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  LayoutDashboard,
  Scale,
  CheckSquare,
  Camera,
  TrendingUp,
  Shield,
  LogOut,
  Leaf,
  MessageCircle,
  X,
} from 'lucide-react'
import LanguageToggle from './ui/LanguageToggle'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { href: '/dashboard/weight', icon: Scale, labelKey: 'weightTracking' as const },
  { href: '/dashboard/checkin', icon: CheckSquare, labelKey: 'dailyCheckin' as const },
  { href: '/dashboard/photos', icon: Camera, labelKey: 'photos' as const },
  { href: '/dashboard/progress', icon: TrendingUp, labelKey: 'progress' as const },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { logout, userProfile } = useAuth()
  const { t } = useLanguage()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">HerbaCoach</span>
              <p className="text-xs text-gray-400">Weight Loss Coach</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
              {userProfile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{userProfile?.fullName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{userProfile?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, labelKey }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={pathname === href ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{t(labelKey)}</span>
            </Link>
          ))}

          {userProfile?.isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className={pathname.startsWith('/admin') ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>{t('admin')}</span>
            </Link>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="px-4 py-3">
            <LanguageToggle />
          </div>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '+919876543210'}?text=${encodeURIComponent(t('whatsappMessage'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{t('contactCoach')}</span>
          </a>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
