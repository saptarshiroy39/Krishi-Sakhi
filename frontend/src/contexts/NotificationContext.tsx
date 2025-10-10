import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Notification {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: { en: string; ml: string }
  message: { en: string; ml: string }
  timestamp: Date
  isRead: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  deleteNotification: (id: number) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: { en: 'Weather Alert', ml: 'കാലാവസ്ഥാ മുന്നറിയിപ്പ്' },
      message: { en: 'Perfect weather conditions for planting rice this week', ml: 'ഈ ആഴ്ച നെല്ല് നടാൻ അനുയോജ്യമായ കാലാവസ്ഥ' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false
    },
    {
      id: 2,
      type: 'info',
      title: { en: 'New Scheme Available', ml: 'പുതിയ പദ്ധതി ലഭ്യം' },
      message: { en: 'PM-KISAN scheme benefits are now available for your region', ml: 'PM-KISAN പദ്ധതിയുടെ ആനുകൂല്യങ്ങൾ നിങ്ങളുടെ പ്രദേശത്ത് ലഭ്യമാണ്' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: true
    },
    {
      id: 3,
      type: 'warning',
      title: { en: 'Pest Alert', ml: 'കീട മുന്നറിയിപ്പ്' },
      message: { en: 'Brown plant hopper detected in nearby farms. Take preventive measures', ml: 'സമീപത്തെ കൃഷിയിടങ്ങളിൽ തവിട്ട് ചാടുന്ന പുഴു കണ്ടെത്തി. പ്രതിരോധ നടപടികൾ സ്വീകരിക്കുക' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      isRead: false
    },
    {
      id: 4,
      type: 'info',
      title: { en: 'Market Price Update', ml: 'മാർക്കറ്റ് വില അപ്ഡേറ്റ്' },
      message: { en: 'Rice prices increased by 5% in Kochi market', ml: 'കൊച്ചി മാർക്കറ്റിൽ നെല്ലിന്റെ വില 5% വർദ്ധിച്ചു' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true
    },
    {
      id: 5,
      type: 'error',
      title: { en: 'Activity Reminder', ml: 'പ്രവർത്തന ഓർമ്മപ്പെടുത്തൽ' },
      message: { en: 'You have 3 pending farming activities scheduled for today', ml: 'ഇന്നത്തേക്ക് ഷെഡ്യൂൾ ചെയ്ത 3 കാർഷിക പ്രവർത്തനങ്ങൾ ബാക്കിയുണ്ട്' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      isRead: false
    }
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
