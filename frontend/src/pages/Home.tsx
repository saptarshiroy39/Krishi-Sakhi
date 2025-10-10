import React, { useState, useEffect } from 'react'
import { 
  Sparkles, Thermometer, Droplets, Wind, MapPin, Zap, CheckCircle, Trees, Cloud,
  RefreshCw
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { Link } from 'react-router-dom'
import { API_ENDPOINTS, apiCall } from '../config/api'
import LoadingSpinner from '../components/LoadingSpinner'





interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
  feels_like: number;
  location: string;
}

interface DashboardStats {
  total_crops: number;
  active_tasks: number;
  upcoming_activities: number;
  weather_alerts: number;
  recent_activities_count: number;
}

interface QuickOption {
  id: number;
  title: string;
  icon: string;
  action: string;
  query: string;
}

interface QuickOptionsData {
  options: QuickOption[];
  generated_at: string;
  cache_key: string;
  expires_at: string;
}

interface DashboardData {
  weather: WeatherData | null;
  advisory: string;
  stats: DashboardStats;
  last_updated: string;
}

const Home: React.FC = () => {
  const { t } = useLanguage()

  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [quickOptions, setQuickOptions] = useState<QuickOptionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('Kochi')
  const [userName, setUserName] = useState('Ramesh')
  const [pendingActivities, setPendingActivities] = useState(0)
  const [totalFarms, setTotalFarms] = useState(0)
  const [isGeneratingAdvisory, setIsGeneratingAdvisory] = useState(false)
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false)
  
  // Cache flag to prevent unnecessary API calls
  const [dataLoaded, setDataLoaded] = useState(false)

  // Fetch dashboard data with advisory
  const fetchDashboardData = async (includeAdvisory = true) => {
    try {
      setIsRefreshingWeather(true)
      console.log('Fetching dashboard data for location:', location)
      // Add generate_advisory parameter to fetch advisory on initial load
      const endpoint = includeAdvisory 
        ? `${API_ENDPOINTS.HOME_DASHBOARD(location)}&generate_advisory=true`
        : API_ENDPOINTS.HOME_DASHBOARD(location)
      
      const data = await apiCall(endpoint)
      console.log('Dashboard data received:', data)
      
      if (data.success) {
        console.log('Setting dashboard data with weather:', data.data.weather)
        setDashboardData(data.data)
        setDataLoaded(true) // Mark data as loaded
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsRefreshingWeather(false)
    }
  }

  // Fetch activities data
  const fetchActivitiesData = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.ACTIVITIES)
      if (data.success) {
        const pending = data.data.filter((activity: any) => activity.status === 'pending').length
        setPendingActivities(pending)
      }
    } catch (error) {
      console.error('Error fetching activities data:', error)
      setPendingActivities(0)
    }
  }

  // Fetch quick options data
  const fetchQuickOptions = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.HOME_QUICK_OPTIONS)
      if (data.success) {
        setQuickOptions(data.data)
      }
    } catch (error) {
      console.error('Error fetching quick options:', error)
    }
  }

  // Handle quick option click
  const handleQuickOptionClick = (option: QuickOption) => {
    // Navigate to chat with pre-filled query
    window.location.href = `/chat?q=${encodeURIComponent(option.query)}`
  }

  // Fetch profile data (for user name, location, and farms count)
  const fetchProfileData = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.PROFILE_BY_ID(1))
      console.log('Profile API response:', data)
      
      if (data.success) {
        // Update user name
        if (data.name) {
          setUserName(data.name)
        }
        
        // Update location
        if (data.location || data.city) {
          setLocation(data.location || data.city)
        }
        
        // Update farms count
        if (data.farms) {
          setTotalFarms(data.farms.length)
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Keep default values on error
      setUserName('Ramesh Kumar')
      setLocation('Kochi')
      setTotalFarms(0)
    }
  }



  // Generate advisory
  const generateAdvisory = async () => {
    setIsGeneratingAdvisory(true)
    try {
      const data = await apiCall(API_ENDPOINTS.HOME_ADVISORY_REGENERATE, {
        method: 'POST',
        body: JSON.stringify({ location })
      })
      
      if (data.success && dashboardData) {
        setDashboardData({
          ...dashboardData,
          advisory: data.data.advisory,
          last_updated: data.data.generated_at
        })
      }
    } catch (error) {
      console.error('Error generating advisory:', error)
    } finally {
      setIsGeneratingAdvisory(false)
    }
  }



  // Load data on component mount - only if not already loaded
  useEffect(() => {
    const loadData = async () => {
      // Skip if data already loaded (cached)
      if (dataLoaded) {
        console.log('Using cached data, skipping API calls')
        setLoading(false)
        return
      }
      
      setLoading(true)
      // First fetch profile data (which includes location)
      await fetchProfileData()
      // Then fetch other data
      await Promise.all([
        fetchDashboardData(),
        fetchActivitiesData(),
        fetchQuickOptions()
      ])
      setLoading(false)
    }
    
    loadData()
  }, []) // Empty dependency array - only run once on mount

  // Auto-refresh quick options every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQuickOptions()
    }, 3 * 60 * 1000) // 3 minutes

    return () => clearInterval(interval)
  }, [])

  // Refresh dashboard data when location changes (only if data was already loaded)
  useEffect(() => {
    if (dataLoaded && location !== 'Kochi') {
      // Only refetch if data was already loaded and location actually changed
      fetchDashboardData()
    }
  }, [location])





  if (loading) {
    return (
      <LoadingSpinner 
        message={t('loadingDashboard', { en: 'Loading dashboard...', ml: 'ഡാഷ്ബോർഡ് ലോഡ് ചെയ്യുന്നു...' })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Header */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-3">
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-text-primary">
              {t('welcome', { en: `Welcome, ${userName}`, ml: `സ്വാഗതം, ${userName}` })}
            </h1>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-600 dark:text-text-secondary text-sm">
                {location}
              </span>
            </div>
          </div>
        </div>



        {/* Weather Widget - Full Width */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-6 rounded-2xl text-left border-2 border-blue-200 dark:border-blue-800 block">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              {t('weather', { en: 'Weather', ml: 'കാലാവസ്ഥ' })}
            </h2>
            <button 
              onClick={() => fetchDashboardData(false)}
              disabled={isRefreshingWeather}
              className="p-2 text-blue-600 dark:text-blue-400 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              title="Refresh weather data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {dashboardData?.weather ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/60 dark:bg-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Thermometer className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{dashboardData.weather.temperature}°C</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Temperature</p>
              </div>
              
              <div className="text-center p-4 bg-white/60 dark:bg-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Droplets className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{dashboardData.weather.humidity}%</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Humidity</p>
              </div>
              
              <div className="text-center p-4 bg-white/60 dark:bg-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Wind className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{dashboardData.weather.wind_speed} m/s</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Wind Speed</p>
              </div>
              
              <div className="text-center p-4 bg-white/60 dark:bg-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Cloud className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1 capitalize">{dashboardData.weather.description}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Condition</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Cloud className="w-12 h-12 text-blue-400 dark:text-blue-300 mx-auto mb-2" />
              <p className="text-blue-600 dark:text-blue-300">Loading weather data...</p>
            </div>
          )}
        </div>

        {/* Quick Options - Dynamic Content */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              {t('quickOptions', { en: 'Quick Options', ml: 'ദ്രുത ഓപ്ഷനുകൾ' })}
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('updatesEvery3Min', { en: 'Updates every 3 min', ml: '3 മിനിറ്റിൽ അപ്ഡേറ്റ്' })}
            </div>
          </div>
          
          {quickOptions ? (
            <div className="grid grid-cols-1 gap-3">
              {quickOptions.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleQuickOptionClick(option)}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700 text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-text-primary text-sm">
                        {option.title}
                      </h3>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {t('tapToLearnMore', { en: 'Tap to learn more', ml: 'കൂടുതൽ അറിയാൻ ടാപ്പ് ചെയ്യൂ' })}
                      </p>
                    </div>
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-300 text-xs">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
              <p className="text-purple-600 dark:text-purple-400 text-sm">
                {t('loadingOptions', { en: 'Loading smart options...', ml: 'സ്മാർട്ട് ഓപ്ഷനുകൾ ലോഡ് ചെയ്യുന്നു...' })}
              </p>
            </div>
          )}
        </div>

        {/* Activities and Farms Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Activities Card */}
          <Link
            to="/activities"
            className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border-2 border-green-200 dark:border-green-700"
          >
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-text-primary text-sm mb-1">
              {t('activities', { en: 'Activities', ml: 'പ്രവർത്തികൾ' })}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {pendingActivities}
              </span>
              <span className="text-xs text-green-600 dark:text-green-400">
                {t('pending', { en: 'Pending', ml: 'കാത്തിരിക്കുന്ന' })}
              </span>
            </div>
          </Link>

          {/* Farms Card */}
          <Link
            to="/profile"
            className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-700"
          >
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-3">
              <Trees className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-text-primary text-sm mb-1">
              {t('farms', { en: 'Farms', ml: 'കൃഷിയിടം' })}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {totalFarms}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {t('total', { en: 'Total', ml: 'ആകെ' })}
              </span>
            </div>
          </Link>
        </div>

        {/* AI-Powered Advisory Card */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-surface-dark/60 dark:to-surface-dark/50 rounded-2xl p-6 border-2 border-primary-200 dark:border-primary-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary">
                {t('aiAdvisory', { en: "AI Farming Advisory", ml: 'AI കൃഷി ഉപദേശം' })}
              </h2>
            </div>
            <button
              onClick={generateAdvisory}
              disabled={isGeneratingAdvisory}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 dark:disabled:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              {isGeneratingAdvisory ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('generating', { en: 'Generating...', ml: 'സൃഷ്ടിക്കുന്നു...' })}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('generate', { en: 'Generate', ml: 'സൃഷ്ടിക്കുക' })}
                </>
              )}
            </button>
          </div>
          
          {dashboardData?.advisory ? (
            <div className="bg-white/80 dark:bg-background-dark/50 backdrop-blur-sm rounded-xl p-4 border border-primary-100 dark:border-primary-900">
              <div className="text-gray-700 dark:text-gray-300">
                <div className="space-y-3">
                  {dashboardData.advisory.split('\n').map((line: string, index: number) => (
                    line.trim() && (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm leading-relaxed">{line.trim()}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary-100 dark:border-primary-800">
                <div className="flex items-center text-xs text-primary-600 dark:text-primary-400">
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>{t('poweredByAI', { en: 'Powered by AI', ml: 'AI പവർഡ്' })}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(dashboardData.last_updated).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-background-dark/50 backdrop-blur-sm rounded-xl p-4 text-center border border-primary-100 dark:border-primary-900">
              <Zap className="w-12 h-12 text-primary-400 mx-auto mb-3" />
              <p className="text-primary-600 dark:text-primary-400 font-medium">
                {t('clickToGenerate', { en: 'Click Generate to get AI farming advisory', ml: 'AI കൃഷി ഉപദേശം ലഭിക്കാൻ ജനറേറ്റ് ക്ലിക്ക് ചെയ്യൂ' })}
              </p>
            </div>
          )}
        </div>



      </div>
    </div>
  )
}

export default Home