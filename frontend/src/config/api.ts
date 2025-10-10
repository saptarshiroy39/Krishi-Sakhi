// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

export const API_ENDPOINTS = {
  // Base URL for all API calls
  BASE: API_BASE_URL,
  
  // Specific endpoints
  SCHEMES: `${API_BASE_URL}/schemes`,
  SCHEMES_DEFAULT: `${API_BASE_URL}/schemes/default-recommendations`,
  SCHEMES_RECOMMEND: `${API_BASE_URL}/schemes/recommend`,
  
  PROFILE: `${API_BASE_URL}/profile`,
  PROFILE_BY_ID: (id: number) => `${API_BASE_URL}/profile/${id}`,
  
  FARM: `${API_BASE_URL}/farm`,
  FARM_BY_ID: (id: number) => `${API_BASE_URL}/farm/${id}`,
  
  KNOWLEDGE_CONTENT: `${API_BASE_URL}/knowledge/content`,
  
  HOME_DASHBOARD: (location: string) => `${API_BASE_URL}/home/dashboard?location=${location}`,
  HOME_WEATHER: (location: string) => `${API_BASE_URL}/home/weather-forecast/${location}`,
  HOME_ADVISORY_REGENERATE: `${API_BASE_URL}/home/advisory/regenerate`,
  HOME_QUICK_OPTIONS: `${API_BASE_URL}/home/quick-options`,
  
  CHAT: `${API_BASE_URL}/chat`,
  CHAT_IMAGE: `${API_BASE_URL}/chat/image`,
  TRANSLATE: `${API_BASE_URL}/translate`,
  TTS: `${API_BASE_URL}/tts`,
  
  ACTIVITIES: `${API_BASE_URL}/activity`,
  ACTIVITIES_BY_FARM: (farmId: number) => `${API_BASE_URL}/activity/farm/${farmId}`,
  
  ADVISORY: (farmerId: number) => `${API_BASE_URL}/advisory/farmer/${farmerId}`,
  
  HEALTH: `${API_BASE_URL}/health`
}

// Helper function for making API calls
export const apiCall = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}