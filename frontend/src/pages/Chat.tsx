import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, Camera, Bot, Upload, Image, X, Languages, Volume2, Square, Trash2, Plus, Copy, Check, Clock, MoreVertical, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface Message {
  id: number
  content: string
  isUser: boolean
  timestamp: Date
  imageUrl?: string
  translatedContent?: string
  originalLanguage?: 'en' | 'ml'
  isTranslated?: boolean
}

const Chat: React.FC = () => {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: t('welcomeMessage', { 
        en: 'Hello! I\'m your AI farming assistant. How can I help you today?',
        ml: 'ഹലോ! ഞാൻ നിങ്ങളുടെ AI കാർഷിക സഹായിയാണ്. ഇന്ന് എങ്ങനെ സഹായിക്കാം?'
      }),
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{file: File, preview: string} | null>(null)
  const [isTranslating, setIsTranslating] = useState<number | null>(null)
  const [isReading, setIsReading] = useState<number | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [showPreviousChats, setShowPreviousChats] = useState(false)
  const [savedChats, setSavedChats] = useState<any[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isRandomizingTopics, setIsRandomizingTopics] = useState(false)
  const [quickTopics, setQuickTopics] = useState({
    topic1: { title: 'Weather Forecast', query: 'What is the current weather forecast for farming?' },
    topic2: { title: 'Paddy Disease', query: 'How can I identify and treat paddy diseases?' },
    topic3: { title: 'Organic Fertilizers', query: 'What are the best organic fertilizers for crops?' }
  })
  const isReadingRef = useRef<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const hasChatHistory = messages.length > 1

  // Handle pre-filled query from URL parameters (for quick options)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const query = urlParams.get('q')
    if (query) {
      setInputMessage(decodeURIComponent(query))
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Load saved chats from localStorage on mount
  useEffect(() => {
    const loadSavedChats = () => {
      try {
        const saved = localStorage.getItem('krishi_sakhi_chats')
        if (saved) {
          const chats = JSON.parse(saved)
          setSavedChats(chats)
        }
      } catch (error) {
        console.error('Error loading saved chats:', error)
      }
    }
    loadSavedChats()
  }, [])

  // Auto-save chat whenever messages change (if there's actual conversation)
  useEffect(() => {
    if (messages.length > 1) {
      const saveCurrentChat = () => {
        try {
          const chatId = currentChatId || `chat_${Date.now()}`
          if (!currentChatId) {
            setCurrentChatId(chatId)
          }

          const chatData = {
            id: chatId,
            messages: messages.map(m => ({
              ...m,
              timestamp: m.timestamp.toISOString()
            })),
            lastUpdated: new Date().toISOString(),
            title: messages.length > 1 ? messages[1].content.substring(0, 50) + '...' : 'New Chat'
          }

          const saved = localStorage.getItem('krishi_sakhi_chats')
          let chats = saved ? JSON.parse(saved) : []
          
          // Update existing chat or add new one
          const existingIndex = chats.findIndex((c: any) => c.id === chatId)
          if (existingIndex >= 0) {
            chats[existingIndex] = chatData
          } else {
            chats.unshift(chatData)
          }

          // Keep only last 20 chats
          chats = chats.slice(0, 20)

          localStorage.setItem('krishi_sakhi_chats', JSON.stringify(chats))
          setSavedChats(chats)
        } catch (error) {
          console.error('Error saving chat:', error)
        }
      }

      // Debounce save to avoid too frequent updates
      const timeoutId = setTimeout(saveCurrentChat, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [messages, currentChatId])

  // *** FIXED SCROLL EFFECT ***
  // This single effect handles scrolling to the bottom whenever a new message is added.
  useEffect(() => {
    // This function scrolls the chat container to the very bottom.
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    // We call scrollToBottom with a minimal delay.
    // This ensures that React has finished rendering the new message
    // before we try to scroll to it.
    setTimeout(scrollToBottom, 0);

  }, [messages]); // This effect runs every time the 'messages' array changes.

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false)
      }
    }

    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOptionsMenu])

  // Clear chat function
  const clearChat = () => {
    // Reset to initial state with only welcome message
    setMessages([
      {
        id: 1,
        content: t('welcomeMessage', { 
          en: 'Hello! I\'m your AI farming assistant. How can I help you today?',
          ml: 'ഹലോ! ഞാൻ നിങ്ങളുടെ AI കാർഷിക സഹായിയാണ്. ഇന്ന് എങ്ങനെ സഹായിക്കാം?'
        }),
        isUser: false,
        timestamp: new Date()
      }
    ])
    
    // Clear any selected image
    setSelectedImage(null)
    
    // Clear input
    setInputMessage('')
    
    // Stop any ongoing audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }
    
    // Reset states
    setIsReading(null)
    setIsTranslating(null)
    setShowClearConfirm(false)
    setCopiedMessageId(null)
    
    // Clear reading ref
    isReadingRef.current = null
    
    // Reset chat ID for new chat
    setCurrentChatId(null)
    
    console.log('Chat cleared successfully')
  }

  // New chat function (same as clear chat but with different messaging)
  const startNewChat = () => {
    clearChat()
    // Randomize topics when starting new chat
    setTimeout(() => {
      randomizeTopics()
    }, 500)
    console.log('New chat started')
  }

  // Load a previous chat
  const loadPreviousChat = (chatData: any) => {
    try {
      // Stop any ongoing audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        setCurrentAudio(null)
      }

      // Parse and restore messages
      const restoredMessages = chatData.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }))

      setMessages(restoredMessages)
      setCurrentChatId(chatData.id)
      setShowPreviousChats(false)
      
      // Reset states
      setIsReading(null)
      setIsTranslating(null)
      setSelectedImage(null)
      setInputMessage('')
      
      console.log('Previous chat loaded:', chatData.id)
    } catch (error) {
      console.error('Error loading previous chat:', error)
    }
  }

  // Delete a saved chat
  const deleteSavedChat = (chatId: string) => {
    try {
      const saved = localStorage.getItem('krishi_sakhi_chats')
      if (saved) {
        let chats = JSON.parse(saved)
        chats = chats.filter((c: any) => c.id !== chatId)
        localStorage.setItem('krishi_sakhi_chats', JSON.stringify(chats))
        setSavedChats(chats)
        
        // If we deleted the current chat, start a new one
        if (currentChatId === chatId) {
          clearChat()
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  // Search functionality
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      // Clear highlights
      document.querySelectorAll('.search-highlight').forEach(el => {
        const parent = el.parentNode
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent || ''), el)
          parent.normalize()
        }
      })
      return
    }

    const results: number[] = []
    const searchLower = query.toLowerCase()

    messages.forEach((message) => {
      const contentLower = message.content.toLowerCase()
      const translatedLower = message.translatedContent?.toLowerCase() || ''
      
      if (contentLower.includes(searchLower) || translatedLower.includes(searchLower)) {
        results.push(message.id)
      }
    })

    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)

    // Highlight matching text
    setTimeout(() => {
      messages.forEach((message) => {
        const messageEl = document.getElementById(`message-${message.id}`)
        if (messageEl && results.includes(message.id)) {
          highlightText(messageEl, query)
        }
      })
      
      // Scroll to first result
      if (results.length > 0) {
        scrollToSearchResult(results[0])
      }
    }, 100)
  }

  const highlightText = (element: HTMLElement, searchText: string) => {
    // Clear any existing highlights first
    element.querySelectorAll('.search-highlight').forEach(highlight => {
      const parent = highlight.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
        parent.normalize()
      }
    })

    // Only search within the message content, skip buttons and other UI elements
    const messageContent = element.querySelector('.message-text')
    if (!messageContent) return

    // Create a more comprehensive text walker that handles all text nodes
    const walker = document.createTreeWalker(
      messageContent, 
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip text nodes inside buttons or other interactive elements
          const parent = node.parentElement
          if (parent && (parent.tagName === 'BUTTON' || parent.closest('button'))) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )
    
    const textNodes: Text[] = []
    let node: Node | null
    
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text)
    }

    const searchLower = searchText.toLowerCase()

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || ''
      const lowerText = text.toLowerCase()
      
      if (lowerText.includes(searchLower)) {
        const fragment = document.createDocumentFragment()
        let lastIndex = 0
        let index = lowerText.indexOf(searchLower)
        
        while (index !== -1) {
          // Add text before the match
          if (index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)))
          }
          
          // Create highlight element
          const highlight = document.createElement('mark')
          highlight.className = 'search-highlight'
          highlight.style.cssText = 'background-color: #fef08a; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: 500;'
          // Use the original text case for highlighting
          highlight.textContent = text.slice(index, index + searchLower.length)
          fragment.appendChild(highlight)
          
          lastIndex = index + searchLower.length
          index = lowerText.indexOf(searchLower, lastIndex)
        }
        
        // Add remaining text after the last match
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
        }
        
        // Replace the original text node with the highlighted fragment
        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(fragment, textNode)
        }
      }
    })
  }

  const scrollToSearchResult = (messageId: number) => {
    const messageEl = document.getElementById(`message-${messageId}`)
    if (messageEl && scrollContainerRef.current) {
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return

    let newIndex = currentSearchIndex
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length
    } else {
      newIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1
    }

    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(searchResults[newIndex])
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setCurrentSearchIndex(-1)
    
    // Clear all highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el)
        parent.normalize()
      }
    })
  }

  // Mobile device detection
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768) ||
           ('ontouchstart' in window)
  }

  // Mobile camera handler
  const handleMobileCamera = () => {
    if (mobileFileInputRef.current) {
      mobileFileInputRef.current.click()
    }
  }

  // Handle mobile camera file selection
  const handleMobileCameraFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
      // Clear the input so the same image can be selected again
      event.target.value = ''
    }
  }

  // Randomize quick suggestion topics using GROQ
  const randomizeTopics = async (e?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setIsRandomizingTopics(true)
    console.log('🤖 Randomizing topics...')
    try {
      const response = await fetch('/api/quick-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Generate exactly 3 random, practical farming topics for Kerala farmers. Each topic should be 2-4 words only. Format: Just list 3 short topics, one per line, no numbers, no bullets, no descriptions.',
          type: 'general'
        }),
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Data received:', data)
        
        const topicsText = data.response || ''
        console.log('📝 Topics text:', topicsText)
        
        const topics = topicsText.split('\n').filter((t: string) => t.trim()).slice(0, 3)
        console.log('📋 Parsed topics:', topics)
        
        if (topics.length >= 1) {
          const newTopics = topics.map((title: string) => {
            const cleanTitle = title.trim().replace(/^[0-9.\-*•]+\s*/, '').replace(/['"]/g, '')
            return {
              title: cleanTitle,
              query: `Tell me about ${cleanTitle.toLowerCase()} for farming in Kerala`
            }
          })
          
          // Pad with defaults if less than 3
          while (newTopics.length < 3) {
            const defaults = [
              { title: 'Weather Forecast', query: 'What is the current weather forecast for farming?' },
              { title: 'Paddy Disease', query: 'How can I identify and treat paddy diseases?' },
              { title: 'Organic Fertilizers', query: 'What are the best organic fertilizers for crops?' }
            ]
            newTopics.push(defaults[newTopics.length])
          }
          
          console.log('✅ New topics set:', newTopics)
          setQuickTopics({
            topic1: newTopics[0] || { title: 'Weather Forecast', query: 'What is the current weather forecast for farming?' },
            topic2: newTopics[1] || { title: 'Paddy Disease', query: 'How can I identify and treat paddy diseases?' },
            topic3: newTopics[2] || { title: 'Organic Fertilizers', query: 'What are the best organic fertilizers for crops?' }
          })
        } else {
          console.warn('⚠️ Not enough topics generated, keeping current topics')
        }
      } else {
        console.error('❌ API response not OK:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error randomizing topics:', error)
    } finally {
      setIsRandomizingTopics(false)
      console.log('🏁 Randomization complete')
    }
  }

  // Copy message function
  const copyMessage = async (messageId: number) => {
    const message = messages.find(msg => msg.id === messageId)
    if (!message) return

    try {
      // Get the content to copy (translated if available, otherwise original)
      const textToCopy = message.isTranslated && message.translatedContent 
        ? message.translatedContent 
        : message.content

      await navigator.clipboard.writeText(textToCopy)
      setCopiedMessageId(messageId)
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
      
      console.log('Message copied to clipboard')
    } catch (error) {
      console.error('Failed to copy message:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        const textToCopy = message.isTranslated && message.translatedContent 
          ? message.translatedContent 
          : message.content
        textArea.value = textToCopy
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopiedMessageId(messageId)
        setTimeout(() => {
          setCopiedMessageId(null)
        }, 2000)
        console.log('Message copied to clipboard (fallback)')
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError)
      }
    }
  }

  // Translation function  
  const translateMessage = async (messageId: number) => {
    setIsTranslating(messageId)
    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || message.isUser) return

      // If already translated, toggle back to original
      if (message.isTranslated && message.translatedContent) {
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m.id === messageId
              ? { ...m, isTranslated: false }
              : m
          )
        )
        setIsTranslating(null)
        return
      }

      const contentToTranslate = message.content
      const currentLang = message.originalLanguage || 'en'
      const targetLang = currentLang === 'en' ? 'ml' : 'en'

      const response = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: contentToTranslate,
          from: currentLang,
          to: targetLang
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m.id === messageId
              ? { 
                  ...m, 
                  translatedContent: data.translatedText,
                  isTranslated: true,
                  originalLanguage: currentLang
                }
              : m
          )
        )
      }
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(null)
    }
  }

  // Stop TTS function
  const stopReading = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }
    setIsReading(null) // Always reset reading state regardless of audio state
    isReadingRef.current = null // Clear the ref to cancel any pending audio
  }

  // Text-to-Speech function
  const readMessage = async (messageId: number) => {
    setIsReading(messageId)
    isReadingRef.current = messageId
    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || message.isUser) return

      // Get the text to read (translated version if available and active)
      const textToRead = message.isTranslated && message.translatedContent 
        ? message.translatedContent 
        : message.content

      // Determine language for TTS
      const language = message.isTranslated 
        ? (message.originalLanguage === 'en' ? 'ml' : 'en')
        : (message.originalLanguage || 'en')

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToRead,
          language: language
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        
        // Check if user has stopped reading while we were loading
        if (isReadingRef.current !== messageId) {
          return // User has cancelled, don't play audio
        }
        
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        // Store the current audio instance
        setCurrentAudio(audio)
        
        audio.onended = () => {
          setIsReading(null)
          setCurrentAudio(null)
          isReadingRef.current = null
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.onerror = () => {
          setIsReading(null)
          setCurrentAudio(null)
          isReadingRef.current = null
          URL.revokeObjectURL(audioUrl)
        }
        
        // Check again before playing (in case user clicked stop during audio loading)
        if (isReadingRef.current === messageId) {
          await audio.play()
        } else {
          // Clean up if cancelled
          setCurrentAudio(null)
          URL.revokeObjectURL(audioUrl)
        }
      }
    } catch (error) {
      console.error('TTS error:', error)
      setIsReading(null)
      setCurrentAudio(null)
      isReadingRef.current = null
    }
  }

  // Function to format AI response text
  const formatAIResponse = (text: string) => {
    // Helper function to process bold and italic text
    const processBoldItalic = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
    }

    // Split text into lines for processing
    const lines = text.split('\n')
    const formattedElements: JSX.Element[] = []
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        // Empty line - add spacing
        formattedElements.push(<br key={`br-${index}`} />)
      } else if (line.startsWith('###')) {
        // Heading
        const headingText = line.replace(/^###\s*/, '')
        const processedHeading = processBoldItalic(headingText)
        formattedElements.push(
          <h3 
            key={`h3-${index}`} 
            className="font-semibold text-sm mt-3 mb-1 text-gray-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: processedHeading }}
          />
        )
      } else if (line.startsWith('##')) {
        // Subheading
        const headingText = line.replace(/^##\s*/, '')
        const processedHeading = processBoldItalic(headingText)
        formattedElements.push(
          <h2 
            key={`h2-${index}`} 
            className="font-bold text-base mt-3 mb-2 text-gray-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: processedHeading }}
          />
        )
      } else if (line.trim().match(/^\d+\./)) {
        // Numbered list item
        const processedLine = processBoldItalic(line.trim())
        formattedElements.push(
          <div key={`num-${index}`} className="ml-2 mb-1">
            <span 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: processedLine }}
            />
          </div>
        )
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        // Bullet point
        const bulletText = line.replace(/^[-•]\s*/, '')
        const processedBullet = processBoldItalic(bulletText)
        formattedElements.push(
          <div key={`bullet-${index}`} className="ml-4 mb-1 flex">
            <span className="mr-2 text-sm">•</span>
            <span 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: processedBullet }}
            />
          </div>
        )
      } else {
        // Regular paragraph - handle bold text
        const processedLine = processBoldItalic(line)
        
        formattedElements.push(
          <p 
            key={`p-${index}`} 
            className="text-sm leading-relaxed mb-2"
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        )
      }
    })
    
    return <div className="space-y-1">{formattedElements}</div>
  }

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      content: inputMessage || (selectedImage ? "Image uploaded" : ""),
      isUser: true,
      timestamp: new Date(),
      imageUrl: selectedImage?.preview
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage
    const imageToSend = selectedImage
    setInputMessage('')
    setSelectedImage(null)
    setIsLoading(true)

    try {
      let response;
      
      if (imageToSend) {
        // Send image with message
        const formData = new FormData()
        formData.append('image', imageToSend.file)
        formData.append('message', messageToSend || '')
        
        response = await fetch('/api/chat/image', {
          method: 'POST',
          body: formData,
        })
      } else {
        // Send text message only
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageToSend }),
        })
      }

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      
      // Simple language detection for response
      const responseText = data.response || getBotResponse(messageToSend)
      const isResponseInMalayalam = /[\u0D00-\u0D7F]/.test(responseText)
      
      const botResponse: Message = {
        id: Date.now() + 1,
        content: responseText,
        isUser: false,
        timestamp: new Date(),
        originalLanguage: isResponseInMalayalam ? 'ml' : 'en',
        isTranslated: false
      }
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorResponse: Message = {
        id: Date.now() + 1,
        content: t('errorMessage', {
          en: 'Sorry, I encountered an error. Please try again.',
          ml: 'ക്ഷമിക്കണം, ഒരു പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
        }),
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    if (message.includes('weather')) {
      return t('weatherResponse', {
        en: 'The current weather is perfect for outdoor activities. Temperature is 28°C with clear skies.',
        ml: 'നിലവിലെ കാലാവസ്ഥ പുറത്തുള്ള പ്രവർത്തനങ്ങൾക്ക് അനുയോജ്യമാണ്. താപനില 28°C ആണ്, ആകാശം തെളിഞ്ഞിരിക്കുന്നു.'
      })
    } else if (message.includes('crop') || message.includes('rice') || message.includes('wheat')) {
      return t('cropResponse', {
        en: 'For this season, I recommend focusing on rice and wheat cultivation based on your region.',
        ml: 'ഈ സീസണിൽ, നിങ്ങളുടെ പ്രദേശത്തെ അടിസ്ഥാനമാക്കി നെല്ലും ഗോതമ്പും കൃഷിയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കാൻ ഞാൻ ശുപാർശ ചെയ്യുന്നു.'
      })
    } else if (message.includes('activity') || message.includes('log')) {
      return t('activityResponse', {
        en: 'I see you\'ve been active with sowing and watering. Great work! Remember to log your pest control activities for better tracking.',
        ml: 'നിങ്ങൾ വിതയലും നീരൊഴിക്കലും സജീവമായി നടത്തുന്നത് ഞാൻ കാണുന്നു. മികച്ച പ്രവർത്തനം! മികച്ച ട്രാക്കിംഗിനായി നിങ്ങളുടെ കീട നിയന്ത്രണ പ്രവർത്തനങ്ങൾ രേഖപ്പെടുത്താൻ ഓർക്കുക.'
      })
    } else {
      return t('defaultResponse', {
        en: 'That\'s interesting! Can you tell me more about your specific farming needs?',
        ml: 'അത് രസകരമാണ്! നിങ്ങളുടെ നിർദ്ദിഷ്ട കാർഷിക ആവശ്യങ്ങളെക്കുറിച്ച് കൂടുതൽ പറയാമോ?'
      })
    }
  }

  // Voice recording functionality
  const handleVoiceRecording = () => {
    console.log('Voice recording clicked, isListening:', isListening)
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      alert(t('voiceNotSupported', {
        en: 'Voice recognition is not supported in your browser. Please use Chrome or Edge.',
        ml: 'നിങ്ങളുടെ ബ്രൗസറിൽ വോയിസ് റെക്കഗ്നിഷൻ പിന്തുണയ്ക്കുന്നില്ল. ദയവായി Chrome അല്ലെങ്കിൽ Edge ഉപയോഗിക്കുക.'
      }))
      return
    }

    if (isListening) {
      console.log('Stopping voice recognition')
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      
      // Configure recognition for real-time transcription
      recognition.continuous = true  // Keep listening continuously
      recognition.interimResults = true  // Show results as user speaks
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      let finalTranscript = ''
      let interimTranscript = ''

      recognition.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
        finalTranscript = inputMessage.trim() // Start with existing text
      }

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event)
        
        interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + transcript
            console.log('Final transcript:', finalTranscript)
          } else {
            interimTranscript += transcript
            console.log('Interim transcript:', interimTranscript)
          }
        }
        
        // Update input with final + interim transcript
        const displayText = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')
        setInputMessage(displayText)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        let errorMessage = t('voiceError', {
          en: 'Voice recognition error. Please try again.',
          ml: 'വോയിസ് റെക്കഗ്നിഷൻ പിശക്. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
        })
        
        if (event.error === 'not-allowed') {
          errorMessage = t('micPermission', {
            en: 'Microphone permission denied. Please allow microphone access.',
            ml: 'മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചു. ദയവായി മൈക്രോഫോൺ ആക്സസ് അനുവദിക്കുക.'
          })
        }
        
        alert(errorMessage)
      }

      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        
        // Finalize the text with only the final transcript
        if (finalTranscript) {
          setInputMessage(finalTranscript)
        }
      }

      console.log('Starting speech recognition')
      recognition.start()
      
    } catch (error) {
      console.error('Speech recognition initialization error:', error)
      setIsListening(false)
      alert(t('voiceNotSupported', {
        en: 'Voice recognition failed to initialize. Please try again.',
        ml: 'വോയിസ് റെക്കഗ്നിഷൻ ആരംഭിക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
      }))
    }
  }

  // Image upload functionality
  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      setSelectedImage({ file, preview })
      setShowImageUpload(false)
      // Don't automatically set input message - let user type their own
    }
    reader.readAsDataURL(file)
  }

  const handleCamera = async () => {
    try {
      setShowImageUpload(false) // Close the popup first
      
      // Check if mobile device and use native camera
      if (isMobileDevice()) {
        handleMobileCamera()
        return
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      console.log('Requesting camera access...')
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera access granted, creating video element...')
      
      // Detect dark mode more reliably
      const isDarkMode = document.documentElement.classList.contains('dark')
      console.log('Dark mode detected:', isDarkMode, 'Classes:', document.documentElement.className)
      
      // Create video container with enhanced styling
      const videoContainer = document.createElement('div')
      videoContainer.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 520px;
        height: 360px;
        margin-bottom: 20px;
        margin-top: 10px;
        border-radius: 20px;
        overflow: hidden;
        background: ${isDarkMode ? '#0f172a' : '#f8fafc'};
        box-shadow: ${isDarkMode ? 
          'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(71, 85, 105, 0.3)' : 
          'inset 0 2px 4px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(148, 163, 184, 0.3)'
        };
        display: flex;
        align-items: center;
        justify-content: center;
      `

      // Create video element for camera preview
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        border-radius: 20px;
        background: ${isDarkMode ? '#111827' : '#f8fafc'};
      `
      
      videoContainer.appendChild(video)
      
      // Create canvas for capturing image
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      // Create modal for camera interface
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: ${isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.75)'}; z-index: 1000;
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; padding: 20px;
        backdrop-filter: blur(12px);
        animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      `
      
      const container = document.createElement('div')
      container.style.cssText = `
        background: ${isDarkMode ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'linear-gradient(145deg, #ffffff, #f8fafc)'}; 
        border-radius: 24px; padding: 20px;
        max-width: min(600px, 95vw); max-height: 95vh; overflow: hidden;
        display: flex; flex-direction: column; align-items: center;
        border: ${isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0'};
        box-shadow: ${isDarkMode ? 
          '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(148, 163, 184, 0.1)' : 
          '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        };
        animation: modalSlideIn 0.3s ease-out;
        position: relative;
      `
      

      
      // Camera switching functionality
      let currentFacingMode = 'environment' // Start with rear camera
      let currentStream = stream // Keep reference to current stream
      
      const switchCamera = async () => {
        try {
          // Stop current stream
          currentStream.getTracks().forEach(track => track.stop())
          
          // Switch camera mode
          currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment'
          
          // Get new stream with switched camera
          currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: currentFacingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          })
          
          // Update video stream
          video.srcObject = currentStream
          
          // Update switch button text and icon
          const nextCameraText = currentFacingMode === 'environment' ? 
            t('frontCamera', { en: 'Front', ml: 'മുന്നിൽ' }) : 
            t('rearCamera', { en: 'Rear', ml: 'പിന്നിൽ' })
          
          // Update switch camera icon tooltip or visual feedback if needed
          switchCameraIcon.title = nextCameraText
        } catch (error) {
          console.error('Error switching camera:', error)
          alert(t('cameraSwitchError', {
            en: 'Could not switch camera. Some devices may not support camera switching.',
            ml: 'ക്യാമറ സ്വിച്ച് ചെയ്യാൻ കഴിഞ്ഞില്ല. ചില ഉപകരണങ്ങൾ ക്യാമറ സ്വിച്ചിംഗ് പിന്തുണയ്ക്കുന്നില്ല.'
          }))
        }
      }
      
      // Add camera switch button as floating icon in bottom right of video
      const switchCameraIcon = document.createElement('button')
      switchCameraIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      `
      switchCameraIcon.style.cssText = `
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: ${isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.95)'};
        color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
        border: none;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        border: 2px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(71, 85, 105, 0.3)'};
        z-index: 5;
        box-shadow: ${isDarkMode ? 
          '0 4px 6px -1px rgba(0, 0, 0, 0.4)' : 
          '0 4px 6px -1px rgba(0, 0, 0, 0.15)'
        };
      `
      switchCameraIcon.onclick = switchCamera
      
      // Add hover effects for camera switch button
      switchCameraIcon.onmouseover = () => {
        switchCameraIcon.style.background = isDarkMode ? 'rgba(51, 65, 85, 0.9)' : 'rgba(226, 232, 240, 1)'
        switchCameraIcon.style.transform = 'scale(1.05)'
      }
      
      switchCameraIcon.onmouseout = () => {
        switchCameraIcon.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.95)'
        switchCameraIcon.style.transform = 'scale(1)'
      }
      
      // Update cleanup function to use currentStream
      const cleanup = () => {
        currentStream.getTracks().forEach(track => track.stop())
        document.body.removeChild(modal)
      }

      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = `
        display: flex; 
        gap: 16px; 
        margin: 20px 0; 
        flex-wrap: wrap; 
        justify-content: center;
        align-items: center;
        width: 100%;
      `
      
      // Update switch camera icon to be a regular button (not overlay)
      switchCameraIcon.style.cssText = `
        background: ${isDarkMode ? 'linear-gradient(145deg, #374151, #1f2937)' : 'linear-gradient(145deg, #f1f5f9, #e2e8f0)'}; 
        color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
        border: ${isDarkMode ? '1px solid #6b7280' : '1px solid #cbd5e1'};
        border-radius: 50%;
        padding: 16px; 
        cursor: pointer; 
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: ${isDarkMode ? 
          '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 
          '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        };
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.025em;
      `
      switchCameraIcon.title = t('switchCamera', { en: 'Switch Camera', ml: 'ക്യാമറ മാറ്റുക' })
      
      // Update hover effects for switch camera button
      switchCameraIcon.onmouseover = () => {
        switchCameraIcon.style.background = isDarkMode ? 'linear-gradient(145deg, #1f2937, #111827)' : 'linear-gradient(145deg, #e2e8f0, #cbd5e1)'
        switchCameraIcon.style.transform = 'translateY(-1px) scale(1.02)'
      }
      
      switchCameraIcon.onmouseout = () => {
        switchCameraIcon.style.background = isDarkMode ? 'linear-gradient(145deg, #374151, #1f2937)' : 'linear-gradient(145deg, #f1f5f9, #e2e8f0)'
        switchCameraIcon.style.transform = 'translateY(0) scale(1)'
      }
      

      
      const captureBtn = document.createElement('button')
      captureBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      `
      captureBtn.style.cssText = `
        background: linear-gradient(145deg, #10b981, #059669); 
        color: white; 
        border: none; 
        border-radius: 50%;
        padding: 16px; 
        cursor: pointer; 
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.025em;
      `
      captureBtn.title = t('capture', { en: 'Capture', ml: 'പിടിക്കുക' })
      
      const captureHover = () => {
        captureBtn.style.background = 'linear-gradient(145deg, #059669, #047857)'
        captureBtn.style.transform = 'translateY(-1px)'
        captureBtn.style.boxShadow = '0 6px 18px 0 rgba(16, 185, 129, 0.5)'
      }
      
      const captureLeave = () => {
        captureBtn.style.background = 'linear-gradient(145deg, #10b981, #059669)'
        captureBtn.style.transform = 'translateY(0)'
        captureBtn.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.4)'
      }
      
      captureBtn.onmouseover = captureHover
      captureBtn.onmouseout = captureLeave
      
      // Create cancel button with red X
      const cancelBtn = document.createElement('button')
      cancelBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `
      cancelBtn.style.cssText = `
        background: linear-gradient(145deg, #ef4444, #dc2626); 
        color: white; 
        border: none; 
        border-radius: 50%;
        padding: 16px; 
        cursor: pointer; 
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4);
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.025em;
      `
      cancelBtn.title = t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })
      
      const cancelHover = () => {
        cancelBtn.style.background = 'linear-gradient(145deg, #dc2626, #b91c1c)'
        cancelBtn.style.transform = 'translateY(-1px)'
        cancelBtn.style.boxShadow = '0 6px 18px 0 rgba(239, 68, 68, 0.5)'
      }
      
      const cancelLeave = () => {
        cancelBtn.style.background = 'linear-gradient(145deg, #ef4444, #dc2626)'
        cancelBtn.style.transform = 'translateY(0)'
        cancelBtn.style.boxShadow = '0 4px 14px 0 rgba(239, 68, 68, 0.4)'
      }
      
      cancelBtn.onmouseover = cancelHover
      cancelBtn.onmouseout = cancelLeave
      
      cancelBtn.onclick = () => {
        currentStream.getTracks().forEach(track => track.stop())
        document.body.removeChild(modal)
      }
      
      captureBtn.onclick = () => {
        try {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          // Draw current video frame to canvas
          context?.drawImage(video, 0, 0)
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Create file from blob
              const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
              console.log('Camera capture successful:', file.name)
              handleImageUpload(file)
            }
            cleanup()
          }, 'image/jpeg', 0.8)
          
        } catch (error) {
          console.error('Capture error:', error)
          cleanup()
          alert(t('captureError', {
            en: 'Failed to capture image. Please try again.',
            ml: 'ചിത്രം പിടിക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
          }))
        }
      }
      
      // Assemble modal
      container.appendChild(videoContainer)
      buttonContainer.appendChild(cancelBtn)
      buttonContainer.appendChild(captureBtn)
      buttonContainer.appendChild(switchCameraIcon)
      container.appendChild(buttonContainer)
      modal.appendChild(container)
      document.body.appendChild(modal)
      
      // Handle video loaded
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, ready to capture')
      }
      
    } catch (error) {
      console.error('Camera error:', error)
      
      let errorMessage = t('cameraError', {
        en: 'Unable to access camera. Please check permissions and try again.',
        ml: 'ക്യാമറ ആക്സസ് ചെയ്യാൻ കഴിയുന്നില്ല. അനുമതികൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.'
      })
      
      const cameraError = error as any
      if (cameraError.name === 'NotAllowedError') {
        errorMessage = t('cameraPermission', {
          en: 'Camera permission denied. Please allow camera access in your browser settings.',
          ml: 'ക്യാമറ അനുമതി നിഷേധിച്ചു. നിങ്ങളുടെ ബ്രൗസർ ക്രമീകരണങ്ങളിൽ ക്യാമറ ആക്സസ് അനുവദിക്കുക.'
        })
      } else if (cameraError.name === 'NotFoundError') {
        errorMessage = t('cameraNotFound', {
          en: 'No camera found on this device.',
          ml: 'ഈ ഉപകരണത്തിൽ ക്യാമറ കണ്ടെത്തിയില്ല.'
        })
      }
      
      alert(errorMessage)
    }
  }

  return (
    <div className="relative h-full bg-background-light dark:bg-background-dark flex flex-col mobile-height max-w-md mx-auto" 
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)', // Account for mobile safe area
        minHeight: '100vh'
      }}>
      
      {/* Header with three-dot menu button - Fixed at top - HIDDEN, menu moved to input */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 pt-20" 
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)',
          width: '100%',
          pointerEvents: 'none',
          display: 'none'
        }}>
        <div className="max-w-md mx-auto">
          <div className="flex justify-end items-center mb-4" style={{ pointerEvents: 'auto' }}>
            {/* Three-dot Menu Button */}
            <div className="relative" ref={optionsMenuRef}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-lg transition-all duration-200 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={t('options', { en: 'Options', ml: 'ഓപ്ഷനുകൾ' })}
              >
                <MoreVertical className="w-5 h-5" strokeWidth={2} />
              </button>

              {/* Dropdown Menu */}
              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[100]">
                  {/* New Chat Option */}
                  <button
                    onClick={() => {
                      startNewChat()
                      setShowOptionsMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-primary-500" strokeWidth={2} />
                    <span className="text-sm font-medium">
                      {t('newChat', { en: 'New Chat', ml: 'പുതിയ ചാറ്റ്' })}
                    </span>
                  </button>

                  {/* Previous Chats Option */}
                  <button
                    onClick={() => {
                      setShowPreviousChats(true)
                      setShowOptionsMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Clock className="w-5 h-5 text-purple-500" strokeWidth={2} />
                    <span className="text-sm font-medium">
                      {t('previousChats', { en: 'Previous Chats', ml: 'മുന്നത്തെ ചാറ്റുകൾ' })}
                    </span>
                    {savedChats.length > 0 && (
                      <span className="ml-auto text-xs bg-purple-500 text-white rounded-full px-2 py-0.5">
                        {savedChats.length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Area - Full height container with top padding for fixed header */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 px-4 pb-8 scroll-smooth chat-scroll flex flex-col"
        id="chat-container"
        style={{ 
          height: 'calc(100vh - 160px - env(safe-area-inset-top, 0px))',
          maxHeight: 'calc(100vh - 160px - env(safe-area-inset-top, 0px))',
          overflowY: hasChatHistory ? 'auto' : 'hidden',
          display: 'flex',
          flexDirection: 'column',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          paddingTop: '140px'
        }}
      >
        {messages.length === 1 && (
          /* Welcome Section - Mobile optimized with no scroll */
          <div 
            className="flex flex-col items-center justify-start text-center px-4 sm:px-6"
            style={{ 
              minHeight: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Robot Icon Circle - Mobile responsive - Now clickable */}
            <button
              type="button"
              onClick={randomizeTopics}
              disabled={isRandomizingTopics}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer group"
              title="Click to randomize topics"
            >
              <Bot className={`w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400 transition-transform ${
                isRandomizingTopics ? 'animate-spin' : 'group-hover:rotate-12'
              }`} />
            </button>
            
            {/* Welcome Title - Mobile responsive */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-text-primary mb-2 sm:mb-3">
              {t('welcomeTitle', { 
                en: 'Welcome to Krishi Sakhi AI', 
                ml: 'കൃഷി സഖി AI-യിലേക്ക് സ്വാഗതം' 
              })}
            </h2>
            
            {/* Welcome Message - Mobile responsive */}
            <p className="text-gray-600 dark:text-text-secondary text-xs sm:text-sm leading-relaxed mb-2 max-w-xs">
              {messages[0].content}
            </p>
            <p className="text-green-600 dark:text-green-400 text-xs mb-6 sm:mb-8 max-w-xs animate-pulse">
              💡 Click the robot to randomize topics!
            </p>
            
            {/* Suggestion Buttons - Mobile optimized */}
            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => {
                  setInputMessage(quickTopics.topic1.query)
                  setTimeout(() => handleSendMessage(), 100)
                }}
                className="w-full py-4 px-4 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-text-primary rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:border-green-400 dark:hover:border-green-600 text-sm font-medium focus:ring-2 focus:ring-primary-400 min-h-[48px] touch-manipulation active:scale-98"
              >
                {quickTopics.topic1.title}
              </button>
              
              <button
                onClick={() => {
                  setInputMessage(quickTopics.topic2.query)
                  setTimeout(() => handleSendMessage(), 100)
                }}
                className="w-full py-4 px-4 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-text-primary rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:border-green-400 dark:hover:border-green-600 text-sm font-medium focus:ring-2 focus:ring-primary-400 min-h-[48px] touch-manipulation active:scale-98"
              >
                {quickTopics.topic2.title}
              </button>
              
              <button
                onClick={() => {
                  setInputMessage(quickTopics.topic3.query)
                  setTimeout(() => handleSendMessage(), 100)
                }}
                className="w-full py-4 px-4 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-text-primary rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:border-green-400 dark:hover:border-green-600 text-sm font-medium focus:ring-2 focus:ring-primary-400 min-h-[48px] touch-manipulation active:scale-98"
              >
                {quickTopics.topic3.title}
              </button>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        {messages.length > 1 && (
          <div className="flex flex-col mt-auto space-y-3 pb-24">
            {messages.slice(1).map((message) => (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in px-1`}
              >
                <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[85%]`}>
                  <div
                    className={`px-3 py-3 sm:px-4 rounded-2xl ${
                      message.isUser
                        ? 'bg-primary-500 text-white rounded-br-md border-2 border-primary-600'
                        : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-text-primary rounded-bl-md border-2 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {message.imageUrl && (
                      <div className="mb-2">
                        <img
                          src={message.imageUrl}
                          alt="Uploaded"
                          className="max-w-48 max-h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                      </div>
                    )}
                    {!message.isUser ? (
                      <div className="message-text">
                        {/* AI Message Content */}
                        {formatAIResponse(
                          message.isTranslated && message.translatedContent 
                            ? message.translatedContent 
                            : message.content
                        )}
                        
                        {/* Action Buttons for AI Messages - Mobile Optimized */}
                        <div className="flex items-center justify-end gap-1 sm:gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex-wrap">
                          {/* Copy Button */}
                          <button
                            onClick={() => copyMessage(message.id)}
                            className="flex items-center gap-1 px-3 py-2 sm:px-2 sm:py-1 text-xs text-gray-600 dark:text-gray-400 rounded-md transition-colors min-h-[36px] touch-manipulation"
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedMessageId === message.id ? (
                              t('copied', { en: 'Copied', ml: 'പകർത്തി' })
                            ) : (
                              t('copy', { en: 'Copy', ml: 'പകർത്തുക' })
                            )}
                          </button>
                          
                          {/* Translate Button */}
                          <button
                            onClick={() => translateMessage(message.id)}
                            disabled={isTranslating === message.id}
                            className="flex items-center gap-1 px-3 py-2 sm:px-2 sm:py-1 text-xs text-gray-600 dark:text-gray-400 rounded-md transition-colors disabled:opacity-50 min-h-[36px] touch-manipulation"
                            title={message.isTranslated ? "Show Original" : "Translate"}
                          >
                            <Languages className="w-3 h-3" />
                            {isTranslating === message.id ? (
                              t('translating', { en: 'Translating...', ml: 'വിവർത്തനം ചെയ്യുന്നു...' })
                            ) : message.isTranslated ? (
                              t('showOriginal', { en: 'Original', ml: 'യഥാർത്ഥം' })
                            ) : (
                              t('translate', { en: 'Translate', ml: 'വിവർത്തനം' })
                            )}
                          </button>
                          
                          {/* TTS Button */}
                          <button
                            onClick={() => {
                              if (isReading === message.id) {
                                stopReading()
                              } else {
                                readMessage(message.id)
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-2 sm:px-2 sm:py-1 text-xs text-gray-600 dark:text-gray-400 rounded-md transition-colors min-h-[36px] touch-manipulation"
                            title={isReading === message.id ? "Stop reading" : "Listen to message"}
                          >
                            {isReading === message.id ? (
                              <Square className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                            {isReading === message.id ? (
                              t('stop', { en: 'Stop', ml: 'നിർത്തുക' })
                            ) : (
                              t('listen', { en: 'Listen', ml: 'കേൾക്കുക' })
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // User messages without copy functionality
                      <div className="message-text">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Upload Popup */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 m-4 max-w-sm w-full border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary mb-4">
              {t('addImage', { en: 'Add Image', ml: 'ചിത്രം ചേർക്കുക' })}
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleCamera}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-primary-500 text-white rounded-xl transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span>{t('takePhoto', { en: 'Take Photo', ml: 'ഫോട്ടോ എടുക്കുക' })}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-xl transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>{t('uploadImage', { en: 'Upload Image', ml: 'ചിത്രം അപ്‌ലോഡ് ചെയ്യുക' })}</span>
              </button>
              <button
                onClick={() => setShowImageUpload(false)}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-xl transition-colors"
              >
                {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 m-4 max-w-sm w-full border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary">
                {t('clearChatTitle', { en: 'Clear Chat History?', ml: 'ചാറ്റ് ചരിത്രം മായ്ക്കണോ?' })}
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              {t('clearChatMessage', { 
                en: 'This will permanently delete all your chat messages. This action cannot be undone.',
                ml: 'ഇത് നിങ്ങളുടെ എല്ലാ ചാറ്റ് സന്ദേശങ്ങളും സ്ഥിരമായി ഇല്ലാതാക്കും. ഈ പ്രവർത്തനം പഴയപടിയാക്കാൻ കഴിയില്ല.'
              })}
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-text-primary rounded-xl transition-colors font-medium"
              >
                {t('cancel', { en: 'Cancel', ml: 'റദ്ദാക്കുക' })}
              </button>
              <button
                onClick={clearChat}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl transition-colors font-medium"
              >
                {t('clearConfirm', { en: 'Clear Chat', ml: 'ചാറ്റ് മായ്ക്കുക' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleImageUpload(file)
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Hidden Mobile Camera Input */}
      <input
        ref={mobileFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleMobileCameraFile}
        style={{ display: 'none' }}
      />

      {/* Previous Chats Modal */}
      {showPreviousChats && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('previousChats', { en: 'Previous Chats', ml: 'മുന്നത്തെ ചാറ്റുകൾ' })}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {savedChats.length} {savedChats.length === 1 ? 'chat' : 'chats'} saved
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviousChats(false)}
                className="p-3 text-gray-500 dark:text-gray-400 rounded-2xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {savedChats.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-violet-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No chats yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                    {t('noPreviousChats', { 
                      en: 'Start a conversation to save your chat history!',
                      ml: 'ചാറ്റ് ചരിത്രം സംരക്ഷിക്കാൻ സംഭാഷണം ആരംഭിക്കൂ!'
                    })}
                  </p>
                </div>
              ) : (
                savedChats.map((chat, index) => (
                  <div
                    key={chat.id}
                    className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start gap-4">
                      {/* Chat Icon */}
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      
                      {/* Chat Content */}
                      <button
                        onClick={() => loadPreviousChat(chat)}
                        className="flex-1 text-left min-w-0"
                      >
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 leading-snug min-h-[2.5rem] line-clamp-2">
                          {chat.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="font-medium">{new Date(chat.lastUpdated).toLocaleDateString()}</span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>{chat.messages.length} messages</span>
                        </div>
                        
                        {/* Current Chat Badge */}
                        {chat.id === currentChatId && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/40 rounded-full">
                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                              {t('currentChat', { en: 'Active', ml: 'സജീവ' })}
                            </span>
                          </div>
                        )}
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(t('confirmDeleteChat', { 
                            en: 'Delete this chat?',
                            ml: 'ഈ ചാറ്റ് ഇല്ലാതാക്കണോ?'
                          }))) {
                            deleteSavedChat(chat.id)
                          }
                        }}
                        className="p-2.5 text-red-500 dark:text-red-400 rounded-xl opacity-60"
                        title="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Input Area */}
      <div 
        className="fixed left-0 right-0 px-3 py-2 z-40 safe-area-inset-bottom"
        style={{
          bottom: '100px', // Moved up higher to provide better spacing from floating navbar
          background: 'transparent'
        }}
      >
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-3 max-w-md mx-auto">
            <div className="relative inline-block">
              <img
                src={selectedImage.preview}
                alt="Selected"
                className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-1 max-w-md mx-auto bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-300 dark:border-gray-600 p-2 pl-1">
              {!showSearch ? (
                <>
                  {/* Three-dot Menu Button - Shifted left with reduced padding */}
                  <button
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center relative"
                  >
                    <MoreVertical className="w-5 h-5" />
                    
                    {/* Dropdown Menu */}
                    {showOptionsMenu && (
                      <div 
                        ref={optionsMenuRef}
                        className="absolute left-0 bottom-12 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[100]"
                      >
                        {/* New Chat Option */}
                        <button
                          onClick={() => {
                            startNewChat()
                            setShowOptionsMenu(false)
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-primary-500" strokeWidth={2} />
                          <span className="text-sm font-medium">
                            {t('newChat', { en: 'New Chat', ml: 'പുതിയ ചാറ്റ്' })}
                          </span>
                        </button>

                        {/* Search Chat Option */}
                        {messages.length > 1 && (
                          <button
                            onClick={() => {
                              setShowSearch(true)
                              setShowOptionsMenu(false)
                              setTimeout(() => searchInputRef.current?.focus(), 100)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Search className="w-5 h-5 text-blue-500" strokeWidth={2} />
                            <span className="text-sm font-medium">
                              {t('searchChat', { en: 'Search Chat', ml: 'ചാറ്റ് തിരയുക' })}
                            </span>
                          </button>
                        )}

                        {/* Clear Chat Option */}
                        {messages.length > 1 && (
                          <button
                            onClick={() => {
                              setShowOptionsMenu(false)
                              setShowClearConfirm(true)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" strokeWidth={2} />
                            <span className="text-sm font-medium">
                              {t('clearChat', { en: 'Clear Chat', ml: 'ചാറ്റ് മായ്ക്കുക' })}
                            </span>
                          </button>
                        )}

                        {/* Previous Chats Option */}
                        <button
                          onClick={() => {
                            setShowPreviousChats(true)
                            setShowOptionsMenu(false)
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <Clock className="w-5 h-5 text-purple-500" strokeWidth={2} />
                          <span className="text-sm font-medium">
                            {t('previousChats', { en: 'Previous Chats', ml: 'മുന്നത്തെ ചാറ്റുകൾ' })}
                          </span>
                          {savedChats.length > 0 && (
                            <span className="ml-auto text-xs bg-purple-500 text-white rounded-full px-2 py-0.5">
                              {savedChats.length}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </button>
                  
                  {/* Image Upload Button - Inside the box */}
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(true)}
                    className="p-2 text-gray-600 dark:text-gray-400 transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  
                  {/* Input Field */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t('chatPlaceholder', {
                        en: 'Ask a question...',
                        ml: 'ചോദ്യം ചോദിക്കൂ...'
                      })}
                      className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-text-primary text-base sm:text-sm focus:outline-none"
                      maxLength={500}
                    />
                  </div>
                  
                  {/* Voice Button - Inside the box */}
                  <button
                    type="button"
                    onClick={handleVoiceRecording}
                    className={`p-2 transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center ${
                      isListening
                        ? 'text-red-500 animate-pulse'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  {/* Send Button - Inside the box */}
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                    className={`p-2 rounded-full transition-all duration-200 min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center ${
                      (inputMessage.trim() || selectedImage) && !isLoading
                        ? 'bg-primary-500 text-white active:bg-primary-600 active:scale-95'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </>
              ) : (
                /* Search Mode */
                <>
                  {/* Search Icon */}
                  <div className="p-2 flex items-center justify-center min-h-[40px] min-w-[40px]">
                    <Search className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        performSearch(e.target.value)
                      }}
                      placeholder={t('searchMessages', { en: 'Search messages...', ml: 'സന്ദേശങ്ങൾ തിരയുക...' })}
                      className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-text-primary text-base sm:text-sm focus:outline-none"
                    />
                  </div>

                  {/* Search Navigation */}
                  {searchResults.length > 0 && (
                    <>
                      <div className="px-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {currentSearchIndex + 1}/{searchResults.length}
                      </div>
                      <button
                        onClick={() => navigateSearch('prev')}
                        className="p-2 text-gray-600 dark:text-gray-400 rounded-lg transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigateSearch('next')}
                        className="p-2 text-gray-600 dark:text-gray-400 rounded-lg transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Close Search Button */}
                  <button
                    onClick={closeSearch}
                    className="p-2 bg-red-500 text-white rounded-full transition-colors min-h-[40px] min-w-[40px] touch-manipulation flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
      </div>
    </div>
  )
}

export default Chat