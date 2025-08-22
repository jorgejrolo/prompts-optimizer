import { useState, useEffect, useCallback, useRef } from 'react'

// Hook para persistencia automática en localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

// Hook para detección de tema del sistema
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return systemTheme
}

// Hook para gestión avanzada de tema
export function useTheme() {
  const systemTheme = useSystemTheme()
  const [themePreference, setThemePreference] = useLocalStorage<'system' | 'light' | 'dark'>('po_theme_preference', 'system')
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const effectiveTheme = themePreference === 'system' ? systemTheme : themePreference
    setCurrentTheme(effectiveTheme)
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effectiveTheme)
    }
  }, [themePreference, systemTheme])

  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setThemePreference(newTheme)
  }, [currentTheme, setThemePreference])

  const setTheme = useCallback((theme: 'system' | 'light' | 'dark') => {
    setThemePreference(theme)
  }, [setThemePreference])

  return {
    theme: currentTheme,
    themePreference,
    systemTheme,
    toggleTheme,
    setTheme
  }
}

// Hook para debouncing (útil para búsquedas)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para detección de cambios en el prompt
export function usePromptAnalysis(prompt: string) {
  const [analysis, setAnalysis] = useState({
    wordCount: 0,
    charCount: 0,
    sentenceCount: 0,
    complexity: 'low' as 'low' | 'medium' | 'high',
    hasActionWords: false,
    hasSpecificFormat: false,
    estimatedIntent: 'general' as string
  })

  useEffect(() => {
    if (!prompt.trim()) {
      setAnalysis({
        wordCount: 0,
        charCount: 0,
        sentenceCount: 0,
        complexity: 'low',
        hasActionWords: false,
        hasSpecificFormat: false,
        estimatedIntent: 'general'
      })
      return
    }

    const words = prompt.trim().split(/\s+/).filter(word => word.length > 0)
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const chars = prompt.length

    // Check for action words
    const actionWords = ['create', 'generate', 'write', 'analyze', 'explain', 'summarize', 'make', 'build', 'design', 'list', 'compare', 'translate', 'fix', 'debug', 'optimize']
    const hasActionWords = actionWords.some(word => prompt.toLowerCase().includes(word))

    // Check for format specifications
    const formatWords = ['json', 'table', 'markdown', 'bullets', 'list', 'format', 'structure']
    const hasSpecificFormat = formatWords.some(word => prompt.toLowerCase().includes(word))

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'low'
    if (words.length > 50 && sentences.length > 3) complexity = 'medium'
    if (words.length > 100 && sentences.length > 5) complexity = 'high'

    // Estimate intent
    let estimatedIntent = 'general'
    const promptLower = prompt.toLowerCase()
    if (promptLower.includes('summar')) estimatedIntent = 'summarization'
    else if (promptLower.includes('translat')) estimatedIntent = 'translation'
    else if (promptLower.includes('code') || promptLower.includes('function')) estimatedIntent = 'code'
    else if (promptLower.includes('analyz') || promptLower.includes('review')) estimatedIntent = 'analysis'
    else if (promptLower.includes('explain') || promptLower.includes('eli5')) estimatedIntent = 'explanation'
    else if (promptLower.includes('write') || promptLower.includes('creat')) estimatedIntent = 'creation'

    setAnalysis({
      wordCount: words.length,
      charCount: chars,
      sentenceCount: sentences.length,
      complexity,
      hasActionWords,
      hasSpecificFormat,
      estimatedIntent
    })
  }, [prompt])

  return analysis
}

// Hook para gestión de notificaciones toast
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration: number
  }>>([])

  const addToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }, [addToast])

  const showError = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration)
  }, [addToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration)
  }, [addToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration)
  }, [addToast])

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  }
}

// Hook para gestión del historial de prompts
export function usePromptHistory() {
  const [history, setHistory] = useLocalStorage<Array<{
    id: string
    prompt: string
    optimizedPrompt: string
    settings: any
    timestamp: number
    favorite: boolean
  }>>('po_prompt_history', [])

  const addToHistory = useCallback((prompt: string, optimizedPrompt: string, settings: any) => {
    const entry = {
      id: Date.now().toString(),
      prompt,
      optimizedPrompt,
      settings,
      timestamp: Date.now(),
      favorite: false
    }
    setHistory(prev => [entry, ...prev.slice(0, 49)]) // Keep only last 50 entries
  }, [setHistory])

  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev => prev.map(entry => 
      entry.id === id ? { ...entry, favorite: !entry.favorite } : entry
    ))
  }, [setHistory])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id))
  }, [setHistory])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  const favorites = history.filter(entry => entry.favorite)
  const recent = history.slice(0, 10)

  return {
    history,
    favorites,
    recent,
    addToHistory,
    toggleFavorite,
    removeFromHistory,
    clearHistory
  }
}

// Hook para copiar al portapapeles con feedback
export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
      
      return true
    } catch (error) {
      console.error('Failed to copy text:', error)
      return false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { copy, copied }
}

// Hook para estadísticas de uso
export function useUsageStats() {
  const [stats, setStats] = useLocalStorage('po_usage_stats', {
    totalPrompts: 0,
    totalOptimizations: 0,
    favoriteRole: 'Subject-matter expert',
    favoriteGoal: 'precision',
    favoriteLanguage: 'en-US',
    lastUsed: Date.now(),
    streak: 0,
    lastStreakDate: null as number | null
  })

  const updateStats = useCallback((newOptimization: {
    role: string
    goal: string
    language: string
  }) => {
    setStats(prev => {
      const today = new Date().toDateString()
      const lastUsedDate = prev.lastStreakDate ? new Date(prev.lastStreakDate).toDateString() : null
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
      
      let newStreak = prev.streak
      if (lastUsedDate === yesterday) {
        newStreak += 1
      } else if (lastUsedDate !== today) {
        newStreak = 1
      }

      return {
        ...prev,
        totalPrompts: prev.totalPrompts + 1,
        totalOptimizations: prev.totalOptimizations + 1,
        favoriteRole: newOptimization.role,
        favoriteGoal: newOptimization.goal,
        favoriteLanguage: newOptimization.language,
        lastUsed: Date.now(),
        streak: newStreak,
        lastStreakDate: Date.now()
      }
    })
  }, [setStats])

  return { stats, updateStats }
}

// Hook para keyboard shortcuts
export function useKeyboardShortcuts(callbacks: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter - Generate
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        callbacks.generate?.()
      }
      
      // Ctrl/Cmd + K - Focus prompt input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        callbacks.focusPrompt?.()
      }
      
      // Ctrl/Cmd + Shift + C - Copy result
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        callbacks.copyResult?.()
      }
      
      // Ctrl/Cmd + Shift + R - Reset
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        callbacks.reset?.()
      }
      
      // Escape - Close modals
      if (event.key === 'Escape') {
        callbacks.closeModal?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [callbacks])
}

// Hook para auto-save
export function useAutoSave<T>(
  data: T,
  save: (data: T) => void,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSaved = useRef<T>(data)

  useEffect(() => {
    if (JSON.stringify(data) === JSON.stringify(lastSaved.current)) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      save(data)
      lastSaved.current = data
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, save, delay])
}

// Hook para detección de device
export function useDevice() {
  const [device, setDevice] = useState<{
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    userAgent: string
  }>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*(?:\bMobile\b))|PlayBook|BB10/i.test(userAgent)
    const isDesktop = !isMobile && !isTablet

    setDevice({
      isMobile,
      isTablet,
      isDesktop,
      userAgent
    })
  }, [])

  return device
}

// Hook para performance monitoring
export function usePerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    optimizationTime: 0,
    memoryUsage: 0
  })

  const measureRender = useCallback(() => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      setMetrics(prev => ({ ...prev, renderTime: end - start }))
    }
  }, [])

  const measureOptimization = useCallback(() => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      setMetrics(prev => ({ ...prev, optimizationTime: end - start }))
    }
  }, [])

  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / memory.totalJSHeapSize
      }))
    }
  }, [])

  return { metrics, measureRender, measureOptimization }
}
