import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, CheckCircle, Bot, Brain, Clipboard } from 'lucide-react'
import { clsx } from 'clsx'

const BottomNav: React.FC = () => {
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      icon: Home
    },
    {
      path: '/activities',
      icon: CheckCircle
    },
    {
      path: '/chat',
      icon: Bot
    },
    {
      path: '/knowledge',
      icon: Brain
    },
    {
      path: '/schemes',
      icon: Clipboard
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
      <div className="max-w-sm mx-auto">
        <div className="bg-white/10 dark:bg-black/10 backdrop-blur-3xl backdrop-saturate-150 backdrop-brightness-110 border border-white/20 dark:border-white/20 rounded-3xl px-4 py-3 shadow-2xl shadow-black/30 dark:shadow-black/70" style={{ backdropFilter: 'blur(60px) saturate(150%) brightness(110%)' }}>
          <div className="flex justify-between items-center px-2">
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-200',
                  isActive 
                    ? 'bg-emerald-600 shadow-lg shadow-emerald-600/25' 
                    : 'bg-slate-100 dark:bg-slate-800'
                )}
              >
                {/* Icon */}
                <Icon 
                  className={clsx(
                    isActive 
                      ? 'w-5 h-5 text-white' 
                      : 'w-5 h-5 text-slate-600 dark:text-slate-400'
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />

              </Link>
            )
          })}
        </div>
      </div>
    </div>
    </nav>
  )
}

export default BottomNav