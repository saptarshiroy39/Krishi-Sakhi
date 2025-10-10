import React, { useState } from 'react'
import { Bell, CheckCircle, Trash2, Search } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotifications } from '../contexts/NotificationContext'

const Notifications: React.FC = () => {
  const { t } = useLanguage()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications()

  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return t('justNow', { en: 'Just now', ml: 'ഇപ്പോൾ തന്നെ' })
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return t('minutesAgo', { en: `${minutes}m ago`, ml: `${minutes} മിനിറ്റ് മുമ്പ്` })
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return t('hoursAgo', { en: `${hours}h ago`, ml: `${hours} മണിക്കൂർ മുമ്പ്` })
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return t('daysAgo', { en: `${days}d ago`, ml: `${days} ദിവസം മുമ്പ്` })
    }
  }

  const handleToggleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchTerm('')
    }
  }

  // Filter notifications by search term
  const filteredNotifications = React.useMemo(() => {
    if (!searchTerm) {
      return notifications
    }
    
    return notifications.filter(notification => 
      notification.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.title.ml.includes(searchTerm) ||
      notification.message.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.ml.includes(searchTerm)
    )
  }, [notifications, searchTerm])

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="px-4 py-4 pb-20 max-w-md mx-auto">
        
        {/* Mobile-Optimized Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 py-2">
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-text-primary">
            {t('notifications', { en: 'Notifications', ml: 'അറിയിപ്പുകൾ' })}
          </h1>
          
          <div className="flex items-center space-x-2">
            {/* Search Icon */}
            <button 
              onClick={handleToggleSearch}
              className={`p-3 rounded-full transition-all duration-200 active:scale-95 ${
                showSearch 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              aria-label={t('search', { en: 'Search', ml: 'തിരയുക' })}
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all duration-200 active:scale-95"
                title={t('markAllRead', { en: 'Mark all as read', ml: 'എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക' })}
              >
                <CheckCircle className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
            
            {/* Clear All Button */}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="p-3 rounded-full bg-red-500 dark:bg-red-600 text-white transition-all duration-200 active:scale-95"
                title={t('clearAll', { en: 'Clear all', ml: 'എല്ലാം മായ്ക്കുക' })}
              >
                <Trash2 className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchNotifications', { en: 'Search notifications...', ml: 'അറിയിപ്പുകൾ തിരയുക...' })}
                className="w-full px-4 py-3 pl-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>
          </div>
        )}

        {/* Content */}
        {filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary mb-2">
              {t('noNotifications', { en: 'No notifications', ml: 'അറിയിപ്പുകളൊന്നുമില്ല' })}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('noNotificationsDesc', { en: 'You\'re all caught up! Check back later for updates.', ml: 'നിങ്ങൾ എല്ലാം കണ്ടു കഴിഞ്ഞു! അപ്ഡേറ്റുകൾക്കായി പിന്നീട് വീണ്ടും നോക്കുക.' })}
            </p>
          </div>
        ) : (
          /* Notification List */
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-600"
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Notification Icon with Number */}
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                      {filteredNotifications.length - index}
                    </span>
                  </div>
                  
                  {/* Notification Content */}
                  <div className="flex-1 text-left min-w-0">
                    <h4 className={`text-base font-semibold leading-snug min-h-[2.5rem] line-clamp-2 ${
                      notification.isRead 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-primary-900 dark:text-primary-100'
                    }`}>
                      {notification.title.en}
                    </h4>
                    
                    <p className={`text-sm mb-2 leading-relaxed ${
                      notification.isRead 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-primary-800 dark:text-primary-200'
                    }`}>
                      {notification.message.en}
                    </p>
                    
                    {/* Timestamp and Status */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{getTimeAgo(notification.timestamp)}</span>
                      {!notification.isRead && (
                        <>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                              {t('unread', { en: 'New', ml: 'പുതിയത്' })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    className="p-2.5 text-red-500 dark:text-red-400 rounded-xl opacity-60"
                    title={t('delete', { en: 'Delete', ml: 'ഇല്ലാതാക്കുക' })}
                    aria-label={t('delete', { en: 'Delete', ml: 'ഇല്ലാതാക്കുക' })}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
