import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle, Clock, Edit2, Trash2, X, Save, RotateCcw, AlertTriangle, Search } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { API_ENDPOINTS, apiCall } from '../config/api'
import LoadingSpinner from '../components/LoadingSpinner'

interface Activity {
  id: number;
  name: { en: string; ml: string };
  date: string;
  status: 'completed' | 'pending';
  description?: { en: string; ml: string };
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  photos?: string[];
}

interface ActivityTemplate {
  id: string;
  name: { en: string; ml: string };
  description: { en: string; ml: string };
  icon: string;
}

const activityTemplates: ActivityTemplate[] = [
  {
    id: 'watering',
    name: { en: 'Watering', ml: 'വെള്ളം നൽകൽ' },
    description: { en: 'Water the crops and plants', ml: 'വിളകൾക്കും ചെടികൾക്കും വെള്ളം നൽകുക' },
    icon: '💧'
  },
  {
    id: 'fertilizing',
    name: { en: 'Fertilizing', ml: 'വളം ഇടൽ' },
    description: { en: 'Apply fertilizer to improve soil nutrients', ml: 'മണ്ണിന്റെ പോഷകങ്ങൾ മെച്ചപ്പെടുത്താൻ വളം പ്രയോഗിക്കുക' },
    icon: '🌱'
  },
  {
    id: 'weeding',
    name: { en: 'Weeding', ml: 'കളകൾ നീക്കൽ' },
    description: { en: 'Remove weeds from the field', ml: 'വയലിൽ നിന്ന് കളകൾ നീക്കം ചെയ്യുക' },
    icon: '🌿'
  },
  {
    id: 'planting',
    name: { en: 'Planting', ml: 'നടീൽ' },
    description: { en: 'Plant seeds or seedlings', ml: 'വിത്തുകളോ തൈകളോ നടുക' },
    icon: '🌾'
  },
  {
    id: 'harvesting',
    name: { en: 'Harvesting', ml: 'വിളവെടുപ്പ്' },
    description: { en: 'Harvest mature crops', ml: 'പാകമായ വിളകൾ വിളവെടുക്കുക' },
    icon: '🚜'
  },
  {
    id: 'spraying',
    name: { en: 'Pest Control', ml: 'കീടനിയന്ത്രണം' },
    description: { en: 'Apply pesticides or organic pest control', ml: 'കീടനാശിനികളോ ജൈവിക കീടനിയന്ത്രണമോ പ്രയോഗിക്കുക' },
    icon: '🚿'
  }
]

const Activities: React.FC = () => {
  const { t } = useLanguage()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAll, setShowAll] = useState(false)
  const [editingActivity, setEditingActivity] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all')

  const [newActivity, setNewActivity] = useState({
    name: { en: '', ml: '' },
    date: '',
    description: { en: '', ml: '' },
    recurring: null as 'daily' | 'weekly' | 'monthly' | null
  })

  // Fetch activities from database
  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall(API_ENDPOINTS.ACTIVITIES)
      if (response.success) {
        setActivities(response.data)
      } else {
        setError('Failed to fetch activities')
      }
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }

  // Function handlers
  const handleAddActivity = () => {
    setShowTemplates(true)
  }

  const handleTemplateSelect = (template: ActivityTemplate) => {
    setNewActivity({
      name: template.name,
      date: new Date().toISOString().split('T')[0],
      description: template.description,
      recurring: null
    })
    setShowTemplates(false)
    setShowAddModal(true)
  }

  const handleCustomActivity = () => {
    setNewActivity({
      name: { en: '', ml: '' },
      date: new Date().toISOString().split('T')[0],
      description: { en: '', ml: '' },
      recurring: null
    })
    setShowTemplates(false)
    setShowAddModal(true)
  }

  const handleSaveNewActivity = async () => {
    if (!newActivity.name.en.trim()) return
    
    try {
      // First get available farms to use the first one
      let farmId = 1; // Default
      try {
        const farmsResponse = await apiCall(API_ENDPOINTS.FARM);
        if (farmsResponse && Array.isArray(farmsResponse) && farmsResponse.length > 0) {
          farmId = farmsResponse[0].id;
        }
      } catch (farmError) {
        console.log('Could not get farms, using default farm_id:', farmId);
      }

      const activityData = {
        farm_id: farmId,
        activity_type: newActivity.name.en,
        date: new Date(newActivity.date).toLocaleDateString('en-GB'),
        details: newActivity.description.en || 'No description',
        status: 'pending'
      }

      const response = await apiCall(API_ENDPOINTS.ACTIVITIES, {
        method: 'POST',
        body: JSON.stringify(activityData)
      })

      if (response.success) {
        // Refresh activities list
        await fetchActivities()
        setShowAddModal(false)
        // Reset form
        setNewActivity({
          name: { en: '', ml: '' },
          date: '',
          description: { en: '', ml: '' },
          recurring: null
        })
        setError(null) // Clear any previous errors
      } else {
        const errorMsg = response.error || response.message || 'Failed to create activity';
        console.error('Activity creation failed:', response);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('Error creating activity:', err)
      const errorMsg = err.message || 'Failed to create activity - please check your connection';
      setError(errorMsg);
    }
  }

  const handleEditActivity = (id: number) => {
    const activity = activities.find(a => a.id === id)
    if (activity) {
      setEditingActivity(id)
      setNewActivity({
        name: activity.name,
        date: new Date(activity.date.split('/').reverse().join('-')).toISOString().split('T')[0],
        description: activity.description || { en: '', ml: '' },
        recurring: activity.recurring || null
      })
      setShowAddModal(true)
    }
  }

  const handleSaveEditActivity = async () => {
    if (!newActivity.name.en.trim() || editingActivity === null) return
    
    try {
      const activityData = {
        activity_type: newActivity.name.en,
        date: new Date(newActivity.date).toLocaleDateString('en-GB'),
        details: newActivity.description.en || 'No description'
      }

      const response = await apiCall(`${API_ENDPOINTS.ACTIVITIES}/${editingActivity}`, {
        method: 'PUT',
        body: JSON.stringify(activityData)
      })

      if (response.success) {
        // Refresh activities list
        await fetchActivities()
        setShowAddModal(false)
        setEditingActivity(null)
        // Reset form
        setNewActivity({
          name: { en: '', ml: '' },
          date: '',
          description: { en: '', ml: '' },
          recurring: null
        })
      } else {
        setError('Failed to update activity')
      }
    } catch (err) {
      console.error('Error updating activity:', err)
      setError('Failed to update activity')
    }
  }

  const handleDeleteActivity = async (id: number) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ACTIVITIES}/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        // Refresh activities list
        await fetchActivities()
      } else {
        setError('Failed to delete activity')
      }
    } catch (err) {
      console.error('Error deleting activity:', err)
      setError('Failed to delete activity')
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setShowTemplates(false)
    setEditingActivity(null)
    setNewActivity({
      name: { en: '', ml: '' },
      date: '',
      description: { en: '', ml: '' },
      recurring: null
    })
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const activity = activities.find(a => a.id === id)
      if (!activity) return

      const newStatus = activity.status === 'completed' ? 'pending' : 'completed'
      
      const response = await apiCall(`${API_ENDPOINTS.ACTIVITIES}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })

      if (response.success) {
        // Refresh activities list
        await fetchActivities()
      } else {
        setError('Failed to update activity status')
      }
    } catch (err) {
      console.error('Error updating activity status:', err)
      setError('Failed to update activity status')
    }
  }

  const handleShowMore = () => {
    setShowAll(!showAll)
  }



  const handleToggleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchTerm('') // Clear search when closing
    }
  }



  // Stats cards are for display only - no filtering functionality

  // Filter activities by search term and status
  const filteredActivities = React.useMemo(() => {
    let filtered = activities
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter)
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.name.ml.includes(searchTerm) ||
        (activity.description?.en?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.description?.ml?.includes(searchTerm))
      )
    }
    
    return filtered
  }, [activities, searchTerm, statusFilter])

  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 5)

  // Loading state
  if (loading) {
    return (
      <LoadingSpinner 
        message={t('loadingActivities', { en: 'Loading activities...', ml: 'പ്രവർത്തനങ്ങൾ ലോഡ് ചെയ്യുന്നു...' })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="px-4 py-4 pb-20 max-w-md mx-auto">
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Mobile-Optimized Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 py-2">
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-text-primary">
            {t('farmActivities', { en: 'Farm Activities', ml: 'കാർഷിക പ്രവർത്തനങ്ങൾ' })}
          </h1>
          
          <div className="flex items-center space-x-2">
            {/* Search Icon - Functional */}
            <button 
              onClick={handleToggleSearch}
              className={`p-3 rounded-full transition-all duration-200 active:scale-95 ${
                showSearch 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              aria-label={t('search', { en: 'Search', ml: 'തിরയുക' })}
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </button>



            {/* Add Button - Uniform Style */}
            <button 
              onClick={handleAddActivity}
              className="p-3 rounded-full bg-primary-500 dark:bg-primary-400 text-white shadow-lg transition-all duration-200 active:scale-95"
              aria-label={t('addActivity', { en: 'Add Activity', ml: 'പ্രവർത്തനം ചേർക്കുക' })}
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
            </button>
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
                placeholder={t('searchActivities', { en: 'Search activities...', ml: 'പ്രവർത്തനങ്ങൾ തിരയുക...' })}
                className="w-full px-4 py-3 pl-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
            </div>
          </div>
        )}






        {/* Mobile-Optimized Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-3 border-2 transition-all active:scale-95 text-left ${
              statusFilter === 'completed'
                ? 'border-green-500 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                : 'border-green-200 dark:border-green-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-text-secondary">
                  {t('completed', { en: 'Completed', ml: 'പൂർത്തിയായത്' })}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-text-primary">
                  {activities.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-3 border-2 transition-all active:scale-95 text-left ${
              statusFilter === 'pending'
                ? 'border-yellow-500 dark:border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800'
                : 'border-yellow-200 dark:border-yellow-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-text-secondary">
                  {t('pending', { en: 'Pending', ml: 'ബാക്കിയുള്ളത്' })}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-text-primary">
                  {activities.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Activities List */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
          {/* Mobile-First Activity Log Header */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary mb-3">
              {t('activityLog', { en: 'Activity Log', ml: 'പ്രവർത്തന രേഖ' })}
            </h2>
            

            

          </div>

          <div className="space-y-2">
            {displayedActivities.map((activity) => (
              <div 
                key={activity.id}
                className="group flex items-start p-4 bg-gray-50 dark:bg-background-dark/50 rounded-2xl active:bg-gray-100 dark:active:bg-background-dark/70 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1">


                  {/* Mobile-Optimized Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(activity.id)}
                    className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                      activity.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 active:bg-green-200 dark:active:bg-green-900/50' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 active:bg-yellow-200 dark:active:bg-yellow-900/50'
                    }`}
                    aria-label={t('toggleStatus', { en: 'Toggle Status', ml: 'സ്റ്റാറ്റസ് മാറ്റുക' })}
                  >
                    {activity.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <div className="font-medium text-gray-900 dark:text-text-primary">
                        {t(`activity_${activity.id}`, activity.name)}
                      </div>
                      
                      {/* Recurring Badge - Mobile Optimized */}
                      <div className="flex items-center gap-1.5">
                        {/* Recurring Badge - Icon Only on Mobile */}
                        {activity.recurring && (
                          <span className="w-6 h-6 sm:px-2 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center sm:w-auto sm:h-auto">
                            <RotateCcw className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">
                              {activity.recurring === 'daily' ? t('daily', { en: 'Daily', ml: 'ദൈനിക' }) :
                               activity.recurring === 'weekly' ? t('weekly', { en: 'Weekly', ml: 'പാഴ്ച്ച' }) :
                               t('monthly', { en: 'Monthly', ml: 'മാസം' })}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-text-secondary mt-1">
                      {activity.description && t(`description_${activity.id}`, activity.description)}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="text-xs text-gray-500 dark:text-text-secondary">
                        {activity.date}
                      </div>
                      

                    </div>
                  </div>
                </div>
                
                {/* Mobile Action Area */}
                <div className="flex flex-col items-end space-y-2">
                  {/* Mobile Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditActivity(activity.id)}
                      className="p-3 text-gray-500 active:text-blue-600 dark:text-gray-400 dark:active:text-blue-400 active:bg-blue-50 dark:active:bg-blue-900/20 rounded-xl transition-colors"
                      aria-label={t('editActivity', { en: 'Edit Activity', ml: 'പ്രവർത്തനം എഡിറ്റ് ചെയ്യുക' })}
                    >
                      <Edit2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-3 text-gray-500 active:text-red-600 dark:text-gray-400 dark:active:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 rounded-xl transition-colors"
                      aria-label={t('deleteActivity', { en: 'Delete Activity', ml: 'പ്രവർത്തനം ഇല്ലാതാക്കുക' })}
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                  
                  {/* Mobile Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {activity.status === 'completed' ? 'Done' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {activities.length > 5 && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleShowMore}
                className="text-primary-500 dark:text-primary-400 font-medium underline-offset-2 transition-all inline-flex items-center space-x-1"
              >
                <span>
                  {showAll 
                    ? t('showLess', { en: 'Show Less', ml: 'കുറച്ച് കാണിക്കുക' })
                    : t('showMore', { en: `Show More (${activities.length - 5} more)`, ml: `കൂടുതൽ കാണിക്കുക (${activities.length - 5} കൂടുതൽ)` })
                  }
                </span>
                <div className={`transition-transform ${showAll ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Activity Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary">
                  {t('chooseTemplate', { en: 'Choose Activity Template', ml: 'പ്രവർത്തന ടെംപ്ലേറ്റ് തിരഞ്ഞെടുക്കുക' })}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {activityTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{template.icon}</span>
                      <h4 className="font-medium text-gray-900 dark:text-text-primary">
                        {t(`template_${template.id}`, template.name)}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t(`template_desc_${template.id}`, template.description)}
                    </p>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={handleCustomActivity}
                  className="px-4 py-2 bg-primary-500 dark:bg-primary-400 text-white rounded-lg font-medium transition-colors"
                >
                  {t('customActivity', { en: 'Create Custom Activity', ml: 'കസ്റ്റം പ്രവർത്തനം സൃഷ്ടിക്കുക' })}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Activity Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary">
                  {editingActivity 
                    ? t('editActivity', { en: 'Edit Activity', ml: 'പ്രവർത്തനം എഡിറ്റ് ചെയ്യുക' })
                    : t('addActivity', { en: 'Add New Activity', ml: 'പുതിയ പ്രവർത്തനം ചേർക്കുക' })
                  }
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-500 dark:text-gray-400 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Activity Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                    {t('activityName', { en: 'Activity Name', ml: 'പ്രവർത്തനത്തിന്റെ പേര്' })}
                  </label>
                  <input
                    type="text"
                    value={newActivity.name.en}
                    onChange={(e) => setNewActivity(prev => ({
                      ...prev,
                      name: { en: e.target.value, ml: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    placeholder="Enter activity name"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                    {t('date', { en: 'Date', ml: 'തീയതി' })}
                  </label>
                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:p-1 dark:[&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                    {t('description', { en: 'Description', ml: 'വിവരണം' })}
                  </label>
                  <textarea
                    value={newActivity.description.en}
                    onChange={(e) => setNewActivity(prev => ({
                      ...prev,
                      description: { en: e.target.value, ml: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none"
                    placeholder="Enter activity description"
                  />
                </div>



                {/* Recurring */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                    {t('recurring', { en: 'Recurring', ml: 'ആവർത്തിക്കുന്ന' })}
                  </label>
                  <select
                    value={newActivity.recurring || ''}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, recurring: e.target.value === '' ? null : e.target.value as any }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY5NzA4RCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:right_12px_center] pr-10"
                  >
                    <option value="">{t('oneTime', { en: 'One Time', ml: 'ഒറ്റത്തവണ' })}</option>
                    <option value="daily">{t('daily', { en: 'Daily', ml: 'ദൈനിക' })}</option>
                    <option value="weekly">{t('weekly', { en: 'Weekly', ml: 'പാഴ്ച്ചത്തിൽ' })}</option>
                    <option value="monthly">{t('monthly', { en: 'Monthly', ml: 'മാസത്തിൽ' })}</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium transition-colors"
                >
                  {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
                </button>
                <button
                  onClick={editingActivity ? handleSaveEditActivity : handleSaveNewActivity}
                  disabled={!newActivity.name.en.trim()}
                  className="px-6 py-2 bg-primary-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors inline-flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingActivity 
                      ? t('update', { en: 'Update', ml: 'അപ്ഡേറ്റ് ചെയ്യുക' })
                      : t('add', { en: 'Add', ml: 'ചേർക്കുക' })
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Activities