import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon, Globe, Sprout } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotifications } from '../contexts/NotificationContext'

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const { toggleLanguage, t } = useLanguage()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[60] transition-all duration-300"
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)',
        width: '100%',
        background: isScrolled 
          ? theme === 'dark'
            ? 'linear-gradient(to bottom, #1E2622 0%, #1E2622 70%, rgba(30, 38, 34, 0) 100%)'
            : 'linear-gradient(to bottom, #FAFBFC 0%, #FAFBFC 70%, rgba(250, 251, 252, 0) 100%)'
          : theme === 'dark' 
            ? '#1E2622'
            : '#FAFBFC'
      }}
    >
      <div className="w-full">
        <div className="px-5 py-4">
          <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)' }}>
              <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-text-primary tracking-wide" style={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', letterSpacing: '-0.02em' }}>
              Krishi Sakhi
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button 
              onClick={() => navigate('/notifications')}
              className="relative w-9 h-9 text-gray-600 dark:text-gray-300 rounded-[14px] border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all active:scale-95"
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={2.2} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 text-gray-600 dark:text-gray-300 rounded-[14px] border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all active:scale-95"
              aria-label={t('toggleTheme', { en: 'Toggle theme', ml: 'തീം മാറ്റുക' })}
            >
              {theme === 'light' ? (
                <Moon className="w-[18px] h-[18px]" strokeWidth={2.2} />
              ) : (
                <Sun className="w-[18px] h-[18px]" strokeWidth={2.2} />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="w-9 h-9 text-gray-600 dark:text-gray-300 rounded-[14px] border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all active:scale-95"
              aria-label={t('toggleLanguage', { en: 'Toggle language', ml: 'ഭാഷ മാറ്റുക' })}
            >
              <Globe className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </button>

            {/* User Profile */}
            <Link 
              to="/profile"
              className="flex items-center justify-center w-9 h-9 text-white rounded-[14px] border border-gray-300 dark:border-gray-700 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)' }}
            >
              <span className="font-semibold text-sm">R</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </header>
  )
}

export default Header