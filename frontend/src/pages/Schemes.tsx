import React, { useState, useEffect } from 'react'
import { 
  Wallet, ArrowRight, DollarSign, Shield, Leaf, CreditCard, Search, Filter, 
  ExternalLink, CheckCircle, AlertCircle, Clock, RefreshCw,
  Star, ChevronRight, X,
  Zap, Award, Target
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { API_ENDPOINTS, apiCall } from '../config/api'

interface Scheme {
  id: number
  name: { en: string; ml: string }
  description: { en: string; ml: string }
  tag: { en: string; ml: string }
  eligibility?: { en: string; ml: string }
  documents?: { en: string[]; ml: string[] }
  applicationProcess?: { en: string; ml: string }
  officialLink?: string
  category?: string
  recommendation?: {
    priority: string
    reason: string
    potential_benefit: string
    seasonal_benefit?: string
  }
}

interface RecommendationRequest {
  farmSize: string
  crops: string[]
  location: string
  farmingType: string
  annualIncome: string
  language: string
}

const Schemes: React.FC = () => {
  const { t, language } = useLanguage()
  
  // State management
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)
  const [showRecommendationForm, setShowRecommendationForm] = useState(false)
  const [recommendations, setRecommendations] = useState<Scheme[]>([])
  const [defaultRecommendations, setDefaultRecommendations] = useState<Scheme[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [currentSeason, setCurrentSeason] = useState('')
  const [generalAdvice, setGeneralAdvice] = useState('')
  
  // Recommendation form state
  const [farmProfile, setFarmProfile] = useState<RecommendationRequest>({
    farmSize: '',
    crops: [],
    location: '',
    farmingType: '',
    annualIncome: '',
    language: language
  })

  const categories = [
    { value: '', label: { en: 'All Categories', ml: 'എല്ലാ വിഭാഗങ്ങളും' } },
    { value: 'income_support', label: { en: 'Income Support', ml: 'വരുമാന പിന്തുണ' } },
    { value: 'insurance', label: { en: 'Insurance', ml: 'ഇൻഷുറൻസ്' } },
    { value: 'credit', label: { en: 'Credit', ml: 'വായ്പ' } },
    { value: 'soil_testing', label: { en: 'Soil Testing', ml: 'മണ്ണ് പരിശോധന' } }
  ]

  const farmingTypes = [
    { value: 'organic', label: { en: 'Organic Farming', ml: 'ജൈവകൃഷി' } },
    { value: 'traditional', label: { en: 'Traditional Farming', ml: 'പരമ്പരാഗത കൃഷി' } },
    { value: 'modern', label: { en: 'Modern Farming', ml: 'ആധുനിക കൃഷി' } },
    { value: 'mixed', label: { en: 'Mixed Farming', ml: 'മിശ്ര കൃഷി' } }
  ]

  const commonCrops = [
    { value: 'rice', label: { en: 'Rice', ml: 'നെല്ല്' } },
    { value: 'wheat', label: { en: 'Wheat', ml: 'ഗോതമ്പ്' } },
    { value: 'coconut', label: { en: 'Coconut', ml: 'തെങ്ങ്' } },
    { value: 'pepper', label: { en: 'Pepper', ml: 'കുരുമുളക്' } },
    { value: 'cardamom', label: { en: 'Cardamom', ml: 'ഏലം' } },
    { value: 'rubber', label: { en: 'Rubber', ml: 'റബ്ബർ' } },
    { value: 'vegetables', label: { en: 'Vegetables', ml: 'പച്ചക്കറികൾ' } }
  ]

  // Fetch data on component mount
  useEffect(() => {
    fetchSchemes()
    fetchDefaultRecommendations()
  }, [])

  const fetchSchemes = async () => {
    try {
      setLoading(true)
      const data = await apiCall(API_ENDPOINTS.SCHEMES)
      
      if (data.success) {
        setSchemes(data.data)
      }
    } catch (error) {
      console.error('Error fetching schemes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDefaultRecommendations = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.SCHEMES_DEFAULT)
      
      if (data.success) {
        setDefaultRecommendations(data.data.recommended_schemes)
        setCurrentSeason(data.data.season)
        setGeneralAdvice(data.data.general_advice)
      }
    } catch (error) {
      console.error('Error fetching default recommendations:', error)
    }
  }

  // Search and filter schemes
  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = !searchTerm || 
      scheme.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.description[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.tag[language].toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || scheme.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Get scheme recommendations
  const getRecommendations = async () => {
    try {
      setRecommendationLoading(true)
      const data = await apiCall(API_ENDPOINTS.SCHEMES_RECOMMEND, {
        method: 'POST',
        body: JSON.stringify({ ...farmProfile, language })
      })
      
      if (data.success) {
        setRecommendations(data.data.recommended_schemes)
        setShowRecommendationForm(false)
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
    } finally {
      setRecommendationLoading(false)
    }
  }

  const getIconForScheme = (category: string) => {
    switch (category) {
      case 'income_support': return DollarSign
      case 'insurance': return Shield
      case 'soil_testing': return Leaf
      case 'credit': return CreditCard
      default: return Wallet
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-md mx-auto">
      <div className="px-4 py-6 pb-20 space-y-6">{/* Added bottom padding for mobile nav */}

        {/* Current Season AI Recommendations */}
        {defaultRecommendations.length > 0 && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-surface-dark/60 dark:to-surface-dark/50 rounded-2xl p-6 border-2 border-primary-200 dark:border-primary-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary">
                  {t('seasonalRecommendations', { en: `${currentSeason} Season Picks`, ml: `${currentSeason} സീസൺ തിരഞ്ഞെടുപ്പുകൾ` })}
                </h2>
              </div>
              <div className="flex items-center text-xs text-primary-600 dark:text-primary-400">
                <Zap className="w-3 h-3 mr-1" />
                <span>{t('aiPowered', { en: 'AI Powered', ml: 'AI പവർഡ്' })}</span>
              </div>
            </div>
            
            {generalAdvice && (
              <div className="bg-white/80 dark:bg-background-dark/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-primary-100 dark:border-primary-900">
                <div className="flex items-start">
                  <Zap className="w-4 h-4 text-primary-500 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{generalAdvice}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {defaultRecommendations.slice(0, 3).map((scheme) => {
                const Icon = getIconForScheme(scheme.category || '')
                return (
                  <div 
                    key={scheme.id} 
                    className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-700 transition-all duration-400"
                    onClick={() => window.open(scheme.officialLink, '_blank')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-500 rounded-lg">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                            {scheme.name[language]}
                          </h3>
                          {scheme.recommendation && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(scheme.recommendation.priority)}`}>
                              {scheme.recommendation.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {scheme.description[language]}
                        </p>
                        {scheme.recommendation && (
                          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-2 mb-2">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              <strong>{t('seasonalBenefit', { en: 'Seasonal Benefit:', ml: 'സീസണൽ ആനുകൂല്യം:' })}</strong> 
                              {scheme.recommendation.seasonal_benefit || scheme.recommendation.reason}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                            {scheme.tag[language]}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}



        {/* Custom Recommendations Display */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center mb-3">
              <Award className="w-5 h-5 text-purple-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('personalizedRecommendations', { en: 'Your Personalized Recommendations', ml: 'നിങ്ങളുടെ വ്യക്തിഗത ശുപാർശകൾ' })}
              </h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((scheme) => {
                const Icon = getIconForScheme(scheme.category || '')
                return (
                  <div 
                    key={scheme.id} 
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300"
                    onClick={() => window.open(scheme.officialLink, '_blank')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {scheme.name[language]}
                          </h4>
                          {scheme.recommendation && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(scheme.recommendation.priority)}`}>
                              {scheme.recommendation.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {scheme.description[language]}
                        </p>
                        {scheme.recommendation && (
                          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-2 mb-2">
                            <p className="text-xs text-purple-800 dark:text-purple-200">
                              <strong>{t('whyRecommended', { en: 'Why recommended:', ml: 'എന്തുകൊണ്ട് ശുപാർശ ചെയ്യുന്നു:' })}</strong> {scheme.recommendation.reason}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {scheme.tag[language]}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('loadingSchemes', { en: 'Loading schemes...', ml: 'പദ്ധതികൾ ലോഡ് ചെയ്യുന്നു...' })}
              </p>
            </div>
          </div>
        )}

        {/* Mobile-Optimized Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 py-2">
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-text-primary">
            {t('allSchemes', { en: 'All Schemes', ml: 'എല്ലാ പദ്ധതികളും' })}
          </h1>
          
          <div className="flex items-center space-x-2">
            {/* Search Icon - Functional */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`p-3 rounded-full transition-all duration-200 active:scale-95 ${
                showSearch 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              aria-label={t('search', { en: 'Search', ml: 'തിരയുക' })}
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Filter Button */}
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`p-3 rounded-full transition-all duration-200 active:scale-95 ${
                showFilter
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              aria-label={t('filter', { en: 'Filter', ml: 'ഫിൽട്ടർ' })}
            >
              <Filter className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Search Bar - Conditional */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchSchemes', { en: 'Search schemes...', ml: 'പദ്ധതികൾ തിരയുക...' })}
                className="w-full px-4 py-3 pl-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>
          </div>
        )}

        {/* Filter Dropdown - Conditional */}
        {showFilter && (
          <div className="mb-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none text-gray-900 dark:text-text-primary shadow-card"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* All Schemes List - Mobile Optimized */}
        {!loading && (
          <>
            
            <div className="space-y-3">
              {filteredSchemes.map((scheme) => {
                const Icon = getIconForScheme(scheme.category || '')
                return (
                  <div 
                    key={scheme.id} 
                    className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-700 transition-all duration-400 active:scale-98"
                    onClick={() => setSelectedScheme(scheme)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-text-primary text-sm line-clamp-1">
                            {scheme.name[language]}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {scheme.officialLink && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(scheme.officialLink, '_blank')
                                }}
                                className="p-1 text-green-600 dark:text-green-400 rounded-full transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-text-secondary line-clamp-2 mb-3">
                          {scheme.description[language]}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                            {scheme.tag[language]}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('tapForDetails', { en: 'Tap for details', ml: 'വിശദാംശങ്ങൾക്ക് ടാപ്പ് ചെയ്യുക' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {filteredSchemes.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('noSchemesFound', { en: 'No schemes found matching your criteria.', ml: 'നിങ്ങളുടെ മാനദണ്ഡങ്ങൾക്ക് അനുയോജ്യമായ പദ്ധതികൾ കണ്ടെത്തിയില്ല.' })}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile-Optimized Recommendation Form Modal */}
      {showRecommendationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:mx-4 max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('farmProfile', { en: 'Your Farm Profile', ml: 'നിങ്ങളുടെ ഫാം പ്രൊഫൈൽ' })}
                </h3>
                <button
                  onClick={() => setShowRecommendationForm(false)}
                  className="p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('farmSize', { en: 'Farm Size', ml: 'ഫാം വലുപ്പം' })}
                </label>
                <input
                  type="text"
                  value={farmProfile.farmSize}
                  onChange={(e) => setFarmProfile(prev => ({ ...prev, farmSize: e.target.value }))}
                  placeholder={t('farmSizePlaceholder', { en: 'e.g., 2 acres', ml: 'ഉദാ: 2 ഏക്കർ' })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('location', { en: 'Location', ml: 'സ്ഥലം' })}
                </label>
                <input
                  type="text"
                  value={farmProfile.location}
                  onChange={(e) => setFarmProfile(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={t('locationPlaceholder', { en: 'e.g., Kerala, India', ml: 'ഉദാ: കേരളം, ഇന്ത്യ' })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('farmingType', { en: 'Farming Type', ml: 'കൃഷി രീതി' })}
                </label>
                <select
                  value={farmProfile.farmingType}
                  onChange={(e) => setFarmProfile(prev => ({ ...prev, farmingType: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('selectFarmingType', { en: 'Select farming type', ml: 'കൃഷി രീതി തിരഞ്ഞെടുക്കുക' })}</option>
                  {farmingTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('annualIncome', { en: 'Annual Income', ml: 'വാർഷിക വരുമാനം' })}
                </label>
                <input
                  type="text"
                  value={farmProfile.annualIncome}
                  onChange={(e) => setFarmProfile(prev => ({ ...prev, annualIncome: e.target.value }))}
                  placeholder={t('incomeePlaceholder', { en: 'e.g., ₹2,00,000', ml: 'ഉദാ: ₹2,00,000' })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('cropsGrown', { en: 'Crops Grown', ml: 'കൃഷി ചെയ്യുന്ന വിളകൾ' })}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {commonCrops.map(crop => (
                    <label key={crop.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={farmProfile.crops.includes(crop.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFarmProfile(prev => ({ ...prev, crops: [...prev.crops, crop.value] }))
                          } else {
                            setFarmProfile(prev => ({ ...prev, crops: prev.crops.filter(c => c !== crop.value) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {crop.label[language]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecommendationForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
                >
                  {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
                </button>
                <button
                  onClick={getRecommendations}
                  disabled={recommendationLoading}
                  className="flex-1 btn-primary text-sm"
                >
                  {recommendationLoading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      {t('analyzing', { en: 'Analyzing...', ml: 'വിശകലനം ചെയ്യുന്നു...' })}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('getRecommendations', { en: 'Get Recommendations', ml: 'ശുപാർശകൾ നേടുക' })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Scheme Details Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {(() => {
                    const Icon = getIconForScheme(selectedScheme.category || '')
                    return <Icon className="w-6 h-6 text-primary-500 mr-3" />
                  })()}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedScheme.name[language]}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedScheme(null)}
                  className="p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  {t('description', { en: 'Description', ml: 'വിവരണം' })}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {selectedScheme.description[language]}
                </p>
              </div>

              {selectedScheme.eligibility && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    {t('eligibility', { en: 'Eligibility', ml: 'യോഗ്യത' })}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedScheme.eligibility[language]}
                  </p>
                </div>
              )}

              {selectedScheme.documents && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                    <Wallet className="w-4 h-4 mr-2 text-blue-500" />
                    {t('requiredDocuments', { en: 'Required Documents', ml: 'ആവശ്യമായ രേഖകൾ' })}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                    {selectedScheme.documents[language].map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScheme.applicationProcess && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                    <ArrowRight className="w-4 h-4 mr-2 text-orange-500" />
                    {t('applicationProcess', { en: 'How to Apply', ml: 'എങ്ങനെ അപേക്ഷിക്കാം' })}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedScheme.applicationProcess[language]}
                  </p>
                </div>
              )}

              {selectedScheme.recommendation && (
                <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center text-sm">
                    <Target className="w-4 h-4 mr-2" />
                    {t('aiRecommendation', { en: 'AI Recommendation', ml: 'AI ശുപാർശ' })}
                  </h4>
                  <p className="text-green-800 dark:text-green-200 text-xs mb-1">
                    <strong>{t('priority', { en: 'Priority:', ml: 'മുൻഗണന:' })}</strong> {selectedScheme.recommendation.priority}
                  </p>
                  <p className="text-green-800 dark:text-green-200 text-xs">
                    <strong>{t('reason', { en: 'Reason:', ml: 'കാരണം:' })}</strong> {selectedScheme.recommendation.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedScheme(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
                >
                  {t('close', { en: 'Close', ml: 'അടയ്ക്കുക' })}
                </button>
                {selectedScheme.officialLink && (
                  <button
                    onClick={() => window.open(selectedScheme.officialLink, '_blank')}
                    className="flex-1 btn-primary text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('applyNow', { en: 'Apply Now', ml: 'ഇപ്പോൾ അപേക്ഷിക്കുക' })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Schemes