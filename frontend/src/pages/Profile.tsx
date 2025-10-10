import React, { useState, useEffect } from 'react'
import { 
  User, Phone, MapPin, Edit2, Save,
  Wheat, Trees, Heart, Droplets, Mountain, 
  ChevronDown, Thermometer, Sprout, Bug, Layers, Waves,
  Mail, Trash2, X, Plus, Search, Info, LogOut
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'
import { API_ENDPOINTS, apiCall } from '../config/api'

// Kerala Districts
const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
]


interface FarmerProfile {
  id: number
  name: string
  phone_number: string
  email?: string
  village_town?: string
  district?: string
}

interface FarmData {
  id: number
  name?: string
  size: number
  district?: string
  location: string
  crops: string[]
  livestock: string[]
  terrain_type?: string
  climate_zone?: string
  soil_type?: string
  water_source?: string
  irrigation_system?: string
  fertilizer_type?: string
  pest_control?: string
}



const Profile: React.FC = () => {
  const { t } = useLanguage()
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showAddFarm, setShowAddFarm] = useState(false)
  const [showEditFarm, setShowEditFarm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [cropInput, setCropInput] = useState('')
  const [livestockInput, setLivestockInput] = useState('')
  const [editCropInput, setEditCropInput] = useState('')
  const [editLivestockInput, setEditLivestockInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<{crops?: string[], livestock?: string[]}>({})

  const [farmOrder, setFarmOrder] = useState<number[]>([])
  const [expandedFarms, setExpandedFarms] = useState<{[key: number]: boolean}>({})
  const [newFarmData, setNewFarmData] = useState({
    name: '',
    size: 1.0,
    unit: 'acres',
    district: '',
    location: '',
    crops: '',
    livestock: '',
    irrigation_system: '',
    soil_type: '',
    water_source: '',
    terrain_type: '',
    climate_zone: '',
    fertilizer_type: '',
    pest_control: ''
  })
  const [editFarmData, setEditFarmData] = useState({
    id: 0,
    name: '',
    size: 0,
    unit: 'acres',
    district: '',
    location: '',
    crops: '',
    livestock: '',
    irrigation_system: '',
    soil_type: '',
    water_source: '',
    terrain_type: '',
    climate_zone: '',
    fertilizer_type: '',
    pest_control: ''
  })
  const [profileData, setProfileData] = useState<FarmerProfile>({
    id: 1,
    name: 'Ramesh Kumar',
    phone_number: '+91 98765 43210',
    email: 'ramesh.kumar@email.com',
    village_town: 'Kattappana',
    district: 'Idukki',
  })
  
  const [farmData, setFarmData] = useState<FarmData[]>([])

  const fetchProfileData = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.PROFILE_BY_ID(1))
      console.log('Profile API response:', data)
      
      if (data.success) {
        // Update profile data from direct fields
        setProfileData({
          id: data.id,
          name: data.name,
          phone_number: data.phone_number,
          email: data.email,
          village_town: data.location,
          district: 'Idukki', // Default district
        })
        
        // Set farm data with proper structure
        const farms = (data.farms || []).map((farm: any) => ({
          ...farm,
          name: farm.name || `Farm ${farm.id}`,
          irrigation_system: farm.irrigation_system || undefined,
          soil_type: farm.soil_type || undefined,
          water_source: farm.water_source || undefined,
          farm_status: farm.farm_status || undefined,
        }))
        setFarmData(farms)
        setFarmOrder(farms.map((f: any) => f.id))
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Use default data if API fails
      setFarmData([
        {
          id: 1,
          size: 2.5,
          location: 'Kattappana, Idukki',
          crops: ['Cardamom', 'Pepper', 'Coffee'],
          livestock: ['Cows', 'Goats'],
          irrigation_system: 'Drip Irrigation',
          soil_type: 'Loamy Soil',
          water_source: 'Borewell',
        }
      ])
    }
  }

  useEffect(() => {
    fetchProfileData().finally(() => setLoading(false))
  }, [])

  // Handle body scroll lock when modals are open
  useEffect(() => {
    const modalOpen = showAddFarm || showEditFarm
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px' // Prevent layout shift
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = 'unset'
    }
  }, [showAddFarm, showEditFarm])

  const handleSave = async () => {
    console.log('handleSave called, isEditing:', isEditing)
    console.log('profileData:', profileData)
    
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        alert(t('nameRequired', { en: 'Name is required', ml: 'പേര് ആവശ്യമാണ്' }))
        return
      }
      
      if (!profileData.phone_number.trim()) {
        alert(t('phoneRequired', { en: 'Phone number is required', ml: 'ഫോൺ നമ്പർ ആവശ്യമാണ്' }))
        return
      }

      const updateData = {
        name: profileData.name.trim(),
        phone_number: profileData.phone_number.trim(),
        email: profileData.email?.trim() || null,
        village_town: profileData.village_town?.trim() || null,
        district: profileData.district || null,
      }

      // Optimistic update - switch to view mode immediately for better UX
      setIsEditing(false)
      
      console.log('Sending update data:', updateData)
      console.log('API endpoint:', API_ENDPOINTS.PROFILE_BY_ID(profileData.id))

      // Make API call in background without blocking UI
      apiCall(API_ENDPOINTS.PROFILE_BY_ID(profileData.id), {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      .then(() => {
        console.log('Profile updated via API successfully')
      })
      .catch((apiError) => {
        console.warn('API call failed:', apiError)
        // If API fails, you could show a subtle notification or retry logic here
      })
      
      console.log('Profile save completed (UI updated, API call in progress)')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(t('updateError', { en: 'Error updating profile. Please try again.', ml: 'പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്യുന്നതിൽ പിശക്. വീണ്ടും ശ്രമിക്കുക.' }))
    }
  }

  const handleInputChange = (field: keyof FarmerProfile, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogout = () => {
    // Show confirmation dialog
    const confirmed = confirm(t('confirmLogout', { 
      en: 'Are you sure you want to logout?', 
      ml: 'നിങ്ങൾക്ക് ലോഗ് ഔട്ട് ചെയ്യാൻ ഉറപ്പാണോ?' 
    }))
    
    if (confirmed) {
      // Clear any stored user data
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      
      // Navigate to login page
      window.location.href = '/login'
      
      console.log('User logged out successfully')
    }
  }





  const handleFarmEdit = (farmId: number) => {
    const farm = farmData.find(f => f.id === farmId)
    if (farm) {
      setEditFarmData({
        id: farm.id,
        name: farm.name || `Farm ${farm.id}`,
        size: farm.size,
        unit: 'acres',
        district: farm.district || '',
        location: farm.location,
        crops: farm.crops.join(', '),
        livestock: farm.livestock.join(', '),
        irrigation_system: farm.irrigation_system || '',
        soil_type: farm.soil_type || '',
        water_source: farm.water_source || '',
        terrain_type: farm.terrain_type || '',
        climate_zone: farm.climate_zone || '',
        fertilizer_type: farm.fertilizer_type || '',
        pest_control: farm.pest_control || ''
      })
      setEditCropInput(farm.crops.join(', '))
      setEditLivestockInput(farm.livestock.join(', '))
      setShowEditFarm(true)
    }
  }



  const handleEditFarmSubmit = async () => {
    try {
      // Parse comma-separated inputs
      const crops = editCropInput ? editCropInput.split(',').map(crop => crop.trim()).filter(crop => crop.length > 0) : []
      const livestock = editLivestockInput ? editLivestockInput.split(',').map(animal => animal.trim()).filter(animal => animal.length > 0) : []

      try {
        await apiCall(API_ENDPOINTS.FARM_BY_ID(editFarmData.id), {
          method: 'PUT',
          body: JSON.stringify({
            name: editFarmData.name,
            size: editFarmData.size,
            location: editFarmData.location,
            crops: crops,
            livestock: livestock,
            irrigation_system: editFarmData.irrigation_system,
            soil_type: editFarmData.soil_type,
            water_source: editFarmData.water_source,
            terrain_type: editFarmData.terrain_type,
            climate_zone: editFarmData.climate_zone,
            fertilizer_type: editFarmData.fertilizer_type,
            pest_control: editFarmData.pest_control,
          })
        })
        
        // Clear validation errors on success
        setValidationErrors({})
      } catch (error: any) {
        // Handle validation errors
        if (error.validation_errors) {
          setValidationErrors(error.validation_errors)
          return // Don't proceed with updating local state
        } else {
          console.error('Failed to update farm:', error)
          return
        }
      }

      // Update local state
      setFarmData(prev => prev.map(farm =>
        farm.id === editFarmData.id
          ? {
              ...farm,
              name: editFarmData.name,
              size: editFarmData.size,
              location: editFarmData.location,
              crops,
              livestock,
              irrigation_system: editFarmData.irrigation_system,
              soil_type: editFarmData.soil_type,
              water_source: editFarmData.water_source,
              terrain_type: editFarmData.terrain_type,
              climate_zone: editFarmData.climate_zone,
              fertilizer_type: editFarmData.fertilizer_type,
              pest_control: editFarmData.pest_control,
            }
          : farm
      ))
      setShowEditFarm(false)
      setEditFarmData({
        id: 0,
        name: '',
        size: 0,
        unit: 'acres',
        district: '',
        location: '',
        crops: '',
        livestock: '',
        irrigation_system: '',
        soil_type: '',
        water_source: '',
        terrain_type: '',
        climate_zone: '',
        fertilizer_type: '',
        pest_control: ''
      })
      setEditCropInput('')
      setEditLivestockInput('')
      console.log('Farm updated successfully')
    } catch (error) {
      console.error('Error updating farm:', error)
    }
  }

  const handleFarmDelete = async (farmId: number) => {
    console.log('Delete farm called for ID:', farmId)
    
    // Show confirmation dialog
    const confirmed = confirm(t('confirmDeleteFarm', { 
      en: 'Are you sure you want to delete this farm?', 
      ml: 'ഈ ഫാം ഇല്ലാതാക്കാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?' 
    }))
    
    if (!confirmed) {
      console.log('Farm deletion cancelled by user')
      return
    }

    try {
      // Optimistic update - remove from UI immediately
      setFarmData(prev => prev.filter(farm => farm.id !== farmId))
      setFarmOrder(prev => prev.filter(id => id !== farmId))
      console.log('Farm removed from UI, making API call...')
      
      // Make API call in background
      apiCall(API_ENDPOINTS.FARM_BY_ID(farmId), {
        method: 'DELETE'
      })
      .then(() => {
        console.log('Farm deleted via API successfully')
      })
      .catch((error) => {
        console.error('Error deleting farm via API:', error)
        // If API fails, you could restore the farm or show error message
      })
      
    } catch (error) {
      console.error('Error in delete handler:', error)
    }
  }



  const handleAddFarm = async () => {
    try {
      // Validate required fields
      if (!newFarmData.location) {
        alert('Please select a location for your farm')
        return
      }
      
      if (!newFarmData.size || newFarmData.size <= 0) {
        alert('Please specify a valid farm size')
        return
      }
      
      // Get the next farm ID (highest current ID + 1)
      const nextId = farmData.length > 0 ? Math.max(...farmData.map(f => f.id)) + 1 : 1
      const farmName = newFarmData.name.trim() || `Farm ${nextId}`
      
      // Parse comma-separated input
      const farmCrops = cropInput ? cropInput.split(',').map(c => c.trim()).filter(c => c.length > 0) : []
      const farmLivestock = livestockInput ? livestockInput.split(',').map(l => l.trim()).filter(l => l.length > 0) : []
      
      try {
        const response = await apiCall(API_ENDPOINTS.FARM, {
          method: 'POST',
          body: JSON.stringify({
            farmer_id: profileData.id,
            name: farmName,
            size: newFarmData.size,
            location: newFarmData.location,
            crops: farmCrops,
            livestock: farmLivestock,
            irrigation_system: newFarmData.irrigation_system || null,
            soil_type: newFarmData.soil_type || null,
            water_source: newFarmData.water_source || null,
            terrain_type: newFarmData.terrain_type || null,
            climate_zone: newFarmData.climate_zone || null,
            fertilizer_type: newFarmData.fertilizer_type || null,
            pest_control: newFarmData.pest_control || null,
          })
        })
        
        // Clear validation errors on success
        setValidationErrors({})
        console.log('Farm created successfully:', response)
      } catch (error: any) {
        console.error('API Error:', error)
        // Handle validation errors
        if (error.validation_errors) {
          setValidationErrors(error.validation_errors)
          return // Don't proceed with adding to local state
        } else {
          console.error('Failed to create farm:', error)
          // Continue to add to local state even if API fails (offline mode)
        }
      }
      
      // Add to local state with proper structure (always add, regardless of API success)
      const newFarm: FarmData = {
        id: nextId,
        name: farmName,
        size: newFarmData.size,
        district: newFarmData.district,
        location: newFarmData.location,
        crops: farmCrops,
        livestock: farmLivestock,
        irrigation_system: newFarmData.irrigation_system || undefined,
        soil_type: newFarmData.soil_type || undefined,
        water_source: newFarmData.water_source || undefined,
        terrain_type: newFarmData.terrain_type || undefined,
        climate_zone: newFarmData.climate_zone || undefined,
        fertilizer_type: newFarmData.fertilizer_type || undefined,
        pest_control: newFarmData.pest_control || undefined,
      }
      
      console.log('Adding farm to local state:', newFarm)
      setFarmData(prev => {
        const updated = [...prev, newFarm]
        console.log('Updated farm data:', updated)
        return updated
      })
      setFarmOrder(prev => [...prev, nextId])
      setShowAddFarm(false)
      
      // Reset form data
      setNewFarmData({ 
        name: '',
        size: 1,
        unit: 'acres',
        district: '',
        location: '', 
        crops: '', 
        livestock: '',
        irrigation_system: '',
        soil_type: '',
        water_source: '',
        terrain_type: '',
        climate_zone: '',
        fertilizer_type: '',
        pest_control: ''
      })
      setCropInput('')
      setLivestockInput('')
      
      console.log('Farm added successfully with ID:', nextId)
    } catch (error) {
      console.error('Error adding farm:', error)
    }
  }

  // Helper function to toggle farm expansion
  const toggleFarmExpansion = (farmId: number) => {
    setExpandedFarms(prev => ({
      ...prev,
      [farmId]: !prev[farmId]
    }))
  }


  // Get ordered farm data
  const getOrderedFarms = () => {
    if (farmOrder.length === 0) {
      return farmData
    }
    
    const ordered = []
    const farmMap = new Map(farmData.map(farm => [farm.id, farm]))
    
    for (const farmId of farmOrder) {
      const farm = farmMap.get(farmId)
      if (farm) ordered.push(farm)
    }
    
    // Add any farms not in the order (newly added ones)
    for (const farm of farmData) {
      if (!farmOrder.includes(farm.id)) {
        ordered.push(farm)
      }
    }
    
    return ordered
  }

  if (loading) {
    return (
      <LoadingSpinner 
        message={t('loadingProfile', { en: 'Loading profile...', ml: 'പ്രൊഫൈൽ ലോഡ് ചെയ്യുന്നു...' })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-md mx-auto">
        <div className="px-4 py-6 pb-20 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold font-display text-gray-900 dark:text-text-primary">
              {t('profile', { en: 'Profile', ml: 'പ്രൊഫൈൽ' })}
            </h1>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Edit/Save Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Button clicked, isEditing:', isEditing)
                  if (isEditing) {
                    handleSave()
                  } else {
                    setIsEditing(true)
                  }
                }}
                className={`p-3 rounded-full ${
                  isEditing 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                title={isEditing ? t('save', { en: 'Save', ml: 'സേവ്' }) : t('edit', { en: 'Edit', ml: 'എഡിറ്റ്' })}
              >
                {isEditing ? (
                  <Save className="w-5 h-5" strokeWidth={2} />
                ) : (
                  <Edit2 className="w-5 h-5" strokeWidth={2} />
                )}
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                title={t('logout', { en: 'Logout', ml: 'ലോഗ് ഔട്ട്' })}
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Profile & Personal Information Card */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-surface-dark/60 dark:to-surface-dark/50 rounded-2xl p-6 border-2 border-primary-200 dark:border-primary-900 mb-6">
            {/* Profile Header */}
            <div className={`flex items-center justify-between ${showProfileDetails ? 'mb-6' : 'mb-2'}`}>
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center overflow-hidden">
                    <User className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-white/50 dark:bg-gray-800/50 border border-primary-300 dark:border-primary-700 rounded-xl px-3 py-2 text-gray-900 dark:text-text-primary font-bold text-lg w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-text-primary">{profileData.name}</h2>
                      {!showProfileDetails && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" strokeWidth={2} />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {profileData.village_town}{profileData.district ? `, ${profileData.district}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chevron Icon */}
              <button
                onClick={() => setShowProfileDetails(!showProfileDetails)}
                className="p-2 rounded-lg"
              >
                <ChevronDown 
                  className={`w-5 h-5 text-primary-600 dark:text-primary-400 ${
                    showProfileDetails ? 'rotate-180' : ''
                  }`} 
                  strokeWidth={2} 
                />
              </button>
            </div>

            {/* Personal Information Section */}
            {showProfileDetails && (
              <div className="pt-4">
                <div className="space-y-4">
                {/* Phone Number */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('phoneNumber', { en: 'Phone Number', ml: 'ഫോൺ നമ്പർ' })}
                    </p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-text-primary">{profileData.phone_number}</p>
                    )}
                  </div>
                </div>
                
                {/* Email Address */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('emailAddress', { en: 'Email Address', ml: 'ഇമെയിൽ വിലാസം' })}
                    </p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder={t('emailPlaceholder', { en: 'Enter your email', ml: 'നിങ്ങളുടെ ഇമെയിൽ നൽകുക' })}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-text-primary">{profileData.email || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {/* Village/Town */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('villageTown', { en: 'Village/Town', ml: 'ഗ്രാമം/പട്ടണം' })}
                    </p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.village_town || ''}
                        onChange={(e) => handleInputChange('village_town', e.target.value)}
                        placeholder={t('villagePlaceholder', { en: 'Enter village or town', ml: 'ഗ്രാമം അല്ലെങ്കിൽ പട്ടണം നൽകുക' })}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-text-primary">{profileData.village_town || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {/* District */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('district', { en: 'District', ml: 'ജില്ല' })}
                    </p>
                    {isEditing ? (
                      <select
                        value={profileData.district || ''}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">{t('selectDistrict', { en: 'Select District', ml: 'ജില്ല തിരഞ്ഞെടുക്കുക' })}</option>
                        {KERALA_DISTRICTS.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-text-primary">{profileData.district || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Farm Information */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Trees className="w-5 h-5 text-white" />
                </div>
                <span>{t('farmDetails', { en: 'Farm Details', ml: 'ഫാം വിശദാംശങ്ങൾ' })}</span>
              </h3>
              
              <div className="flex items-center space-x-2">
                {/* Search Button */}
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-3 rounded-full ${
                    showSearch 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Search className="w-5 h-5" strokeWidth={2} />
                </button>
                {/* Add Farm Button */}
                <button 
                  onClick={() => setShowAddFarm(true)}
                  className="bg-primary-500 text-white p-3 rounded-full"
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
                    placeholder={t('searchFarms', { en: 'Search farms...', ml: 'ഫാമുകൾ തിരയുക...' })}
                    className="w-full px-4 py-3 pl-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
                </div>
              </div>
            )}
            
            {/* Farm Cards */}
            <div className="space-y-3">
              {getOrderedFarms().filter(farm => {
                if (!searchTerm) return true;
                const lowerSearchTerm = searchTerm.toLowerCase();
                return (
                  farm.crops.some(crop => crop.toLowerCase().includes(lowerSearchTerm)) ||
                  farm.livestock.some(animal => animal.toLowerCase().includes(lowerSearchTerm)) ||
                  `farm ${farm.id}`.toLowerCase().includes(lowerSearchTerm)
                );
              }).map((farm) => (
                <div 
                  key={farm.id} 
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
                >
                  {/* Farm Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left Section: Farm Info */}
                      <div className="flex items-center flex-1">
                        <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-text-primary text-lg">
                          {farm.name || `${t('farm', { en: 'Farm', ml: 'ഫാം' })} ${farm.id}`}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{farm.location}</span>
                        </div>
                        {!expandedFarms[farm.id] && null}
                      </div>
                      </div>
                      
                      {/* Right Section: Info + Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {/* Info Button */}
                        <button
                          onClick={() => toggleFarmExpansion(farm.id)}
                          className={`p-2 rounded-full ${
                            expandedFarms[farm.id]
                              ? 'text-primary-500'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Info className="w-4 h-4" strokeWidth={2} />
                        </button>
                        
                        {/* Action Buttons */}
                        <button
                          onClick={() => handleFarmEdit(farm.id)}
                          className="p-2 rounded-full text-gray-600 dark:text-gray-400"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleFarmDelete(farm.id)}
                          className="p-2 rounded-full text-gray-600 dark:text-gray-400"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable Farm Details */}
                  {expandedFarms[farm.id] && (
                    <div className="border-t border-green-200 dark:border-green-700 px-4 pb-4">
                      <div className="pt-4 space-y-4">
                        {/* Production Section */}
                        <div className="grid grid-cols-1 gap-4">
                          {/* Crops */}
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Wheat className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('crops', { en: 'Crops', ml: 'വിളകൾ' })}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {farm.crops.length > 0 ? farm.crops.map((crop, index) => (
                                <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-xs font-medium">
                                  {crop}
                                </span>
                              )) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  {t('noCrops', { en: 'No crops added', ml: 'വിളകൾ ചേർത്തിട്ടില്ല' })}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Livestock */}
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('livestock', { en: 'Livestock', ml: 'കന്നുകാലികൾ' })}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {farm.livestock.length > 0 ? farm.livestock.map((animal, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-medium">
                                  {animal}
                                </span>
                              )) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  {t('noLivestock', { en: 'No livestock added', ml: 'കന്നുകാലികൾ ചേർത്തിട്ടില്ല' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Farm Technical Details */}
                        <div className="pt-4 border-t border-green-200 dark:border-green-700">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {t('farmDetails', { en: 'Farm Details', ml: 'ഫാം വിശദാംശങ്ങൾ' })}
                          </h5>
                          
                          {/* Farm Details Grid - 4x2 Layout */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Row 1: Size + Terrain */}
                            {/* Size */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Trees className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('farmSize', { en: 'Size', ml: 'വലുപ്പം' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs font-medium">
                                  {farm.size.toFixed(2)} acres
                                </span>
                              </div>
                            </div>

                            {/* Terrain */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('terrain', { en: 'Terrain', ml: 'ഭൂപ്രകൃതി' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-xs font-medium">
                                  {farm.terrain_type || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>

                            {/* Row 2: Climate + Soil Type */}
                            {/* Climate */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Thermometer className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('climate', { en: 'Climate', ml: 'കാലാവസ്ഥ' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-xs font-medium">
                                  {farm.climate_zone || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>

                            {/* Soil Type */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Mountain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('soilType', { en: 'Soil Type', ml: 'മണ്ണിന്റെ തരം' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium">
                                  {farm.soil_type || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>

                            {/* Row 3: Water Source + Irrigation */}
                            {/* Water Source */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Droplets className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('waterSource', { en: 'Water Source', ml: 'ജലസ്രോതസ്സ്' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-medium">
                                  {farm.water_source || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>

                            {/* Irrigation */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Waves className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('irrigation', { en: 'Irrigation', ml: 'ജലസേചനം' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-lg text-xs font-medium">
                                  {farm.irrigation_system || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>

                            {/* Row 4: Fertilizer + Pest Control */}
                            {/* Fertilizer */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Sprout className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('fertilizer', { en: 'Fertilizer', ml: 'വളം' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 rounded-lg text-xs font-medium">
                                  {farm.fertilizer_type || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>

                            {/* Pest Control */}
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Bug className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  {t('pestControl', { en: 'Pest Control', ml: 'കീടനിയന്ത്രണം' })}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg text-xs font-medium">
                                  {farm.pest_control || t('notSpecified', { en: 'Not specified', ml: 'വ്യക്തമാക്കിയിട്ടില്ല' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {farmData.length === 0 && (
                <div className="text-center py-8">
                  <Trees className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('noFarms', { en: 'No farms added yet', ml: 'ഇതുവരെ ഫാമുകൾ ചേർത്തിട്ടില്ല' })}
                  </p>
                  <button
                    onClick={() => setShowAddFarm(true)}
                    className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg"
                  >
                    {t('addFirstFarm', { en: 'Add your first farm', ml: 'നിങ്ങളുടെ ആദ്യത്തെ ഫാം ചേർക്കുക' })}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add Farm Modal */}
          {showAddFarm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl mx-4 my-4 max-h-[calc(100vh-200px)] overflow-y-auto modal-scroll">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary">
                    {t('addNewFarm', { en: 'Add New Farm', ml: 'പുതിയ ഫാം ചേർക്കുക' })}
                  </h3>
                  <button
                    onClick={() => setShowAddFarm(false)}
                    className="p-2 text-gray-500 dark:text-gray-400 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Row 1: District, Area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('district', { en: 'District', ml: 'ജില്ല' })}
                      </label>
                      <select
                        value={newFarmData.district || ''}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectDistrict', { en: 'Select District', ml: 'ജില്ല തിരഞ്ഞെടുക്കുക' })}</option>
                        {KERALA_DISTRICTS.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('area', { en: 'Area', ml: 'പ്രദേശം' })}
                      </label>
                      <input
                        type="text"
                        value={newFarmData.location}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                        placeholder={t('enterArea', { en: 'Enter area', ml: 'പ്രദേശം നൽകുക' })}
                      />
                    </div>
                  </div>

                  {/* Row 2: Size, Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('farmSize', { en: 'Farm Size', ml: 'ഫാം വലുപ്പം' })}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newFarmData.size}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, size: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                        placeholder="Enter size"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('unit', { en: 'Unit', ml: 'യൂണിറ്റ്' })}
                      </label>
                      <select
                        value={newFarmData.unit}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                        <option value="cents">Cents</option>
                        <option value="sq_feet">Sq Feet</option>
                        <option value="sq_meters">Sq Meters</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Row 3: Crops, Livestock - Stacked Layout for better mobile UX */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('crops', { en: 'Crops', ml: 'വിളകൾ' })} <span className="text-xs text-gray-500">(comma separated)</span>
                      </label>
                      <textarea
                        value={cropInput}
                        onChange={(e) => setCropInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none min-h-[100px]"
                        placeholder="Rice, Wheat, Coconut"
                        rows={4}
                      />
                      {validationErrors.crops && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <strong>Invalid crops:</strong> {validationErrors.crops.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('livestock', { en: 'Livestock', ml: 'കന്നുകാലികൾ' })} <span className="text-xs text-gray-500">(comma separated)</span>
                      </label>
                      <textarea
                        value={livestockInput}
                        onChange={(e) => setLivestockInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none min-h-[100px]"
                           placeholder="Cows, Goats, Chickens"
                        rows={4}
                      />
                      {validationErrors.livestock && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <strong>Invalid livestock:</strong> {validationErrors.livestock.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Terrain Type, Climate Zone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('terrainType', { en: 'Terrain Type', ml: 'ഭൂപ്രകൃതി തരം' })}
                      </label>
                      <select
                        value={newFarmData.terrain_type}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, terrain_type: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectTerrain', { en: 'Select Terrain', ml: 'ഭൂപ്രകൃതി തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Plain">{t('plain', { en: 'Plain', ml: 'സമതലം' })}</option>
                        <option value="Hilly">{t('hilly', { en: 'Hilly', ml: 'മലയോര' })}</option>
                        <option value="Mountainous">{t('mountainous', { en: 'Mountainous', ml: 'പർവതീയ' })}</option>
                        <option value="Coastal">{t('coastal', { en: 'Coastal', ml: 'തീരദേശം' })}</option>
                        <option value="Valley">{t('valley', { en: 'Valley', ml: 'താഴ്വര' })}</option>
                        <option value="Plateau">{t('plateau', { en: 'Plateau', ml: 'പീഠഭൂമി' })}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('climateZone', { en: 'Climate Zone', ml: 'കാലാവസ്ഥാ മേഖല' })}
                      </label>
                      <select
                        value={newFarmData.climate_zone}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, climate_zone: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectClimate', { en: 'Select Climate', ml: 'കാലാവസ്ഥാ മേഖല തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Tropical">{t('tropical', { en: 'Tropical', ml: 'ഉഷ്ണമേഖലാ' })}</option>
                        <option value="Sub-tropical">{t('subtropical', { en: 'Sub-tropical', ml: 'ഉപ-ഉഷ്ണമേഖലാ' })}</option>
                        <option value="Temperate">{t('temperate', { en: 'Temperate', ml: 'മിതോഷ്ണ' })}</option>
                        <option value="Arid">{t('arid', { en: 'Arid', ml: 'വരണ്ട' })}</option>
                        <option value="Semi-arid">{t('semiarid', { en: 'Semi-arid', ml: 'അർദ്ധ വരണ്ട' })}</option>
                        <option value="Humid">{t('humid', { en: 'Humid', ml: 'ഈർപ്പമുള്ള' })}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Soil Type, Water Source */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('soilType', { en: 'Soil Type', ml: 'മണ്ണിന്റെ തരം' })}
                      </label>
                      <select
                        value={newFarmData.soil_type}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, soil_type: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectSoilType', { en: 'Select Soil Type', ml: 'മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Loamy">{t('loamySoil', { en: 'Loamy Soil', ml: 'ലോമി മണ്ണ്' })}</option>
                        <option value="Clay">{t('claySoil', { en: 'Clay Soil', ml: 'ക്ലേ മണ്ണ്' })}</option>
                        <option value="Sandy">{t('sandySoil', { en: 'Sandy Soil', ml: 'മണൽ മണ്ണ്' })}</option>
                        <option value="Laterite">{t('lateriteSoil', { en: 'Laterite Soil', ml: 'ലാറ്ററൈറ്റ് മണ്ണ്' })}</option>
                        <option value="Alluvial">{t('alluvialSoil', { en: 'Alluvial Soil', ml: 'അല്യൂവിയൽ മണ്ണ്' })}</option>
                        <option value="Black">{t('blackSoil', { en: 'Black Soil', ml: 'കറുത്ത മണ്ണ്' })}</option>
                        <option value="Red">{t('redSoil', { en: 'Red Soil', ml: 'ചുവപ്പ് മണ്ണ്' })}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('waterSource', { en: 'Water Source', ml: 'ജലസ്രോതസ്സ്' })}
                      </label>
                      <select
                        value={newFarmData.water_source}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, water_source: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectWaterSource', { en: 'Select Water Source', ml: 'ജലസ്രോതസ്സ് തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="N.A.">{t('notApplicable', { en: 'N.A.', ml: 'ബാധകമല്ല' })}</option>
                        <option value="Borewell">{t('borewell', { en: 'Borewell', ml: 'ബോർവെൽ' })}</option>
                        <option value="Well">{t('well', { en: 'Well', ml: 'കിണർ' })}</option>
                        <option value="River">{t('river', { en: 'River', ml: 'നദി' })}</option>
                        <option value="Pond">{t('pond', { en: 'Pond', ml: 'കുളം' })}</option>
                        <option value="Canal">{t('canal', { en: 'Canal', ml: 'കനാൽ' })}</option>
                        <option value="Rainwater">{t('rainwater', { en: 'Rainwater', ml: 'മഴവെള്ളം' })}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 6: Irrigation, Fertilizer */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('irrigationSystem', { en: 'Irrigation System', ml: 'ജലസേചന സംവിധാനം' })}
                      </label>
                      <select
                        value={newFarmData.irrigation_system}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, irrigation_system: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectIrrigation', { en: 'Select Irrigation', ml: 'ജലസേചനം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Drip Irrigation">{t('dripIrrigation', { en: 'Drip Irrigation', ml: 'ഡ്രിപ് ജലസേചനം' })}</option>
                        <option value="Sprinkler Irrigation">{t('sprinklerIrrigation', { en: 'Sprinkler Irrigation', ml: 'സ്പ്രിങ്ക്ലർ ജലസേചനം' })}</option>
                        <option value="Flood Irrigation">{t('floodIrrigation', { en: 'Flood Irrigation', ml: 'വെള്ളപ്പൊക്ക ജലസേചനം' })}</option>
                        <option value="Rain Fed">{t('rainFed', { en: 'Rain Fed', ml: 'മഴ നിർഭര' })}</option>
                        <option value="Manual Watering">{t('manualWatering', { en: 'Manual Watering', ml: 'കൈകൊണ്ട് നനയ്ക്കൽ' })}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('fertilizerType', { en: 'Fertilizer Type', ml: 'വളത്തിന്റെ തരം' })}
                      </label>
                      <select
                        value={newFarmData.fertilizer_type}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, fertilizer_type: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectFertilizer', { en: 'Select Fertilizer', ml: 'വളം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Organic Manure">{t('organicManure', { en: 'Organic Manure', ml: 'ജൈവ വളം' })}</option>
                        <option value="Chemical Fertilizer">{t('chemicalFertilizer', { en: 'Chemical Fertilizer', ml: 'രാസവളം' })}</option>
                        <option value="Bio-fertilizer">{t('biofertilizer', { en: 'Bio-fertilizer', ml: 'ജൈവ രാസവളം' })}</option>
                        <option value="Compost">{t('compost', { en: 'Compost', ml: 'കമ്പോസ്റ്റ്' })}</option>
                        <option value="Vermicompost">{t('vermicompost', { en: 'Vermicompost', ml: 'വേം കമ്പോസ്റ്റ്' })}</option>
                        <option value="NPK Fertilizer">{t('npkFertilizer', { en: 'NPK Fertilizer', ml: 'എൻപികെ വളം' })}</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Row 7: Pest Control (with blank space) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('pestControl', { en: 'Pest Control Method', ml: 'കീടനിയന്ത്രണ രീതി' })}
                      </label>
                      <select
                        value={newFarmData.pest_control}
                        onChange={(e) => setNewFarmData(prev => ({ ...prev, pest_control: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectPestControl', { en: 'Select Pest Control', ml: 'കീടനിയന്ത്രണം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Organic Pesticides">{t('organicPesticides', { en: 'Organic Pesticides', ml: 'ജൈവ കീടനാശിനി' })}</option>
                        <option value="Chemical Pesticides">{t('chemicalPesticides', { en: 'Chemical Pesticides', ml: 'രാസ കീടനാശിനി' })}</option>
                        <option value="Integrated Pest Management">{t('ipm', { en: 'Integrated Pest Management', ml: 'സംയോജിത കീടനിയന്ത്രണം' })}</option>
                        <option value="Biological Control">{t('biologicalControl', { en: 'Biological Control', ml: 'ജൈവിക നിയന്ത്രണം' })}</option>
                        <option value="Natural Predators">{t('naturalPredators', { en: 'Natural Predators', ml: 'പ്രകൃതിദത്ത ശത്രുക്കൾ' })}</option>
                        <option value="Neem-based">{t('neemBased', { en: 'Neem-based', ml: 'വേപ്പ് അധിഷ്ഠിത' })}</option>
                      </select>
                    </div>
                    <div></div>
                  </div>
                </div>
                
                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddFarm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium"
                  >
                    {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
                  </button>
                  <button
                    onClick={handleAddFarm}
                    disabled={!newFarmData.location || !newFarmData.size}
                    className="px-6 py-2 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('add', { en: 'Add', ml: 'ചേർക്কുك' })}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Farm Modal */}
          {showEditFarm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-2xl mx-4 my-4 max-h-[calc(100vh-200px)] overflow-y-auto modal-scroll">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-text-primary">
                    {t('editFarm', { en: 'Edit Farm', ml: 'ഫാം എഡિറ്റ് ചെയ്യുക' })}
                  </h3>
                  <button
                    onClick={() => setShowEditFarm(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Row 1: District, Area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('district', { en: 'District', ml: 'ജില്ല' })}
                      </label>
                      <select
                        value={editFarmData.district || ''}
                        onChange={(e) => setEditFarmData({ ...editFarmData, district: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectDistrict', { en: 'Select District', ml: 'ജില്ല തിരഞ്ഞെടുക്കുക' })}</option>
                        {KERALA_DISTRICTS.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('area', { en: 'Area', ml: 'പ്രദേശം' })}
                      </label>
                      <input
                        type="text"
                        value={editFarmData.location}
                        onChange={(e) => setEditFarmData({ ...editFarmData, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                        placeholder={t('enterArea', { en: 'Enter area', ml: 'പ്രദേശം നൽകുക' })}
                      />
                    </div>
                  </div>

                  {/* Row 2: Size, Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('farmSize', { en: 'Farm Size', ml: 'ഫാം വലുപ്പം' })}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editFarmData.size}
                        onChange={(e) => setEditFarmData({...editFarmData, size: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                        placeholder="Enter size"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('unit', { en: 'Unit', ml: 'യൂണിറ്റ്' })}
                      </label>
                      <select
                        value={editFarmData.unit}
                        onChange={(e) => setEditFarmData({...editFarmData, unit: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                        <option value="cents">Cents</option>
                        <option value="sq_feet">Sq Feet</option>
                        <option value="sq_meters">Sq Meters</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Row 3: Crops, Livestock - Stacked Layout for better mobile UX */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('crops', { en: 'Crops', ml: 'വിളകൾ' })} <span className="text-xs text-gray-500">(comma separated)</span>
                      </label>
                      <textarea
                        value={editCropInput}
                        onChange={(e) => setEditCropInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none min-h-[100px]"
                        placeholder="Rice, Wheat, Coconut"
                        rows={4}
                      />
                      {validationErrors.crops && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <strong>Invalid crops:</strong> {validationErrors.crops.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('livestock', { en: 'Livestock', ml: 'കന്നുകാലികൾ' })} <span className="text-xs text-gray-500">(comma separated)</span>
                      </label>
                      <textarea
                        value={editLivestockInput}
                        onChange={(e) => setEditLivestockInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none min-h-[100px]"
                        placeholder="Cows, Goats, Chickens"
                        rows={4}
                      />
                      {validationErrors.livestock && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <strong>Invalid livestock:</strong> {validationErrors.livestock.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Terrain Type, Climate Zone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('terrainType', { en: 'Terrain Type', ml: 'ഭൂപ്രകൃതി തരം' })}
                      </label>
                      <select
                        value={editFarmData.terrain_type}
                        onChange={(e) => setEditFarmData({ ...editFarmData, terrain_type: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectTerrain', { en: 'Select Terrain Type', ml: 'ഭൂപ്രകൃതി തരം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="N.A.">{t('notApplicable', { en: 'N.A.', ml: 'ബാധകമല്ല' })}</option>
                        <option value="Plain">{t('plain', { en: 'Plain', ml: 'സമതലം' })}</option>
                        <option value="Hilly">{t('hilly', { en: 'Hilly', ml: 'മലയോര' })}</option>
                        <option value="Mountainous">{t('mountainous', { en: 'Mountainous', ml: 'പർവതീയ' })}</option>
                        <option value="Coastal">{t('coastal', { en: 'Coastal', ml: 'തീരദേശം' })}</option>
                        <option value="Valley">{t('valley', { en: 'Valley', ml: 'താഴ്വര' })}</option>
                        <option value="Plateau">{t('plateau', { en: 'Plateau', ml: 'പീഠഭൂമി' })}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('climateZone', { en: 'Climate Zone', ml: 'കാലാവസ്ഥാ മേഖല' })}
                      </label>
                      <select
                        value={editFarmData.climate_zone}
                        onChange={(e) => setEditFarmData({ ...editFarmData, climate_zone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectClimate', { en: 'Select Climate Zone', ml: 'കാലാവസ്ഥാ മേഖല തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="N.A.">{t('notApplicable', { en: 'N.A.', ml: 'ബാധകമല്ല' })}</option>
                        <option value="Tropical">{t('tropical', { en: 'Tropical', ml: 'ഉഷ്ണമേഖലാ' })}</option>
                        <option value="Sub-tropical">{t('subtropical', { en: 'Sub-tropical', ml: 'ഉപ-ഉഷ്ണമേഖലാ' })}</option>
                        <option value="Temperate">{t('temperate', { en: 'Temperate', ml: 'മിതോഷ്ണ' })}</option>
                        <option value="Arid">{t('arid', { en: 'Arid', ml: 'വരണ്ട' })}</option>
                        <option value="Semi-arid">{t('semiarid', { en: 'Semi-arid', ml: 'അർദ്ധ വരണ്ട' })}</option>
                        <option value="Humid">{t('humid', { en: 'Humid', ml: 'ഈർപ്പമുള്ള' })}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Soil Type, Water Source */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('soilType', { en: 'Soil Type', ml: 'മണ്ണിന്റെ തരം' })}
                      </label>
                      <select
                        value={editFarmData.soil_type}
                        onChange={(e) => setEditFarmData({ ...editFarmData, soil_type: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectSoilType', { en: 'Select Soil Type', ml: 'മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Loamy">{t('loamySoil', { en: 'Loamy Soil', ml: 'ലോമി മണ്ണ്' })}</option>
                        <option value="Clay">{t('claySoil', { en: 'Clay Soil', ml: 'ക്ലേ മണ്ണ്' })}</option>
                        <option value="Sandy">{t('sandySoil', { en: 'Sandy Soil', ml: 'മണൽ മണ്ണ്' })}</option>
                        <option value="Laterite">{t('lateriteSoil', { en: 'Laterite Soil', ml: 'ലാറ്ററൈറ്റ് മണ്ണ്' })}</option>
                        <option value="Alluvial">{t('alluvialSoil', { en: 'Alluvial Soil', ml: 'അല്യൂവിയൽ മണ്ണ്' })}</option>
                        <option value="Black">{t('blackSoil', { en: 'Black Soil', ml: 'കറുത്ത മണ്ണ്' })}</option>
                        <option value="Red">{t('redSoil', { en: 'Red Soil', ml: 'ചുവപ്പ് മണ്ണ്' })}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('waterSource', { en: 'Water Source', ml: 'ജലസ്രോതസ്സ്' })}
                      </label>
                      <select
                        value={editFarmData.water_source}
                        onChange={(e) => setEditFarmData({ ...editFarmData, water_source: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectWaterSource', { en: 'Select Water Source', ml: 'ജലസ്രോതസ്സ് തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="N.A.">{t('notApplicable', { en: 'N.A.', ml: 'ബാധകമല്ല' })}</option>
                        <option value="Borewell">{t('borewell', { en: 'Borewell', ml: 'ബോർവെൽ' })}</option>
                        <option value="Well">{t('well', { en: 'Well', ml: 'കിണർ' })}</option>
                        <option value="River">{t('river', { en: 'River', ml: 'നദി' })}</option>
                        <option value="Pond">{t('pond', { en: 'Pond', ml: 'കുളം' })}</option>
                        <option value="Canal">{t('canal', { en: 'Canal', ml: 'കനാൽ' })}</option>
                        <option value="Rainwater">{t('rainwater', { en: 'Rainwater', ml: 'മഴവെള്ളം' })}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 6: Irrigation, Fertilizer */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('irrigationSystem', { en: 'Irrigation System', ml: 'ജലസേചന സംവിധാനം' })}
                      </label>
                      <select
                        value={editFarmData.irrigation_system}
                        onChange={(e) => setEditFarmData({ ...editFarmData, irrigation_system: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectIrrigation', { en: 'Select Irrigation', ml: 'ജലസേചനം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="Drip Irrigation">{t('dripIrrigation', { en: 'Drip Irrigation', ml: 'ഡ്രിപ് ജലസേചനം' })}</option>
                        <option value="Sprinkler Irrigation">{t('sprinklerIrrigation', { en: 'Sprinkler Irrigation', ml: 'സ്പ്രിങ്ക്ലർ ജലസേചനം' })}</option>
                        <option value="Flood Irrigation">{t('floodIrrigation', { en: 'Flood Irrigation', ml: 'വെള്ളപ്പൊക്ക ജലസേചനം' })}</option>
                        <option value="Rain Fed">{t('rainFed', { en: 'Rain Fed', ml: 'മഴ നിർഭര' })}</option>
                        <option value="Manual Watering">{t('manualWatering', { en: 'Manual Watering', ml: 'കൈകൊണ്ട് നനയ്ക്കൽ' })}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('fertilizerType', { en: 'Fertilizer Type', ml: 'വളത്തിന്റെ തരം' })}
                      </label>
                      <select
                        value={editFarmData.fertilizer_type}
                        onChange={(e) => setEditFarmData({ ...editFarmData, fertilizer_type: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectFertilizer', { en: 'Select Fertilizer Type', ml: 'വളത്തിന്റെ തരം തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="N.A.">{t('notApplicable', { en: 'N.A.', ml: 'ബാധകമല്ല' })}</option>
                        <option value="Organic Manure">{t('organicManure', { en: 'Organic Manure', ml: 'ജൈവ വളം' })}</option>
                        <option value="Chemical Fertilizer">{t('chemicalFertilizer', { en: 'Chemical Fertilizer', ml: 'രാസവളം' })}</option>
                        <option value="Bio-fertilizer">{t('biofertilizer', { en: 'Bio-fertilizer', ml: 'ജൈവ രാസവളം' })}</option>
                        <option value="Compost">{t('compost', { en: 'Compost', ml: 'കമ്പോസ്റ്റ്' })}</option>
                        <option value="Vermicompost">{t('vermicompost', { en: 'Vermicompost', ml: 'വേം കമ്പോസ്റ്റ്' })}</option>
                        <option value="NPK Fertilizer">{t('npkFertilizer', { en: 'NPK Fertilizer', ml: 'എൻപികെ വളം' })}</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 7: Pest Control (with blank space) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-text-secondary mb-2">
                        {t('pestControl', { en: 'Pest Control Method', ml: 'കീടനിയന്ത്രണ രീതി' })}
                      </label>
                      <select
                        value={editFarmData.pest_control}
                        onChange={(e) => setEditFarmData({ ...editFarmData, pest_control: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark text-gray-900 dark:text-text-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      >
                        <option value="">{t('selectPestControl', { en: 'Select Pest Control Method', ml: 'കീടനിയന്ത്രണ രീതി തിരഞ്ഞെടുക്കുക' })}</option>
                        <option value="N.A.">{t('notApplicable', { en: 'N.A.', ml: 'ബാധകമല്ല' })}</option>
                        <option value="Organic Pesticides">{t('organicPesticides', { en: 'Organic Pesticides', ml: 'ജൈവ കീടനാശിനി' })}</option>
                        <option value="Chemical Pesticides">{t('chemicalPesticides', { en: 'Chemical Pesticides', ml: 'രാസ കീടനാശിനി' })}</option>
                        <option value="Integrated Pest Management">{t('ipm', { en: 'Integrated Pest Management', ml: 'സംയോജിത കീടനിയന്ത്രണം' })}</option>
                        <option value="Biological Control">{t('biologicalControl', { en: 'Biological Control', ml: 'ജൈവിക നിയന്ത്രണം' })}</option>
                        <option value="Natural Predators">{t('naturalPredators', { en: 'Natural Predators', ml: 'പ്രകൃതിദത്ത ശത്രുക്കൾ' })}</option>
                        <option value="Neem-based">{t('neemBased', { en: 'Neem-based', ml: 'വേപ്പ് അധിഷ്ഠിത' })}</option>
                      </select>
                    </div>

                    <div></div>
                  </div>
                </div>
                
                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditFarm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
                  </button>
                  <button
                    onClick={handleEditFarmSubmit}
                    disabled={!editFarmData.location || !editFarmData.size}
                    className="px-6 py-2 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors inline-flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t('update', { en: 'Update', ml: 'അപ്ഡേറ്റ് ചെय്യുക' })}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Profile
