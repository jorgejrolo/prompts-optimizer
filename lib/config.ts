// lib/config.ts - Configuración centralizada de la aplicación

export const APP_CONFIG = {
  name: 'Prompt Optimizer',
  version: '5.3.7',
  description: 'Turn any messy prompt into clean JSON and a reusable optimized prompt.',
  author: 'Jorge J. Rolo',
  url: 'https://prompt-optimizer.vercel.app',
  
  // Configuración de características
  features: {
    analytics: true,
    history: true,
    shortcuts: true,
    autoSave: true,
    performance: process.env.NODE_ENV === 'development',
    darkMode: true,
    multiLanguage: true,
    export: true,
    sharing: true
  },
  
  // Límites y validación
  limits: {
    maxPromptLength: 5000,
    maxHistoryItems: 50,
    maxFavorites: 20,
    minPromptLength: 5,
    autoSaveDelay: 1000
  },
  
  // Configuración de UI
  ui: {
    toastDuration: 2200,
    animationDuration: 300,
    debounceDelay: 300,
    examplesPerPage: 4,
    maxModalWidth: '80vw',
    maxModalHeight: '90vh'
  },
  
  // Rutas y enlaces
  links: {
    jsonGuide: 'https://jorgejrolo.com/ia/json-prompts/',
    promptingGuide: 'https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide',
    author: 'https://jorgejrolo.com/',
    github: 'https://github.com/jorgejrolo/prompt-optimizer',
    support: 'mailto:jorge@jorgejrolo.com'
  },
  
  // Configuración de analytics (si se implementa)
  analytics: {
    trackUsage: false, // Respeta la privacidad del usuario
    trackErrors: true,
    trackPerformance: process.env.NODE_ENV === 'development'
  },
  
  // Temas por defecto
  defaultSettings: {
    theme: 'system' as 'system' | 'light' | 'dark',
    language: 'en-US',
    role: 'Subject-matter expert',
    goal: 'precision' as const,
    reasoning: 'medium' as const,
    contentType: 'text' as const,
    autoSave: true,
    showAdvanced: false
  }
}

// Tipos para configuración
export type AppConfig = typeof APP_CONFIG
export type AppFeatures = keyof typeof APP_CONFIG.features
export type AppLimits = keyof typeof APP_CONFIG.limits

// Utilidades de configuración
export function isFeatureEnabled(feature: AppFeatures): boolean {
  return APP_CONFIG.features[feature] === true
}

export function getLimit(limit: AppLimits): number {
  return APP_CONFIG.limits[limit]
}

export function getDefaultSetting<K extends keyof typeof APP_CONFIG.defaultSettings>(
  setting: K
): typeof APP_CONFIG.defaultSettings[K] {
  return APP_CONFIG.defaultSettings[setting]
}

// Configuración de roles con descripciones
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Subject-matter expert': 'General expertise across multiple domains with focus on accuracy',
  'Senior software engineer': 'Experienced in software development, architecture, and best practices',
  'Software architect': 'System design, technical leadership, and architectural decisions',
  'Data scientist': 'Statistical analysis, machine learning, and data-driven insights',
  'Data analyst': 'Data interpretation, visualization, and business intelligence',
  'ML engineer': 'Machine learning implementation, model deployment, and MLOps',
  'DevOps engineer': 'Infrastructure, deployment pipelines, and system reliability',
  'Security engineer': 'Cybersecurity, threat analysis, and security architecture',
  'Product manager': 'Product strategy, user experience, and business requirements',
  'Technical writer': 'Documentation, technical communication, and content strategy',
  'Growth marketer': 'User acquisition, conversion optimization, and marketing analytics',
  'Content strategist': 'Content planning, editorial strategy, and audience engagement',
  'Educator / teacher': 'Pedagogical expertise, curriculum design, and learning optimization'
}

// Configuración de objetivos con descripciones
export const GOAL_DESCRIPTIONS = {
  precision: {
    name: 'Precision',
    description: 'Maximizes accuracy and detail in responses',
    icon: '🎯',
    characteristics: ['Detailed explanations', 'Specific examples', 'Evidence-based']
  },
  brevity: {
    name: 'Brevity',
    description: 'Focuses on concise, essential information',
    icon: '⚡',
    characteristics: ['Concise answers', 'Key points only', 'Action-oriented']
  },
  creativity: {
    name: 'Creativity',
    description: 'Encourages innovative and diverse approaches',
    icon: '🎨',
    characteristics: ['Multiple perspectives', 'Creative solutions', 'Analogies and metaphors']
  },
  safety: {
    name: 'Safety',
    description: 'Prioritizes risk awareness and safety considerations',
    icon: '🛡️',
    characteristics: ['Risk assessment', 'Safety warnings', 'Ethical considerations']
  },
  speed: {
    name: 'Speed',
    description: 'Optimizes for quick, actionable responses',
    icon: '🚀',
    characteristics: ['Fast execution', 'Direct answers', 'Minimal elaboration']
  }
}

// Configuración de tipos de contenido
export const CONTENT_TYPE_DESCRIPTIONS = {
  text: {
    name: 'Text',
    description: 'General text content and written communication',
    icon: '📝',
    examples: ['Articles', 'Essays', 'Documentation', 'Reports']
  },
  video: {
    name: 'Video',
    description: 'Video content, scripts, and visual storytelling',
    icon: '🎬',
    examples: ['Scripts', 'Storyboards', 'Video descriptions', 'Tutorials']
  },
  image: {
    name: 'Image',
    description: 'Visual content, graphics, and image descriptions',
    icon: '🖼️',
    examples: ['Alt text', 'Visual descriptions', 'Design briefs', 'Infographics']
  },
  audio: {
    name: 'Audio',
    description: 'Audio content, podcasts, and sound design',
    icon: '🎧',
    examples: ['Podcast scripts', 'Audio descriptions', 'Sound effects', 'Music']
  },
  presentation: {
    name: 'Presentation',
    description: 'Slides, presentations, and structured content',
    icon: '📑',
    examples: ['Slide decks', 'Pitches', 'Training materials', 'Workshops']
  }
}

// Configuración de niveles de razonamiento
export const REASONING_DESCRIPTIONS = {
  low: {
    name: 'Low',
    description: 'Minimal explanation, focus on results',
    icon: '🟢',
    characteristics: ['Direct answers', 'No detailed reasoning', 'Action-focused']
  },
  medium: {
    name: 'Medium',
    description: 'Balanced explanation with key reasoning',
    icon: '🟡',
    characteristics: ['Brief explanations', 'Key decisions explained', 'Balanced detail']
  },
  high: {
    name: 'High',
    description: 'Detailed reasoning and step-by-step thinking',
    icon: '🔴',
    characteristics: ['Comprehensive reasoning', 'Step-by-step logic', 'Deep analysis']
  }
}

// Configuración de atajos de teclado
export const KEYBOARD_SHORTCUTS = {
  generate: { key: 'Ctrl+Enter', mac: 'Cmd+Enter', description: 'Generate optimized prompt' },
  focusPrompt: { key: 'Ctrl+K', mac: 'Cmd+K', description: 'Focus prompt input' },
  copyResult: { key: 'Ctrl+Shift+C', mac: 'Cmd+Shift+C', description: 'Copy current result' },
  reset: { key: 'Ctrl+Shift+R', mac: 'Cmd+Shift+R', description: 'Reset form' },
  closeModal: { key: 'Escape', mac: 'Escape', description: 'Close modal/dialog' },
  toggleTheme: { key: 'Ctrl+Shift+T', mac: 'Cmd+Shift+T', description: 'Toggle theme' }
}

// Mensajes de error personalizados
export const ERROR_MESSAGES = {
  promptTooShort: 'Prompt must be at least 5 characters long',
  promptTooLong: 'Prompt exceeds maximum length of 5000 characters',
  optimizationFailed: 'Failed to optimize prompt. Please try again.',
  copyFailed: 'Failed to copy to clipboard',
  saveFailed: 'Failed to save to history',
  loadFailed: 'Failed to load saved data',
  networkError: 'Network error. Please check your connection.',
  unknownError: 'An unexpected error occurred'
}

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  promptOptimized: '✨ Prompt optimized successfully!',
  copied: '📋 Copied to clipboard',
  saved: '💾 Saved to history',
  exported: '📤 Exported successfully',
  shared: '🔗 Share link copied',
  reset: '🗑️ Form reset',
  settingsSaved: '⚙️ Settings saved'
}

// Configuración de validación
export const VALIDATION_RULES = {
  prompt: {
    minLength: 5,
    maxLength: 5000,
    required: true
  },
  role: {
    required: true,
    options: Object.keys(ROLE_DESCRIPTIONS)
  },
  language: {
    required: true,
    pattern: /^[a-z]{2}-[A-Z]{2}$/
  }
}

// Métricas de calidad
export const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 40
}

export function getQualityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= QUALITY_THRESHOLDS.excellent) return 'excellent'
  if (score >= QUALITY_THRESHOLDS.good) return 'good'
  if (score >= QUALITY_THRESHOLDS.fair) return 'fair'
  return 'poor'
}

export function getQualityColor(score: number): string {
  const level = getQualityLevel(score)
  switch (level) {
    case 'excellent': return 'text-green-400 bg-green-500/20'
    case 'good': return 'text-blue-400 bg-blue-500/20'
    case 'fair': return 'text-yellow-400 bg-yellow-500/20'
    case 'poor': return 'text-red-400 bg-red-500/20'
  }
}
